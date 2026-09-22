import { requireSupabase, supabase } from '../lib/supabase'

// Emails are case-insensitive: normalize so "User@Gmail.com " still matches.
const normalizeEmail = (email) => (email || '').trim().toLowerCase()

// Absolute in-app URL that respects the deploy base path (/, /Drinklyy/, ...).
const appUrl = (path) => window.location.origin + import.meta.env.BASE_URL + path

export async function signUp({ email, password, fullName, role = 'CUSTOMER' }) {
  const client = requireSupabase()
  return client.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: {
      data: { full_name: fullName, role },
      // Without this, confirmation links fall back to the Supabase Site URL
      // (often localhost), so the mail link never returns to the deployed app.
      emailRedirectTo: appUrl('home')
    }
  })
}

export async function signIn({ email, password }) {
  return requireSupabase().auth.signInWithPassword({ email: normalizeEmail(email), password })
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
  return requireSupabase().auth.updateUser({
    email: normalizeEmail(email),
    options: { emailRedirectTo: appUrl('home') }
  })
}

export async function resetPassword(email) {
  const client = requireSupabase()
  // Must point at the app's real path (e.g. /Drinklyy/login on GitHub Pages),
  // otherwise the reset link from the mail opens a dead page.
  return client.auth.resetPasswordForEmail(normalizeEmail(email), { redirectTo: appUrl('login') })
}

export async function updatePassword(newPassword) {
  return requireSupabase().auth.updateUser({ password: newPassword })
}

export function onAuthStateChange(callback) {
  if (!supabase) return { data: { subscription: { unsubscribe() {} } } }
  return supabase.auth.onAuthStateChange(callback)
}
