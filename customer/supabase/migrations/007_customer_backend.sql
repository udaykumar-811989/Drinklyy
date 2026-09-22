-- ============================================================
-- PHASE 1: CUSTOMER BACKEND SCHEMA
-- Adds delivery columns, expanded addresses, order item images
-- ============================================================

-- 1. Expand addresses table with full fields
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS address_line_1 text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS address_line_2 text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS landmark text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS latitude numeric(10,7);
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS longitude numeric(10,7);

-- Migrate existing 'line' data to address_line_1 if address_line_1 is empty
UPDATE public.addresses SET address_line_1 = line WHERE address_line_1 IS NULL AND line IS NOT NULL;

-- 2. Add delivery snapshot columns to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_address text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_city text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_state text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_postal_code text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_latitude numeric(10,7);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_longitude numeric(10,7);

-- 3. Add product image snapshot to order_items
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_image_url text;

-- 4. Add tax column to orders (if not already present via total calculation)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax numeric(12,2) NOT NULL DEFAULT 0;

-- 5. Update create_order_from_cart RPC to include address snapshot and image
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
  address_row public.addresses;
  calculated_subtotal numeric(12,2) := 0;
  tax_amount numeric(12,2);
  item_quantity integer;
  item_subtotal numeric(12,2);
  item_price numeric(12,2);
  order_number_val text;
  resolved_address_id uuid;
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN RAISE EXCEPTION 'Order must contain at least one item'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.shops WHERE id = p_shop_id) THEN RAISE EXCEPTION 'Shop not found'; END IF;

  -- Resolve address: use provided or find customer's default/first address
  resolved_address_id := p_address_id;
  IF resolved_address_id IS NULL THEN
    SELECT id INTO resolved_address_id FROM public.addresses
    WHERE customer_id = current_user_id ORDER BY is_default DESC, created_at DESC LIMIT 1;
    IF resolved_address_id IS NULL THEN
      RAISE EXCEPTION 'No delivery address found. Please add an address first.';
    END IF;
  ELSE
    IF NOT EXISTS (SELECT 1 FROM public.addresses WHERE id = resolved_address_id AND customer_id = current_user_id) THEN
      RAISE EXCEPTION 'Address does not belong to customer';
    END IF;
  END IF;

  -- Fetch address for snapshot
  SELECT * INTO address_row FROM public.addresses WHERE id = resolved_address_id;

  -- Validate all items, check stock, calculate prices server-side
  FOR requested_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO product_row FROM public.products WHERE id = (requested_item->>'product_id')::uuid AND shop_id = p_shop_id AND status = 'ACTIVE';
    IF NOT FOUND THEN RAISE EXCEPTION 'Product % is unavailable', requested_item->>'product_id'; END IF;
    item_quantity := (requested_item->>'quantity')::integer;
    IF item_quantity IS NULL OR item_quantity <= 0 THEN RAISE EXCEPTION 'Invalid quantity for %', product_row.name; END IF;
    SELECT * INTO inventory_row FROM public.inventory WHERE product_id = product_row.id FOR UPDATE;
    IF NOT FOUND OR inventory_row.stock < item_quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (available: %, requested: %)', product_row.name, COALESCE(inventory_row.stock, 0), item_quantity;
    END IF;
    item_price := COALESCE(product_row.discount_price, product_row.price);
    item_subtotal := item_price * item_quantity;
    calculated_subtotal := calculated_subtotal + item_subtotal;
  END LOOP;

  -- Calculate tax (18% GST)
  tax_amount := ROUND(calculated_subtotal * 0.18, 2);
  order_number_val := public.generate_order_number();

  -- Create order with address snapshot
  INSERT INTO public.orders (
    customer_id, shop_id, address_id,
    delivery_name, delivery_phone, delivery_address, delivery_city, delivery_state, delivery_postal_code,
    delivery_latitude, delivery_longitude,
    subtotal, delivery_fee, discount, tax, total, currency,
    status, payment_status, compliance_status, order_number
  ) VALUES (
    current_user_id, p_shop_id, resolved_address_id,
    COALESCE(address_row.full_name, ''), COALESCE(address_row.phone, ''),
    COALESCE(address_row.address_line_1, address_row.line, ''),
    COALESCE(address_row.city, ''),
    COALESCE(address_row.state, ''),
    COALESCE(address_row.postal_code, ''),
    address_row.latitude, address_row.longitude,
    calculated_subtotal, GREATEST(p_delivery_fee, 0), 0, tax_amount,
    calculated_subtotal + GREATEST(p_delivery_fee, 0) + tax_amount,
    'INR', 'PENDING_PAYMENT', 'PENDING', p_compliance_status, order_number_val
  )
  RETURNING * INTO created_order;

  -- Create order items with price and image snapshots
  FOR requested_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO product_row FROM public.products WHERE id = (requested_item->>'product_id')::uuid;
    item_quantity := (requested_item->>'quantity')::integer;
    item_price := COALESCE(product_row.discount_price, product_row.price);
    item_subtotal := item_price * item_quantity;
    INSERT INTO public.order_items (order_id, product_id, product_name_snapshot, product_image_url, price_snapshot, quantity, subtotal)
    VALUES (created_order.id, product_row.id, product_row.name, product_row.image_url, item_price, item_quantity, item_subtotal);
    -- Decrement stock atomically
    UPDATE public.inventory SET stock = stock - item_quantity WHERE product_id = product_row.id;
  END LOOP;

  RETURN created_order;
END;
$$;

-- 6. Fix RLS: Allow customers to insert addresses with full_name/phone
DROP POLICY IF EXISTS addresses_insert_own ON public.addresses;
CREATE POLICY addresses_insert_own ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- 7. Allow customers to delete own addresses
DROP POLICY IF EXISTS addresses_delete_own ON public.addresses;
CREATE POLICY addresses_delete_own ON public.addresses
  FOR DELETE USING (customer_id = auth.uid() OR public.is_admin());

-- 8. Allow customers to update own addresses
DROP POLICY IF EXISTS addresses_update_own ON public.addresses;
CREATE POLICY addresses_update_own ON public.addresses
  FOR UPDATE USING (customer_id = auth.uid() OR public.is_admin())
  WITH CHECK (customer_id = auth.uid() OR public.is_admin());

-- 9. Allow customers to read own orders with order_items
DROP POLICY IF EXISTS orders_customer_or_shop ON public.orders;
CREATE POLICY orders_customer_or_shop ON public.orders
  FOR SELECT USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid())
    OR public.is_admin()
  );

-- 10. Allow reading order_items for orders the user owns or shops own
DROP POLICY IF EXISTS order_items_read_auth ON public.order_items;
CREATE POLICY order_items_read_auth ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
      AND (o.customer_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = o.shop_id AND s.owner_id = auth.uid())
        OR public.is_admin())
    )
  );

-- 11. Allow customers to update their own orders (for cancellation only via app)
DROP POLICY IF EXISTS orders_update_customer ON public.orders;
CREATE POLICY orders_update_customer ON public.orders
  FOR UPDATE USING (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid())
    OR public.is_admin()
  )
  WITH CHECK (
    customer_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid())
    OR public.is_admin()
  );

-- 12. Index for address lookups
CREATE INDEX IF NOT EXISTS addresses_customer_idx ON public.addresses(customer_id);

-- 13. Notifications index
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id);
