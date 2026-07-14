import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const MODEL_NAME = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const examId = body.examId;
    const questionId = String(body.questionId ?? '');
    const learnerAnswer = String(body.learnerAnswer ?? '').trim();
    const language = body.language === 'SW' ? 'SW' : 'EN';

    if (!examId || !questionId || !learnerAnswer) {
      return new Response(JSON.stringify({ error: 'Missing examId, questionId, or learnerAnswer' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { data: exam, error: examError } = await supabase
      .from('knowledge_base')
      .select('id, title, subject, grade, exam_type, exam_year, paper_number, structured_questions')
      .eq('id', examId)
      .maybeSingle();

    if (examError) throw examError;
    if (!exam) {
      return new Response(JSON.stringify({ error: 'Exam not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const questions = Array.isArray(exam.structured_questions) ? exam.structured_questions : [];
    const question = questions.find((item: any) => String(item?.id ?? '') === questionId || String(item?.number ?? '') === questionId);

    if (!question) {
      return new Response(JSON.stringify({ error: 'Question not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const marksAvailable = Number(question.marks || 0) || 0;
    const markingGuide = Array.isArray(question.markingScheme) ? question.markingScheme : [];
    const modelAnswer = String(question.modelAnswer || '');
    const topic = String(question.topic || exam.subject || 'General');
    const useSwahili = /kiswahili/i.test(`${exam.subject || ''} ${question.text || ''}`);
    const responseLanguage = useSwahili || language === 'SW' ? 'Swahili' : 'English';

    const prompt = [
      'You are a strict Kenyan national-exam marker.',
      `Exam: ${exam.title}`,
      `Subject: ${exam.subject}`,
      `Grade: ${exam.grade}`,
      `Question number: ${question.number || questionId}`,
      `Question text: ${question.text || ''}`,
      `Topic: ${topic}`,
      `Marks available: ${marksAvailable}`,
      'Private marking guide:',
      markingGuide.length ? markingGuide.map((point: string, index: number) => `${index + 1}. ${point}`).join('\n') : 'No marking guide supplied.',
      modelAnswer ? `Reference model answer: ${modelAnswer}` : '',
      `Candidate answer: ${learnerAnswer}`,
      `Respond entirely in ${responseLanguage}.`,
      'Return JSON with marksAwarded, marksAvailable, isCorrect, modelAnswer, feedback, and examTip.',
      'Keep feedback specific, concise, and exam-focused.'
    ].filter(Boolean).join('\n');

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
          maxOutputTokens: 1024
        }
      })
    });

    const responseText = await geminiResponse.text();
    if (!geminiResponse.ok) {
      throw new Error(`Gemini marking failed: ${geminiResponse.status} ${responseText}`);
    }

    const parsed = JSON.parse(responseText);
    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const result = JSON.parse(text);

    return new Response(JSON.stringify({
      marksAwarded: Number(result.marksAwarded ?? 0),
      marksAvailable: Number(result.marksAvailable ?? marksAvailable),
      isCorrect: Boolean(result.isCorrect),
      modelAnswer: String(result.modelAnswer ?? modelAnswer ?? ''),
      feedback: String(result.feedback ?? ''),
      examTip: String(result.examTip ?? '')
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});