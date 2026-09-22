import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppHeader, BottomNav, PrimaryButton, SecondaryButton } from './components'
import { Icon } from './icons'
import { isSupabaseConfigured, requireSupabase } from './lib/supabase'
import { signOut, updateCurrentProfile, updatePassword } from './services/auth'
import { createAddress, updateAddress, deleteAddress, setDefaultAddress } from './services/addresses'

function AccountScreen({ children, title }) { return <div className="screen"><AppHeader title={title} />{children}<BottomNav /></div> }
function Field({ label, value, onChange, placeholder, type = 'text' }) { return <label className="account-field">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /></label> }

export function Addresses({ addresses, setAddresses, selectedAddressId, setSelectedAddressId, customerSession }) {
  const [editing, setEditing] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    label: 'Home',
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    landmark: '',
    area: '',
    city: '',
    state: '',
    postal_code: ''
  })

  const startEdit = (address) => {
    setEditing(address.id)
    setForm({
      label: address.label || 'Home',
      full_name: address.full_name || '',
      phone: address.phone || '',
      address_line_1: address.address_line_1 || address.line || '',
      address_line_2: address.address_line_2 || '',
      landmark: address.landmark || '',
      area: address.area || '',
      city: address.city || '',
      state: address.state || '',
      postal_code: address.postal_code || ''
    })
    setError('')
  }

  const startNew = () => {
    setEditing('new')
    setForm({ label: 'Home', full_name: '', phone: '', address_line_1: '', address_line_2: '', landmark: '', area: '', city: '', state: '', postal_code: '' })
    setError('')
  }

  const validate = () => {
    if (!form.full_name.trim()) { setError('Full name is required'); return false }
    if (!form.phone.trim()) { setError('Phone number is required'); return false }
    if (!form.address_line_1.trim()) { setError('Address is required'); return false }
    if (!form.city.trim()) { setError('City is required'); return false }
    return true
  }

  const save = async (event) => {
    event.preventDefault()
    if (!validate()) return
    if (!customerSession) { setError('Please log in to save addresses'); return }

    setLoading(true)
    setError('')
    try {
      if (editing === 'new') {
        const isFirst = addresses.length === 0
        const { data, error: createError } = await createAddress({ ...form, is_default: isFirst })
        if (createError) throw createError
        if (data) {
          const newAddr = {
            id: data.id, label: data.label, full_name: data.full_name || '', phone: data.phone || '',
            line: data.address_line_1 || data.line || '', address_line_1: data.address_line_1 || data.line || '',
            address_line_2: data.address_line_2 || '', landmark: data.landmark || '', area: data.area || '',
            city: data.city, state: data.state || '', postal_code: data.postal_code || '',
            latitude: data.latitude, longitude: data.longitude, is_default: data.is_default
          }
          setAddresses((current) => [newAddr, ...current])
          if (isFirst) setSelectedAddressId(data.id)
        }
      } else {
        const { data, error: updateError } = await updateAddress(editing, form)
        if (updateError) throw updateError
        if (data) {
          setAddresses((current) => current.map((a) => a.id === editing ? {
            ...a, label: data.label, full_name: data.full_name || '', phone: data.phone || '',
            address_line_1: data.address_line_1 || data.line || '', address_line_2: data.address_line_2 || '',
            landmark: data.landmark || '', area: data.area || '', city: data.city,
            state: data.state || '', postal_code: data.postal_code || ''
          } : a))
        }
      }
      setEditing(null)
      setForm({ label: 'Home', full_name: '', phone: '', address_line_1: '', address_line_2: '', landmark: '', area: '', city: '', state: '', postal_code: '' })
    } catch (err) {
      setError(err.message || 'Failed to save address')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this address?')) return
    setLoading(true)
    try {
      const { error } = await deleteAddress(id)
      if (error) throw error
      setAddresses((current) => current.filter((a) => a.id !== id))
      if (selectedAddressId === id) setSelectedAddressId(null)
    } catch (err) {
      setError(err.message || 'Failed to delete address')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (id) => {
    setLoading(true)
    try {
      const { error } = await setDefaultAddress(id)
      if (error) throw error
      setAddresses((current) => current.map((a) => ({ ...a, is_default: a.id === id })))
      setSelectedAddressId(id)
    } catch (err) {
      setError(err.message || 'Failed to set default address')
    } finally {
      setLoading(false)
    }
  }

  return <AccountScreen title="Saved Addresses">
    {error && <p className="form-error" style={{ padding: '0 16px', margin: '8px 0', color: '#ff6b6b' }}>{error}</p>}
    <div className="account-list">
      {addresses.map((address) => <article className={selectedAddressId === address.id ? 'account-card selected-account-card' : 'account-card'} key={address.id}>
        <button className="account-card-main" onClick={() => setSelectedAddressId(address.id)}>
          <div className="account-card-icon"><Icon name="home" size={17} /></div>
          <div>
            <strong>{address.label}{address.is_default ? ' (Default)' : ''}</strong>
            <p>
              {address.full_name && <>{address.full_name}<br /></>}
              {address.address_line_1 || address.line}{address.city ? `, ${address.city}` : ''}{address.state ? `, ${address.state}` : ''}{address.postal_code ? ` - ${address.postal_code}` : ''}
              {address.phone && <><br />Phone: {address.phone}</>}
            </p>
          </div>
        </button>
        <span className="account-card-actions">
          <button onClick={() => startEdit(address)}>EDIT</button>
          <button onClick={() => handleDelete(address.id)} disabled={loading}>DELETE</button>
          {!address.is_default && <button onClick={() => handleSetDefault(address.id)} disabled={loading}>SET DEFAULT</button>}
          <small>{selectedAddressId === address.id ? 'SELECTED' : 'SELECT'}</small>
        </span>
      </article>)}
    </div>

    {editing !== null ? <form className="account-form" onSubmit={save}>
      <h3>{editing === 'new' ? 'Add New Address' : 'Edit Address'}</h3>
      <label className="account-field">Label
        <select value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })}>
          <option>Home</option>
          <option>Work</option>
          <option>Other</option>
        </select>
      </label>
      <Field label="Full Name" value={form.full_name} onChange={(value) => setForm({ ...form, full_name: value })} placeholder="Recipient name" />
      <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} placeholder="Phone number" />
      <Field label="Address Line 1" value={form.address_line_1} onChange={(value) => setForm({ ...form, address_line_1: value })} placeholder="Street address, house number" />
      <Field label="Address Line 2" value={form.address_line_2} onChange={(value) => setForm({ ...form, address_line_2: value })} placeholder="Apartment, suite, floor (optional)" />
      <Field label="Landmark" value={form.landmark} onChange={(value) => setForm({ ...form, landmark: value })} placeholder="Nearby landmark (optional)" />
      <Field label="Area" value={form.area} onChange={(value) => setForm({ ...form, area: value })} placeholder="Area or locality (optional)" />
      <Field label="City" value={form.city} onChange={(value) => setForm({ ...form, city: value })} placeholder="City" />
      <Field label="State" value={form.state} onChange={(value) => setForm({ ...form, state: value })} placeholder="State (optional)" />
      <Field label="Postal Code" value={form.postal_code} onChange={(value) => setForm({ ...form, postal_code: value })} placeholder="PIN code (optional)" />
      <div className="form-actions">
        <SecondaryButton onClick={() => { setEditing(null); setError('') }}>CANCEL</SecondaryButton>
        <PrimaryButton type="submit" disabled={loading}>{loading ? 'SAVING...' : 'SAVE ADDRESS'}</PrimaryButton>
      </div>
    </form> : <button className="add-row" onClick={startNew}>+ ADD NEW ADDRESS</button>}
  </AccountScreen>
}

