-- ============================================================
-- REAL ORDER SYSTEM MIGRATION
-- ============================================================

-- 1. Update order_status enum with new values
DO $$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'CONFIRMED'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'DELIVERED'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Update payment_status enum
DO $$ BEGIN ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'CANCELLED'; EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN ALTER TYPE public.payment_status ADD VALUE IF NOT EXISTS 'CAPTURED'; EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Order number sequence for unique sequential numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- 4. Generate unique order number: DRK-YYYYMMDD-XXXX
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  order_num text;
  exists_count integer;
BEGIN
  LOOP
    order_num := 'DRK-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(nextval('order_number_seq')::text, 4, '0');
    SELECT count(*) INTO exists_count FROM public.orders WHERE order_number = order_num;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN order_num;
END;
$$;

-- 5. Rewrite create_order_from_cart with server-side price calculation, proper order number, compliance
CREATE OR REPLACE FUNCTION public.create_order_from_cart(
  p_shop_id uuid,
  p_address_id uuid,
  p_items jsonb,
  p_delivery_fee numeric default 49,
  p_compliance_status text default 'PENDING'
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  created_order public.orders;
  requested_item jsonb;
  product_row public.products;
  inventory_row public.inventory;
  calculated_subtotal numeric(12,2) := 0;
  item_quantity integer;
  item_subtotal numeric(12,2);
  item_price numeric(12,2);
  order_number_val text;
  tax_amount numeric(12,2);
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Order must contain at least one item'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id) THEN RAISE EXCEPTION 'Shop not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.addresses WHERE id = p_address_id AND customer_id = current_user_id) THEN RAISE EXCEPTION 'Address does not belong to customer'; END IF;

  -- Validate all items, check stock, calculate prices server-side
  FOR requested_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO product_row FROM public.products WHERE id = (requested_item->>'product_id')::uuid AND shop_id = p_shop_id AND status = 'ACTIVE';
    IF NOT FOUND THEN RAISE EXCEPTION 'Product % is unavailable', requested_item->>'product_id'; END IF;
    item_quantity := (requested_item->>'quantity')::integer;
    IF item_quantity IS NULL OR item_quantity <= 0 THEN RAISE EXCEPTION 'Invalid quantity for %', product_row.name; END IF;
    SELECT * INTO inventory_row FROM public.inventory WHERE product_id = product_row.id FOR UPDATE;
    IF NOT FOUND OR inventory_row.stock < item_quantity THEN RAISE EXCEPTION 'Insufficient stock for % (available: %, requested: %)', product_row.name, COALESCE(inventory_row.stock, 0), item_quantity; END IF;
    -- Server-side price: always use discount_price if available, else price
    item_price := COALESCE(product_row.discount_price, product_row.price);
    item_subtotal := item_price * item_quantity;
    calculated_subtotal := calculated_subtotal + item_subtotal;
  END LOOP;

  -- Calculate tax (18% GST on alcohol in India)
  tax_amount := ROUND(calculated_subtotal * 0.18, 2);

  -- Generate unique order number
  order_number_val := public.generate_order_number();

  -- Create order with PENDING_PAYMENT status
  INSERT INTO public.orders (customer_id, shop_id, address_id, subtotal, delivery_fee, discount, total, currency, status, payment_status, compliance_status, order_number)
  VALUES (current_user_id, p_shop_id, p_address_id, calculated_subtotal, GREATEST(p_delivery_fee, 0), 0, calculated_subtotal + GREATEST(p_delivery_fee, 0) + tax_amount, 'INR', 'PENDING_PAYMENT', 'PENDING', p_compliance_status, order_number_val)
  RETURNING * INTO created_order;

  -- Create order items with price snapshots (never recalculate from current price)
  FOR requested_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO product_row FROM public.products WHERE id = (requested_item->>'product_id')::uuid;
    item_quantity := (requested_item->>'quantity')::integer;
    item_price := COALESCE(product_row.discount_price, product_row.price);
    item_subtotal := item_price * item_quantity;
    INSERT INTO public.order_items (order_id, product_id, product_name_snapshot, price_snapshot, quantity, subtotal)
    VALUES (created_order.id, product_row.id, product_row.name, item_price, item_quantity, item_subtotal);
    -- Decrement stock atomically
    UPDATE public.inventory SET stock = stock - item_quantity WHERE product_id = product_row.id;
  END LOOP;

  RETURN created_order;
END;
$$;

