import { useMemo, useState } from 'react'
import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'
import { StatusBadge } from '../../components/shop/StatusBadge'
import { isSupabaseConfigured } from '../../lib/supabase'
import { updateInventory } from '../../services/inventory'

export function ShopInventory({ shopProducts, setShopProducts, shopProfile, shopOnline, setShopOnline, onLogout, onProductSaved }) {
  const [query, setQuery] = useState('')

  const updateStock = async (productId, nextValue) => {
    const product = shopProducts.find((item) => item.id === productId)
    const stock = Math.max(0, Number(nextValue))
    if (isSupabaseConfigured) {
      const result = await updateInventory(productId, stock, product.lowStockThreshold || 0)
      if (result.error) return
    }
    setShopProducts((current) =>
      current.map((p) => {
        if (p.id !== productId) return p
        return { ...p, stock }
      })
    )
  }

  const inventoryRows = useMemo(() => {
    const normalizedQuery = query.toLowerCase().trim()

    return shopProducts
      .filter((product) => product.name.toLowerCase().includes(normalizedQuery) || product.id.toLowerCase().includes(normalizedQuery))
      .map((product) => ({
        ...product,
        computedStatus: product.stock === 0 ? 'OUT_OF_STOCK' : product.stock <= product.lowStockThreshold ? 'LOW_STOCK' : 'IN_STOCK'
      }))
  }, [query, shopProducts])

  return (
    <ShopLayout title="Inventory" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title="Inventory" breadcrumbs="Dashboard / Inventory" />

      <div className="shop-filter-row">
        <input
          className="shop-search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search inventory..."
        />
      </div>

      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU/ID</th>
              <th>Current Stock</th>
              <th>Low Stock Threshold</th>
              <th>Status</th>
              <th>Last Updated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {inventoryRows.map((product) => (
              <tr key={product.id}>
                <td>{product.name}</td>
                <td>{product.id}</td>
                <td>{product.stock}</td>
                <td>{product.lowStockThreshold}</td>
                <td><StatusBadge status={product.computedStatus} /></td>
                <td>Today</td>
                <td>
                  <div className="shop-actions-group">
                    <button onClick={() => updateStock(product.id, product.stock + 5)}>+5</button>
                    <button onClick={() => updateStock(product.id, product.stock - 5)}>-5</button>
                    <button onClick={() => updateStock(product.id, 0)}>Set 0</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ShopLayout>
  )
}
