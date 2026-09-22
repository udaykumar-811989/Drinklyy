import { requireSupabase } from '../lib/supabase'

export async function getCart(customerId) {
  return requireSupabase()
    .from('carts')
    .select('*, cart_items(*, products(id, name, brand, size, alcohol_percentage, price, discount_price, image_url, status, inventory(stock)), categories(name))')
    .eq('customer_id', customerId)
    .maybeSingle()
}

export async function ensureCart(customerId) {
  return requireSupabase()
    .from('carts')
    .upsert({ customer_id: customerId }, { onConflict: 'customer_id' })
    .select()
    .single()
}

export async function setCartItem(cartId, productId, quantity) {
  const client = requireSupabase()
  if (quantity <= 0) {
    return client.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId)
  }
  return client
    .from('cart_items')
    .upsert({ cart_id: cartId, product_id: productId, quantity }, { onConflict: 'cart_id,product_id' })
    .select()
    .single()
}

export async function clearCart(cartId) {
  return requireSupabase().from('cart_items').delete().eq('cart_id', cartId)
}

export async function loadCartFromSupabase(userId) {
  const { data: cart } = await getCart(userId)
  if (!cart || !cart.cart_items) return []
  return cart.cart_items
    .filter((ci) => ci.products && ci.products.status === 'ACTIVE')
    .map((ci) => ({
      id: ci.products.id,
      name: ci.products.name,
      brand: ci.products.brand || '',
      category: ci.products.categories?.name?.toLowerCase() || '',
      categoryName: ci.products.categories?.name || '',
      size: ci.products.size || '',
      alcoholPercentage: ci.products.alcohol_percentage ? `${ci.products.alcohol_percentage}%` : '',
      price: Number(ci.products.discount_price || ci.products.price),
      oldPrice: ci.products.discount_price ? Number(ci.products.price) : null,
      image: ci.products.image_url || 'https://placehold.co/200x240/101a23/ffc431?text=Drink',
      inStock: (ci.products.inventory?.stock || 0) > 0,
      stock: ci.products.inventory?.stock || 0,
      shopId: ci.products.shop_id,
      quantity: ci.quantity,
      rating: 4.5
    }))
}

export async function syncCartToSupabase(userId, localItems) {
  const { data: cart } = await ensureCart(userId)
  if (!cart) return

  // Clear existing items
  await clearCart(cart.id)

  // Add all local items
  for (const item of localItems) {
    if (item.id && typeof item.id === 'string' && item.id.length >= 10) {
      await setCartItem(cart.id, item.id, item.quantity)
    }
  }
}
