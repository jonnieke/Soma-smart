import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const isSandbox = Deno.env.get('PESAPAL_IS_SANDBOX') === 'true';
const pesapalBase = isSandbox
  ? 'https://cybqa.pesapal.com/pesapalv3'
  : 'https://pay.pesapal.com/v3';
const paperPrice = 20;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const cleanPhone = (value: unknown) => {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  );
  const path = new URL(req.url).pathname.toLowerCase();

  const getToken = async () => {
    const response = await fetch(`${pesapalBase}/api/Auth/RequestToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        consumer_key: Deno.env.get('PESAPAL_CONSUMER_KEY'),
        consumer_secret: Deno.env.get('PESAPAL_CONSUMER_SECRET'),
      }),
    });
    if (!response.ok) throw new Error('Payment authentication failed');
    return (await response.json()).token as string;
  };

  const verifyOrder = async (order: Record<string, any>) => {
    if (order.status === 'SUCCESS') return true;
    if (!order.order_tracking_id) return false;
    const token = await getToken();
    const response = await fetch(
      `${pesapalBase}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(order.order_tracking_id)}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) return false;
    const status = await response.json();
    const completed = String(status.payment_status_description || '').toLowerCase() === 'completed';
    if (completed) {
      await supabase.from('exam_paper_orders').update({
        status: 'SUCCESS',
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }).eq('id', order.id);
    }
    return completed;
  };

  try {
    if (path.endsWith('/initiate')) {
      const { examId, buyerToken, buyer } = await req.json();
      const name = String(buyer?.name || '').trim();
      const phone = cleanPhone(buyer?.phone);
      const email = String(buyer?.email || '').trim();
      if (!examId || !/^[0-9a-f-]{36}$/i.test(String(buyerToken || '')) || !name || phone.length < 12) {
        return json({ error: 'Valid paper, name and Kenyan phone number are required.' }, 400);
      }

      const { data: exam, error: examError } = await supabase
        .from('knowledge_base')
        .select('id, title, type, review_status, file_url, file_path')
        .eq('id', examId)
        .eq('type', 'PAST_PAPER')
        .eq('review_status', 'PUBLISHED')
        .maybeSingle();
      if (examError || !exam || (!exam.file_url && !exam.file_path)) return json({ error: 'Paper is not available for sale.' }, 404);

      const { data: existing } = await supabase
        .from('exam_paper_orders')
        .select('*')
        .eq('exam_id', examId)
        .eq('buyer_token', buyerToken)
        .eq('status', 'SUCCESS')
        .maybeSingle();
      if (existing) return json({ already_paid: true, reference: existing.reference_code });

      const reference = `PAPER_${examId}_${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`;
      const { data: order, error: orderError } = await supabase.from('exam_paper_orders').insert({
        exam_id: examId,
        buyer_token: buyerToken,
        buyer_name: name,
        buyer_phone: phone,
        buyer_email: email || null,
        amount: paperPrice,
        reference_code: reference,
      }).select('id').single();
      if (orderError) throw orderError;

      const token = await getToken();
      const origin = String(req.headers.get('origin') || 'https://www.somaai.co.ke').replace(/\/$/, '');
      const callback = `${origin}/exam-papers?status=verifying&paper=${encodeURIComponent(examId)}&ref=${encodeURIComponent(reference)}`;
      const response = await fetch(`${pesapalBase}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: reference,
          currency: 'KES',
          amount: paperPrice,
          description: `SomaAI Exam Paper: ${String(exam.title).slice(0, 70)}`,
          callback_url: callback,
          notification_id: Deno.env.get('PESAPAL_IPN_ID'),
          billing_address: {
            email_address: email || 'papers@somaai.co.ke',
            phone_number: phone,
            first_name: name.split(/\s+/)[0] || 'SomaAI',
            last_name: name.split(/\s+/).slice(1).join(' ') || 'Buyer',
            country_code: 'KE',
          },
        }),
      });
      const payment = await response.json();
      if (!response.ok || !payment.order_tracking_id) {
        await supabase.from('exam_paper_orders').update({ status: 'FAILED' }).eq('id', order.id);
        return json({ error: 'Could not create checkout.' }, 400);
      }
      await supabase.from('exam_paper_orders').update({
        order_tracking_id: payment.order_tracking_id,
        updated_at: new Date().toISOString(),
      }).eq('id', order.id);
      return json({ ...payment, reference });
    }

    if (path.endsWith('/access')) {
      const { examId, buyerToken, reference } = await req.json();
      if (!examId || !/^[0-9a-f-]{36}$/i.test(String(buyerToken || ''))) return json({ paid: false }, 400);

      let query = supabase.from('exam_paper_orders').select('*')
        .eq('exam_id', examId).eq('buyer_token', buyerToken).order('created_at', { ascending: false }).limit(1);
      if (reference) query = query.eq('reference_code', reference);
      const { data: orders } = await query;
      const order = orders?.[0];
      if (!order || !(await verifyOrder(order))) return json({ paid: false, examId });

      const { data: exam } = await supabase.from('knowledge_base')
        .select('id, title, file_url, file_path, marking_scheme_url, marking_scheme_path')
        .eq('id', examId).eq('review_status', 'PUBLISHED').maybeSingle();
      if (!exam) return json({ paid: false, examId }, 404);

      const resolveDocument = (url: string | null, filePath: string | null) => {
        if (url) return url;
        if (!filePath) return null;
        if (/^https?:\/\//i.test(filePath)) return filePath;
        return `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/syllabus-docs/${filePath.split('/').map(encodeURIComponent).join('/')}`;
      };
      return json({
        paid: true,
        examId: exam.id,
        title: exam.title,
        paperUrl: resolveDocument(exam.file_url, exam.file_path),
        markingSchemeUrl: resolveDocument(exam.marking_scheme_url, exam.marking_scheme_path),
      });
    }

    return json({ error: 'Not found' }, 404);
  } catch (error) {
    console.error('Exam paper bank error:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected server error' }, 500);
  }
});