export function PaymentMethods() {
  return <AccountScreen title="Payment Methods">
    <div className="account-list">
      <article className="account-card payment-method">
        <div className="account-card-icon"><Icon name="bag" size={17} /></div>
        <div><strong>Cash on Delivery</strong><p>Pay when your order arrives</p></div>
        <div className="method-actions"><small>DEFAULT</small></div>
      </article>
    </div>
    <p style={{ padding: '16px', color: '#888', fontSize: 13 }}>Online payment via Razorpay is available at checkout.</p>
  </AccountScreen>
}

export function Notifications({ notifications, setNotifications }) {
  const markAllRead = async () => {
    if (!isSupabaseConfigured) {
      setNotifications((current) => current.map((item) => ({ ...item, read: true })))
      return
    }
    try {
      const { data: { user } } = await requireSupabase().auth.getUser()
      if (user) {
        await requireSupabase()
          .from('notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .is('read_at', null)
      }
    } catch (err) {
      console.error('Failed to mark notifications read:', err)
    }
    setNotifications((current) => current.map((item) => ({ ...item, read: true })))
  }

  return <AccountScreen title="Notifications">
    <div className="notification-toolbar">
      <span>{notifications.filter((item) => !item.read).length} unread</span>
      <button onClick={markAllRead}>MARK ALL AS READ</button>
    </div>
    <div className="account-list">
      {notifications.length === 0 && <p style={{ padding: '24px 16px', color: '#888', textAlign: 'center' }}>No notifications yet.</p>}
      {notifications.map((notification) => <article className={notification.read ? 'notification-card read' : 'notification-card'} key={notification.id}>
        <span className="notification-dot" />
        <div>
          <strong>{notification.title}</strong>
          <p>{notification.message}</p>
          <small>{notification.time}</small>
        </div>
      </article>)}
    </div>
  </AccountScreen>
}

export function Support() { return <AccountScreen title="Help & Support"><div className="support-list"><Link className="support-row" to="/support/faqs"><span><Icon name="grid" size={15} /></span><div><strong>FAQs</strong><small>Find answers to common questions</small></div><Icon name="chevron" size={14} /></Link><Link className="support-row" to="/support/contact"><span><Icon name="phone" size={15} /></span><div><strong>Contact Us</strong><small>Get in touch with our support team</small></div><Icon name="chevron" size={14} /></Link><Link className="support-row" to="/support/chat"><span><Icon name="user" size={15} /></span><div><strong>Live Chat</strong><small>Chat with us instantly</small></div><Icon name="chevron" size={14} /></Link><Link className="support-row" to="/support/report"><span><Icon name="close" size={15} /></span><div><strong>Report an Issue</strong><small>Help us improve</small></div><Icon name="chevron" size={14} /></Link></div></AccountScreen> }

export function EditProfile({ profile, setProfile }) {
  const [form, setForm] = useState({
    name: profile?.name || profile?.full_name || '',
    phone: profile?.phone || '',
    email: profile?.email || ''
  })
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' })
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const save = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const { error: updateError } = await updateCurrentProfile({
        full_name: form.name,
        phone: form.phone
      })
      if (updateError) throw updateError
      setProfile((prev) => ({ ...prev, name: form.name, phone: form.phone, full_name: form.name }))
      setSuccess('Profile updated successfully')
    } catch (err) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (event) => {
    event.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const { error } = await updatePassword(passwordForm.newPassword)
      if (error) throw error
      setSuccess('Password updated successfully')
      setShowPasswordChange(false)
      setPasswordForm({ newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const initials = (form.name || 'U').slice(0, 2).toUpperCase()

  return <AccountScreen title="Edit Profile">
    {error && <p className="form-error" style={{ padding: '0 16px', margin: '8px 0', color: '#ff6b6b' }}>{error}</p>}
    {success && <p className="form-success" style={{ padding: '0 16px', margin: '8px 0', color: '#4caf50' }}>{success}</p>}

    <form className="account-form profile-form" onSubmit={save}>
      <div className="edit-avatar">{initials}</div>
      <Field label="Name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
      <Field label="Phone" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} />
      <Field label="Email" value={form.email} onChange={() => {}} placeholder="Email cannot be changed here" />
      <PrimaryButton type="submit" disabled={loading}>{loading ? 'SAVING...' : 'SAVE CHANGES'}</PrimaryButton>
    </form>

    <div style={{ padding: '16px' }}>
      <SecondaryButton onClick={() => setShowPasswordChange(!showPasswordChange)}>
        {showPasswordChange ? 'CANCEL PASSWORD CHANGE' : 'CHANGE PASSWORD'}
      </SecondaryButton>
    </div>

    {showPasswordChange && <form className="account-form" onSubmit={handlePasswordChange}>
      <h3>Change Password</h3>
      <Field label="New Password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })} type="password" placeholder="Enter new password" />
      <Field label="Confirm Password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })} type="password" placeholder="Confirm new password" />
      <PrimaryButton type="submit" disabled={loading}>{loading ? 'UPDATING...' : 'UPDATE PASSWORD'}</PrimaryButton>
    </form>}
  </AccountScreen>
}

export function Faqs() { const [open, setOpen] = useState(null); const questions = [['How do I track my order?', 'Open My Orders from your profile and select Track order.'], ['What is the delivery age requirement?', 'You must be 21 or older and may be asked to show valid ID at delivery.'], ['Can I cancel an order?', 'Contact support as soon as possible and we will check the order status.']]; return <AccountScreen title="FAQs"><div className="faq-list">{questions.map(([question, answer], index) => <div className="faq-item" key={question}><button onClick={() => setOpen(open === index ? null : index)}><strong>{question}</strong><Icon name="chevron" size={14} /></button>{open === index && <p>{answer}</p>}</div>)}</div></AccountScreen> }
export function ContactUs() { return <AccountScreen title="Contact Us"><div className="contact-options"><a href="tel:+918000123456"><Icon name="phone" /><strong>Call us<small>+91 8000 123 456</small></strong></a><a href="mailto:support@drinkly.in"><Icon name="grid" /><strong>Email support<small>support@drinkly.in</small></strong></a></div></AccountScreen> }
export function LiveChat() { const [message, setMessage] = useState(''); const [messages, setMessages] = useState([{ from: 'support', text: 'Hi! How can we help?' }]); return <AccountScreen title="Live Chat"><div className="chat-box">{messages.map((item, index) => <p className={item.from === 'me' ? 'chat-message mine' : 'chat-message'} key={index}>{item.text}</p>)}</div><form className="chat-form" onSubmit={(event) => { event.preventDefault(); if (message.trim()) { setMessages([...messages, { from: 'me', text: message }]); setMessage('') } }}><input value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Type your message..." /><button type="submit">SEND</button></form></AccountScreen> }
export function ReportIssue() { const [submitted, setSubmitted] = useState(false); return <AccountScreen title="Report an Issue">{submitted ? <div className="success-note"><strong>Thanks for letting us know.</strong><p>Our team will review your report shortly.</p></div> : <form className="account-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true) }}><label className="account-field">Issue type<select><option>Order issue</option><option>Payment issue</option><option>App feedback</option></select></label><label className="account-field">Description<textarea required placeholder="Tell us what happened..." /></label><PrimaryButton type="submit">SUBMIT</PrimaryButton></form>}</AccountScreen> }

export function PolicyPage({ title, children }) { return <AccountScreen title={title}><div className="policy-copy">{children}</div></AccountScreen> }
export function PrivacyPolicy() { return <PolicyPage title="Privacy Policy"><h3>Your privacy matters</h3><p>Drinklyy uses the information you provide to fulfil orders, improve the app, and support your account. We do not sell your personal information.</p><h3>Information we use</h3><p>Your name, contact details, delivery address, and order history are used only to provide the Drinklyy service.</p></PolicyPage> }
export function Terms() { return <PolicyPage title="Terms & Conditions"><h3>Using Drinklyy</h3><p>Drinklyy is an alcohol delivery platform. Orders, payments, and delivery tracking are managed through our backend systems.</p><h3>Age requirement</h3><p>You must be legally permitted to purchase alcohol in your location. Valid identification may be required at delivery.</p></PolicyPage> }

export function LanguagePage({ language, setLanguage }) { const navigate = useNavigate(); return <AccountScreen title="Language"><div className="language-list">{['English', 'Hindi', 'Kannada'].map((item) => <button className={language === item ? 'selected' : ''} key={item} onClick={() => { setLanguage(item); navigate('/settings') }}>{item}<span>{language === item ? '✓' : ''}</span></button>)}</div></AccountScreen> }

export function SettingsPage({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const items = [['Account Information', '/edit-profile'], ['Change Password', '/edit-profile'], ['Language', '/language'], ['Dark Mode', null], ['Privacy Policy', '/privacy-policy'], ['Terms & Conditions', '/terms']]
  const logout = async () => {
    if (isSupabaseConfigured) await signOut()
    localStorage.removeItem('drinkly-cart')
    navigate('/login')
  }
  return <AccountScreen title="Settings">
    <div className="menu-list settings-list">
      {items.map(([label, to]) => <button key={label} onClick={() => to && navigate(to)}>
        <span><Icon name="user" size={14} /></span>
        {label}
        {label === 'Dark Mode' ? <i className={darkMode ? 'toggle on' : 'toggle'} onClick={(event) => { event.stopPropagation(); setDarkMode(!darkMode) }} /> : <Icon name="chevron" size={14} />}
      </button>)}
    </div>
    <button className="logout-button" onClick={logout}><Icon name="close" size={13} /> &nbsp; Log Out</button>
  </AccountScreen>
}
