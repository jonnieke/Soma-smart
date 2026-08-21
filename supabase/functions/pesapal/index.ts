import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const IS_SANDBOX = Deno.env.get('PESAPAL_IS_SANDBOX') === 'true';
const PESAPAL_BASE_URL = IS_SANDBOX ? 'https://cybqa.pesapal.com/pesapalv3' : 'https://pay.pesapal.com/v3';
const PRODUCTION_ORIGINS = new Set(['https://somaai.co.ke', 'https://www.somaai.co.ke']);
const PREVIEW_ORIGINS = new Set(String(Deno.env.get('ALLOWED_PREVIEW_ORIGINS') || '').split(',').map((value) => value.trim()).filter(Boolean));

const PLAN_CATALOG: Record<string, { amount: number; duration: string; description: string; credits?: number; creditDays?: number }> = {
  s_daily: { amount: 20, duration: 'DAILY', description: 'Soma AI Daily Dash' },
  s_weekly: { amount: 100, duration: 'WEEKLY', description: 'Soma AI Weekly Warrior' },
  s_monthly: { amount: 300, duration: 'MONTHLY', description: 'Soma AI Monthly Master' },
  s_termly: { amount: 700, duration: 'TERMLY', description: 'Soma AI Term Lite' },
  s_annual: { amount: 2000, duration: 'ANNUAL', description: 'Soma AI Annual Ace' },
  t_monthly: { amount: 600, duration: 'MONTHLY', description: 'Soma AI Teacher Pro Monthly' },
  t_termly: { amount: 1600, duration: 'TERMLY', description: 'Soma AI Teacher Pro Termly' },
  t_annual: { amount: 5000, duration: 'ANNUAL', description: 'Soma AI Teacher Pro Annual' },
  credit_30: { amount: 20, duration: 'DAILY', description: '30 Soma AI learning credits', credits: 30, creditDays: 1 },
  credit_100: { amount: 50, duration: 'WEEKLY', description: '100 Soma AI learning credits', credits: 100, creditDays: 7 },
  credit_250: { amount: 100, duration: 'MONTHLY', description: '250 Soma AI learning credits', credits: 250, creditDays: 30 },
};

