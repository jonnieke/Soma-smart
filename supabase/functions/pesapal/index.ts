import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const IS_SANDBOX = Deno.env.get('PESAPAL_IS_SANDBOX') === 'true'
const PESAPAL_BASE_URL = IS_SANDBOX
    ? "https://cybqa.pesapal.com/pesapalv3"
    : "https://pay.pesapal.com/v3"

serve(async (req) => {
    const { method } = req

    // Handle CORS
    if (method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const url = new URL(req.url)
        const path = url.pathname.split('/').pop()

        // Helper to get Auth Token
        const getAuthToken = async () => {
            const key = Deno.env.get('PESAPAL_CONSUMER_KEY')
            const secret = Deno.env.get('PESAPAL_CONSUMER_SECRET')

            console.log(`Using Key: ${key?.substring(0, 4)}...${key?.substring(key.length - 4)}`)

            const response = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    consumer_key: key,
                    consumer_secret: secret
                })
            })

            const responseText = await response.text()
            console.log("Auth Response:", responseText)

            if (!response.ok) {
                throw new Error(`Pesapal Auth Failed: ${response.status} ${responseText}`)
            }

            try {
                const data = JSON.parse(responseText)
                return data.token
            } catch (e) {
                throw new Error(`Invalid Auth JSON: ${responseText}`)
            }
        }

        // Helper to update transaction status
        const updateTransactionStatus = async (orderTrackingId: string) => {
            const token = await getAuthToken()
            const statusRes = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const statusData = await statusRes.json()

            if (statusData.payment_status_description === 'Completed') {
                const { merchant_reference } = statusData

                // 1. Update Transaction
                await supabase.from('transactions').update({ status: 'SUCCESS' }).eq('reference_code', merchant_reference)

                // 2. Update Profile (Subscription)
                const { data: tx } = await supabase.from('transactions').select('user_id, amount').eq('reference_code', merchant_reference).single()

                if (tx) {
                    await supabase.from('profiles').update({
                        subscription_tier: 'PRO',
                        subscription_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    }).eq('id', tx.user_id)
                }
            }
            return statusData
        }

        // 1. AUTHENTICATION
        if (path === 'authenticate') {
            const key = Deno.env.get('PESAPAL_CONSUMER_KEY')
            const secret = Deno.env.get('PESAPAL_CONSUMER_SECRET')

            const response = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({
                    consumer_key: key,
                    consumer_secret: secret
                })
            })

            const data = await response.json()
            return new Response(JSON.stringify({
                pesapal_response: data,
                key_preview: `${key?.substring(0, 4)}...`,
                env_vars: Object.keys(Deno.env.toObject()).filter(k => k.includes('PESAPAL'))
            }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
        }

        // 2. REGISTER IPN
        if (path === 'register-ipn') {
            const token = await getAuthToken()
            const supabaseUrl = Deno.env.get('SUPABASE_URL')
            if (!supabaseUrl) throw new Error("SUPABASE_URL not found in environment")

            const projectRef = supabaseUrl.split('//')[1].split('.')[0]
            const ipnUrl = `https://${projectRef}.supabase.co/functions/v1/pesapal/ipn-handler`

            console.log(`Registering IPN URL: ${ipnUrl}`)

            const ipnBody = {
                url: ipnUrl,
                ipn_notification_type: 'POST'
            }
            console.log("Registering IPN with body:", JSON.stringify(ipnBody))

            const response = await fetch(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(ipnBody)
            })

            const responseText = await response.text()
            console.log("Pesapal Response:", responseText)

            if (!response.ok) {
                return new Response(JSON.stringify({
                    error: `Pesapal Registration Failed: ${response.status}`,
                    details: responseText,
                    hint: "Check if your keys are for Live or Sandbox. If Sandbox, set PESAPAL_IS_SANDBOX=true in secrets."
                }), { status: response.status, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
            }

            try {
                const data = JSON.parse(responseText)
                return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
            } catch (e) {
                return new Response(JSON.stringify({ error: "Invalid JSON from Pesapal", raw: responseText }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
            }
        }

        // 3. INITIATE ORDER
        if (path === 'initiate-order') {
            const { amount, description, reference, callback_url, billing_address } = await req.json()
            const token = await getAuthToken()

            const orderRes = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: reference,
                    currency: "KES",
                    amount: amount,
                    description: description,
                    callback_url: callback_url,
                    notification_id: Deno.env.get('PESAPAL_IPN_ID'),
                    billing_address: billing_address
                })
            })
            const orderData = await orderRes.json()
            return new Response(JSON.stringify(orderData), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
        }

        // 4. IPN HANDLER (GET or POST from Pesapal)
        if (path === 'ipn-handler') {
            console.log("IPN Received:", method)
            let trackingId = url.searchParams.get('OrderTrackingId')
            let merchantRef = url.searchParams.get('OrderMerchantReference')

            if (method === 'POST') {
                try {
                    const body = await req.json()
                    trackingId = trackingId || body.OrderTrackingId
                    merchantRef = merchantRef || body.OrderMerchantReference
                } catch (e) {
                    console.error("Failed to parse IPN POST body:", e.message)
                }
            }

            console.log(`Processing IPN for OrderTrackingId: ${trackingId}`)

            if (trackingId) {
                await updateTransactionStatus(trackingId)

                return new Response(JSON.stringify({
                    "orderNotificationType": "IPN",
                    "orderTrackingId": trackingId,
                    "orderMerchantReference": merchantRef,
                    "status": 200
                }), { headers: { 'Content-Type': 'application/json' } })
            }
            return new Response('Missing OrderTrackingId', { status: 400 })
        }

        // 5. MANUAL CHECK STATUS
        if (path === 'check-status') {
            const { OrderTrackingId } = await req.json()
            const statusData = await updateTransactionStatus(OrderTrackingId)
            return new Response(JSON.stringify(statusData), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
        }

        return new Response('Not Found', { status: 404 })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }
})
