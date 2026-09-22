import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'
import { StatusBadge } from '../../components/shop/StatusBadge'
import { isSupabaseConfigured } from '../../lib/supabase'
import { updateOrderStatusByShop } from '../../services/orders'

export function ShopOrderDetails({ shopOrders, setShopOrders, shopProfile, shopOnline, setShopOnline, onLogout }) {
  const { id } = useParams()
  const order = useMemo(() => shopOrders.find((item) => item.id === id) || shopOrders[0], [id, shopOrders])
  const [reason, setReason] = useState('Out of Stock')

  if (!order) return null

  const subtotal = (order.itemsList || []).reduce((sum, item) => sum + item.price * item.quantity, 0)

  const updateStatus = async (nextStatus) => {
    if (isSupabaseConfigured && order.databaseId) {
      const dbStatusMap = { ACCEPTED: 'ACCEPTED', PREPARING: 'PREPARING', READY_FOR_PICKUP: 'READY_FOR_PICKUP', OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY', DELIVERED: 'DELIVERED', CANCELLED: 'CANCELLED' }
      const result = await updateOrderStatusByShop(order.databaseId, dbStatusMap[nextStatus] || nextStatus)
      if (result.error) return
    }
    setShopOrders((current) => current.map((item) => (item.id === order.id ? { ...item, status: nextStatus } : item)))
  }

  return (
    <ShopLayout title={`Order ${order.id}`} userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title={`Order ${order.id}`} breadcrumbs="Dashboard / Orders / Order Details" />

      <div className="shop-order-detail-card">
        <div className="shop-order-head">
          <strong>{order.id}</strong>
          <StatusBadge status={order.status} />
        </div>
        <div className="shop-order-detail-grid">
          <div>
            <p>Customer</p>
            <strong>{order.customer}</strong>
            {order.customerPhone && <small>{order.customerPhone}</small>}
            {order.customerEmail && <small>{order.customerEmail}</small>}
          </div>
          <div>
            <p>Delivery address</p>
            <strong>{order.address}</strong>
          </div>
          <div>
            <p>Order time</p>
            <strong>{order.time}</strong>
          </div>
          <div>
            <p>Total</p>
            <strong>₹{order.total}</strong>
          </div>
          <div>
            <p>Payment</p>
            <strong className={`payment-status ${(order.paymentStatus || '').toLowerCase()}`}>{order.paymentStatus || 'PENDING'}</strong>
          </div>
          <div>
            <p>Compliance</p>
            <strong>{order.complianceStatus || 'PENDING'}</strong>
          </div>
        </div>

        <div className="shop-order-items">
          <h3>Items</h3>
          {(order.itemsList || []).map((item, index) => (
            <div className="shop-order-item-row" key={`${order.id}-item-${index}`}>
              <span>{item.product}</span>
              <span>Qty {item.quantity}</span>
              <strong>₹{item.price * item.quantity}</strong>
            </div>
          ))}
        </div>

        <div className="shop-summary-box">
          <div><span>Subtotal</span><strong>₹{subtotal}</strong></div>
          <div><span>Delivery fee</span><strong>₹{order.delivery_fee || 49}</strong></div>
          <div className="total"><span>Total</span><strong>₹{order.total}</strong></div>
        </div>

        <div className="shop-card-actions detail-actions">
          {order.status === 'CONFIRMED' && <button onClick={() => updateStatus('ACCEPTED')}>ACCEPT</button>}
          {order.status === 'CONFIRMED' && (
            <>
              <select value={reason} onChange={(event) => setReason(event.target.value)}>
                <option>Out of Stock</option>
                <option>Shop Closed</option>
                <option>Unable to Fulfill</option>
                <option>Compliance Restriction</option>
                <option>Other</option>
              </select>
              <button className="danger" onClick={() => updateStatus('CANCELLED')}>REJECT</button>
            </>
          )}
          {order.status === 'ACCEPTED' && <button onClick={() => updateStatus('PREPARING')}>START PREPARING</button>}
          {order.status === 'PREPARING' && <button onClick={() => updateStatus('READY_FOR_PICKUP')}>MARK READY</button>}
          {order.status === 'READY_FOR_PICKUP' && <button onClick={() => updateStatus('OUT_FOR_DELIVERY')}>OUT FOR DELIVERY</button>}
          {order.status === 'OUT_FOR_DELIVERY' && <button onClick={() => updateStatus('DELIVERED')}>MARK DELIVERED</button>}
        </div>
      </div>
    </ShopLayout>
  )
}
