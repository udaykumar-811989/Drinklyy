import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { categories as fallbackCategories, offers, products as fallbackProducts } from './data'
import { AppHeader, BottomNav, BottleLogo, CategoryCard, PrimaryButton, ProductGrid, PriceSummary, QuantityControl, SearchBar, SecondaryButton } from './components'
import { Icon } from './icons'
import { isSupabaseConfigured } from './lib/supabase'
import { signIn, signUp, resetPassword } from './services/auth'

export function Splash() { const navigate = useNavigate(); return <div className="splash-screen"><div className="splash-brand"><BottleLogo linked={false} /><p>Good Drinks. On Time.</p></div><PrimaryButton onClick={() => navigate('/login')}>GET STARTED</PrimaryButton><p className="auth-switch">Already have an account? <Link to="/login">Log in</Link></p></div> }

function AuthLayout({ mode = 'login' }) {
	const navigate = useNavigate()
	const isLogin = mode === 'login'
	const [showPassword, setShowPassword] = useState(false)
	const [form, setForm] = useState({ fullName: '', email: '', password: '' })
	const [error, setError] = useState('')
	const [success, setSuccess] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (event) => {
		event.preventDefault()
		setError('')
		setSuccess('')

		if (!isSupabaseConfigured) {
			navigate('/home')
			return
		}

		setLoading(true)
		try {
			const result = isLogin
				? await signIn({ email: form.email, password: form.password })
				: await signUp({ email: form.email, password: form.password, fullName: form.fullName })

			if (result.error) {
				const message = result.error.message || ''
				setError(/rate limit|too many/i.test(message)
					? 'Too many attempts right now — please wait about an hour and try again.'
					: (message || 'Something went wrong. Please try again.'))
				return
			}

			if (!isLogin) {
				setSuccess('Account created! Check your email for verification. You can now log in.')
				setForm({ fullName: '', email: form.email, password: '' })
				return
			}

			navigate('/home')
		} catch (err) {
			setError(err?.message || 'Something went wrong. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	const handleForgotPassword = async () => {
		if (!form.email) {
			setError('Please enter your email address first.')
			return
		}
		setError('')
		setSuccess('')
		const { error: resetError } = await resetPassword(form.email)
		if (resetError) {
			setError(resetError.message || 'Failed to send reset email.')
		} else {
			setSuccess('Password reset email sent! Check your inbox.')
		}
	}

	return <div className="auth-screen"><button className="back-button" onClick={() => navigate(-1)}><Icon name="back" /></button><div className="auth-copy"><h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1><p>{isLogin ? 'Sign in to your Drinklyy account' : 'Join Drinklyy and get your favorite drinks delivered to your door.'}</p></div><form className="auth-form" onSubmit={handleSubmit}>{!isLogin && <label>Full Name<input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Enter your full name" required /></label>}<label>Email<input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" placeholder="Enter your email" required /></label><label>Password<span className="password-wrap"><input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" required minLength="6" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Show password"><Icon name="eye" size={15} /></button></span></label>{isLogin && <div className="form-row"><label className="check-row"><input type="checkbox" /> Remember me</label><button type="button" className="text-link" onClick={handleForgotPassword}>Forgot password?</button></div>}{error && <p className="form-error">{error}</p>}{success && <p className="form-success">{success}</p>}<PrimaryButton type="submit" disabled={loading}>{loading ? (isLogin ? 'LOGGING IN...' : 'CREATING ACCOUNT...') : (isLogin ? 'LOG IN' : 'SIGN UP')}</PrimaryButton></form><div className="or-divider"><span>OR</span></div><p className="auth-switch">{isLogin ? "Don't have an account?" : 'Already have an account?'} <Link to={isLogin ? '/signup' : '/login'}>{isLogin ? 'Sign up' : 'Log in'}</Link></p></div>
}
export function Login() { return <AuthLayout mode="login" /> }
export function Signup() { return <AuthLayout mode="signup" /> }
export function Otp() { const navigate = useNavigate(); const [resent, setResent] = useState(false); return <div className="auth-screen"><button className="back-button" onClick={() => navigate(-1)}>‹</button><div className="auth-copy"><h1>Verify your number</h1><p>Enter the 4-digit code sent to your phone.</p></div><div className="otp-boxes">{[1, 2, 3, 4].map((item) => <input key={item} maxLength="1" />)}</div><button className="text-link centered" onClick={() => setResent(true)}>{resent ? 'Code sent again' : 'Resend code'}</button><PrimaryButton onClick={() => navigate('/home')}>VERIFY</PrimaryButton></div> }

export function Home({ cart, onAdd, wishlist, onWishlist, products: supabaseProducts, categories: supabaseCategories }) {
	const [query, setQuery] = useState('')
	const navigate = useNavigate()
	const productList = (supabaseProducts && supabaseProducts.length > 0) ? supabaseProducts : fallbackProducts
	const categoryList = (supabaseCategories && supabaseCategories.length > 0) ? supabaseCategories : fallbackCategories
	const filtered = productList.filter((product) => product.name.toLowerCase().includes(query.toLowerCase()))

	return <div className="screen">
		<header className="home-header">
			<BottleLogo compact />
			<button className="home-location" onClick={() => navigate('/addresses')}><Icon name="pin" size={15} /><span><small>Delivering to</small>Bengaluru</span></button>
			<button className="header-icon" onClick={() => navigate('/categories')} aria-label="Search"><Icon name="search" /></button>
			<button className="header-icon" onClick={() => navigate('/cart')} aria-label="Cart"><Icon name="bag" /></button>
		</header>
		<SearchBar value={query} onChange={setQuery} />
		<section className="promo-banner">
			<div>
				<strong>Cheers to<br />Good Times!</strong>
				<p>{offers[0].subtitle}</p>
				<button onClick={() => navigate('/categories')}>{offers[0].action}</button>
			</div>
			<div className="promo-bottles">
				{productList.length > 0 && <>
					<img src={productList[0].image} alt={productList[0].name} />
					{productList.length > 1 && <img src={productList[1].image} alt={productList[1].name} />}
				</>}
			</div>
		</section>
		<section className="section-block">
			<div className="section-title"><h2>Categories</h2><Link to="/categories">See All</Link></div>
			<div className="category-row">{categoryList.map((category) => <CategoryCard key={category.id} category={category} onClick={() => navigate(`/category/${category.id}`)} />)}</div>
		</section>
		<section className="section-block">
			<div className="section-title"><h2>Trending Now</h2><Link to="/categories">See All</Link></div>
			<ProductGrid items={filtered.slice(0, 4)} onAdd={onAdd} onWishlist={onWishlist} wishlist={wishlist} />
		</section>
		<BottomNav cartCount={cart.length} />
	</div>
}

export function Categories({ categories: supabaseCategories }) {
	const navigate = useNavigate()
	const categoryList = (supabaseCategories && supabaseCategories.length > 0) ? supabaseCategories : fallbackCategories
	return <div className="screen">
		<AppHeader title="Categories" action={<button className="header-icon" onClick={() => navigate('/category/beer')} aria-label="Search"><Icon name="search" /></button>} />
		<div className="category-list">{categoryList.map((category) => <button className="category-large" key={category.id} onClick={() => navigate(`/category/${category.id}`)}><span><img src={category.image || 'https://placehold.co/240x240/101a23/ffc431?text=Category'} alt="" /></span><div><strong>{category.name}</strong><small>{category.count || ''} products</small></div><Icon name="chevron" /></button>)}</div>
		<BottomNav />
	</div>
}

export function Category({ cart, onAdd, wishlist, onWishlist, products: supabaseProducts, categories: supabaseCategories }) {
	const { id = 'beer' } = useParams()
	const categoryList = (supabaseCategories && supabaseCategories.length > 0) ? supabaseCategories : fallbackCategories
	const category = categoryList.find((item) => item.id === id || item.slug === id) || categoryList[0]
	const productList = (supabaseProducts && supabaseProducts.length > 0) ? supabaseProducts : fallbackProducts
	const [filter, setFilter] = useState('All')
	const filtered = productList.filter((product) => {
		const matchesCategory = product.category === id || product.category === category?.id || product.category === category?.slug || product.categoryName?.toLowerCase() === category?.name?.toLowerCase()
		return matchesCategory
	})

	return <div className="screen">
		<AppHeader title={category?.name || 'Category'} action={<button className="header-icon" onClick={() => setFilter('All')} aria-label="Search"><Icon name="search" /></button>} />
		<div className="chips">{['All', 'Lager', 'IPA', 'Stout', 'Craft'].map((item) => <button className={filter === item ? 'chip active' : 'chip'} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div>
		<div className="listing-count">{filtered.length} products</div>
		<ProductGrid items={filtered} onAdd={onAdd} onWishlist={onWishlist} wishlist={wishlist} />
		<BottomNav cartCount={cart.length} />
	</div>
}

export function Wishlist({ cart, wishlist, onAdd, onWishlist, products: supabaseProducts }) {
	const productList = (supabaseProducts && supabaseProducts.length > 0) ? supabaseProducts : fallbackProducts
	const saved = productList.filter((product) => wishlist.includes(product.id))
	return <div className="screen">
		<AppHeader title="Wishlist" />
		<ProductGrid items={saved} onAdd={onAdd} onWishlist={onWishlist} wishlist={wishlist} />
		{saved.length === 0 && <div className="empty-cart"><Icon name="heart" size={34} /><h2>Your wishlist is empty</h2><p>Tap the heart on a product to save it.</p><Link to="/home">Browse drinks</Link></div>}
		<BottomNav cartCount={cart.length} />
	</div>
}

export function ProductDetails({ onAdd, wishlist, onWishlist, products: supabaseProducts }) {
	const { id } = useParams()
	const productList = (supabaseProducts && supabaseProducts.length > 0) ? supabaseProducts : fallbackProducts
	const product = productList.find((item) => item.id === id) || productList[0]
	const [quantity, setQuantity] = useState(1)
	const [wished, setWished] = useState(wishlist.includes(product?.id))
	const [addedMsg, setAddedMsg] = useState('')
	const navigate = useNavigate()
	const stock = product.stock ?? product.inventory?.[0]?.stock ?? 999
	const outOfStock = stock <= 0
	if (!product) return <div className="screen"><AppHeader title="Product" /><div className="empty-cart"><h2>Product not found</h2><Link to="/home">Browse drinks</Link></div></div>
	return <div className="screen details-screen">
		<div className="detail-top">
			<button className="header-icon" onClick={() => navigate(-1)}><Icon name="back" /></button>
			<button className={wished ? 'header-icon wished' : 'header-icon'} onClick={() => { setWished(!wished); onWishlist(product.id) }}><Icon name="heart" /></button>
		</div>
		<div className="detail-image"><img src={product.image} alt={product.name} /></div>
		<div className="detail-copy">
			<div className="detail-rating">★ {product.rating || 4.5} <small>(23 reviews)</small></div>
			<h1>{product.name}</h1>
			<p>{product.size} {product.alcoholPercentage ? `• ${product.alcoholPercentage} Alcohol` : ''}</p>
			<strong className="detail-price">₹{product.price}</strong>
			{product.oldPrice && <small style={{ textDecoration: 'line-out', color: '#888', marginLeft: 8 }}>₹{product.oldPrice}</small>}
			{!outOfStock && <small style={{ color: '#888', marginLeft: 8 }}>{stock} in stock</small>}
			{outOfStock ? <p style={{ color: '#ff6b6b', fontWeight: 600, margin: '12px 0' }}>Out of stock</p> : <>
				<QuantityControl quantity={quantity} onDecrease={() => setQuantity(Math.max(1, quantity - 1))} onIncrease={() => { if (quantity < stock) setQuantity(quantity + 1) }} />
				<PrimaryButton onClick={() => { onAdd(product, quantity); setAddedMsg('Added to cart!'); setTimeout(() => setAddedMsg(''), 2000) }}>ADD TO CART</PrimaryButton>
			</>}
			{addedMsg && <p style={{ color: '#4caf50', fontWeight: 600, marginTop: 8 }}>{addedMsg}</p>}
			<h3>Description</h3>
			<p className="description">{product.description || 'No description available.'}</p>
			<div className="detail-facts">
				<span>Availability<strong>{outOfStock ? 'Out of stock' : `In stock (${stock})`}</strong></span>
				<span>Brand<strong>{product.brand || 'N/A'}</strong></span>
				<span>Delivery<strong>20–30 min</strong></span>
			</div>
		</div>
	</div>
}

export function Cart({ cart, onChangeQuantity, onRemove }) {
	const navigate = useNavigate()
	const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
	return <div className="screen">
		<AppHeader title="My Cart" />
		<div className="cart-list">{cart.length === 0 ? <div className="empty-cart"><span><Icon name="bag" size={34} /></span><h2>Your cart is empty</h2><p>Find something good to pour.</p><Link to="/home">Browse drinks</Link></div> : cart.map((item) => <div className="cart-item" key={item.id}><img src={item.image} alt="" /><div className="cart-item-info"><strong>{item.name}</strong><small>{item.size}</small><b>₹{item.price}</b><QuantityControl quantity={item.quantity} onDecrease={() => onChangeQuantity(item.id, -1)} onIncrease={() => onChangeQuantity(item.id, 1)} /></div><button className="delete-button" onClick={() => onRemove(item.id)}><Icon name="trash" size={15} /></button></div>)}</div>
		{cart.length > 0 && <PriceSummary subtotal={subtotal} action="PROCEED TO CHECKOUT" onAction={() => navigate('/checkout')} />}
		<BottomNav cartCount={cart.length} />
	</div>
}

export function Checkout({ cart, addresses, selectedAddressId, onSelectAddress, profile, customerSession, onPlaceOrder }) {
	const [payment, setPayment] = useState('cod')
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [ageConfirmed, setAgeConfirmed] = useState(false)
	const navigate = useNavigate()
	const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
	const deliveryFee = cart.length > 0 ? 49 : 0
	const tax = Math.round(subtotal * 0.18)
	const total = subtotal + deliveryFee + tax
	const selectedAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0]

	const handlePlaceOrder = async () => {
		if (!ageConfirmed) { setError('Please confirm you are 21+'); return }
		if (!customerSession) { setError('Please log in to place an order'); setTimeout(() => navigate('/login'), 1500); return }
		if (!selectedAddress) { setError('Please add a delivery address'); return }
		setLoading(true)
		setError('')
		try {
			const result = await onPlaceOrder({ paymentMethod: payment, addressId: selectedAddress.id })
			if (result?.error) { setError(result.error); setLoading(false); return }
			if (result?.orderId) {
				navigate('/order-success', { state: { orderId: result.orderId, orderNumber: result.orderNumber } })
			}
		} catch (err) {
			setError(err.message || 'Failed to place order. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return <div className="screen">
		<AppHeader title="Checkout" />
		<section className="checkout-section">
			<h3>Delivery Address</h3>
			{selectedAddress ? <div className="checkout-address-card">
				<div><strong>{selectedAddress.label || 'Address'}</strong>
				<p>{selectedAddress.full_name ? `${selectedAddress.full_name}, ` : ''}{selectedAddress.address_line_1 || selectedAddress.line}{selectedAddress.city ? `, ${selectedAddress.city}` : ''}{selectedAddress.state ? `, ${selectedAddress.state}` : ''}{selectedAddress.postal_code ? ` - ${selectedAddress.postal_code}` : ''}</p>
				{selectedAddress.phone && <small>Phone: {selectedAddress.phone}</small>}
				</div>
				<button onClick={() => navigate('/addresses')}>Change</button>
			</div> : <div className="checkout-address-card"><p>No address found.</p><button onClick={() => navigate('/addresses')}>Add Address</button></div>}
			{addresses.length > 1 && <select className="address-select" value={selectedAddressId || ''} onChange={(e) => onSelectAddress(e.target.value)}>{addresses.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.city || a.address_line_1 || a.line}</option>)}</select>}

			<h3>Payment Method</h3>
			<div className="payment-options">
				<label className={`payment-option ${payment === 'razorpay' ? 'selected' : ''}`}>
					<input type="radio" name="payment" value="razorpay" checked={payment === 'razorpay'} onChange={() => setPayment('razorpay')} />
					<span><Icon name="grid" size={14} /> Online Payment (UPI / Card / Wallet)</span>
				</label>
				<label className={`payment-option ${payment === 'cod' ? 'selected' : ''}`}>
					<input type="radio" name="payment" value="cod" checked={payment === 'cod'} onChange={() => setPayment('cod')} />
					<span><Icon name="bag" size={14} /> Cash on Delivery</span>
				</label>
			</div>

			<h3>Order Summary</h3>
			<div className="summary-lines">
				<span>{cart.length} items <b>₹{subtotal}</b></span>
				<span>Delivery Fee <b>₹{deliveryFee}</b></span>
				<span>Tax (18% GST) <b>₹{tax}</b></span>
				<strong>Total <b>₹{total}</b></strong>
			</div>
			<label className="age-checkbox">
				<input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
				I confirm that I am 21+ years old and legally permitted to purchase alcohol.
			</label>
			{error && <p className="checkout-error">{error}</p>}
			<PrimaryButton onClick={handlePlaceOrder} disabled={loading}>{loading ? 'PLACING ORDER...' : 'PLACE ORDER'}</PrimaryButton>
		</section>
	</div>
}

export function OrderSuccess() {
	const navigate = useNavigate()
	const location = useLocation()
	const orderId = location.state?.orderId
	const orderNumber = location.state?.orderNumber || 'Processing'
	return <div className="success-screen">
		<button className="back-button" style={{ position: 'absolute', top: 20, left: 16, color: '#10201b', fontSize: 28 }} onClick={() => navigate('/home')}>‹</button>
		<div className="success-check">✓</div>
		<h1>Order Placed Successfully!</h1>
		<p>Your drinks are on the way.<br />Get ready for some good times!</p>
		<div className="success-info">
			<span>Order<strong>#{orderNumber}</strong></span>
			<span>Estimated Delivery<strong>20–30 min</strong></span>
		</div>
		<PrimaryButton onClick={() => navigate('/track-order', { state: { orderId } })}>TRACK ORDER</PrimaryButton>
		<SecondaryButton onClick={() => navigate('/orders')}>VIEW ORDER DETAILS</SecondaryButton>
	</div>
}

export function TrackOrder({ customerOrders }) {
	const location = useLocation()
	const orderId = location.state?.orderId
	const order = customerOrders.find((o) => o.id === orderId) || customerOrders[0]

	const statusSteps = ['CONFIRMED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED']
	const currentStep = order ? statusSteps.indexOf(order.status) : -1

	return <div className="screen">
		<AppHeader title="Track Order" />
		{!order ? <div className="empty-cart"><p>No active order found.</p><Link to="/home">Browse drinks</Link></div> : <>
			<div className="tracking-status-bar">
				{statusSteps.map((step, i) => <div key={step} className={`status-dot ${i <= currentStep ? 'active' : ''}`} title={step.replace(/_/g, ' ')} />)}
			</div>
			<div className="tracking-copy">
				<h2>{order.status === 'DELIVERED' ? 'Order Delivered!' : order.status === 'CANCELLED' ? 'Order Cancelled' : 'Your order is on the way!'}</h2>
				<p>{order.status.replace(/_/g, ' ')}</p>
				<div className="order-tracking-items">
					{order.order_items?.map((item) => <div key={item.id} className="tracking-item-row">
						<span>{item.product_name_snapshot} × {item.quantity}</span>
						<strong>₹{item.subtotal}</strong>
					</div>)}
				</div>
				<div className="shop-summary-box">
					<div><span>Subtotal</span><strong>₹{order.subtotal}</strong></div>
					<div><span>Delivery</span><strong>₹{order.delivery_fee}</strong></div>
					{order.tax > 0 && <div><span>Tax</span><strong>₹{order.tax}</strong></div>}
					<div className="total"><span>Total</span><strong>₹{order.total}</strong></div>
				</div>
				{order.delivery_address && <div className="delivery-address-box"><strong>Delivery Address</strong><p>{order.delivery_name ? `${order.delivery_name}, ` : ''}{order.delivery_address}{order.delivery_city ? `, ${order.delivery_city}` : ''}{order.delivery_state ? `, ${order.delivery_state}` : ''}{order.delivery_postal_code ? ` - ${order.delivery_postal_code}` : ''}</p></div>}
				<small className="order-number">Order #{order.order_number} <span>₹{order.total} {order.payment_status === 'PAID' ? 'paid' : 'pending'}</span></small>
			</div>
		</>}
		<BottomNav />
	</div>
}

export function Profile({ profile }) {
	if (!profile) return <div className="screen"><AppHeader title="Profile" back={false} /><div className="empty-cart"><p>Loading profile...</p></div><BottomNav /></div>
	const initials = (profile.name || profile.full_name || 'U').slice(0, 2).toUpperCase()
	return <div className="screen"><AppHeader title="Profile" back={false} /><div className="profile-card"><span>{initials}</span><div><h2>{profile.name || profile.full_name || 'User'}</h2><p>{profile.email || ''}</p></div><Link to="/edit-profile"><Icon name="edit" size={14} /></Link></div><div className="menu-list">{[['My Orders', '/orders'], ['Wishlist', '/wishlist'], ['Saved Addresses', '/addresses'], ['Payment Methods', '/payment-methods'], ['Notifications', '/notifications'], ['Help & Support', '/support'], ['Settings', '/settings']].map(([label, to]) => <Link to={to} key={label}><span><Icon name="grid" size={14} /></span>{label}<Icon name="chevron" size={14} /></Link>)}</div><BottomNav /></div>
}
export function Support() { return <div className="screen"><AppHeader title="Help & Support" /><div className="support-list">{[['FAQs', 'Find answers to common questions', 'grid'], ['Contact Us', 'Get in touch with our support team', 'phone'], ['Live Chat', 'Chat with us instantly', 'user'], ['Report an Issue', 'Help us improve', 'close']].map(([title, subtitle, icon]) => <button className="support-row" key={title}><span><Icon name={icon} size={15} /></span><div><strong>{title}</strong><small>{subtitle}</small></div><Icon name="chevron" size={14} /></button>)}</div><BottomNav /></div> }
export function Orders({ customerOrders }) {
	const navigate = useNavigate()
	return <div className="screen">
		<AppHeader title="My Orders" />
		{customerOrders.length === 0 ? <div className="empty-cart"><span><Icon name="bag" size={34} /></span><h2>No orders yet</h2><p>Your order history will appear here.</p><Link to="/home">Browse drinks</Link></div> : customerOrders.map((order) => <div className="order-card" key={order.id}>
			<div>
				<strong>#{order.order_number}</strong>
				<small>{new Date(order.created_at).toLocaleString()}</small>
			</div>
			<span className="order-status">{order.status.replace(/_/g, ' ').toLowerCase()}</span>
			<p>{order.order_items?.map((item) => item.product_name_snapshot).join(', ') || 'Order'}</p>
			<strong>₹{order.total}</strong>
			<button className="link-button" onClick={() => navigate('/track-order', { state: { orderId: order.id } })}>Track order →</button>
		</div>)}
		<BottomNav />
	</div>
}
