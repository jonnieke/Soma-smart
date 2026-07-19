import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const cleanText = (value: unknown, fallback = '') => String(value ?? fallback).trim();
const cleanArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value.map((item) => String(item || '').trim().toUpperCase()).filter(Boolean);
  return cleaned.length ? Array.from(new Set(cleaned)) : fallback;
};

type DeliveryJob = {
  id: string;
  channel: string;
  recipient: string;
  title: string;
  body: string;
  action_url: string | null;
  attempts: number | null;
};

const providerMissing = (provider: string) => ({
  sent: false,
  pending: true,
  provider,
  providerMessageId: null,
  error: null,
});

const sendResendEmail = async (job: DeliveryJob) => {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('NOTIFICATION_EMAIL_FROM') || 'SomaAI <noreply@somaai.co.ke>';
  if (!apiKey || !job.recipient) return providerMissing('resend');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [job.recipient],
      subject: job.title || 'New SomaAI learning update',
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#172033">
          <h2>${job.title || 'New SomaAI learning update'}</h2>
          <p>${job.body || ''}</p>
          ${job.action_url ? `<p><a href="${job.action_url}">Open in SomaAI</a></p>` : ''}
        </div>
      `,
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.message || 'Email provider failed');
  return { sent: true, pending: false, provider: 'resend', providerMessageId: result?.id || null, error: null };
};

const sendAfricasTalkingSms = async (job: DeliveryJob) => {
  const username = Deno.env.get('AFRICASTALKING_USERNAME');
  const apiKey = Deno.env.get('AFRICASTALKING_API_KEY');
  const from = Deno.env.get('AFRICASTALKING_SENDER_ID') || undefined;
  if (!username || !apiKey || !job.recipient) return providerMissing('africastalking');

  const message = `${job.title || 'SomaAI update'}\n${job.body || ''}${
    job.action_url ? `\n${job.action_url}` : ''
  }`;
  const form = new URLSearchParams();
  form.set('username', username);
  form.set('to', job.recipient);
  form.set('message', message.slice(0, 640));
  if (from) form.set('from', from);

  const response = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      apiKey,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: form,
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.SMSMessageData?.Message || "Africa's Talking SMS failed");
  return {
    sent: true,
    pending: false,
    provider: 'africastalking',
    providerMessageId: result?.SMSMessageData?.Recipients?.[0]?.messageId || null,
    error: null,
  };
};

const sendWhatsAppCloud = async (job: DeliveryJob) => {
  const token = Deno.env.get('WHATSAPP_CLOUD_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  if (!token || !phoneNumberId || !job.recipient) return providerMissing('whatsapp_cloud');

  const text = `${job.title || 'SomaAI update'}\n${job.body || ''}${
    job.action_url ? `\n${job.action_url}` : ''
  }`;

  const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: job.recipient,
      type: 'text',
      text: { preview_url: true, body: text.slice(0, 1000) },
    }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result?.error?.message || 'WhatsApp provider failed');
  return {
    sent: true,
    pending: false,
    provider: 'whatsapp_cloud',
    providerMessageId: result?.messages?.[0]?.id || null,
    error: null,
  };
};

const dispatchDeliveryJobs = async (supabase: any, eventId: string) => {
  const { data: jobs, error } = await supabase
    .from('notification_delivery_jobs')
    .select('id, channel, recipient, title, body, action_url, attempts')
    .eq('event_id', eventId)
    .eq('status', 'PENDING')
    .limit(50);

  if (error) throw error;

  const summary = { sent: 0, pending: 0, failed: 0 };
  for (const job of (jobs || []) as DeliveryJob[]) {
    try {
      const result = job.channel === 'EMAIL'
        ? await sendResendEmail(job)
        : job.channel === 'SMS'
          ? await sendAfricasTalkingSms(job)
          : job.channel === 'WHATSAPP'
            ? await sendWhatsAppCloud(job)
            : { sent: false, pending: false, provider: 'in_app', providerMessageId: null, error: null };

      if (result.pending) {
        summary.pending += 1;
        continue;
      }

      if (result.sent) {
        summary.sent += 1;
        await supabase
          .from('notification_delivery_jobs')
          .update({
            status: 'SENT',
            provider: result.provider,
            provider_message_id: result.providerMessageId,
            attempts: (job.attempts || 0) + 1,
            sent_at: new Date().toISOString(),
            error: null,
          })
          .eq('id', job.id);
      }
    } catch (error) {
      summary.failed += 1;
      await supabase
        .from('notification_delivery_jobs')
        .update({
          status: 'FAILED',
          attempts: (job.attempts || 0) + 1,
          error: error instanceof Error ? error.message : 'Delivery failed',
        })
        .eq('id', job.id);
    }
  }

  return summary;
};


serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') || '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
  );

  try {
    const payload = await req.json();
    const itemType = cleanText(payload.itemType || payload.item_type, 'UPDATE').toUpperCase();
    const title = cleanText(payload.title);
    const body = cleanText(payload.body || payload.message);
    const sourceTable = cleanText(payload.sourceTable || payload.source_table, 'app');
    const sourceId = cleanText(payload.sourceId || payload.source_id || crypto.randomUUID());
    const actionUrl = cleanText(payload.actionUrl || payload.action_url, '');
    const grade = cleanText(payload.grade, '');
    const subject = cleanText(payload.subject, '');
    const targetClassId = cleanText(payload.targetClassId || payload.target_class_id, '');
    const createdBy = cleanText(payload.createdBy || payload.created_by, '');
    const channels = cleanArray(payload.channels, ['IN_APP']);
    const targetRoles = cleanArray(payload.targetRoles || payload.target_roles, ['LEARNER', 'TEACHER']);

    if (!title || !body) return json({ error: 'Notification title and body are required.' }, 400);
    if (!sourceTable || !sourceId) return json({ error: 'Notification source is required.' }, 400);

    const { data, error } = await supabase.rpc('create_content_notification', {
      p_source_table: sourceTable,
      p_source_id: sourceId,
      p_item_type: itemType,
      p_title: title,
      p_body: body,
      p_grade: grade || null,
      p_subject: subject || null,
      p_action_url: actionUrl || null,
      p_target_roles: targetRoles,
      p_channels: channels,
      p_target_class_id: targetClassId || null,
      p_created_by: createdBy || null,
    });

    if (error) throw error;

    const notification = Array.isArray(data) ? data[0] : data;
    const delivery = notification?.event_id
      ? await dispatchDeliveryJobs(supabase, notification.event_id)
      : { sent: 0, pending: 0, failed: 0 };

    return json({ ok: true, notification, delivery });
  } catch (error) {
    console.error('notify-users failed:', error);
    return json({ error: error instanceof Error ? error.message : 'Unexpected notification error' }, 500);
  }
});
