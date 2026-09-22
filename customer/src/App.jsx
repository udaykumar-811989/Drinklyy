import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Cart, Categories, Category, Checkout, Home, Login, Otp, Orders, OrderSuccess, ProductDetails, Profile, Signup, Splash, TrackOrder, Wishlist } from './pages'
import { Addresses, ContactUs, EditProfile, Faqs, LanguagePage, LiveChat, Notifications, PaymentMethods, PrivacyPolicy, ReportIssue, SettingsPage, Support, Terms } from './accountPages'
import { ShopAddProduct } from './pages/shop/ShopAddProduct'
import { ShopAnalytics } from './pages/shop/ShopAnalytics'
import { ShopCompliance } from './pages/shop/ShopCompliance'
import { ShopDashboard } from './pages/shop/ShopDashboard'
import { ShopEditProduct } from './pages/shop/ShopEditProduct'
import { ShopInventory } from './pages/shop/ShopInventory'
import { ShopLogin } from './pages/shop/ShopLogin'
import { ShopNotifications } from './pages/shop/ShopNotifications'
import { ShopOffers } from './pages/shop/ShopOffers'
import { ShopOrderDetails } from './pages/shop/ShopOrderDetails'
import { ShopOrders } from './pages/shop/ShopOrders'
import { ShopProducts } from './pages/shop/ShopProducts'
import { ShopProfile } from './pages/shop/ShopProfile'
import { ShopSettings } from './pages/shop/ShopSettings'
import { ShopSignup } from './pages/shop/ShopSignup'
import { ShopSetup } from './pages/shop/ShopSetup'
import {
  defaultShopCompliance,
  defaultShopSettings,
  readStorage,
  shopStorageKeys,
  writeStorage,
} from './data/shopData'
import './App.css'
import './shop.css'
import { isSupabaseConfigured, requireSupabase } from './lib/supabase'
import { getCurrentProfile, getCurrentUser, getProfile, upsertProfile, getSession, onAuthStateChange, signOut } from './services/auth'
import { listShopProducts, listProducts, listCategories } from './services/products'
import { listShopOrders, listCustomerOrders, createOrderFromCart, verifyAndConfirmOrder, subscribeToOrders, subscribeToCustomerOrders } from './services/orders'
import { listOffers } from './services/offers'
import { listShopNotifications } from './services/notifications'
import { getOwnedShop } from './services/shops'
import { getCart as fetchSupabaseCart, loadCartFromSupabase, syncCartToSupabase, clearCart } from './services/cart'
import { listAddresses, getDefaultAddress } from './services/addresses'
import { loadRazorpayScript, openRazorpayCheckout } from './services/payments'
import { products as fallbackProducts, categories as fallbackCategories } from './data'

function ShopProtectedRoute({ allowed, loading, error, shopProfile, onCreated, onLogout, shopOnline, setShopOnline, children }) {
  if (!allowed) return <Navigate to="/shop/login" replace />
  if (loading) return <div className="shop-loading-screen">Loading your shop...</div>
  if (error) return <div className="shop-error-screen"><h1>We couldn't load your shop.</h1><p>{error}</p><button onClick={() => window.location.reload()}>RETRY</button><button onClick={onLogout}>LOG OUT</button></div>
  if (!shopProfile) return <ShopSetup onCreated={onCreated} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={onLogout} />
  return children
}

function mapSupabaseProduct(item) {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand || '',
    category: item.categories?.slug || item.categories?.name?.toLowerCase() || '',
    categoryName: item.categories?.name || '',
    size: item.size || '',
    alcoholPercentage: item.alcohol_percentage ? `${item.alcohol_percentage}%` : '',
    alcoholPercentageNum: Number(item.alcohol_percentage) || 0,
    price: Number(item.discount_price || item.price),
    oldPrice: item.discount_price ? Number(item.price) : null,
    image: item.image_url || 'https://placehold.co/200x240/101a23/ffc431?text=Drink',
    description: item.description || '',
    inStock: (item.inventory?.[0]?.stock || 0) > 0,
    stock: item.inventory?.[0]?.stock || 0,
    shopId: item.shop_id,
    status: item.status,
    rating: 4.5
  }
}

