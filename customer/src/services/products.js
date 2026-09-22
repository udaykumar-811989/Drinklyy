import { requireSupabase } from '../lib/supabase'

export async function listCategories() {
  return requireSupabase().from('categories').select('*').order('name')
}

export async function listProducts({ shopId, categoryId } = {}) {
  let query = requireSupabase().from('products').select('*, categories(*)').eq('status', 'ACTIVE')
  if (shopId) query = query.eq('shop_id', shopId)
  if (categoryId) query = query.eq('category_id', categoryId)
  const { data: products, error } = await query.order('created_at', { ascending: false })
  if (error || !products || products.length === 0) return { data: products || [], error }
  const productIds = products.map((p) => p.id)
  const { data: inventoryRows } = await requireSupabase().from('inventory').select('*').in('product_id', productIds)
  const invMap = {}
  if (inventoryRows) inventoryRows.forEach((row) => { invMap[row.product_id] = row })
  const merged = products.map((p) => ({ ...p, inventory: invMap[p.id] ? [invMap[p.id]] : [] }))
  return { data: merged, error: null }
}

export async function listShopProducts(shopId) {
  const { data: products, error: prodError } = await requireSupabase().from('products').select('*, categories(*)').eq('shop_id', shopId).order('created_at', { ascending: false })
  if (prodError) return { data: null, error: prodError }
  if (!products || products.length === 0) return { data: [], error: null }
  const productIds = products.map((p) => p.id)
  const { data: inventoryRows } = await requireSupabase().from('inventory').select('*').in('product_id', productIds)
  const invMap = {}
  if (inventoryRows) inventoryRows.forEach((row) => { invMap[row.product_id] = row })
  const merged = products.map((p) => ({ ...p, inventory: invMap[p.id] ? [invMap[p.id]] : [] }))
  return { data: merged, error: null }
}

export async function createProduct(product) {
  return requireSupabase().from('products').insert(product).select().single()
}

export async function updateProduct(productId, changes) {
  return requireSupabase().from('products').update(changes).eq('id', productId).select().single()
}

export async function deleteProduct(productId) {
  return requireSupabase().from('products').delete().eq('id', productId)
}

export async function uploadProductImage(shopId, file) {
  const client = requireSupabase()
  const path = `${shopId}/${crypto.randomUUID()}-${file.name}`
  const { data, error } = await client.storage.from('product-images').upload(path, file, { upsert: false })
  if (error) return { data: null, error }
  const { data: urlData } = client.storage.from('product-images').getPublicUrl(path)
  return { data: { path, publicUrl: urlData.publicUrl }, error: null }
}