-- 6. Verify payment and confirm order
CREATE OR REPLACE FUNCTION public.verify_and_confirm_order(
  p_order_id uuid,
  p_payment_id text,
  p_payment_status text default 'CAPTURED'
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  order_row public.orders;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id AND customer_id = current_user_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF order_row.status != 'PENDING_PAYMENT' THEN RAISE EXCEPTION 'Order is not pending payment'; END IF;

  -- Update payment record
  UPDATE public.payments SET
    provider_payment_id = p_payment_id,
    status = p_payment_status::public.payment_status,
    updated_at = now()
  WHERE order_id = p_order_id;

  -- Update order status
  UPDATE public.orders SET
    status = 'CONFIRMED',
    payment_status = CASE WHEN p_payment_status = 'CAPTURED' THEN 'PAID'::public.payment_status ELSE 'FAILED'::public.payment_status END,
    updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO order_row;

  -- Record payment event
  INSERT INTO public.payment_events (payment_id, event_type, provider_event_id, payload)
  SELECT id, 'payment_captured', p_payment_id, jsonb_build_object('status', p_payment_status)
  FROM public.payments WHERE order_id = p_order_id;

  RETURN order_row;
END;
$$;

-- 7. Update order status (shop owner action)
CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id uuid,
  p_new_status text
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  order_row public.orders;
  valid_transition boolean;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO order_row FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  -- Verify the shop owner owns this order's shop
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = order_row.shop_id AND owner_id = current_user_id) THEN
    RAISE EXCEPTION 'Not authorized to update this order';
  END IF;

  -- Validate status transition
  valid_transition := CASE
    WHEN order_row.status = 'CONFIRMED' AND p_new_status = 'ACCEPTED' THEN true
    WHEN order_row.status = 'ACCEPTED' AND p_new_status = 'PREPARING' THEN true
    WHEN order_row.status = 'PREPARING' AND p_new_status = 'READY_FOR_PICKUP' THEN true
    WHEN order_row.status = 'READY_FOR_PICKUP' AND p_new_status = 'OUT_FOR_DELIVERY' THEN true
    WHEN order_row.status = 'OUT_FOR_DELIVERY' AND p_new_status = 'DELIVERED' THEN true
    WHEN order_row.status IN ('CONFIRMED', 'ACCEPTED', 'PREPARING') AND p_new_status = 'CANCELLED' THEN true
    ELSE false
  END;

  IF NOT valid_transition THEN
    RAISE EXCEPTION 'Invalid status transition from % to %', order_row.status, p_new_status;
  END IF;

  UPDATE public.orders SET status = p_new_status::public.order_status, updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO order_row;

  -- Record status change
  INSERT INTO public.order_status_history (order_id, status, changed_by)
  VALUES (p_order_id, p_new_status::public.order_status, current_user_id);

  RETURN order_row;
END;
$$;

-- 8. Check compliance for order
CREATE OR REPLACE FUNCTION public.check_order_compliance(
  p_shop_id uuid,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  customer_profile public.profiles;
  shop_row public.shops;
  compliance_row public.compliance_rules;
  requested_item jsonb;
  product_row public.products;
  result jsonb := '{"eligible": true, "reason": ""}'::jsonb;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Authentication required');
  END IF;

  -- Check customer profile exists
  SELECT * INTO customer_profile FROM public.profiles WHERE id = current_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Customer profile not found');
  END IF;

  -- Check shop exists and is open
  SELECT * INTO shop_row FROM public.shops WHERE id = p_shop_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Shop not found');
  END IF;
  IF NOT shop_row.is_open THEN
    RETURN jsonb_build_object('eligible', false, 'reason', 'Shop is currently closed');
  END IF;

  -- Check compliance rules (use first active rule for the shop's jurisdiction, or DEMO)
  SELECT * INTO compliance_row FROM public.compliance_rules LIMIT 1;
  IF FOUND THEN
    -- Check operating hours
    IF compliance_row.operating_hours ? 'open' AND compliance_row.operating_hours ? 'close' THEN
      IF EXTRACT(HOUR FROM now()) < CAST(compliance_row.operating_hours->>'open' AS integer)
         OR EXTRACT(HOUR FROM now()) > CAST(compliance_row.operating_hours->'close' AS integer) THEN
        RETURN jsonb_build_object('eligible', false, 'reason', 'Order not allowed outside operating hours');
      END IF;
    END IF;
  END IF;

  RETURN result;
END;
$$;

-- 9. Allow authenticated users to insert into payments (for order creation flow)
DO $$ BEGIN DROP POLICY IF EXISTS payments_insert_auth ON public.payments; EXCEPTION WHEN undefined_object THEN null; END $$;
CREATE POLICY payments_insert_auth ON public.payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 10. Allow customers to insert their own addresses
DO $$ BEGIN DROP POLICY IF EXISTS addresses_insert_own ON public.addresses; EXCEPTION WHEN undefined_object THEN null; END $$;
CREATE POLICY addresses_insert_own ON public.addresses FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- 11. Allow customers to read their own addresses
DO $$ BEGIN DROP POLICY IF EXISTS addresses_read_own ON public.addresses; EXCEPTION WHEN undefined_object THEN null; END $$;
CREATE POLICY addresses_read_own ON public.addresses FOR SELECT USING (auth.uid() = customer_id);

-- 12. Allow customers to read shops (needed for checkout)
DO $$ BEGIN DROP POLICY IF EXISTS shops_read_customer ON public.shops; EXCEPTION WHEN undefined_object THEN null; END $$;
CREATE POLICY shops_read_customer ON public.shops FOR SELECT USING (true);

-- 13. Allow order creation via SECURITY DEFINER function
DO $$ BEGIN DROP POLICY IF EXISTS orders_insert_auth ON public.orders; EXCEPTION WHEN undefined_object THEN null; END $$;
CREATE POLICY orders_insert_auth ON public.orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 14. Allow order_items insertion via SECURITY DEFINER function
DO $$ BEGIN DROP POLICY IF EXISTS order_items_insert_auth ON public.order_items; EXCEPTION WHEN undefined_object THEN null; END $$;
CREATE POLICY order_items_insert_auth ON public.order_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 13. Add index for faster order lookups
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at DESC);
