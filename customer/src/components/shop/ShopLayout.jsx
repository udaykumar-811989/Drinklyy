import { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

const navItems = [
  ['Orders', '/shop/orders'],
  ['Dashboard', '/shop/dashboard'],
  ['Products', '/shop/products'],
  ['Inventory', '/shop/inventory'],
  ['Offers', '/shop/offers'],
  ['Analytics', '/shop/analytics'],
  ['Shop Profile', '/shop/profile'],
  ['Compliance', '/shop/compliance'],
  ['Notifications', '/shop/notifications'],
  ['Settings', '/shop/settings']
]

export function ShopLayout({ title, children, userName = '', shopName = '', location = '', logoUrl = '', online = true, setOnline, onLogout }) {
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const nav = useMemo(() => navItems, [])
  return (
    <div className="shop-app-shell">
      <aside className="shop-sidebar desktop-only">
        <div className="shop-side-top">
          <div className="shop-brand-bar">
            {logoUrl ? <img className="shop-brand-image" src={logoUrl} alt="Shop logo" /> : <div className="shop-brand-mark">{(shopName || userName || 'S').slice(0, 2).toUpperCase()}</div>}
            <div>
              <strong>{shopName || 'Drinklyy Shop'}</strong>
              <small>Shop</small>
            </div>
          </div>

          <div className="shop-location-pill">
            <span className="shop-location-dot" />
            <div>
              <strong>{shopName || 'Shop'}</strong>
              <small>{location}</small>
            </div>
          </div>
        </div>

        <nav className="shop-sidebar-nav">
          {nav.map(([label, to]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/shop/dashboard'}
              className={({ isActive }) => (isActive ? 'shop-nav-item active' : 'shop-nav-item')}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="shop-logout" onClick={onLogout}>Logout</button>
      </aside>

      <div className="shop-main-panel">
        <header className="shop-topbar">
          <div className="shop-mobile-row">
            <button className="shop-menu-button mobile-only" onClick={() => setDrawerOpen(true)}>☰</button>
            <div className="shop-header-identity">
              <span className="shop-kicker">Drinklyy Shop</span>
              <h1>{title}</h1>
            </div>
          </div>

          <div className="shop-header-actions">
            <div className="shop-user-wrap">
              <button className="shop-avatar-button" onClick={() => navigate('/shop/profile')}>
                <span className="shop-avatar">{(userName || shopName || 'S').slice(0, 2).toUpperCase()}</span>
              </button>
              <div className="shop-user-dropdown">
                <button onClick={() => navigate('/shop/profile')}>Shop Profile</button>
                <button onClick={() => navigate('/shop/settings')}>Settings</button>
                <button onClick={onLogout}>Logout</button>
              </div>
            </div>

            <div className="shop-owner-meta">
              <strong>{userName}</strong>
              <span>Shop Owner</span>
            </div>
          </div>
        </header>

        <main className="shop-page-content">{children}</main>
      </div>

      {drawerOpen && (
        <div className="shop-mobile-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <div className="shop-mobile-drawer" onClick={(event) => event.stopPropagation()}>
            <div className="shop-brand-bar">
              {logoUrl ? <img className="shop-brand-image" src={logoUrl} alt="Shop logo" /> : <div className="shop-brand-mark">{(shopName || userName || 'S').slice(0, 2).toUpperCase()}</div>}
              <div>
                <strong>{shopName || 'Drinklyy Shop'}</strong>
                <small>Shop</small>
              </div>
            </div>
            <nav className="shop-drawer-nav">
              {nav.map(([label, to]) => (
                <NavLink key={to} to={to} onClick={() => setDrawerOpen(false)} className={({ isActive }) => (isActive ? 'shop-nav-item active' : 'shop-nav-item')}>
                  {label}
                </NavLink>
              ))}
            </nav>
            <button className="shop-logout" onClick={onLogout}>Logout</button>
          </div>
        </div>
      )}
    </div>
  )
}
