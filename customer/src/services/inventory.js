import { requireSupabase } from '../lib/supabase'

export async function listInventory(shopId) {
  return requireSupabase().from('inventory').select('*, products!inner(*)').eq('products.shop_id', shopId)
}

export async function updateInventory(productId, stock, lowStockThreshold) {
  if (stock < 0) throw new Error('Stock cannot be negative.')
  return requireSupabase().from('inventory').upsert({ product_id: productId, stock, low_stock_threshold: lowStockThreshold }, { onConflict: 'product_id' }).select().single()
}
