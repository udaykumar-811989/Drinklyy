import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'
import { StatusBadge } from '../../components/shop/StatusBadge'
import { isSupabaseConfigured } from '../../lib/supabase'
import { deleteProduct as deleteSupabaseProduct, updateProduct } from '../../services/products'

export function ShopProducts({ shopProducts, setShopProducts, shopProfile, shopOnline, setShopOnline, onLogout, onProductSaved }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return shopProducts.filter((product) => {
      const matchesQuery = product.name.toLowerCase().includes(query.toLowerCase())
      if (!matchesQuery) return false
      switch (filter) {
        case 'Active': return product.status === 'ACTIVE'
        case 'Inactive': return product.status === 'INACTIVE'
        case 'Pending Review': return product.status === 'PENDING_REVIEW'
        case 'Blocked': return product.status === 'BLOCKED'
        case 'Low Stock': return product.stock > 0 && product.stock <= (product.lowStockThreshold || 5)
        case 'Out of Stock': return product.stock === 0
        default: return true
      }
    })
  }, [filter, query, shopProducts])

  const updateStatus = async (id, nextStatus) => {
    if (isSupabaseConfigured) {
      const result = await updateProduct(id, { status: nextStatus })
      if (result.error) return
    }
    setShopProducts((current) => current.map((product) => (product.id === id ? { ...product, status: nextStatus } : product)))
    if (onProductSaved) await onProductSaved()
  }

  const deleteProduct = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    if (isSupabaseConfigured) {
      const result = await deleteSupabaseProduct(id)
      if (result.error) return
    }
    setShopProducts((current) => current.filter((product) => product.id !== id))
    if (onProductSaved) await onProductSaved()
  }

  return (
    <ShopLayout title="Products" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader
        title="Products"
        breadcrumbs="Dashboard / Products"
        actions={<button className="shop-primary-button compact" onClick={() => navigate('/shop/products/add')}>+ ADD PRODUCT</button>}
      />

      <div className="shop-filter-row">
        <input
          className="shop-search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products..."
        />
      </div>

      <div className="shop-chip-row">
        {['All', 'Active', 'Inactive', 'Low Stock', 'Out of Stock', 'Pending Review', 'Blocked'].map((option) => (
          <button key={option} className={filter === option ? 'shop-chip active' : 'shop-chip'} onClick={() => setFilter(option)}>
            {option}
          </button>
        ))}
      </div>

      <div className="shop-table-wrap">
        <table className="shop-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Product</th>
              <th>Brand</th>
              <th>Category</th>
              <th>Size</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id}>
                <td><img className="shop-thumb" src={product.image || 'https://placehold.co/80x80/101a23/ffc431?text=Drink'} alt={product.name} /></td>
                <td>{product.name}</td>
                <td>{product.brand}</td>
                <td>{product.category}</td>
                <td>{product.size}</td>
                <td>₹{product.price}</td>
                <td>{product.stock}</td>
                <td><StatusBadge status={product.status} /></td>
                <td>
                  <div className="shop-actions-group">
                    <button onClick={() => navigate(`/shop/products/edit/${product.id}`)}>EDIT</button>
                    <button onClick={() => deleteProduct(product.id)}>DELETE</button>
                    <button onClick={() => updateStatus(product.id, product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}>{product.status === 'ACTIVE' ? 'DISABLE' : 'ENABLE'}</button>
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
