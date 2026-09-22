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
    const resendApiKey = Deno.env.get('RESEND_API_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { order_id } = await req.json()

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: 'order_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch order with related data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        shops(name, address, phone),
        profiles!orders_customer_id_fkey(full_name, email, phone),
        addresses(label, address_line_1, city, state, postal_code)
      `)
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const customerEmail = order.profiles?.email
    if (!customerEmail) {
      return new Response(
        JSON.stringify({ error: 'Customer email not found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const shopName = order.shops?.name || 'Drinkly Shop'
    const itemsHtml = order.order_items?.map((item) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${item.product_name_snapshot}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${item.price_snapshot}</td>
        <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${item.subtotal}</td>
      </tr>
    `).join('') || ''

    const deliveryAddress = [
      order.delivery_name,
      order.delivery_address,
      order.delivery_city,
      order.delivery_state,
      order.delivery_postal_code
    ].filter(Boolean).join(', ')

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <div style="background:#101a23;color:#ffc431;padding:20px;text-align:center;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:24px">Drinkly</h1>
          <p style="margin:8px 0 0;opacity:0.8">Order Confirmation</p>
        </div>
        <div style="background:#f9f9f9;padding:20px;border:1px solid #eee">
          <h2 style="color:#101a23">Order #${order.order_number}</h2>
          <p>Thank you for your order from <strong>${shopName}</strong>!</p>
          
          <h3 style="color:#101a23;border-bottom:2px solid #ffc431;padding-bottom:8px">Order Details</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#101a23;color:#fff">
                <th style="padding:8px;text-align:left">Product</th>
                <th style="padding:8px;text-align:center">Qty</th>
                <th style="padding:8px;text-align:right">Price</th>
                <th style="padding:8px;text-align:right">Total</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          
          <div style="margin-top:20px;padding:16px;background:#fff;border-radius:8px">
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Subtotal</span><strong>₹${order.subtotal}</strong></div>
            <div style="display:flex;justify-content:space-between;padding:4px 0"><span>Delivery Fee</span><strong>₹${order.delivery_fee}</strong></div>
            ${order.tax > 0 ? `<div style="display:flex;justify-content:space-between;padding:4px 0"><span>Tax</span><strong>₹${order.tax}</strong></div>` : ''}
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-top:2px solid #101a23;margin-top:8px;font-size:18px"><strong>Total</strong><strong style="color:#ffc431">₹${order.total}</strong></div>
          </div>
          
          <div style="margin-top:16px;padding:16px;background:#fff;border-radius:8px">
            <p><strong>Payment Status:</strong> ${order.payment_status}</p>
            <p><strong>Order Status:</strong> ${order.status.replace(/_/g, ' ')}</p>
          </div>
          
          ${deliveryAddress ? `<div style="margin-top:16px;padding:16px;background:#fff;border-radius:8px">
            <p><strong>Delivery Address:</strong></p>
            <p>${deliveryAddress}</p>
          </div>` : ''}
        </div>
        <div style="text-align:center;padding:20px;color:#888;font-size:12px">
          <p>Drinkly - Good Drinks. On Time.</p>
        </div>
      </body>
      </html>
    `

    // Send email via Resend
    if (resendApiKey) {
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Drinkly <orders@drinkly.in>',
          to: [customerEmail],
          subject: `Order #${order.order_number} Confirmed - Drinkly`,
          html: emailHtml
        })
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('Email send failed:', errorText)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Order confirmation email sent' }),
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
