import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'

export function ShopCompliance({ shopCompliance, shopProfile, shopOnline, setShopOnline, onLogout }) {
  return (
    <ShopLayout title="Compliance" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title="Compliance" breadcrumbs="Dashboard / Compliance" />

      <div className="shop-compliance-grid">
        <div className="shop-panel">
          <div className="shop-panel-header"><h2>Shop Licence</h2></div>
          <div className="shop-licence-list">
            <div><span>Status</span><strong>{shopCompliance.licenceStatus}</strong></div>
            <div><span>Licence Number</span><strong>{shopCompliance.licenceNumber}</strong></div>
            <div><span>Expiry</span><strong>{shopCompliance.licenceExpiry}</strong></div>
            <div><span>Approval</span><strong>{shopCompliance.approvalStatus}</strong></div>
            <div><span>Jurisdiction</span><strong>{shopCompliance.jurisdiction}</strong></div>
            <div><span>Alcohol Sales</span><strong>{shopCompliance.alcoholSalesEnabled ? 'ENABLED' : 'DISABLED'}</strong></div>
            <div><span>Delivery Area</span><strong>{shopCompliance.deliveryAreaConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}</strong></div>
          </div>
        </div>

        <div className="shop-panel">
          <div className="shop-panel-header"><h2>Compliance Checklist</h2></div>
          <ul className="shop-checklist">
            <li>Shop licence ✓</li>
            <li>Jurisdiction configuration ✓</li>
            <li>Operating hours ✓</li>
            <li>Product review ✓</li>
            <li>Delivery authorization dependency ✓</li>
          </ul>
        </div>
      </div>
    </ShopLayout>
  )
}