const isAllowedOrigin = (origin: string | null) => !origin || PRODUCTION_ORIGINS.has(origin) || PREVIEW_ORIGINS.has(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
const corsHeadersFor = (req: Request) => {
  const origin = req.headers.get('Origin');
  return {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    Vary: 'Origin',
    ...(origin && isAllowedOrigin(origin) ? { 'Access-Control-Allow-Origin': origin } : {}),
  };
};
const json = (body: unknown, status: number, headers: Record<string, string>) => new Response(JSON.stringify(body), {
  status,
  headers: { ...headers, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
const serviceClient = () => {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) throw new Error('Server database credentials are not configured');
  return createClient(url, key);
};
const getAuthenticatedUser = async (req: Request, supabase: ReturnType<typeof serviceClient>) => {
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
};
const isAdminUser = (user: { email?: string | null } | null) => {
  if (!user?.email) return false;
  const allowed = new Set(String(Deno.env.get('ADMIN_EMAILS') || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));
  return allowed.has(user.email.toLowerCase());
};
const cleanText = (value: unknown, maxLength: number) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, maxLength);

const requestPesapalToken = async () => {
  const key = Deno.env.get('PESAPAL_CONSUMER_KEY');
  const secret = Deno.env.get('PESAPAL_CONSUMER_SECRET');
  if (!key || !secret) throw new Error('Payment provider credentials are not configured');
  const response = await fetch(`${PESAPAL_BASE_URL}/api/Auth/RequestToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ consumer_key: key, consumer_secret: secret }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.token) throw new Error(`Payment provider authentication failed (${response.status})`);
  return data.token as string;
};
const paymentCallbackUrl = (reference: string) => {
  const configured = Deno.env.get('PUBLIC_APP_URL') || 'https://somaai.co.ke';
  const appUrl = new URL(configured);
  if (!PRODUCTION_ORIGINS.has(appUrl.origin) && !PREVIEW_ORIGINS.has(appUrl.origin)) throw new Error('PUBLIC_APP_URL is not approved');
  appUrl.pathname = '/pricing';
  appUrl.search = new URLSearchParams({ status: 'verifying', ref: reference }).toString();
  return appUrl.toString();
};
const submitOrder = async (order: Record<string, unknown>) => {
  const token = await requestPesapalToken();
  const response = await fetch(`${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(order),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.order_tracking_id || !data?.redirect_url) throw new Error(`Payment provider rejected the order (${response.status})`);
  return data;
};
const statusFromPesapal = async (trackingId: string) => {
  const token = await requestPesapalToken();
  const endpoint = new URL(`${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus`);
  endpoint.searchParams.set('orderTrackingId', trackingId);
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15_000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Payment status lookup failed (${response.status})`);
  return data;
};
const addDuration = (duration: string) => {
  const now = new Date();
  const expiry = new Date(now);
  if (duration === 'DAILY') expiry.setDate(now.getDate() + 1);
  else if (duration === 'WEEKLY') expiry.setDate(now.getDate() + 7);
  else if (duration === 'TERMLY') expiry.setMonth(now.getMonth() + 3);
  else if (duration === 'ANNUAL') expiry.setFullYear(now.getFullYear() + 1);
  else expiry.setMonth(now.getMonth() + 1);
  return expiry;
};

const fulfillClaimedTransaction = async (supabase: ReturnType<typeof serviceClient>, tx: any) => {
  if (tx.type === 'CREDIT_PACK') {
    const credits = Number(String(tx.description || '').match(/CREDITS:(\d+)/)?.[1] || 0);
    const days = Number(String(tx.description || '').match(/DAYS:(\d+)/)?.[1] || 0);
    if (!credits || !days) throw new Error('Credit transaction metadata is invalid');
    const { error } = await supabase.rpc('grant_learning_credits', {
      p_profile_id: tx.user_id,
      p_credits: credits,
      p_expires_at: new Date(Date.now() + days * 86400000).toISOString(),
    });
    if (error) throw error;
    return;
  }
  if (tx.type === 'MARKETPLACE_PURCHASE') {
    const materialId = String(tx.description || '').match(/MATERIAL:([0-9a-f-]{36})/i)?.[1];
    const buyerPhone = String(tx.description || '').match(/PHONE:([^|]+)/)?.[1] || '';
    if (!materialId) throw new Error('Marketplace transaction metadata is invalid');
    const { data: existing } = await supabase.from('creator_orders').select('id').eq('payment_reference', tx.reference_code).maybeSingle();
    if (!existing) {
      const { error } = await supabase.rpc('record_creator_material_sale', {
        p_material_id: materialId,
        p_buyer_id: tx.user_id,
        p_buyer_phone: buyerPhone,
        p_payment_reference: tx.reference_code,
        p_gross_amount_kes: Number(tx.amount),
        p_statutory_adjustments_kes: 0,
      });
      if (error) throw error;
    }
    return;
  }
  if (tx.type !== 'SUBSCRIPTION') throw new Error('Unsupported payment transaction type');
  const duration = String(tx.description || '').match(/PLAN:(DAILY|WEEKLY|MONTHLY|TERMLY|ANNUAL)/)?.[1];
  if (!duration) throw new Error('Subscription transaction metadata is invalid');
  const newExpiry = addDuration(duration);
  const { data: profile, error: profileError } = await supabase.from('profiles').select('subscription_expiry').eq('id', tx.user_id).maybeSingle();
  if (profileError) throw profileError;
  const currentExpiry = profile?.subscription_expiry ? new Date(profile.subscription_expiry) : null;
  if (!currentExpiry || !Number.isFinite(currentExpiry.getTime()) || newExpiry > currentExpiry) {
    const { error } = await supabase.from('profiles').update({ subscription_tier: duration, subscription_expiry: newExpiry.toISOString() }).eq('id', tx.user_id);
    if (error) throw error;
  }
};

const updateTransactionStatus = async (supabase: ReturnType<typeof serviceClient>, trackingId?: string | null, merchantReference?: string | null) => {
  let query = supabase.from('transactions').select('*');
  if (merchantReference) query = query.eq('reference_code', merchantReference);
  else if (trackingId) query = query.eq('order_tracking_id', trackingId);
  else throw new Error('Payment reference is required');
  const { data: transaction, error } = await query.maybeSingle();
  if (error || !transaction) throw new Error('Payment transaction was not found');
  const resolvedTrackingId = trackingId || transaction.order_tracking_id;
  if (!resolvedTrackingId) throw new Error('Payment tracking ID is missing');
  const providerStatus = await statusFromPesapal(resolvedTrackingId);
  const providerReference = String(providerStatus.merchant_reference || '');
  if (!providerReference || providerReference !== transaction.reference_code) throw new Error('Payment provider reference mismatch');
  const providerAmount = Number(providerStatus.amount ?? providerStatus.amount_paid ?? transaction.amount);
  if (!Number.isFinite(providerAmount) || providerAmount !== Number(transaction.amount)) throw new Error('Payment provider amount mismatch');

  const status = String(providerStatus.payment_status_description || '').toLowerCase();
  if (status === 'completed' && String(transaction.status).toUpperCase() !== 'SUCCESS') {
    const { data: claimed, error: claimError } = await supabase.from('transactions')
      .update({ status: 'SUCCESS', order_tracking_id: resolvedTrackingId })
      .eq('id', transaction.id).neq('status', 'SUCCESS').select('*').maybeSingle();
    if (claimError) throw claimError;
    if (claimed) await fulfillClaimedTransaction(supabase, claimed);
  } else if (['failed', 'invalid', 'cancelled', 'canceled'].includes(status)) {
    await supabase.from('transactions').update({ status: 'FAILED', order_tracking_id: resolvedTrackingId }).eq('id', transaction.id).neq('status', 'SUCCESS');
  }
  return {
    payment_status_description: providerStatus.payment_status_description,
    payment_status_code: providerStatus.payment_status_code,
    merchant_reference: providerReference,
    order_tracking_id: resolvedTrackingId,
  };
};

serve(async (req) => {
  const corsHeaders = corsHeadersFor(req);
  if (!isAllowedOrigin(req.headers.get('Origin'))) return json({ error: 'Origin not allowed' }, 403, corsHeaders);
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = serviceClient();
    const path = new URL(req.url).pathname.toLowerCase();
    const user = await getAuthenticatedUser(req, supabase);

    if (path.endsWith('/ipn-handler')) {
      const url = new URL(req.url);
      let trackingId = url.searchParams.get('OrderTrackingId');
      let merchantReference = url.searchParams.get('OrderMerchantReference');
      if (req.method === 'POST') {
        const body = await req.json().catch(() => ({}));
        trackingId ||= body.OrderTrackingId || null;
        merchantReference ||= body.OrderMerchantReference || null;
      }
      const result = await updateTransactionStatus(supabase, trackingId, merchantReference);
      return json({ orderNotificationType: 'IPN', orderTrackingId: result.order_tracking_id, orderMerchantReference: result.merchant_reference, status: 200 }, 200, corsHeaders);
    }
    if (path.endsWith('/test-keys')) {
      if (!isAdminUser(user)) return json({ error: 'Admin access required' }, 403, corsHeaders);
      await requestPesapalToken();
      return json({
        success: true,
        key_present: Boolean(Deno.env.get('PESAPAL_CONSUMER_KEY')),
        secret_present: Boolean(Deno.env.get('PESAPAL_CONSUMER_SECRET')),
        ipn_present: Boolean(Deno.env.get('PESAPAL_IPN_ID')),
        is_sandbox: IS_SANDBOX,
      }, 200, corsHeaders);
    }
    if (path.endsWith('/register-ipn')) {
      if (!isAdminUser(user)) return json({ error: 'Admin access required' }, 403, corsHeaders);
      const token = await requestPesapalToken();
      const supabaseUrl = new URL(Deno.env.get('SUPABASE_URL') || '');
      const response = await fetch(`${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: `${supabaseUrl.origin}/functions/v1/pesapal/ipn-handler`, ipn_notification_type: 'POST' }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Payment provider IPN registration failed (${response.status})`);
      return json(await response.json(), 200, corsHeaders);
    }
    if (path.endsWith('/initiate-order')) {
      const body = await req.json();
      const billing = body.billing_address || {};
      const materialId = cleanText(body.materialId, 36);
      const planId = cleanText(body.planId, 40);
      const targetUserId = user?.id || cleanText(body.userId, 40) || '00000000-0000-0000-0000-000000000000';
      let amount: number;
      let type: 'MARKETPLACE_PURCHASE' | 'CREDIT_PACK' | 'SUBSCRIPTION';
      let description: string;
      let providerDescription: string;
      let prefix: string;
      if (materialId) {
        const { data: material, error } = await supabase.from('creator_materials').select('id, title, price_kes').eq('id', materialId).eq('status', 'PUBLISHED').single();
        if (error || !material) return json({ error: 'Published marketplace material not found' }, 404, corsHeaders);
        amount = Number(material.price_kes);
        type = 'MARKETPLACE_PURCHASE';
        prefix = 'MKT';
        providerDescription = `Soma AI Marketplace: ${cleanText(material.title, 70)}`;
        description = `MATERIAL:${material.id}|PHONE:${cleanText(billing.phone_number, 24)}`;
      } else {
        const plan = PLAN_CATALOG[planId];
        if (!plan) return json({ error: 'Unknown payment plan' }, 400, corsHeaders);
        amount = plan.amount;
        providerDescription = plan.description;
        if (plan.credits) {
          type = 'CREDIT_PACK';
          prefix = 'CREDIT';
          description = `CREDITS:${plan.credits}|DAYS:${plan.creditDays}`;
        } else {
          type = 'SUBSCRIPTION';
          prefix = 'SUB';
          description = `PLAN:${plan.duration}|CATALOG:${planId}`;
        }
      }
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Catalog amount is invalid');
      const reference = `${prefix}_${crypto.randomUUID()}`;
      const { error: insertError } = await supabase.from('transactions').insert({
        user_id: targetUserId,
        teacher_id: targetUserId,
        amount,
        type,
        status: 'PENDING',
        method: 'MPESA',
        reference_code: reference,
        description,
        created_at: new Date().toISOString(),
      });
      if (insertError) throw new Error(`Could not create payment transaction: ${insertError.message}`);
      try {
        const order = await submitOrder({
          id: reference,
          currency: 'KES',
          amount,
          description: providerDescription,
          callback_url: paymentCallbackUrl(reference),
          notification_id: Deno.env.get('PESAPAL_IPN_ID'),
          billing_address: {
            email_address: cleanText(billing.email_address || user?.email || 'learner@soma.app', 160),
            phone_number: cleanText(billing.phone_number, 24),
            first_name: cleanText(billing.first_name || 'Learner', 80),
            last_name: cleanText(billing.last_name || 'User', 80),
            country_code: 'KE',
          },
        });
        await supabase.from('transactions').update({ order_tracking_id: order.order_tracking_id }).eq('reference_code', reference);
        return json({ order_tracking_id: order.order_tracking_id, redirect_url: order.redirect_url, client_reference: reference }, 200, corsHeaders);
      } catch (error) {
        await supabase.from('transactions').update({ status: 'FAILED' }).eq('reference_code', reference);
        throw error;
      }
    }

    if (path.endsWith('/check-status')) {
      const body = await req.json();
      const reference = cleanText(body.merchantReference, 100);
      const trackingId = cleanText(body.OrderTrackingId, 100);
      let ownerQuery = supabase.from('transactions').select('user_id, teacher_id');
      ownerQuery = reference ? ownerQuery.eq('reference_code', reference) : ownerQuery.eq('order_tracking_id', trackingId);
      const { data: owner } = await ownerQuery.maybeSingle();
      if (!owner || (owner.user_id !== user.id && owner.teacher_id !== user.id && !isAdminUser(user))) return json({ error: 'Payment transaction not found' }, 404, corsHeaders);
      return json(await updateTransactionStatus(supabase, trackingId, reference), 200, corsHeaders);
    }
    return json({ error: 'Not found' }, 404, corsHeaders);
  } catch (error) {
    console.error('Pesapal request failed:', error instanceof Error ? error.message : String(error));
    return json({ error: 'Payment request could not be completed' }, 500, corsHeaders);
  }
});
