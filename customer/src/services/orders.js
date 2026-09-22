import { requireSupabase } from '../lib/supabase'

export async function listCustomerOrders(customerId) {
  return requireSupabase()
    .from('orders')
    .select('*, order_items(*), shops(name, logo_url, address)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
}

export async function listShopOrders(shopId) {
  return requireSupabase()
    .from('orders')
    .select('*, order_items(*), profiles!orders_customer_id_fkey(full_name, phone, email)')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })
}

export async function getOrder(orderId) {
  return requireSupabase()
    .from('orders')
    .select('*, order_items(*), shops(name, logo_url, address), profiles!orders_customer_id_fkey(full_name, phone, email), addresses(label, line, city)')
    .eq('id', orderId)
    .single()
}

export async function createOrderFromCart(shopId, addressId, items, deliveryFee = 49) {
  return requireSupabase().rpc('create_order_from_cart', {
    p_shop_id: shopId,
    p_address_id: addressId,
    p_items: items.map((item) => ({ product_id: item.product_id || item.id, quantity: item.quantity })),
    p_delivery_fee: deliveryFee
  })
}

export async function updateOrderStatusByShop(orderId, newStatus) {
  return requireSupabase().rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus
  })
}

export async function verifyAndConfirmOrder(orderId, paymentId, paymentStatus = 'CAPTURED') {
  return requireSupabase().rpc('verify_and_confirm_order', {
    p_order_id: orderId,
    p_payment_id: paymentId,
    p_payment_status: paymentStatus
  })
}

export async function checkCompliance(shopId, items) {
  return requireSupabase().rpc('check_order_compliance', {
    p_shop_id: shopId,
    p_items: items.map((item) => ({ product_id: item.product_id || item.id, quantity: item.quantity }))
  })
}

export function subscribeToOrders(shopId, callback) {
  const client = requireSupabase()
  return client
    .channel('shop-orders')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` }, (payload) => {
      callback(payload)
    })
    .subscribe()
}

export function subscribeToCustomerOrders(customerId, callback) {
  const client = requireSupabase()
  return client
    .channel('customer-orders')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${customerId}` }, (payload) => {
      callback(payload)
    })
    .subscribe()
}
