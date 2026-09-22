import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { order_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json()

    if (!order_id || !razorpay_payment_id) {
      return new Response(
        JSON.stringify({ error: 'order_id and razorpay_payment_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify Razorpay signature server-side
    if (razorpayKeySecret && razorpay_signature && razorpay_order_id) {
      const encoder = new TextEncoder()
      const data = encoder.encode(`${razorpay_order_id}|${razorpay_payment_id}`)
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(razorpayKeySecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )
      const signatureBuffer = await crypto.subtle.sign('HMAC', key, data)
      const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      if (expectedSignature !== razorpay_signature) {
        console.error('Payment signature mismatch')
        return new Response(
          JSON.stringify({ error: 'Payment signature verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Update payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        provider_payment_id: razorpay_payment_id,
        status: 'CAPTURED',
        updated_at: new Date().toISOString()
      })
      .eq('order_id', order_id)

    if (paymentError) {
      console.error('Payment update error:', paymentError)
    }

    // Update order status
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'CONFIRMED',
        payment_status: 'PAID',
        updated_at: new Date().toISOString()
      })
      .eq('id', order_id)
      .eq('status', 'PENDING_PAYMENT')
      .select()
      .single()

    if (orderError || !order) {
      console.error('Order update error:', orderError)
      return new Response(
        JSON.stringify({ error: 'Failed to confirm order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Record payment event
    await supabase
      .from('payment_events')
      .insert({
        payment_id: (await supabase.from('payments').select('id').eq('order_id', order_id).single()).data?.id,
        event_type: 'payment_captured',
        provider_event_id: razorpay_payment_id,
        payload: { status: 'CAPTURED', order_id }
      })

    // Trigger order confirmation email
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-order-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id })
      })
    } catch (emailError) {
      console.error('Failed to trigger confirmation email:', emailError)
    }

    return new Response(
      JSON.stringify({ success: true, order }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
