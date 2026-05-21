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
        console.log(`Incoming request URL: ${req.url}`)
        const path = url.pathname.toLowerCase()

        console.log(`Request Method: ${method}, Lowercase Path: ${path}`)

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
        const updateTransactionStatus = async (orderTrackingId?: string, merchantReference?: string) => {
            let resolvedTrackingId = orderTrackingId

            if (!resolvedTrackingId && merchantReference) {
                const { data: existingTx } = await supabase
                    .from('transactions')
                    .select('order_tracking_id')
                    .eq('reference_code', merchantReference)
                    .maybeSingle()

                resolvedTrackingId = existingTx?.order_tracking_id
            }

            if (!resolvedTrackingId) {
                throw new Error('Missing OrderTrackingId for Pesapal status check')
            }

            const token = await getAuthToken()
            const statusRes = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${resolvedTrackingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const statusData = await statusRes.json()
            const statusDescription = String(statusData.payment_status_description || '').toLowerCase()
            const resolvedReference = statusData.merchant_reference || merchantReference

            if (!resolvedReference) {
                return statusData
            }

            if (statusDescription === 'completed') {
                const merchant_reference = resolvedReference

                // 1. Update Transaction
                await supabase
                    .from('transactions')
                    .update({ status: 'SUCCESS', order_tracking_id: resolvedTrackingId })
                    .eq('reference_code', merchant_reference)

                // 2. Update Profile (Subscription)
                const { data: tx } = await supabase.from('transactions').select('user_id, amount').eq('reference_code', merchant_reference).single()

                if (tx) {
                    // Parse Plan from reference (Format: SUB_DURATION_USERID_TIMESTAMP)
                    const parts = merchant_reference.split('_')
                    let duration = parts[1]

                    // ROBUST FALLBACK: Infer Duration from Amount (Source of Truth)
                    // This prevents "Default to Monthly" errors if reference parsing fails
                    if (tx.amount === 20) duration = 'DAILY'
                    else if (tx.amount === 100) duration = 'WEEKLY'
                    else if (tx.amount === 300 || tx.amount === 600) duration = 'MONTHLY'
                    else if (tx.amount === 700 || tx.amount === 1600) duration = 'TERMLY'
                    else if (tx.amount === 2000 || tx.amount === 5000) duration = 'ANNUAL'

                    // Final safety fallback
                    if (!duration) duration = 'MONTHLY'

                    const now = new Date()
                    let expiryDate = new Date(now)

                    // Simple mapping of durations
                    switch (duration) {
                        case 'DAILY': expiryDate.setDate(now.getDate() + 1); break;
                        case 'WEEKLY': expiryDate.setDate(now.getDate() + 7); break;
                        case 'MONTHLY': expiryDate.setMonth(now.getMonth() + 1); break;
                        case 'TERMLY': expiryDate.setMonth(now.getMonth() + 3); break;
                        case 'ANNUAL': expiryDate.setFullYear(now.getFullYear() + 1); break;
                        default: expiryDate.setMonth(now.getMonth() + 1);
                    }

                    // Guard against accidental downgrade: only move forward if this expiry is later.
                    const { data: currentProfile } = await supabase
                        .from('profiles')
                        .select('subscription_expiry')
                        .eq('id', tx.user_id)
                        .maybeSingle()

                    const currentExpiry = currentProfile?.subscription_expiry ? new Date(currentProfile.subscription_expiry) : null
                    const shouldUpdate = !currentExpiry || isNaN(currentExpiry.getTime()) || expiryDate > currentExpiry

                    if (shouldUpdate) {
                        await supabase.from('profiles').update({
                            subscription_tier: duration,
                            subscription_expiry: expiryDate.toISOString()
                        }).eq('id', tx.user_id)
                    }
                }
            } else if (['failed', 'invalid', 'cancelled', 'canceled'].includes(statusDescription)) {
                await supabase
                    .from('transactions')
                    .update({ status: 'FAILED', order_tracking_id: resolvedTrackingId })
                    .eq('reference_code', resolvedReference)
            }
            return statusData
        }

        // 1. AUTHENTICATION & KEY TEST
        if (path.endsWith('authenticate') || path.endsWith('test-keys')) {
            const key = Deno.env.get('PESAPAL_CONSUMER_KEY')
            const secret = Deno.env.get('PESAPAL_CONSUMER_SECRET')
            const ipnId = Deno.env.get('PESAPAL_IPN_ID')

            console.log(`Key Test: Key exists: ${!!key}, Secret exists: ${!!secret}, IPN ID exists: ${!!ipnId}`)

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
                success: response.ok,
                pesapal_response: data,
                config_preview: {
                    key_present: !!key,
                    secret_present: !!secret,
                    ipn_present: !!ipnId,
                    is_sandbox: IS_SANDBOX
                }
            }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
        }

        // 2. REGISTER IPN
        if (path.endsWith('register-ipn')) {
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
        if (path.endsWith('initiate-order')) {
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
            console.log("Pesapal Order Response:", JSON.stringify(orderData))

            if (!orderRes.ok) {
                return new Response(JSON.stringify({
                    error: "Pesapal Order Failed",
                    status: orderRes.status,
                    details: orderData
                }), { status: 400, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
            }

            if (orderData.order_tracking_id) {
                await supabase
                    .from('transactions')
                    .update({ order_tracking_id: orderData.order_tracking_id })
                    .eq('reference_code', reference)
            }

            return new Response(JSON.stringify(orderData), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
        }

        // 4. IPN HANDLER (GET or POST from Pesapal)
        if (path.endsWith('ipn-handler')) {
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
                await updateTransactionStatus(trackingId, merchantRef)

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
        if (path.endsWith('check-status')) {
            const { OrderTrackingId, merchantReference } = await req.json()
            const statusData = await updateTransactionStatus(OrderTrackingId, merchantReference)
            return new Response(JSON.stringify(statusData), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
        }

        return new Response(JSON.stringify({
            error: 'Not Found',
            path,
            message: 'Target action not matched in Edge Function. Use /test-keys to verify setup.'
        }), { status: 404, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }
})
