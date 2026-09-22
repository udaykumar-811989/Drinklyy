import { requireSupabase } from '../lib/supabase'

export async function listNotifications(userId) {
  return requireSupabase().from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
}

export async function listShopNotifications(shopId) {
  return requireSupabase().from('notifications').select('*').eq('shop_id', shopId).order('created_at', { ascending: false })
}

export async function markNotificationRead(notificationId) {
  return requireSupabase().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId)
}

export async function markAllNotificationsRead(userId) {
  return requireSupabase().from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null)
}
