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
    const learnerId = String(body.learnerId ?? '').trim();
    const learnerPin = String(body.learnerPin ?? '');
    const attemptId = String(body.attemptId ?? '').trim();

    if (!examId || !questionId || !learnerAnswer || !attemptId) {
      return new Response(
        JSON.stringify({ error: 'Missing exam, attempt, question, or learner answer' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }
    if (!learnerId) {
      return new Response(JSON.stringify({ error: 'A verified learner session is required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let learnerVerified = false;
    const authToken = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();

    if (authToken) {
      const { data: authData } = await supabase.auth.getUser(authToken);
      if (authData.user) {
        const { data: authProfile } = await supabase
          .from('profiles')
          .select('id, student_id')
          .eq('id', authData.user.id)
          .maybeSingle();
        learnerVerified = Boolean(
          authProfile &&
          (String(authProfile.id) === learnerId ||
            String(authProfile.student_id || '') === learnerId)
        );
      }
    }

    if (!learnerVerified && learnerPin) {
      const { data: pinProfile } = await supabase
        .from('profiles')
        .select('student_id, recovery_pin')
        .eq('student_id', learnerId)
        .maybeSingle();
      learnerVerified = Boolean(
        pinProfile?.recovery_pin && String(pinProfile.recovery_pin) === learnerPin
      );
    }

    if (!learnerVerified) {
      return new Response(JSON.stringify({ error: 'Learner verification failed' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { data: attempt } = await supabase
      .from('exam_attempts')
      .select('id, status')
      .eq('id', attemptId)
      .eq('exam_id', examId)
      .eq('learner_id', learnerId)
      .maybeSingle();

    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return new Response(
        JSON.stringify({ error: 'This exam attempt is not available for marking' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
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
    const question = questions.find(
      (item: any) =>
        String(item?.id ?? '') === questionId || String(item?.number ?? '') === questionId
    );

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
      markingGuide.length
        ? markingGuide.map((point: string, index: number) => `${index + 1}. ${point}`).join('\n')
        : 'No marking guide supplied.',
      modelAnswer ? `Reference model answer: ${modelAnswer}` : '',
      `Candidate answer: ${learnerAnswer}`,
      `Respond entirely in ${responseLanguage}.`,
      'Return JSON with marksAwarded, marksAvailable, isCorrect, modelAnswer, feedback, and examTip.',
      'Keep feedback specific, concise, and exam-focused.',
    ]
      .filter(Boolean)
      .join('\n');

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    const responseText = await geminiResponse.text();
    if (!geminiResponse.ok) {
      throw new Error(`Gemini marking failed: ${geminiResponse.status} ${responseText}`);
    }

    const parsed = JSON.parse(responseText);
    const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const result = JSON.parse(text);
    const marksAwarded = Math.min(
      marksAvailable,
      Math.max(0, Number(result.marksAwarded ?? 0) || 0)
    );
    const safeResult = {
      marksAwarded,
      marksAvailable,
      isCorrect: Boolean(result.isCorrect),
      modelAnswer: String(result.modelAnswer ?? modelAnswer ?? ''),
      feedback: String(result.feedback ?? ''),
      examTip: String(result.examTip ?? ''),
    };

    const { error: saveError } = await supabase.from('exam_responses').upsert(
      {
        attempt_id: attemptId,
        question_id: questionId,
        answer_text: learnerAnswer,
        marks_awarded: marksAwarded,
        marks_available: marksAvailable,
        marking_breakdown: safeResult,
        marking_status: 'MARKED',
        marked_by: 'HYBRID_AI',
      },
      { onConflict: 'attempt_id,question_id' }
    );
    if (saveError) throw saveError;

    return new Response(JSON.stringify(safeResult), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
