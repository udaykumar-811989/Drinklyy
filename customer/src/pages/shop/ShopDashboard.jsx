import { useMemo, useState } from 'react'
import { StatusBadge } from '../../components/shop/StatusBadge'
import { ShopLayout } from '../../components/shop/ShopLayout'
import { isSupabaseConfigured } from '../../lib/supabase'
import { updateOrderStatusByShop } from '../../services/orders'

export function ShopDashboard({
  shopProducts,
  shopOrders,
  shopProfile,
  setShopOnline,
  shopOnline,
  onLogout,
  setShopOrders,
  setShopProducts
}) {
  const [orderRange, setOrderRange] = useState('1 Day')
  const [orderQuery, setOrderQuery] = useState('')
  const newOrders = shopOrders.filter((item) => item.status === 'CONFIRMED')
  const pendingOrders = shopOrders.filter((item) => item.status === 'ACCEPTED' || item.status === 'PREPARING').length
  const lowStock = shopProducts.filter((item) => item.stock <= item.lowStockThreshold && item.stock > 0).length
  const salesThisWeek = shopOrders.filter((item) => item.status !== 'CANCELLED' && item.status !== 'REJECTED').reduce((sum, item) => sum + item.total, 0)
  const stats = [
    { label: "Today's Orders", value: newOrders.length, tone: 'gold', trend: '+12% vs yesterday' },
    { label: "Today's Sales", value: `₹${salesThisWeek.toLocaleString('en-IN')}`, tone: 'green', trend: '+18% vs yesterday' },
    { label: 'Pending Orders', value: pendingOrders, tone: 'amber', trend: 'Needs attention' },
    { label: 'Low Stock Items', value: lowStock, tone: 'red', trend: 'Review soon' },
    { label: 'Compliance', value: 'ACTIVE', tone: 'blue', trend: 'Verified' }
  ]

  const handleOrderAction = async (orderId, action) => {
    const current = [...shopOrders]
    const index = current.findIndex((order) => order.id === orderId)
    if (index === -1) return

    const nextStatus = action === 'accept' ? 'ACCEPTED' : action === 'reject' ? 'CANCELLED' : action === 'prepare' ? 'PREPARING' : 'READY_FOR_PICKUP'
    if (isSupabaseConfigured) {
      const dbStatusMap = { ACCEPTED: 'ACCEPTED', PREPARING: 'PREPARING', READY_FOR_PICKUP: 'READY_FOR_PICKUP', CANCELLED: 'CANCELLED' }
      const result = await updateOrderStatusByShop(current[index].databaseId || orderId, dbStatusMap[nextStatus] || nextStatus)
      if (result.error) return
    }
    current[index].status = nextStatus
    setShopOrders(current)
  }

  const filteredOrders = useMemo(() => {
    const normalizedQuery = orderQuery.toLowerCase().trim()

    return shopOrders.filter((order) => {
      const isToday = order.time.toLowerCase().startsWith('today')
      const matchesRange = orderRange !== '1 Day' || isToday
      const matchesQuery = !normalizedQuery || [order.id, order.customer, order.status]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
      return matchesRange && matchesQuery
    })
  }, [orderQuery, orderRange, shopOrders])

  const liveOrders = filteredOrders.filter((order) => ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(order.status)).slice(0, 4)

  return (
    <ShopLayout title="Dashboard" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <div className="shop-dashboard-header">
        <div>
          <p className="shop-section-kicker">Overview</p>
          <h2>Dashboard</h2>
        </div>
        <div className="shop-subtitle">Manage your store, orders and inventory.</div>
      </div>

      <section className="shop-stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`shop-stat-card ${stat.tone}`}>
            <div className="shop-stat-meta">
              <span>{stat.label}</span>
              <small>{stat.trend}</small>
            </div>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </section>

      <section className="shop-dashboard-main-grid">
        <div className="shop-card shop-live-orders-card">
          <div className="shop-card-header">
            <div>
              <h3>Total Orders</h3>
              <span className="shop-count-badge">{filteredOrders.length}</span>
            </div>
          </div>

          <div className="shop-chip-row">
            {['1 Day', '1 Week', '1 Month', '1 Year'].map((range) => (
              <button key={range} className={orderRange === range ? 'shop-chip active' : 'shop-chip'} onClick={() => setOrderRange(range)}>
                {range}
              </button>
            ))}
          </div>

          <div className="shop-filter-row">
            <input
              className="shop-search-input"
              value={orderQuery}
              onChange={(event) => setOrderQuery(event.target.value)}
              placeholder="Search orders..."
            />
          </div>

          <div className="shop-table-wrap">
            <table className="shop-table dashboard-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {liveOrders.map((order) => (
                  <tr key={order.id}>
                    <td>#{order.id}</td>
                    <td>{order.items} items</td>
                    <td>₹{order.total}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td>
                      <div className="shop-row-actions">
                        {order.status === 'CONFIRMED' && (
                          <>
                            <button onClick={() => handleOrderAction(order.id, 'accept')}>ACCEPT</button>
                            <button className="danger" onClick={() => handleOrderAction(order.id, 'reject')}>REJECT</button>
                          </>
                        )}
                        {order.status === 'ACCEPTED' && <button onClick={() => handleOrderAction(order.id, 'prepare')}>START PREPARING</button>}
                        {order.status === 'PREPARING' && <button onClick={() => handleOrderAction(order.id, 'ready')}>MARK READY</button>}
                        {order.status === 'READY_FOR_PICKUP' && <button onClick={() => window.location.assign(`/shop/orders/${order.id}`)}>VIEW</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </section>

    </ShopLayout>
  )
}
