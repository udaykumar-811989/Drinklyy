import { NavLink } from 'react-router-dom'
import { brandLogo } from '../../components'

const items = [
  ['Dashboard', '/shop/dashboard'],
  ['Orders', '/shop/orders'],
  ['Products', '/shop/products'],
  ['Inventory', '/shop/inventory'],
  ['Offers', '/shop/offers'],
  ['Analytics', '/shop/analytics'],
  ['Shop Profile', '/shop/profile'],
  ['Compliance', '/shop/compliance'],
  ['Settings', '/shop/settings']
]

export function ShopSidebar({ onLogout }) {
  return (
    <aside className="shop-sidebar">
      <div className="shop-sidebar-brand">
        <div className="shop-brand-mark"><img src={brandLogo} alt="" /></div>
        <div>
          <strong>Drinklyy Shop</strong>
        </div>
      </div>

      <nav className="shop-sidebar-nav">
        {items.map(([label, to]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? 'shop-nav-item active' : 'shop-nav-item')}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <button className="shop-logout" onClick={onLogout}>Logout</button>
    </aside>
  )
}
