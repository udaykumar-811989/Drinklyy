import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { shopStorageKeys, writeStorage } from '../../data/shopData'
import { isSupabaseConfigured } from '../../lib/supabase'
import { getCurrentProfile, signIn } from '../../services/auth'
import { brandLogo } from '../../components'

export function ShopLogin({ setLoggedIn }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.email || !form.password) return
    setError('')

    if (isSupabaseConfigured) {
      const result = await signIn(form)
      if (result.error) {
        setError(result.error.message)
        return
      }
      const { data: profile, error: profileError } = await getCurrentProfile()
      if (profileError) {
        setError(`Shop profile lookup failed: ${profileError.message}`)
        return
      }
      if (profile?.role !== 'SHOP_OWNER' && profile?.role !== 'ADMIN') {
        setError('This account is not registered as a shop owner. Run the shop-owner role repair migration, then log in again.')
        return
      }
    }

    if (!isSupabaseConfigured) writeStorage(shopStorageKeys.session, { loggedIn: true, userEmail: form.email })
    setLoggedIn(true)
    navigate('/shop/dashboard')
  }

  return (
    <div className="shop-auth-screen">
      <div className="shop-auth-card">
        <div className="shop-auth-brand">
          <div className="shop-brand-mark large"><img src={brandLogo} alt="" /></div>
          <div>
            <strong>Drinkly Shop</strong>
            <small>Owner portal</small>
          </div>
        </div>

        <div className="shop-auth-copy">
          <h1>Welcome back</h1>
          <p>Manage your store, products and orders.</p>
        </div>

        <form className="shop-auth-form" onSubmit={handleSubmit}>
          <label>
            Email / Phone
            <input
              type="text"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="name@shop.com"
            />
          </label>

          <label>
            Password
            <div className="shop-password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Enter your password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && <p className="form-error">{error}</p>}
          <button className="shop-primary-button" type="submit">LOGIN</button>

          <div className="shop-auth-links">
            <button type="button">Forgot Password</button>
            <Link to="/shop/signup">Create Shop Account</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
