import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from './icons'

export const brandLogo = `${import.meta.env.BASE_URL}logo.png`

export function BottleLogo({ compact = false }) {
  return <Link className={compact ? 'bottle-logo compact' : 'bottle-logo'} to="/home"><img className="logo-img" src={brandLogo} alt="" /><span><strong>Drinkly</strong><small>Good Drinks. On Time.</small></span></Link>
}

export function PrimaryButton({ children, onClick, type = 'button' }) { return <button className="primary-button" onClick={onClick} type={type}>{children}</button> }
export function SecondaryButton({ children, onClick, type = 'button' }) { return <button className="secondary-button" onClick={onClick} type={type}>{children}</button> }

export function AppHeader({ title, back = true, action }) {
  const navigate = useNavigate()
  return <header className="app-header">{back ? <button className="header-icon" onClick={() => navigate(-1)} aria-label="Go back">‹</button> : <BottleLogo compact />}<h1>{title}</h1>{action || <span className="header-spacer" />}</header>
}

export function BottomNav({ cartCount = 0 }) {
  const location = useLocation()
  const links = [['/home', 'home', 'Home'], ['/categories', 'grid', 'Categories'], ['/cart', 'bag', 'Cart'], ['/profile', 'user', 'Account']]
  return <nav className="bottom-nav">{links.map(([to, icon, label]) => <Link className={location.pathname === to || (to === '/home' && location.pathname === '/') ? 'bottom-link active' : 'bottom-link'} key={to} to={to}><span><Icon name={icon} size={16} /></span>{label}{label === 'Cart' && cartCount > 0 && <b>{cartCount}</b>}</Link>)}</nav>
}

export function SearchBar({ value, onChange }) { return <label className="search-bar"><Icon name="search" size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Search for drinks, brands..." /></label> }

export function CategoryCard({ category, onClick }) { return <button className="category-card" type="button" onClick={onClick}><span className="category-icon"><img src={category.image || 'https://placehold.co/240x240/101a23/ffc431?text=Category'} alt="" /></span><strong>{category.name}</strong></button> }

export function ProductCard({ product, onAdd, onWishlist, wished = false }) {
  const navigate = useNavigate()
  const imageSrc = product.image || product.image_url || 'https://placehold.co/200x240/101a23/ffc431?text=Drink'
  const stock = product.stock ?? product.inventory?.[0]?.stock ?? 999
  const outOfStock = stock <= 0
  return <article className="product-card"><div className="product-visual" role="button" tabIndex="0" onClick={() => navigate(`/product/${product.id}`)} onKeyDown={(event) => event.key === 'Enter' && navigate(`/product/${product.id}`)}><img src={imageSrc} alt={product.name} onError={(event) => { event.currentTarget.src = 'https://placehold.co/200x240/101a23/ffc431?text=Drink' }} /><button className={wished ? 'heart wished' : 'heart'} type="button" onClick={(event) => { event.stopPropagation(); onWishlist(product.id) }} aria-label="Toggle wishlist"><Icon name="heart" size={14} /></button></div><button className="product-info" type="button" onClick={() => navigate(`/product/${product.id}`)}><strong>{product.name}</strong><small>{product.size} {product.alcoholPercentage ? `• ${product.alcoholPercentage}` : ''}</small><span className="product-price">₹{product.price}</span></button>{outOfStock ? <span className="add-mini" style={{ opacity: 0.5, cursor: 'default' }}>Out of stock</span> : <button className="add-mini" type="button" onClick={() => onAdd(product)}>Add</button>}</article>
}

export function QuantityControl({ quantity, onDecrease, onIncrease }) { return <div className="quantity-control"><button onClick={onDecrease} aria-label="Decrease quantity">−</button><strong>{quantity}</strong><button onClick={onIncrease} aria-label="Increase quantity">+</button></div> }

export function PriceSummary({ subtotal, action, onAction }) { const delivery = subtotal > 0 ? 49 : 0; const tax = Math.round(subtotal * 0.18); const total = subtotal + delivery + tax; return <div className="price-summary"><div><span>Subtotal</span><strong>₹{subtotal}</strong></div><div><span>Delivery Fee</span><strong>₹{delivery}</strong></div><div><span>Tax (18% GST)</span><strong>₹{tax}</strong></div><div className="total-row"><span>Total</span><strong>₹{total}</strong></div>{action && <PrimaryButton onClick={onAction}>{action}</PrimaryButton>}</div> }

export function AddressCard({ address, onChange }) { if (!address) return <div className="info-card address-card"><span className="leading-icon"><Icon name="home" /></span><div><strong>No address</strong><p>Please add a delivery address</p></div><button onClick={onChange}>Add</button></div>; return <div className="info-card address-card"><span className="leading-icon"><Icon name="home" /></span><div><strong>{address.label || 'Address'}</strong><p>{address.address_line_1 || address.line}{address.city ? `, ${address.city}` : ''}</p></div><button onClick={onChange}>Change</button></div> }

export function PaymentCard({ selected, onSelect }) { return <div className="payment-options">{[['cod', 'bag', 'Cash on Delivery'], ['upi', 'grid', 'UPI'], ['card', 'bag', 'Card']].map(([id, icon, label]) => <button className={selected === id ? 'payment-option selected' : 'payment-option'} key={id} onClick={() => onSelect(id)}><Icon name={icon} size={15} />{label}<b>{selected === id ? '●' : '○'}</b></button>)}</div> }

export function OrderStatus() { return <div className="status-timeline">{['Confirmed', 'Preparing', 'Out for delivery', 'Delivered'].map((item, index) => <div className={index < 3 ? 'status-step done' : 'status-step'} key={item}><span>{index < 3 ? '✓' : '•'}</span><small>{item}</small></div>)}</div> }

export function ProductGrid({ items = [], onAdd, onWishlist, wishlist = [] }) { return <div className="product-grid">{items.map((product) => <ProductCard key={product.id} product={product} onAdd={onAdd} onWishlist={onWishlist} wished={wishlist.includes(product.id)} />)}</div> }
