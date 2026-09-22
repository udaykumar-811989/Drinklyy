import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'
import { isSupabaseConfigured } from '../../lib/supabase'
import { deleteProduct, listCategories, updateProduct, uploadProductImage } from '../../services/products'
import { updateInventory } from '../../services/inventory'

export function ShopEditProduct({ shopProducts, setShopProducts, shopProfile, shopOnline, setShopOnline, onLogout, onProductSaved }) {
  const navigate = useNavigate()
  const { id } = useParams()
  const product = useMemo(() => shopProducts.find((item) => item.id === id) || shopProducts[0], [id, shopProducts])
  const [form, setForm] = useState({})
  const [initialized, setInitialized] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [errors, setErrors] = useState({})
  const [dbCategories, setDbCategories] = useState([])

  useEffect(() => {
    if (product && !initialized) {
      setForm({ ...product })
      setInitialized(true)
    }
  }, [product, initialized])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    listCategories().then(({ data }) => {
      if (data) setDbCategories(data)
    })
  }, [])

  const handleChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors({ image: 'Please select an image file.' })
      return
    }
    setUploading(true)
    setErrors((current) => ({ ...current, image: '' }))
    const result = await uploadProductImage(shopProfile.id, file)
    if (result.error) {
      setErrors({ image: 'Upload failed: ' + result.error.message })
    } else {
      handleChange('image', result.data.publicUrl)
    }
    setUploading(false)
  }

  const saveChanges = async (event) => {
    event.preventDefault()
    if (!form.name?.trim()) {
      setErrors({ name: 'Product name is required.' })
      return
    }
    setSaving(true)
    setErrors({})

    try {
      if (isSupabaseConfigured) {
        const matchedCategory = dbCategories.find((c) => c.name === form.category)
        const result = await updateProduct(id, {
          name: form.name.trim(),
          brand: (form.brand || '').trim(),
          description: (form.description || '').trim(),
          size: (form.size || '').trim(),
          alcohol_percentage: Number(form.alcoholPercentage || 0),
          price: Number(form.price || 0),
          discount_price: form.discountPrice ? Number(form.discountPrice) : null,
          image_url: form.image || null,
          status: form.status || 'ACTIVE',
          category_id: matchedCategory ? matchedCategory.id : null
        })
        if (result.error) {
          setErrors({ form: result.error.message })
          setSaving(false)
          return
        }

        const inventoryResult = await updateInventory(id, Number(form.stock || 0), Number(form.lowStockThreshold || 0))
        if (inventoryResult.error) {
          setErrors({ form: 'Product updated but inventory failed: ' + inventoryResult.error.message })
          setSaving(false)
          return
        }

        if (onProductSaved) await onProductSaved()
        setSaving(false)
        navigate('/shop/products')
        return
      }

      setShopProducts((current) => current.map((item) => (item.id === id ? { ...form, id, price: Number(form.price), stock: Number(form.stock) } : item)))
      navigate('/shop/products')
    } catch (err) {
      setErrors({ form: err.message || 'An unexpected error occurred.' })
    } finally {
      setSaving(false)
    }
  }

  const removeProduct = async () => {
    if (!confirm('Are you sure you want to delete this product?')) return
    setSaving(true)
    try {
      if (isSupabaseConfigured) {
        const result = await deleteProduct(id)
        if (result.error) {
          setErrors({ form: result.error.message })
          setSaving(false)
          return
        }
      }
      setShopProducts((current) => current.filter((item) => item.id !== id))
      if (onProductSaved) await onProductSaved()
      navigate('/shop/products')
    } catch (err) {
      setErrors({ form: err.message || 'Failed to delete product.' })
    } finally {
      setSaving(false)
    }
  }

  if (!product) return null

  return (
    <ShopLayout title="Edit Product" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title="Edit Product" breadcrumbs="Dashboard / Products / Edit Product" />

      <form className="shop-form" onSubmit={saveChanges}>
        <div className="shop-form-grid">
          <label className="shop-form-field full">
            Product Image
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {form.image && <img src={form.image} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #333' }} />}
              <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading || saving} style={{ marginBottom: 8 }} />
                {uploading && <small style={{ color: '#ffc431' }}>Uploading image...</small>}
                {errors.image && <small style={{ color: '#ff6b6b' }}>{errors.image}</small>}
              </div>
            </div>
            <input type="url" value={form.image || ''} onChange={(event) => handleChange('image', event.target.value)} placeholder="Or paste an image URL" style={{ marginTop: 8 }} disabled={saving} />
          </label>

          <label className="shop-form-field">
            <span>Product Name *</span>
            <input value={form.name || ''} onChange={(event) => handleChange('name', event.target.value)} disabled={saving} />
            {errors.name && <small style={{ color: '#ff6b6b' }}>{errors.name}</small>}
          </label>

          <label className="shop-form-field">
            <span>Brand</span>
            <input value={form.brand || ''} onChange={(event) => handleChange('brand', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field">
            <span>Category</span>
            <select value={form.category || 'Beer'} onChange={(event) => handleChange('category', event.target.value)} disabled={saving}>
              {(dbCategories.length > 0 ? dbCategories.map((c) => c.name) : ['Beer', 'Whisky', 'Vodka', 'Rum', 'Wine']).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>

          <label className="shop-form-field">
            <span>Size</span>
            <input value={form.size || ''} onChange={(event) => handleChange('size', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field">
            <span>Alcohol %</span>
            <input type="number" step="0.1" value={form.alcoholPercentage || 0} onChange={(event) => handleChange('alcoholPercentage', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field">
            <span>Price *</span>
            <input type="number" step="0.01" value={form.price || 0} onChange={(event) => handleChange('price', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field">
            <span>Discount Price</span>
            <input type="number" step="0.01" value={form.discountPrice || ''} onChange={(event) => handleChange('discountPrice', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field">
            <span>Stock</span>
            <input type="number" value={form.stock || 0} onChange={(event) => handleChange('stock', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field">
            <span>Low Stock Threshold</span>
            <input type="number" value={form.lowStockThreshold || 0} onChange={(event) => handleChange('lowStockThreshold', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field full">
            <span>Description</span>
            <textarea value={form.description || ''} onChange={(event) => handleChange('description', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field">
            <span>Status</span>
            <select value={form.status || 'ACTIVE'} onChange={(event) => handleChange('status', event.target.value)} disabled={saving}>
              <option>ACTIVE</option>
              <option>INACTIVE</option>
              <option>PENDING_REVIEW</option>
              <option>OUT_OF_STOCK</option>
            </select>
          </label>
        </div>

        {errors.form && <p style={{ color: '#ff6b6b', margin: '12px 0', padding: '10px', background: 'rgba(255,107,107,0.1)', borderRadius: 6 }}>{errors.form}</p>}

        <div className="shop-form-buttons">
          <button className="shop-primary-button" type="submit" disabled={saving || uploading}>
            {saving ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
          <button className="shop-secondary-button" type="button" onClick={() => navigate('/shop/products')} disabled={saving}>CANCEL</button>
          <button className="shop-danger-button" type="button" onClick={removeProduct} disabled={saving}>DELETE PRODUCT</button>
        </div>
      </form>
    </ShopLayout>
  )
}
