import { useNavigate } from 'react-router-dom'

export function ShopPageHeader({ title, subtitle, showBack = true, actions, breadcrumbs }) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate('/shop/dashboard')
  }

  return (
    <div className="shop-page-header">
      <div className="shop-page-header-row">
        {showBack && (
          <button type="button" className="shop-back-button" onClick={handleBack} aria-label={`Go back from ${title}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 18L9 12L15 6" />
            </svg>
            <span>Back</span>
          </button>
        )}

        <div className="shop-page-header-copy">
          {breadcrumbs && <div className="shop-breadcrumbs">{breadcrumbs}</div>}
          <h2>{title}</h2>
          {subtitle && <small>{subtitle}</small>}
        </div>

        {actions && <div className="shop-page-header-actions">{actions}</div>}
      </div>
    </div>
  )
}
