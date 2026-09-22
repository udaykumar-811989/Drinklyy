import { requireSupabase, supabase } from '../lib/supabase'

export async function signUp({ email, password, fullName, role = 'CUSTOMER' }) {
  const client = requireSupabase()
  return client.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role } }
  })
}

export async function signIn({ email, password }) {
  return requireSupabase().auth.signInWithPassword({ email, password })
}

export async function signOut() {
  return requireSupabase().auth.signOut()
}

export async function getSession() {
  return requireSupabase().auth.getSession()
}

export async function getCurrentUser() {
  return requireSupabase().auth.getUser()
}

export async function getCurrentProfile() {
  const client = requireSupabase()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { data: null, error: null }
  return client.from('profiles').select('*').eq('id', user.id).single()
}

export async function getProfile(userId) {
  return requireSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
}

export async function upsertProfile({ id, full_name, phone, email, avatar_url }) {
  const client = requireSupabase()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { data: null, error: new Error('Authentication required') }
  const profileId = id || user.id
  return client
    .from('profiles')
    .upsert({
      id: profileId,
      full_name: full_name || user.user_metadata?.full_name || '',
      phone: phone || user.phone || '',
      email: email || user.email || '',
      avatar_url: avatar_url || null
    }, { onConflict: 'id' })
    .select()
    .single()
}

export async function updateCurrentProfile(changes) {
  const client = requireSupabase()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { data: null, error: new Error('Authentication required') }
  return client.from('profiles').update(changes).eq('id', user.id).select().single()
}

export async function updateCurrentUserEmail(email) {
  return requireSupabase().auth.updateUser({ email })
}

export async function resetPassword(email) {
  const client = requireSupabase()
  const { data: { url } } = await client.auth.getSession()
  const redirectTo = window.location.origin + '/login'
  return client.auth.resetPasswordForEmail(email, { redirectTo })
}

export async function updatePassword(newPassword) {
  return requireSupabase().auth.updateUser({ password: newPassword })
}

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe() {} } } }
  return supabase.auth.onAuthStateChange(callback)
}
