import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildPurchaseReport } from '../_shared/purchaseReportModel.ts';

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const client = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    if (!token) return json({ error: 'Sign in as an administrator' }, 401);
    const { data: auth, error } = await client.auth.getUser(token);
    const admins = String(Deno.env.get('ADMIN_EMAILS') || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    if (error || !auth.user?.email || !admins.includes(auth.user.email.toLowerCase()))
      return json({ error: 'Admin authorization required' }, 403);
    const { days = 30 } = await req.json();
    if (![0, 7, 30, 90, 365].includes(days))
      return json({ error: 'Choose a valid reporting period' }, 400);
    const until = new Date().toISOString();
    const since = days === 0 ? new Date(0).toISOString() : new Date(Date.now() - days * 86400000).toISOString();
    // Read every page: Supabase's default row limit must not silently lower revenue totals.
    const read = async (table: string, columns: string) => {
      const rows: Record<string, any>[] = [];
      for (let offset = 0; offset <= 10000; offset += 500) {
        const result = await client
          .from(table)
          .select(columns)
          .gte('created_at', since)
          .lt('created_at', until)
          .order('created_at', { ascending: false })
          .order('id')
          .range(offset, offset + 499);
        if (result.error) throw new Error(`Could not load ${table}`);
        rows.push(...(result.data || []));
        if (rows.length > 10000)
          throw new Error('Choose a shorter reporting period (more than 10,000 orders)');
        if ((result.data || []).length < 500) return rows;
      }
      return rows;
    };
    const [transactions, orders] = await Promise.all([
      read('transactions', 'id,user_id,reference_code,type,description,amount,status,created_at'),
      read(
        'exam_paper_orders',
        'id,exam_id,buyer_name,buyer_phone,buyer_email,amount,status,reference_code,created_at'
      ),
    ]);
    const lookup = async (table: string, columns: string, ids: string[], key = 'id') => {
      const rows: Record<string, any>[] = [];
      for (let i = 0; i < ids.length; i += 100) {
        const result = await client
          .from(table)
          .select(columns)
          .in(key, ids.slice(i, i + 100));
        if (result.error) throw new Error(`Could not load purchase details from ${table}`);
        rows.push(...(result.data || []));
      }
      return rows;
    };
    const [profiles, papers, contacts] = await Promise.all([
      lookup(
        'profiles',
        'id,full_name,student_id,phone,email,subscription_status,subscription_tier,subscription_expiry',
        [
          ...new Set(
            transactions
              .map((t) => t.user_id)
              .filter((id) =>
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id))
              )
          ),
        ]
      ),
      lookup('knowledge_base', 'id,title', [...new Set(orders.map((o) => String(o.exam_id)))]),
      lookup(
        'payment_receipt_contacts',
        'reference_code,payer_phone,payer_email',
        [...new Set(transactions.map((t) => t.reference_code).filter(Boolean))],
        'reference_code'
      ),
    ]);
    return json({
      purchases: buildPurchaseReport(transactions, orders, profiles, papers, contacts),
      since,
      until,
    });
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : 'Purchase report unavailable' },
      500
    );
  }
});
