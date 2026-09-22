export function StatusBadge({ status }) {
  const normalized = (status || '').toUpperCase().replace(/\s+/g, '_')
  const palette = {
    NEW: 'amber',
    CONFIRMED: 'amber',
    ACCEPTED: 'info',
    PREPARING: 'purple',
    READY_FOR_PICKUP: 'green',
    OUT_FOR_DELIVERY: 'blue',
    PICKED_UP: 'blue',
    DELIVERED: 'success',
    CANCELLED: 'red',
    REJECTED: 'red',
    ACTIVE: 'success',
    INACTIVE: 'muted',
    PENDING_REVIEW: 'amber',
    RESTRICTED: 'amber',
    BLOCKED: 'red',
    OUT_OF_STOCK: 'red',
    LOW_STOCK: 'amber',
    IN_STOCK: 'success',
    SCHEDULED: 'info',
    EXPIRED: 'red',
    DISABLED: 'muted',
    PENDING: 'amber',
    PAID: 'success',
    FAILED: 'red'
  }

  const displayText = (status || '').replace(/_/g, ' ')
  return <span className={`shop-badge shop-badge-${palette[normalized] || 'muted'}`}>{displayText}</span>
}
