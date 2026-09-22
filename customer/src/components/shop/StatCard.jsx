export function StatCard({ label, value, tone = 'gold' }) {
  return (
    <div className={`shop-stat-card shop-stat-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
