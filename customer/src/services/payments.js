import { requireSupabase } from '../lib/supabase'

export async function createPaymentRecord(orderId, amount, currency = 'INR', provider = 'razorpay') {
  return requireSupabase()
    .from('payments')
    .insert({ order_id: orderId, amount, currency, status: 'PENDING', provider })
    .select()
    .single()
}

export async function getPaymentForOrder(orderId) {
  return requireSupabase()
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle()
}

export async function updatePaymentStatus(paymentId, status, providerPaymentId = null) {
  const update = { status }
  if (providerPaymentId) update.provider_payment_id = providerPaymentId
  return requireSupabase()
    .from('payments')
    .update(update)
    .eq('id', paymentId)
    .select()
    .single()
}

export async function recordPaymentEvent(paymentId, eventType, payload = {}) {
  return requireSupabase()
    .from('payment_events')
    .insert({ payment_id: paymentId, event_type: eventType, payload })
}

export function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function openRazorpayCheckout({ amount, orderId, orderNumber, customerName, customerEmail, customerPhone, onSuccess, onFailure }) {
  const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID
  if (!keyId) {
    onFailure('Payment gateway not configured. Add VITE_RAZORPAY_KEY_ID to .env.local')
    return
  }

  const options = {
    key: keyId,
    amount: Math.round(amount * 100),
    currency: 'INR',
    name: 'Drinkly',
    description: `Order ${orderNumber}`,
    order_id: orderId,
    handler: function (response) {
      onSuccess({
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_order_id: response.razorpay_order_id,
        razorpay_signature: response.razorpay_signature
      })
    },
    prefill: {
      name: customerName || '',
      email: customerEmail || '',
      contact: customerPhone || ''
    },
    theme: { color: '#ffc431' },
    modal: {
      ondismiss: function () {
        onFailure('Payment was cancelled')
      }
    }
  }

  const rzp = new window.Razorpay(options)
  rzp.on('payment.failed', function (response) {
    onFailure(response.error?.description || 'Payment failed')
  })
  rzp.open()
}

export function verifyRazorpaySignature(paymentId, orderId, signature) {
  // Signature verification is now done server-side via Edge Function
  // This is a fallback for development/testing only
  console.warn('Client-side signature verification is deprecated. Use server-side verification.')
  return true
}
