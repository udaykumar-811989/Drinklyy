import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShopLayout } from '../../components/shop/ShopLayout'
import { ShopPageHeader } from '../../components/shop/ShopPageHeader'
import { isSupabaseConfigured } from '../../lib/supabase'
import { createProduct, listCategories, uploadProductImage } from '../../services/products'
import { updateInventory } from '../../services/inventory'

const emptyForm = {
  name: '',
  brand: '',
  category: 'Beer',
  size: '330ml',
  alcoholPercentage: 5,
  price: '',
  discountPrice: '',
  stock: 1,
  lowStockThreshold: 5,
  description: '',
  status: 'ACTIVE',
  image: '',
  tastingNotes: '',
  origin: '',
  productType: ''
}

export function ShopAddProduct({ shopProducts, setShopProducts, shopProfile, shopOnline, setShopOnline, onLogout, onProductSaved }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dbCategories, setDbCategories] = useState([])

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
    if (file.size > 5 * 1024 * 1024) {
      setErrors({ image: 'Image must be under 5MB.' })
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

  const validate = () => {
    const nextErrors = {}
    if (!form.name.trim()) nextErrors.name = 'Product name is required.'
    if (!form.category.trim()) nextErrors.category = 'Category is required.'
    if (!form.price || Number(form.price) <= 0) nextErrors.price = 'Price is required.'
    if (Number(form.stock) < 0) nextErrors.stock = 'Stock cannot be negative.'
    if (Number(form.alcoholPercentage) < 0) nextErrors.alcoholPercentage = 'Alcohol percentage cannot be negative.'
    if (Number(form.discountPrice) > Number(form.price)) nextErrors.discountPrice = 'Discount price cannot exceed price.'
    return nextErrors
  }

  const saveProduct = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    setErrors({})

    try {
      if (isSupabaseConfigured) {
        const matchedCategory = dbCategories.find((c) => c.name === form.category)
        const productPayload = {
          shop_id: shopProfile.id,
          name: form.name.trim(),
          brand: form.brand.trim(),
          description: form.description.trim(),
          size: form.size.trim(),
          alcohol_percentage: Number(form.alcoholPercentage),
          price: Number(form.price),
          discount_price: form.discountPrice ? Number(form.discountPrice) : null,
          image_url: form.image || null,
          status: form.status,
          category_id: matchedCategory ? matchedCategory.id : null
        }

        const result = await createProduct(productPayload)
        if (result.error) {
          setErrors({ form: result.error.message })
          setSaving(false)
          return
        }

        const inventoryResult = await updateInventory(result.data.id, Number(form.stock), Number(form.lowStockThreshold))
        if (inventoryResult.error) {
          setErrors({ form: 'Product saved but inventory failed: ' + inventoryResult.error.message })
          setSaving(false)
          return
        }

        if (onProductSaved) await onProductSaved()
        setSaving(false)
        navigate('/shop/products')
        return
      }

      const item = {
        ...form,
        id: `product-${Date.now()}`,
        price: Number(form.price),
        discountPrice: Number(form.discountPrice || form.price),
        stock: Number(form.stock),
        lowStockThreshold: Number(form.lowStockThreshold),
        alcoholPercentage: Number(form.alcoholPercentage),
        image: form.image || 'https://placehold.co/200x240/101a23/ffc431?text=Drink'
      }
      const nextItems = [item, ...shopProducts]
      setShopProducts(nextItems)
      navigate('/shop/products')
    } catch (err) {
      setErrors({ form: err.message || 'An unexpected error occurred.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ShopLayout title="Add Product" userName={shopProfile.ownerName} shopName={shopProfile.shopName} location={shopProfile.address} logoUrl={shopProfile.logo} online={shopOnline} setOnline={setShopOnline} onLogout={onLogout}>
      <ShopPageHeader title="Add Product" breadcrumbs="Dashboard / Products / Add Product" />

      <form className="shop-form" onSubmit={saveProduct}>
        <div className="shop-form-grid">
          <label className="shop-form-field full">
            Product Image
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {form.image && <img src={form.image} alt="Preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #333' }} />}
              <div style={{ flex: 1 }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} style={{ marginBottom: 8 }} />
                {uploading && <small style={{ color: '#ffc431' }}>Uploading image...</small>}
                {errors.image && <small style={{ color: '#ff6b6b' }}>{errors.image}</small>}
              </div>
            </div>
            <input type="url" value={form.image} onChange={(event) => handleChange('image', event.target.value)} placeholder="Or paste an image URL" style={{ marginTop: 8 }} />
          </label>

          <label className="shop-form-field">
            Product Name *
            <input value={form.name} onChange={(event) => handleChange('name', event.target.value)} disabled={saving} />
            {errors.name && <small>{errors.name}</small>}
          </label>

          <label className="shop-form-field">
            Brand
            <input value={form.brand} onChange={(event) => handleChange('brand', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field">
            Category *
            <select value={form.category} onChange={(event) => handleChange('category', event.target.value)} disabled={saving}>
              {(dbCategories.length > 0 ? dbCategories.map((c) => c.name) : ['Beer', 'Whisky', 'Vodka', 'Rum', 'Wine']).map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            {errors.category && <small>{errors.category}</small>}
          </label>

          <label className="shop-form-field">
            Bottle Size
            <input value={form.size} onChange={(event) => handleChange('size', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field">
            Alcohol Percentage
            <input type="number" step="0.1" value={form.alcoholPercentage} onChange={(event) => handleChange('alcoholPercentage', event.target.value)} disabled={saving} />
            {errors.alcoholPercentage && <small>{errors.alcoholPercentage}</small>}
          </label>

          <label className="shop-form-field">
            Price *
            <input type="number" step="0.01" value={form.price} onChange={(event) => handleChange('price', event.target.value)} disabled={saving} />
            {errors.price && <small>{errors.price}</small>}
          </label>

          <label className="shop-form-field">
            Discount Price
            <input type="number" step="0.01" value={form.discountPrice} onChange={(event) => handleChange('discountPrice', event.target.value)} disabled={saving} />
            {errors.discountPrice && <small>{errors.discountPrice}</small>}
          </label>

          <label className="shop-form-field">
            Stock Quantity
            <input type="number" value={form.stock} onChange={(event) => handleChange('stock', event.target.value)} disabled={saving} />
            {errors.stock && <small>{errors.stock}</small>}
          </label>

          <label className="shop-form-field">
            Low Stock Threshold
            <input type="number" value={form.lowStockThreshold} onChange={(event) => handleChange('lowStockThreshold', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field full">
            Description
            <textarea value={form.description} onChange={(event) => handleChange('description', event.target.value)} disabled={saving} />
          </label>

          <label className="shop-form-field">
            Status
            <select value={form.status} onChange={(event) => handleChange('status', event.target.value)} disabled={saving}>
              <option>ACTIVE</option>
              <option>INACTIVE</option>
              <option>PENDING_REVIEW</option>
            </select>
          </label>
        </div>

        {errors.form && <p className="shop-form-error" style={{ color: '#ff6b6b', margin: '12px 0', padding: '10px', background: 'rgba(255,107,107,0.1)', borderRadius: 6 }}>{errors.form}</p>}

        <div className="shop-form-buttons">
          <button className="shop-primary-button" type="submit" disabled={saving || uploading}>
            {saving ? 'SAVING...' : 'SAVE PRODUCT'}
          </button>
          <button className="shop-secondary-button" type="button" onClick={() => navigate('/shop/products')} disabled={saving}>CANCEL</button>
        </div>
      </form>
    </ShopLayout>
  )
}
