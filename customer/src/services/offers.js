import { requireSupabase } from '../lib/supabase'

export async function listOffers(shopId) {
  let query = requireSupabase().from('offers').select('*, products(*)').order('starts_at')
  if (shopId) query = query.eq('shop_id', shopId)
  return query
}

export async function createOffer(offer) {
  return requireSupabase().from('offers').insert(offer).select().single()
}

export async function updateOffer(offerId, changes) {
  return requireSupabase().from('offers').update(changes).eq('id', offerId).select().single()
}

export async function deleteOffer(offerId) {
  return requireSupabase().from('offers').delete().eq('id', offerId)
}
