import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'

export function ShopAnalytics({ shopAnalytics, shopProfile, shopOnline, setShopOnline, onLogout }) {
  return (
    <ShopLayout title="Analytics" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title="Analytics" breadcrumbs="Dashboard / Analytics" />

      <section className="shop-stats-grid">
        <div className="shop-stat-card shop-stat-gold"><span>Today's Sales</span><strong>₹{shopAnalytics.todaySales.toLocaleString('en-IN')}</strong></div>
        <div className="shop-stat-card shop-stat-green"><span>Weekly Sales</span><strong>₹{shopAnalytics.weeklySales.toLocaleString('en-IN')}</strong></div>
        <div className="shop-stat-card shop-stat-blue"><span>Monthly Sales</span><strong>₹{shopAnalytics.monthlySales.toLocaleString('en-IN')}</strong></div>
        <div className="shop-stat-card shop-stat-amber"><span>Total Orders</span><strong>{shopAnalytics.totalOrders}</strong></div>
        <div className="shop-stat-card shop-stat-red"><span>Average Order Value</span><strong>₹{shopAnalytics.averageOrderValue}</strong></div>
      </section>

      <section className="shop-panel-grid analytics-grid">
        <div className="shop-panel">
          <div className="shop-panel-header"><h2>Sales chart</h2></div>
          <div className="shop-chart-bars">
            {shopAnalytics.salesData.map((value, index) => (
              <div key={index} className="shop-chart-bar-wrap">
                <span className="shop-chart-bar" style={{ height: `${value}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="shop-panel">
          <div className="shop-panel-header"><h2>Orders chart</h2></div>
          <div className="shop-chart-bars orders">
            {shopAnalytics.orderData.map((value, index) => (
              <div key={index} className="shop-chart-bar-wrap">
                <span className="shop-chart-bar alt" style={{ height: `${value}%` }} />
              </div>
            ))}
          </div>
        </div>

        <div className="shop-panel full-width">
          <div className="shop-panel-header"><h2>Top products</h2></div>
          <div className="shop-ranking-list">
            {shopAnalytics.topProducts.map((product, index) => (
              <div className="shop-ranking-row" key={product.name}>
                <span>#{index + 1}</span>
                <strong>{product.name}</strong>
                <small>{product.value} sales</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ShopLayout>
  )
}
