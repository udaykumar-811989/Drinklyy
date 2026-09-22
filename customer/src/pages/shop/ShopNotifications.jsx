import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'

export function ShopNotifications({ shopNotifications, setShopNotifications, shopProfile, shopOnline, setShopOnline, onLogout }) {
  const markRead = (id) => {
    setShopNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)))
  }

  const markAllRead = () => {
    setShopNotifications((current) => current.map((item) => ({ ...item, read: true })))
  }

  return (
    <ShopLayout title="Notifications" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title="Notifications" breadcrumbs="Dashboard / Notifications" />

      <div className="shop-notifications-toolbar">
        <span>{shopNotifications.filter((item) => !item.read).length} unread</span>
        <button onClick={markAllRead}>Mark all read</button>
      </div>

      <div className="shop-notification-list">
        {shopNotifications.map((notification) => (
          <div className={notification.read ? 'shop-notification-card read' : 'shop-notification-card'} key={notification.id}>
            <div className="shop-notification-dot" />
            <div>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <small>{notification.time}</small>
            </div>
            {!notification.read && <button onClick={() => markRead(notification.id)}>Mark read</button>}
          </div>
        ))}
      </div>
    </ShopLayout>
  )
}
