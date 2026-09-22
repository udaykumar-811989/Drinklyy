import { useState } from 'react'
import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'
import { isSupabaseConfigured } from '../../lib/supabase'
import { createOffer as createSupabaseOffer, deleteOffer as deleteSupabaseOffer } from '../../services/offers'

export function ShopOffers({ shopOffers, setShopOffers, shopProfile, shopOnline, setShopOnline, onLogout }) {
  const [form, setForm] = useState({
    name: '',
    type: 'Percentage',
    value: 10,
    products: 'Corona Extra, Heineken',
    startDate: '2026-09-10',
    endDate: '2026-09-20',
    minimumOrder: 999,
    maximumDiscount: 300,
    status: 'ACTIVE'
  })

  const deleteOffer = async (offerId) => {
    if (isSupabaseConfigured) {
      const result = await deleteSupabaseOffer(offerId)
      if (result.error) return
    }
    setShopOffers((current) => current.filter((offer) => offer.id !== offerId))
  }

  const createOffer = async (event) => {
    event.preventDefault()
    const nextOffer = {
      ...form,
      id: `offer-${Date.now()}`,
      value: Number(form.value),
      minimumOrder: Number(form.minimumOrder),
      maximumDiscount: Number(form.maximumDiscount)
    }
    if (isSupabaseConfigured) {
      const result = await createSupabaseOffer({ shop_id: shopProfile.id, name: nextOffer.name, offer_type: nextOffer.type === 'Percentage' ? 'PERCENTAGE' : 'FIXED_AMOUNT', value: nextOffer.value, minimum_order: nextOffer.minimumOrder, maximum_discount: nextOffer.maximumDiscount, starts_at: `${nextOffer.startDate}T00:00:00Z`, ends_at: `${nextOffer.endDate}T23:59:59Z`, status: nextOffer.status })
      if (result.error) return
    }
    setShopOffers((current) => [nextOffer, ...current])
    setForm({
      name: '',
      type: 'Percentage',
      value: 10,
      products: '',
      startDate: '',
      endDate: '',
      minimumOrder: 0,
      maximumDiscount: 0,
      status: 'ACTIVE'
    })
  }

  return (
    <ShopLayout title="Offers" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title="Offers" breadcrumbs="Dashboard / Offers" />

      <form className="shop-form" onSubmit={createOffer}>
        <div className="shop-form-grid">
          <label className="shop-form-field"><span>Offer Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
          <label className="shop-form-field"><span>Discount Type</span><select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}><option>Percentage</option><option>Fixed Amount</option></select></label>
          <label className="shop-form-field"><span>Discount Value</span><input type="number" value={form.value} onChange={(event) => setForm({ ...form, value: event.target.value })} /></label>
          <label className="shop-form-field"><span>Applicable Products</span><input value={form.products} onChange={(event) => setForm({ ...form, products: event.target.value })} /></label>
          <label className="shop-form-field"><span>Start Date</span><input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} /></label>
          <label className="shop-form-field"><span>End Date</span><input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} /></label>
          <label className="shop-form-field"><span>Minimum Order</span><input type="number" value={form.minimumOrder} onChange={(event) => setForm({ ...form, minimumOrder: event.target.value })} /></label>
          <label className="shop-form-field"><span>Maximum Discount</span><input type="number" value={form.maximumDiscount} onChange={(event) => setForm({ ...form, maximumDiscount: event.target.value })} /></label>
          <label className="shop-form-field"><span>Status</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option>ACTIVE</option><option>SCHEDULED</option><option>EXPIRED</option><option>DISABLED</option></select></label>
        </div>
        <div className="shop-form-buttons">
          <button className="shop-primary-button" type="submit">+ CREATE OFFER</button>
        </div>
      </form>

      <div className="shop-panel">
        <div className="shop-panel-header"><h2>Current Offers</h2></div>
        <div className="shop-order-stack">
          {shopOffers.map((offer) => (
            <div className="shop-order-card" key={offer.id}>
              <div className="shop-order-head"><strong>{offer.name}</strong><span className="shop-badge shop-badge-success">{offer.status}</span></div>
              <p>{offer.type} • {offer.value}</p>
              <div className="shop-order-meta"><span>{offer.products}</span><span>{offer.startDate} to {offer.endDate}</span></div>
              <div className="shop-card-actions">
                <button className="danger" type="button" onClick={() => deleteOffer(offer.id)}>DELETE OFFER</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ShopLayout>
  )
}
