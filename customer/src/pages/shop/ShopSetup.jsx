import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getCurrentProfile, getCurrentUser } from '../../services/auth'
import { createShop } from '../../services/shops'

export function ShopSetup({ onCreated, shopOnline, setShopOnline, onLogout }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ shopName: '', ownerName: '', phone: '', address: '', openingHours: '', deliveryRadius: '', description: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const [{ data: userResult, error: userError }, { data: profileResult, error: profileError }] = await Promise.all([getCurrentUser(), getCurrentProfile()])
    if (userError || profileError || !userResult.user) {
      setError((userError || profileError)?.message || 'Please log in again.')
      setSaving(false)
      return
    }
    const result = await createShop({
      owner_id: userResult.user.id,
      name: form.shopName,
      description: form.description,
      phone: form.phone || profileResult?.phone,
      email: userResult.user.email,
      address: form.address,
      opening_hours: form.openingHours,
      delivery_radius: form.deliveryRadius,
      is_open: true
    })
    if (result.error) setError(result.error.message)
    else {
      onCreated({ ...result.data, ownerName: form.ownerName || profileResult?.full_name, openingHours: form.openingHours, deliveryRadius: form.deliveryRadius })
      navigate('/shop/dashboard')
    }
    setSaving(false)
  }

  if (!isSupabaseConfigured) return null

  return (
    <div className="shop-app-shell">
      <div className="shop-main-panel">
        <main className="shop-page-content">
          <div className="shop-auth-card shop-setup-card">
            <div className="shop-auth-copy">
              <h1>Set up your shop</h1>
              <p>Create your shop profile before opening the dashboard.</p>
            </div>
            <form className="shop-form" onSubmit={save}>
              <div className="shop-form-grid">
                <label className="shop-form-field"><span>Shop Name</span><input required value={form.shopName} onChange={(event) => update('shopName', event.target.value)} /></label>
                <label className="shop-form-field"><span>Owner Name</span><input value={form.ownerName} onChange={(event) => update('ownerName', event.target.value)} /></label>
                <label className="shop-form-field"><span>Phone</span><input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
                <label className="shop-form-field"><span>Shop Address</span><input required value={form.address} onChange={(event) => update('address', event.target.value)} /></label>
                <label className="shop-form-field"><span>Opening Hours</span><input placeholder="10:00-22:00" value={form.openingHours} onChange={(event) => update('openingHours', event.target.value)} /></label>
                <label className="shop-form-field"><span>Delivery Radius</span><input value={form.deliveryRadius} onChange={(event) => update('deliveryRadius', event.target.value)} /></label>
                <label className="shop-form-field full"><span>Description</span><textarea value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
              </div>
              {error && <p className="form-error">{error}</p>}
              <div className="shop-form-buttons"><button className="shop-primary-button" type="submit" disabled={saving}>{saving ? 'SAVING...' : 'CREATE SHOP'}</button><button className="shop-secondary-button" type="button" onClick={onLogout}>LOG OUT</button></div>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}
