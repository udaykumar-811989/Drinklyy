import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { defaultShopProfile, shopStorageKeys, writeStorage } from '../../data/shopData'
import { isSupabaseConfigured } from '../../lib/supabase'
import { signUp } from '../../services/auth'
import { createShop } from '../../services/shops'
import { brandLogo } from '../../components'

export function ShopSignup({ setLoggedIn, onCreated }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    shopName: '',
    ownerName: '',
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.shopName || !form.ownerName || !form.email || !form.password) return
    setError('')

    if (isSupabaseConfigured) {
      const result = await signUp({ email: form.email, password: form.password, fullName: form.ownerName, role: 'SHOP_OWNER' })
      if (result.error) {
        setError(result.error.message)
        return
      }
      if (!result.data.session) {
        setError('Account created. Please log in to continue.')
        return
      }
      const shopResult = await createShop({ owner_id: result.data.user.id, name: form.shopName, email: form.email })
      if (shopResult.error) {
        setError(shopResult.error.message)
        return
      }
      onCreated?.({ ...shopResult.data, ownerName: form.ownerName })
    }

    if (!isSupabaseConfigured) {
      writeStorage(shopStorageKeys.profile, { ...defaultShopProfile, shopName: form.shopName, ownerName: form.ownerName, email: form.email })
      writeStorage(shopStorageKeys.session, { loggedIn: true, userEmail: form.email })
    }
    setLoggedIn(true)
    navigate('/shop/dashboard')
  }

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  return (
    <div className="shop-auth-screen">
      <div className="shop-auth-card">
        <div className="shop-auth-brand">
          <div className="shop-brand-mark large"><img src={brandLogo} alt="" /></div>
          <div>
            <strong>Drinklyy Shop</strong>
            <small>Create your store account</small>
          </div>
        </div>

        <div className="shop-auth-copy">
          <h1>Create Shop Account</h1>
          <p>Set up your store to start managing products and orders.</p>
        </div>

        <form className="shop-auth-form" onSubmit={handleSubmit}>
          <label>
            Shop Name
            <input type="text" value={form.shopName} onChange={(event) => updateField('shopName', event.target.value)} placeholder="Your shop name" required />
          </label>

          <label>
            Owner Name
            <input type="text" value={form.ownerName} onChange={(event) => updateField('ownerName', event.target.value)} placeholder="Your full name" required />
          </label>

          <label>
            Email
            <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} placeholder="name@shop.com" required />
          </label>

          <label>
            Password
            <input type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="Create a password" required />
          </label>

          {error && <p className="form-error">{error}</p>}
          <button className="shop-primary-button" type="submit">CREATE ACCOUNT</button>

          <div className="shop-auth-links">
            <span>Already have an account?</span>
            <Link to="/shop/login">Back to Login</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
