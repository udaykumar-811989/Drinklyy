import { Link, useNavigate } from 'react-router-dom'

export function ShopHeader({ shopName, online, onToggleOnline, onLogout }) {
  const navigate = useNavigate()

  return (
    <header className="shop-topbar">
      <div className="shop-header-brand">
        <div className="shop-header-mark">D</div>
        <div>
          <strong>Drinkly Shop</strong>
          <small>{shopName}</small>
        </div>
      </div>

      <div className="shop-header-actions">
        <button className="shop-toggle" onClick={onToggleOnline}>
          <span className={online ? 'on' : ''} />
          {online ? 'Online' : 'Offline'}
        </button>

        <Link to="/shop/notifications" className="shop-icon-button" aria-label="Notifications">
          🔔
        </Link>

        <div className="shop-user-menu">
          <button className="shop-user-pill" onClick={() => navigate('/shop/profile')}>
            <span className="shop-avatar">NS</span>
          </button>
          <div className="shop-user-dropdown">
            <button onClick={() => navigate('/shop/profile')}>Shop Profile</button>
            <button onClick={() => navigate('/shop/settings')}>Settings</button>
            <button onClick={onLogout}>Logout</button>
          </div>
        </div>
      </div>
    </header>
  )
}
