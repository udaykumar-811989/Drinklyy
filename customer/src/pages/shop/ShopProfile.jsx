import { useState } from 'react'
import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getCurrentUser, updateCurrentProfile, updateCurrentUserEmail } from '../../services/auth'
import { getOwnedShop, updateShop } from '../../services/shops'

export function ShopProfile({ shopProfile, setShopProfile, shopOnline, setShopOnline, onLogout }) {
  const [form, setForm] = useState(shopProfile)
  const [error, setError] = useState('')

  const save = async (event) => {
    event.preventDefault()
    setError('')

    if (isSupabaseConfigured) {
      const { data: userResult, error: userError } = await getCurrentUser()
      if (userError) {
        setError(userError.message)
        return
      }
      const { data: shop, error: shopError } = await getOwnedShop(userResult.user.id)
      if (shopError || !shop) {
        setError(shopError?.message || 'No shop is linked to this account.')
        return
      }
      const result = await updateShop(shop.id, {
        name: form.shopName,
        description: form.description,
        logo_url: form.logo,
        phone: form.phone,
        email: form.email,
        address: form.address,
        opening_hours: form.openingHours,
        delivery_radius: form.deliveryRadius,
        is_open: form.status === 'Online'
      })
      if (result.error) {
        setError(result.error.message)
        return
      }
      const profileResult = await updateCurrentProfile({ full_name: form.ownerName, phone: form.phone, email: form.email })
      if (profileResult.error) {
        setError(profileResult.error.message)
        return
      }
      if (form.email !== userResult.user.email) {
        const emailResult = await updateCurrentUserEmail(form.email)
        if (emailResult.error) {
          setError(emailResult.error.message)
          return
        }
      }
    }

    setShopProfile(form)
  }

  return (
    <ShopLayout title="Shop Profile" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title="Shop Profile" breadcrumbs="Dashboard / Shop Profile" />

      {error && <p className="form-error">{error}</p>}

      <form className="shop-form" onSubmit={save}>
        <div className="shop-form-grid">
          <label className="shop-form-field"><span>Shop Logo</span><input value={form.logo || ''} onChange={(event) => setForm({ ...form, logo: event.target.value })} /></label>
          <label className="shop-form-field"><span>Shop Name</span><input value={form.shopName || ''} onChange={(event) => setForm({ ...form, shopName: event.target.value })} /></label>
          <label className="shop-form-field"><span>Owner Name</span><input value={form.ownerName || ''} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} /></label>
          <label className="shop-form-field"><span>Phone</span><input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
          <label className="shop-form-field"><span>Email</span><input value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label className="shop-form-field"><span>Shop Address</span><input value={form.address || ''} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
          <label className="shop-form-field"><span>Opening Hours</span><input value={typeof form.openingHours === 'string' ? form.openingHours : Object.values(form.openingHours || {}).map((day) => day.open ? `${day.openTime}-${day.closeTime}` : 'Closed').join(', ')} onChange={(event) => setForm({ ...form, openingHours: event.target.value })} /></label>
          <label className="shop-form-field"><span>Delivery Radius</span><input value={form.deliveryRadius || ''} onChange={(event) => setForm({ ...form, deliveryRadius: event.target.value })} /></label>
          <label className="shop-form-field full"><span>Shop Description</span><textarea value={form.description || ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          <label className="shop-form-field"><span>Store Status</span><select value={form.status || 'Online'} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>Online</option><option>Offline</option></select></label>
        </div>
        <div className="shop-form-buttons"><button className="shop-primary-button" type="submit">SAVE CHANGES</button></div>
      </form>
    </ShopLayout>
  )
}
