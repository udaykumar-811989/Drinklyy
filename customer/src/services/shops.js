import { requireSupabase } from '../lib/supabase'

export async function listShops() {
  return requireSupabase().from('shops').select('*').order('name')
}

export async function getShop(shopId) {
  return requireSupabase().from('shops').select('*').eq('id', shopId).single()
}

export async function getOwnedShop(ownerId) {
  return requireSupabase().from('shops').select('*').eq('owner_id', ownerId).maybeSingle()
}

export async function createShop(shop) {
  return requireSupabase().from('shops').insert(shop).select().single()
}

export async function updateShop(shopId, changes) {
  return requireSupabase().from('shops').update(changes).eq('id', shopId).select().single()
}

export async function uploadShopImage(shopId, file) {
  const path = `${shopId}/${crypto.randomUUID()}-${file.name}`
  return requireSupabase().storage.from('shop-images').upload(path, file, { upsert: false })
}
