import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'
import { StatusBadge } from '../../components/shop/StatusBadge'
import { isSupabaseConfigured } from '../../lib/supabase'
import { updateOrderStatusByShop } from '../../services/orders'

export function ShopOrders({ shopOrders, setShopOrders, shopProfile, shopOnline, setShopOnline, onLogout }) {
  const [tab, setTab] = useState('New')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const tabs = ['New', 'Accepted', 'Preparing', 'Ready', 'Out for Delivery', 'Completed', 'Cancelled']

  const tabStatusMap = {
    New: ['CONFIRMED'],
    Accepted: ['ACCEPTED'],
    Preparing: ['PREPARING'],
    Ready: ['READY_FOR_PICKUP'],
    'Out for Delivery': ['OUT_FOR_DELIVERY'],
    Completed: ['DELIVERED'],
    Cancelled: ['CANCELLED']
  }

  const visibleOrders = useMemo(() => {
    const allowedStatuses = tabStatusMap[tab] || []
    return shopOrders.filter((order) => {
      const matchesTab = tab === 'New' ? allowedStatuses.includes(order.status) : allowedStatuses.includes(order.status)
      const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) || (order.customer || '').toLowerCase().includes(search.toLowerCase())
      return matchesTab && matchesSearch
    })
  }, [search, shopOrders, tab])

  const updateOrder = async (id, nextStatus) => {
    const order = shopOrders.find((item) => item.id === id)
    if (isSupabaseConfigured && order?.databaseId) {
      const dbStatusMap = { ACCEPTED: 'ACCEPTED', PREPARING: 'PREPARING', READY_FOR_PICKUP: 'READY_FOR_PICKUP', OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED' }
      const result = await updateOrderStatusByShop(order.databaseId, dbStatusMap[nextStatus] || nextStatus)
      if (result.error) return
    }
    setShopOrders((current) => current.map((order) => (order.id === id ? { ...order, status: nextStatus } : order)))
  }

  return (
    <ShopLayout title="Orders" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title="Orders" breadcrumbs="Dashboard / Orders" />

      <div className="shop-order-filters">
        <div className="shop-tab-row">
          {tabs.map((item) => (
            <button key={item} className={tab === item ? 'shop-tab active' : 'shop-tab'} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>
        <div className="shop-order-actions-row">
          <input className="shop-search-input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by Order ID or Customer" />
        </div>
      </div>

      <div className="shop-order-stack">
        {visibleOrders.length === 0 && <p className="shop-empty-text">No orders in this category.</p>}
        {visibleOrders.map((order) => (
          <div className="shop-order-card" key={order.id}>
            <div className="shop-order-head">
              <strong>{order.id}</strong>
              <StatusBadge status={order.status} />
            </div>
            <p>{order.time}</p>
            <div className="shop-order-meta">
              <span>{order.customer}</span>
              <span>{order.items} Items</span>
            </div>
            <div className="shop-order-meta big">
              <strong>₹{order.total}</strong>
              <span>{order.address}</span>
            </div>
            <div className="shop-card-actions">
              <button onClick={() => navigate(`/shop/orders/${order.id}`)}>VIEW</button>
              {order.status === 'CONFIRMED' && <button className="ghost" onClick={() => updateOrder(order.id, 'ACCEPTED')}>ACCEPT</button>}
              {order.status === 'CONFIRMED' && <button className="danger" onClick={() => updateOrder(order.id, 'CANCELLED')}>REJECT</button>}
              {order.status === 'ACCEPTED' && <button onClick={() => updateOrder(order.id, 'PREPARING')}>START PREPARING</button>}
              {order.status === 'PREPARING' && <button onClick={() => updateOrder(order.id, 'READY_FOR_PICKUP')}>MARK READY</button>}
              {order.status === 'READY_FOR_PICKUP' && <button onClick={() => updateOrder(order.id, 'OUT_FOR_DELIVERY')}>OUT FOR DELIVERY</button>}
              {order.status === 'OUT_FOR_DELIVERY' && <button onClick={() => updateOrder(order.id, 'DELIVERED')}>MARK DELIVERED</button>}
            </div>
          </div>
        ))}
      </div>
    </ShopLayout>
  )
}
