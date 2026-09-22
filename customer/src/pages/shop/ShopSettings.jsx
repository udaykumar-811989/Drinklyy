import { useState } from 'react'
import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'

export function ShopSettings({ shopSettings, setShopSettings, shopProfile, shopOnline, setShopOnline, onLogout }) {
  const [localSettings, setLocalSettings] = useState(shopSettings)

  const toggle = (key) => {
    setLocalSettings((current) => ({ ...current, [key]: !current[key] }))
    setShopSettings((current) => ({ ...current, [key]: !current[key] }))
  }

  return (
    <ShopLayout title="Settings" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title="Settings" breadcrumbs="Dashboard / Settings" />

      <div className="shop-settings-list">
        <div className="shop-settings-row"><span>Email notifications</span><button onClick={() => toggle('emailNotifications')}>{localSettings.emailNotifications ? 'On' : 'Off'}</button></div>
        <div className="shop-settings-row"><span>New order notifications</span><button onClick={() => toggle('newOrderNotifications')}>{localSettings.newOrderNotifications ? 'On' : 'Off'}</button></div>
        <div className="shop-settings-row"><span>Low stock notifications</span><button onClick={() => toggle('lowStockNotifications')}>{localSettings.lowStockNotifications ? 'On' : 'Off'}</button></div>
        <div className="shop-settings-row"><span>Offer notifications</span><button onClick={() => toggle('offerNotifications')}>{localSettings.offerNotifications ? 'On' : 'Off'}</button></div>
        <div className="shop-settings-row"><span>Sound notifications</span><button onClick={() => toggle('soundNotifications')}>{localSettings.soundNotifications ? 'On' : 'Off'}</button></div>
        <div className="shop-settings-row"><span>Compliance Preferences</span><button onClick={() => toggle('compliancePreferences')}>{localSettings.compliancePreferences ? 'On' : 'Off'}</button></div>
      </div>
    </ShopLayout>
  )
}
