import { requireSupabase } from '../lib/supabase'

export async function listAddresses(customerId) {
  return requireSupabase()
    .from('addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
}

export async function createAddress(address) {
  const client = requireSupabase()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { data: null, error: new Error('Authentication required') }

  const newAddress = {
    customer_id: user.id,
    label: address.label || 'Home',
    full_name: address.full_name || '',
    phone: address.phone || '',
    line: address.address_line_1 || address.line || '',
    address_line_1: address.address_line_1 || '',
    address_line_2: address.address_line_2 || '',
    landmark: address.landmark || '',
    area: address.area || '',
    city: address.city || '',
    state: address.state || '',
    postal_code: address.postal_code || '',
    latitude: address.latitude || null,
    longitude: address.longitude || null,
    is_default: address.is_default || false
  }

  // If this is the first address or marked as default, unset other defaults
  if (newAddress.is_default) {
    await client
      .from('addresses')
      .update({ is_default: false })
      .eq('customer_id', user.id)
      .eq('is_default', true)
  }

  return client
    .from('addresses')
    .insert(newAddress)
    .select()
    .single()
}

export async function updateAddress(id, changes) {
  const client = requireSupabase()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { data: null, error: new Error('Authentication required') }

  const updateData = {}
  if (changes.label !== undefined) updateData.label = changes.label
  if (changes.full_name !== undefined) updateData.full_name = changes.full_name
  if (changes.phone !== undefined) updateData.phone = changes.phone
  if (changes.address_line_1 !== undefined) {
    updateData.address_line_1 = changes.address_line_1
    updateData.line = changes.address_line_1
  }
  if (changes.address_line_2 !== undefined) updateData.address_line_2 = changes.address_line_2
  if (changes.landmark !== undefined) updateData.landmark = changes.landmark
  if (changes.area !== undefined) updateData.area = changes.area
  if (changes.city !== undefined) updateData.city = changes.city
  if (changes.state !== undefined) updateData.state = changes.state
  if (changes.postal_code !== undefined) updateData.postal_code = changes.postal_code
  if (changes.latitude !== undefined) updateData.latitude = changes.latitude
  if (changes.longitude !== undefined) updateData.longitude = changes.longitude

  if (changes.is_default) {
    await client
      .from('addresses')
      .update({ is_default: false })
      .eq('customer_id', user.id)
      .eq('is_default', true)
      .neq('id', id)
    updateData.is_default = true
  }

  return client
    .from('addresses')
    .update(updateData)
    .eq('id', id)
    .eq('customer_id', user.id)
    .select()
    .single()
}

export async function deleteAddress(id) {
  const client = requireSupabase()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { data: null, error: new Error('Authentication required') }

  return client
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('customer_id', user.id)
}

export async function setDefaultAddress(addressId) {
  const client = requireSupabase()
  const { data: { user } } = await client.auth.getUser()
  if (!user) return { data: null, error: new Error('Authentication required') }

  // Unset all current defaults
  await client
    .from('addresses')
    .update({ is_default: false })
    .eq('customer_id', user.id)
    .eq('is_default', true)

  // Set new default
  return client
    .from('addresses')
    .update({ is_default: true })
    .eq('id', addressId)
    .eq('customer_id', user.id)
    .select()
    .single()
}

export async function getDefaultAddress(customerId) {
  return requireSupabase()
    .from('addresses')
    .select('*')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
}