function App() {
  const location = useLocation()
  const isShopRoute = location.pathname.startsWith('/shop')

  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('drinkly-cart') || '[]'))
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem('drinkly-wishlist') || '[]'))
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem('drinkly-dark-mode') || 'true'))
  const [language, setLanguage] = useState(() => localStorage.getItem('drinkly-language') || 'English')

  // Supabase-backed state
  const [profile, setProfile] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [customerProducts, setCustomerProducts] = useState(() => isSupabaseConfigured ? [] : fallbackProducts)
  const [customerCategories, setCustomerCategories] = useState(() => isSupabaseConfigured ? [] : fallbackCategories)
  const [customerSession, setCustomerSession] = useState(null)
  const [customerOrders, setCustomerOrders] = useState([])
  const [customerLoading, setCustomerLoading] = useState(true)

  // Shop state (unchanged)
  const [shopSession, setShopSession] = useState(() => isSupabaseConfigured ? { loggedIn: false, userEmail: '' } : readStorage(shopStorageKeys.session, { loggedIn: false, userEmail: '' }))
  const [shopProducts, setShopProducts] = useState(() => isSupabaseConfigured ? [] : readStorage(shopStorageKeys.products, []))
  const [shopOrders, setShopOrders] = useState(() => isSupabaseConfigured ? [] : readStorage(shopStorageKeys.orders, []))
  const [shopOffers, setShopOffers] = useState(() => isSupabaseConfigured ? [] : readStorage(shopStorageKeys.offers, []))
  const [shopProfile, setShopProfile] = useState(() => isSupabaseConfigured ? null : readStorage(shopStorageKeys.profile, null))
  const [shopNotifications, setShopNotifications] = useState(() => isSupabaseConfigured ? [] : readStorage(shopStorageKeys.notifications, []))
  const [shopSettings, setShopSettings] = useState(() => readStorage(shopStorageKeys.settings, defaultShopSettings))
  const [shopCompliance, setShopCompliance] = useState(() => readStorage(shopStorageKeys.compliance, defaultShopCompliance))
  const [shopAnalytics, setShopAnalytics] = useState(null)
  const [shopOnline, setShopOnline] = useState(true)
  const [shopLoading, setShopLoading] = useState(isSupabaseConfigured)
  const [shopError, setShopError] = useState('')
  const [ownedShop, setOwnedShop] = useState(null)

  // Persist only non-Supabase state to localStorage
  useEffect(() => localStorage.setItem('drinkly-cart', JSON.stringify(cart)), [cart])
  useEffect(() => localStorage.setItem('drinkly-wishlist', JSON.stringify(wishlist)), [wishlist])
  useEffect(() => localStorage.setItem('drinkly-dark-mode', JSON.stringify(darkMode)), [darkMode])
  useEffect(() => localStorage.setItem('drinkly-language', language), [language])
  useEffect(() => { if (!isSupabaseConfigured) writeStorage(shopStorageKeys.products, shopProducts) }, [shopProducts])
  useEffect(() => { if (!isSupabaseConfigured) writeStorage(shopStorageKeys.orders, shopOrders) }, [shopOrders])
  useEffect(() => { if (!isSupabaseConfigured) writeStorage(shopStorageKeys.offers, shopOffers) }, [shopOffers])
  useEffect(() => { if (!isSupabaseConfigured) writeStorage(shopStorageKeys.profile, shopProfile) }, [shopProfile])
  useEffect(() => { if (!isSupabaseConfigured) writeStorage(shopStorageKeys.notifications, shopNotifications) }, [shopNotifications])
  useEffect(() => writeStorage(shopStorageKeys.settings, shopSettings), [shopSettings])
  useEffect(() => writeStorage(shopStorageKeys.compliance, shopCompliance), [shopCompliance])
  useEffect(() => { if (!isSupabaseConfigured) writeStorage(shopStorageKeys.session, shopSession) }, [shopSession])

  const refreshCustomerProducts = useCallback(async () => {
    if (!isSupabaseConfigured) return
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        listProducts(),
        listCategories()
      ])
      if (productsResult.data) setCustomerProducts(productsResult.data.map(mapSupabaseProduct))
      if (categoriesResult.data) setCustomerCategories(categoriesResult.data.map((c) => ({ id: c.slug, name: c.name, image: c.image_url, slug: c.slug })))
    } catch (err) {
      console.error('Failed to load customer products:', err)
    }
  }, [])

  const refreshShopProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !ownedShop) return
    try {
      const { data } = await listShopProducts(ownedShop.id)
      if (data) {
        setShopProducts(data.map((item) => ({
          ...item,
          image: item.image_url,
          discountPrice: item.discount_price,
          alcoholPercentage: item.alcohol_percentage,
          stock: item.inventory?.[0]?.stock || 0,
          lowStockThreshold: item.inventory?.[0]?.low_stock_threshold || 0,
          category: item.categories?.name || ''
        })))
      }
    } catch (err) {
      console.error('Failed to refresh shop products:', err)
    }
  }, [ownedShop])

  const handleProductSaved = useCallback(async () => {
    await Promise.all([refreshShopProducts(), refreshCustomerProducts()])
  }, [refreshShopProducts, refreshCustomerProducts])

  // Load customer addresses from Supabase
  const loadCustomerAddresses = useCallback(async (userId) => {
    if (!isSupabaseConfigured || !userId) return
    try {
      const { data } = await listAddresses(userId)
      if (data) {
        setAddresses(data.map((a) => ({
          id: a.id,
          label: a.label,
          full_name: a.full_name || '',
          phone: a.phone || '',
          line: a.address_line_1 || a.line || '',
          address_line_1: a.address_line_1 || a.line || '',
          address_line_2: a.address_line_2 || '',
          landmark: a.landmark || '',
          area: a.area || '',
          city: a.city,
          state: a.state || '',
          postal_code: a.postal_code || '',
          latitude: a.latitude,
          longitude: a.longitude,
          is_default: a.is_default
        })))
        // Auto-select default or first address
        const defaultAddr = data.find((a) => a.is_default) || data[0]
        if (defaultAddr) setSelectedAddressId(defaultAddr.id)
      }
    } catch (err) {
      console.error('Failed to load addresses:', err)
    }
  }, [])

  // Load customer notifications from Supabase
  const loadCustomerNotifications = useCallback(async (userId) => {
    if (!isSupabaseConfigured || !userId) return
    try {
      const { data } = await requireSupabase()
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (data) {
        setNotifications(data.map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: new Date(n.created_at).toLocaleString(),
          read: Boolean(n.read_at)
        })))
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }, [])

  // Sync customer session from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) { setCustomerLoading(false); return undefined }

    let active = true
    let orderSubscription = null

    const syncCustomerSession = async (session) => {
      if (!session) {
        if (active) {
          setCustomerSession(null)
          setCustomerOrders([])
          setProfile(null)
          setAddresses([])
          setSelectedAddressId(null)
          setNotifications([])
          setCustomerLoading(false)
        }
        return
      }

      const userId = session.user?.id
      const userEmail = session.user?.email || ''
      if (active) setCustomerSession({ userId, email: userEmail })

      // Load or create profile from Supabase
      try {
        let { data: profileData, error: profileError } = await getProfile(userId)

        if (profileError || !profileData) {
          // Profile doesn't exist yet, create it from auth user metadata
          const { data: newProfile, error: createError } = await upsertProfile({
            id: userId,
            full_name: session.user?.user_metadata?.full_name || '',
            phone: session.user?.phone || '',
            email: userEmail
          })
          if (!createError && newProfile) profileData = newProfile
        }

        if (active && profileData) {
          setProfile({
            name: profileData.full_name || session.user?.user_metadata?.full_name || userEmail.split('@')[0],
            phone: profileData.phone || session.user?.phone || '',
            email: profileData.email || userEmail,
            full_name: profileData.full_name || '',
            avatar_url: profileData.avatar_url || ''
          })
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
        // Fallback to auth data
        if (active) {
          setProfile({
            name: session.user?.user_metadata?.full_name || userEmail.split('@')[0],
            phone: session.user?.phone || '',
            email: userEmail,
            full_name: session.user?.user_metadata?.full_name || '',
            avatar_url: ''
          })
        }
      }

      // Load addresses
      if (active) await loadCustomerAddresses(userId)

      // Load notifications
      if (active) await loadCustomerNotifications(userId)

      // Load cart from Supabase and merge with local
      if (active) {
        try {
          const supabaseCartItems = await loadCartFromSupabase(userId)
          if (supabaseCartItems.length > 0) {
            // Use Supabase cart if it has items, otherwise keep local
            setCart(supabaseCartItems)
          } else if (cart.length > 0) {
            // Sync local cart to Supabase
            await syncCartToSupabase(userId, cart)
          }
        } catch (err) {
          console.error('Failed to load cart from Supabase:', err)
        }
      }

      // Load orders
      const { data: orders } = await listCustomerOrders(userId)
      if (active) {
        setCustomerOrders((orders || []).map((o) => ({ ...o, items: o.order_items?.length || 0 })))
      }

      // Subscribe to realtime order updates
      if (orderSubscription) { try { orderSubscription.unsubscribe() } catch {} }
      orderSubscription = subscribeToCustomerOrders(userId, async () => {
        const { data: refreshed } = await listCustomerOrders(userId)
        if (active) setCustomerOrders((refreshed || []).map((o) => ({ ...o, items: o.order_items?.length || 0 })))
      })

      if (active) setCustomerLoading(false)
    }

    getSession().then(({ data }) => syncCustomerSession(data.session))
    const { data: authListener } = onAuthStateChange((_event, session) => syncCustomerSession(session))

    return () => {
      active = false
      if (orderSubscription) try { orderSubscription.unsubscribe() } catch {}
      authListener.subscription.unsubscribe()
    }
  }, [loadCustomerAddresses, loadCustomerNotifications])

  // Shop session sync (unchanged)
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined

    let active = true
    let shopOrderSubscription = null
    const syncShopSession = async (session) => {
      if (!session) {
        if (active) { setShopSession({ loggedIn: false, userEmail: '' }); setShopLoading(false); setShopProfile(null); setOwnedShop(null) }
        return
      }

      setShopLoading(true)
      const [{ data: profile, error: profileError }, { data: userResult, error: userError }] = await Promise.all([getCurrentProfile(), getCurrentUser()])
      const isOwner = profile?.role === 'SHOP_OWNER' || profile?.role === 'ADMIN'
      if (profileError || userError || !isOwner) {
        if (active) { setShopError(profileError?.message || userError?.message || 'This account is not authorized as a shop owner.'); setShopSession({ loggedIn: false, userEmail: '' }); setShopLoading(false) }
        return
      }
      const { data: shop, error: shopError } = await getOwnedShop(userResult.user.id)
      if (shopError) { if (active) { setShopError(shopError.message); setShopLoading(false) }; return }
      if (active) {
        setShopError('')
        setShopSession({ loggedIn: true, userEmail: userResult.user.email })
        setOwnedShop(shop)
        setShopProfile(shop ? { ...shop, shopName: shop.name, ownerName: profile.full_name || '', email: shop.email || profile.email || userResult.user.email, phone: shop.phone || profile.phone || '', logo: shop.logo_url || '', address: shop.address || '', openingHours: shop.opening_hours || {}, deliveryRadius: shop.delivery_radius || '', status: shop.is_open ? 'Online' : 'Offline' } : null)
        setShopLoading(false)
      }
      if (!shop) return
      const [productsResult, ordersResult, offersResult, notificationsResult] = await Promise.all([listShopProducts(shop.id), listShopOrders(shop.id), listOffers(shop.id), listShopNotifications(shop.id)])
      if (active) {
        setShopProducts((productsResult.data || []).map((item) => ({
          ...item,
          image: item.image_url,
          discountPrice: item.discount_price,
          alcoholPercentage: item.alcohol_percentage,
          stock: item.inventory?.[0]?.stock || 0,
          lowStockThreshold: item.inventory?.[0]?.low_stock_threshold || 0,
          category: item.categories?.name || ''
        })))
        const statusMap = { PLACED: 'CONFIRMED', COMPLETED: 'DELIVERED', PENDING_PAYMENT: 'CONFIRMED' }
        const orders = (ordersResult.data || []).map((item) => ({
          ...item,
          databaseId: item.id,
          id: item.order_number || item.id,
          status: statusMap[item.status] || item.status,
          time: new Date(item.created_at).toLocaleString(),
          total: Number(item.total),
          items: item.order_items?.reduce((sum, orderItem) => sum + orderItem.quantity, 0) || 0,
          customer: item.profiles?.full_name || 'Customer',
          customerEmail: item.profiles?.email || '',
          customerPhone: item.profiles?.phone || '',
          address: item.delivery_address || (item.addresses ? `${item.addresses.line}, ${item.addresses.city}` : 'No address'),
          itemsList: (item.order_items || []).map((oi) => ({ product: oi.product_name_snapshot, quantity: oi.quantity, price: Number(oi.price_snapshot), subtotal: Number(oi.subtotal) })),
          paymentStatus: item.payment_status || 'PENDING',
          complianceStatus: item.compliance_status || 'PENDING'
        }))
        setShopOrders(orders)
        setShopOffers((offersResult.data || []).map((item) => ({ ...item, type: item.offer_type, value: Number(item.value), products: item.products?.name || 'All products', startDate: item.starts_at?.slice(0, 10), endDate: item.ends_at?.slice(0, 10) })))
        setShopNotifications((notificationsResult.data || []).map((item) => ({ ...item, time: new Date(item.created_at).toLocaleString(), read: Boolean(item.read_at) })))
        const totalSales = orders.reduce((sum, item) => sum + item.total, 0)
        setShopAnalytics({ todaySales: totalSales, weeklySales: totalSales, monthlySales: totalSales, totalOrders: orders.length, averageOrderValue: orders.length ? Math.round(totalSales / orders.length) : 0, topProducts: [], salesData: [], orderData: [] })

        if (shopOrderSubscription) try { shopOrderSubscription.unsubscribe() } catch {}
        shopOrderSubscription = subscribeToOrders(shop.id, async () => {
          const { data: refreshedOrders } = await listShopOrders(shop.id)
          if (active && refreshedOrders) {
            const refreshed = refreshedOrders.map((item) => ({
              ...item,
              databaseId: item.id,
              id: item.order_number || item.id,
              status: statusMap[item.status] || item.status,
              time: new Date(item.created_at).toLocaleString(),
              total: Number(item.total),
              items: item.order_items?.reduce((sum, orderItem) => sum + orderItem.quantity, 0) || 0,
              customer: item.profiles?.full_name || 'Customer',
              customerEmail: item.profiles?.email || '',
              customerPhone: item.profiles?.phone || '',
              address: item.delivery_address || (item.addresses ? `${item.addresses.line}, ${item.addresses.city}` : 'No address'),
              itemsList: (item.order_items || []).map((oi) => ({ product: oi.product_name_snapshot, quantity: oi.quantity, price: Number(oi.price_snapshot), subtotal: Number(oi.subtotal) })),
              paymentStatus: item.payment_status || 'PENDING',
              complianceStatus: item.compliance_status || 'PENDING'
            }))
            setShopOrders(refreshed)
          }
        })
      }
    }

    getSession().then(({ data }) => syncShopSession(data.session))
    const { data: authListener } = onAuthStateChange((_event, session) => syncShopSession(session))

    refreshCustomerProducts()

    return () => {
      active = false
      if (shopOrderSubscription) try { shopOrderSubscription.unsubscribe() } catch {}
      authListener.subscription.unsubscribe()
    }
  }, [refreshCustomerProducts])

  const clearSupabaseCart = useCallback(async () => {
    if (!customerSession) return
    try {
      const { data: existingCart } = await fetchSupabaseCart(customerSession.userId)
      if (existingCart) await clearCart(existingCart.id)
    } catch {}
  }, [customerSession])

  const handlePlaceOrder = useCallback(async ({ paymentMethod, addressId }) => {
    if (!customerSession) return { error: 'Please log in to place an order' }
    if (cart.length === 0) return { error: 'Cart is empty' }

    const productId = cart[0].id
    if (!productId || typeof productId !== 'string' || productId.length < 10) {
      return { error: 'Please add products from the shop to place an order.' }
    }

    const shopId = cart[0].shopId
    if (!shopId || typeof shopId !== 'string' || shopId.length < 10) {
      return { error: 'Shop information missing. Please browse products from a shop.' }
    }

    // Resolve address from Supabase
    let resolvedAddressId = addressId
    if (!resolvedAddressId || typeof resolvedAddressId !== 'string' || resolvedAddressId.length < 10) {
      const { data: defaultAddress } = await getDefaultAddress(customerSession.userId)
      if (defaultAddress) {
        resolvedAddressId = defaultAddress.id
      } else {
        return { error: 'Please add a delivery address before placing an order.' }
      }
    }

    const { data: order, error: orderError } = await createOrderFromCart(shopId, resolvedAddressId, cart, 49)
    if (orderError) return { error: orderError.message || 'Failed to create order' }

    if (paymentMethod === 'razorpay') {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) return { error: 'Failed to load payment gateway. Please try again.' }

      return new Promise((resolve) => {
        openRazorpayCheckout({
          amount: order.total,
          orderId: order.id,
          orderNumber: order.order_number,
          customerName: profile?.name || '',
          customerEmail: customerSession.email,
          customerPhone: profile?.phone || '',
          onSuccess: async (paymentResponse) => {
            const { error: confirmError } = await verifyAndConfirmOrder(order.id, paymentResponse.razorpay_payment_id)
            if (confirmError) { resolve({ error: 'Payment verification failed. Contact support.' }); return }
            await clearSupabaseCart()
            setCart([])
            resolve({ orderId: order.id, orderNumber: order.order_number })
          },
          onFailure: (errorMsg) => {
            resolve({ error: errorMsg || 'Payment was cancelled' })
          }
        })
      })
    }

    // COD flow
    const { error: confirmError } = await verifyAndConfirmOrder(order.id, 'COD_' + Date.now(), 'CAPTURED')
    if (confirmError) return { error: 'Failed to confirm order. Please try again.' }
    await clearSupabaseCart()
    setCart([])
    return { orderId: order.id, orderNumber: order.order_number }
  }, [cart, customerSession, profile, clearSupabaseCart])

  const addToCart = (product, quantity = 1) => {
    const stock = product.stock ?? product.inventory?.[0]?.stock ?? 999
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        const newQty = existing.quantity + quantity
        if (newQty > stock) return current
        return current.map((item) => (item.id === product.id ? { ...item, quantity: newQty } : item))
      }
      if (quantity > stock) return current
      return [...current, { ...product, quantity }]
    })
  }
  const changeQuantity = (id, amount) => setCart((current) => {
    return current.map((item) => {
      if (item.id !== id) return item
      const newQty = item.quantity + amount
      const stock = item.stock ?? item.inventory?.[0]?.stock ?? 999
      if (newQty > stock) return item
      return { ...item, quantity: Math.max(0, newQty) }
    }).filter((item) => item.quantity > 0)
  })
  const toggleWishlist = (id) => setWishlist((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  const handleShopLogin = (value = true) => setShopSession((current) => ({ ...current, loggedIn: Boolean(value) }))
  const handleShopLogout = async () => {
    if (isSupabaseConfigured) await signOut()
    setShopSession({ loggedIn: false, userEmail: '' })
  }

  const handleShopCreated = (shop) => {
    setOwnedShop(shop)
    setShopProfile({ ...shop, shopName: shop.name, ownerName: shop.ownerName || '', email: shop.email || '', phone: shop.phone || '', logo: shop.logo_url || '', address: shop.address || '', openingHours: shop.opening_hours || {}, deliveryRadius: shop.delivery_radius || '', status: shop.is_open ? 'Online' : 'Offline' })
  }

  const protectedProps = { allowed: shopSession.loggedIn, loading: shopLoading, error: shopError, shopProfile, onCreated: handleShopCreated, onLogout: handleShopLogout, shopOnline, setShopOnline }

  if (isShopRoute) {
    return (
      <Routes>
        <Route path="/shop" element={<Navigate to={shopSession.loggedIn ? '/shop/dashboard' : '/shop/login'} replace />} />
        <Route path="/shop/login" element={shopSession.loggedIn ? <Navigate to="/shop/dashboard" replace /> : <ShopLogin setLoggedIn={handleShopLogin} />} />
        <Route path="/shop/signup" element={shopSession.loggedIn ? <Navigate to="/shop/dashboard" replace /> : <ShopSignup setLoggedIn={handleShopLogin} onCreated={handleShopCreated} />} />
        <Route path="/shop/dashboard" element={<ShopProtectedRoute {...protectedProps}><ShopDashboard shopProducts={shopProducts} shopOrders={shopOrders} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} setShopOrders={setShopOrders} setShopProducts={setShopProducts} /></ShopProtectedRoute>} />
        <Route path="/shop/orders" element={<ShopProtectedRoute {...protectedProps}><ShopOrders shopOrders={shopOrders} setShopOrders={setShopOrders} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} /></ShopProtectedRoute>} />
        <Route path="/shop/orders/:id" element={<ShopProtectedRoute {...protectedProps}><ShopOrderDetails shopOrders={shopOrders} setShopOrders={setShopOrders} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} /></ShopProtectedRoute>} />
        <Route path="/shop/products" element={<ShopProtectedRoute {...protectedProps}><ShopProducts shopProducts={shopProducts} setShopProducts={setShopProducts} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} onProductSaved={handleProductSaved} /></ShopProtectedRoute>} />
        <Route path="/shop/products/add" element={<ShopProtectedRoute {...protectedProps}><ShopAddProduct shopProducts={shopProducts} setShopProducts={setShopProducts} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} onProductSaved={handleProductSaved} /></ShopProtectedRoute>} />
        <Route path="/shop/products/edit/:id" element={<ShopProtectedRoute {...protectedProps}><ShopEditProduct shopProducts={shopProducts} setShopProducts={setShopProducts} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} onProductSaved={handleProductSaved} /></ShopProtectedRoute>} />
        <Route path="/shop/inventory" element={<ShopProtectedRoute {...protectedProps}><ShopInventory shopProducts={shopProducts} setShopProducts={setShopProducts} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} onProductSaved={handleProductSaved} /></ShopProtectedRoute>} />
        <Route path="/shop/offers" element={<ShopProtectedRoute {...protectedProps}><ShopOffers shopOffers={shopOffers} setShopOffers={setShopOffers} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} /></ShopProtectedRoute>} />
        <Route path="/shop/analytics" element={<ShopProtectedRoute {...protectedProps}><ShopAnalytics shopAnalytics={shopAnalytics} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} /></ShopProtectedRoute>} />
        <Route path="/shop/profile" element={<ShopProtectedRoute {...protectedProps}><ShopProfile shopProfile={shopProfile} setShopProfile={setShopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} /></ShopProtectedRoute>} />
        <Route path="/shop/compliance" element={<ShopProtectedRoute {...protectedProps}><ShopCompliance shopCompliance={shopCompliance} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} /></ShopProtectedRoute>} />
        <Route path="/shop/settings" element={<ShopProtectedRoute {...protectedProps}><ShopSettings shopSettings={shopSettings} setShopSettings={setShopSettings} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} /></ShopProtectedRoute>} />
        <Route path="/shop/notifications" element={<ShopProtectedRoute {...protectedProps}><ShopNotifications shopNotifications={shopNotifications} setShopNotifications={setShopNotifications} shopProfile={shopProfile} shopOnline={shopOnline} setShopOnline={setShopOnline} onLogout={handleShopLogout} /></ShopProtectedRoute>} />
        <Route path="*" element={<Navigate to={shopSession.loggedIn ? '/shop/dashboard' : '/shop/login'} replace />} />
      </Routes>
    )
  }

  return (
    <div className={darkMode ? 'app-frame' : 'app-frame light-mode'}>
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/otp" element={<Otp />} />
        <Route path="/home" element={<Home cart={cart} onAdd={addToCart} wishlist={wishlist} onWishlist={toggleWishlist} products={customerProducts} categories={customerCategories} />} />
        <Route path="/categories" element={<Categories categories={customerCategories} />} />
        <Route path="/category/:id" element={<Category cart={cart} onAdd={addToCart} wishlist={wishlist} onWishlist={toggleWishlist} products={customerProducts} categories={customerCategories} />} />
        <Route path="/product/:id" element={<ProductDetails onAdd={addToCart} wishlist={wishlist} onWishlist={toggleWishlist} products={customerProducts} />} />
        <Route path="/wishlist" element={<Wishlist cart={cart} wishlist={wishlist} onAdd={addToCart} onWishlist={toggleWishlist} products={customerProducts} />} />
        <Route path="/cart" element={<Cart cart={cart} onChangeQuantity={changeQuantity} onRemove={(id) => setCart((current) => current.filter((item) => item.id !== id))} />} />
        <Route path="/checkout" element={<Checkout cart={cart} addresses={addresses} selectedAddressId={selectedAddressId} onSelectAddress={setSelectedAddressId} profile={profile} customerSession={customerSession} onPlaceOrder={handlePlaceOrder} />} />
        <Route path="/order-success" element={<OrderSuccess />} />
        <Route path="/track-order" element={<TrackOrder customerOrders={customerOrders} />} />
        <Route path="/orders" element={<Orders customerOrders={customerOrders} />} />
        <Route path="/profile" element={<Profile profile={profile} />} />
        <Route path="/edit-profile" element={<EditProfile profile={profile} setProfile={setProfile} />} />
        <Route path="/addresses" element={<Addresses addresses={addresses} setAddresses={setAddresses} selectedAddressId={selectedAddressId} setSelectedAddressId={setSelectedAddressId} customerSession={customerSession} />} />
        <Route path="/payment-methods" element={<PaymentMethods />} />
        <Route path="/notifications" element={<Notifications notifications={notifications} setNotifications={setNotifications} />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support/faqs" element={<Faqs />} />
        <Route path="/support/contact" element={<ContactUs />} />
        <Route path="/support/chat" element={<LiveChat />} />
        <Route path="/support/report" element={<ReportIssue />} />
        <Route path="/settings" element={<SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} />} />
        <Route path="/language" element={<LanguagePage language={language} setLanguage={setLanguage} />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

function RootApp() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  )
}

export default RootApp
