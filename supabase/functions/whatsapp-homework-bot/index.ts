import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const normalizePhone = (phone?: string | null) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
};

const compactText = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const generateSomaAiSolution = async (question: string, geminiKey?: string) => {
  const apiKey = geminiKey || Deno.env.get('GEMINI_API_KEY');
  if (!apiKey) {
    return 'Karibu Soma AI! Please visit https://somaai.co.ke to access instant CBC & KCSE homework solutions.';
  }

  const prompt = `You are Akili, the friendly AI study companion for Kenyan CBC, KPSEA, and KCSE learners.
Provide a clear, learner-friendly direct answer in short bullet points for the following homework question.
Rules:
1. Lead with the direct point-form answer first.
2. Include short, clear Key Points.
3. Include 1 practical real-world example from Kenya.
4. Include 1 KNEC Exam Tip.
5. End with a 1-sentence quick check question to test understanding.
6. Do NOT use markdown bold (**) or headers (#). Use plain text and bullet hyphens (-).

Question: ${question}`;

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 600, temperature: 0.2 },
        }),
      }
    );

    const data = await resp.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No response from Gemini');

    return compactText(
      text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^[*-]\s/gm, '• ')
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\*/g, '')
    );
  } catch (err) {
    console.error('Gemini call failed in WhatsApp bot:', err);
    return `Soma AI Solution for: "${question}"\n\n• Point 1: Review core definitions in your textbook\n• Point 2: Write step-by-step working clearly\n\nRevise interactively: https://somaai.co.ke/learner`;
  }
};

const sendWhatsAppMessage = async (toPhone: string, text: string) => {
  const token = Deno.env.get('WHATSAPP_API_TOKEN');
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');

  if (!token || !phoneNumberId || !toPhone) {
    console.log(`[DRY-RUN WHATSAPP SEND] To: ${toPhone} | Text: ${text.slice(0, 100)}...`);
    return { success: true, dryRun: true };
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone,
        type: 'text',
        text: { preview_url: true, body: text },
      }),
    }
  );

  return { success: response.ok, status: response.status };
};

serve(async (req: Request) => {
  // Handle CORS Preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);

  // Meta Webhook Verification Handshake (GET)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');
    const expectedToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN') || 'soma_ai_whatsapp_token_2026';

    if (mode === 'subscribe' && token === expectedToken) {
      return new Response(challenge || '', { status: 200 });
    }
    return new Response('Verification token mismatch', { status: 403 });
  }

  // Handle Inbound Webhook Payload (POST)
  try {
    const body = await req.json();
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const message = change?.messages?.[0];
    const fromRaw = message?.from || body?.from;
    const from = normalizePhone(fromRaw);

    let incomingText = message?.text?.body || message?.caption || body?.text || body?.message || '';

    if (!from || !incomingText.trim()) {
      return json({ received: true, ignored: 'No phone or text provided' });
    }

    incomingText = incomingText.trim();

    // Generate Curriculum Solution
    const solution = await generateSomaAiSolution(incomingText);
    const replyMessage = [
      '🤖 *Soma AI Homework Bot*',
      `*Q:* ${incomingText.slice(0, 100)}${incomingText.length > 100 ? '...' : ''}`,
      '',
      solution,
      '',
      '📚 Save, listen and test yourself on Soma AI: https://somaai.co.ke/learner',
    ].join('\n');

    // Send WhatsApp Reply
    await sendWhatsAppMessage(from, replyMessage);

    // Persist to Supabase if credentials available
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase.from('study_notes').insert([
        {
          owner_id: from,
          student_code: null,
          title: incomingText.slice(0, 80),
          content: solution,
          subject: 'General',
          grade: 'CBC/KCSE',
          topic: incomingText.slice(0, 80),
          source: 'ai_answer',
          mastery_status: 'new',
        },
      ]).catch((err) => console.warn('Supabase study note save note:', err));
    }

    return json({ success: true, to: from, answerLength: solution.length });
  } catch (err: any) {
    console.error('Error handling WhatsApp webhook:', err);
    return json({ error: err?.message || 'Internal server error' }, 500);
  }
});
