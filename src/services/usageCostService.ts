import { supabase } from '../lib/supabase';

const KES_PER_USD = 130;

const MODEL_PRICING_USD_PER_1M: Record<string, { input: number; output: number }> = {
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-2.5-flash': { input: 0.30, output: 2.50 },
  default: { input: 0.30, output: 2.50 },
};

type UsageProvider = 'gemini' | 'elevenlabs' | 'ocr' | 'pdf' | 'other';

interface TrackUsageCostInput {
  provider: UsageProvider;
  model: string;
  feature?: string;
  inputTokens?: number;
  outputTokens?: number;
  estimatedCostKes?: number;
  metadata?: Record<string, unknown>;
}

const roughlyCountTokens = (value: unknown) => {
  try {
    const text = typeof value === 'string' ? value : JSON.stringify(value);
    return Math.max(1, Math.ceil((text || '').length / 4));
  } catch {
    return 1;
  }
};

const pickPricing = (model: string) => {
  const normalized = model.toLowerCase();
  const key = Object.keys(MODEL_PRICING_USD_PER_1M).find(k => normalized.includes(k));
  return key ? MODEL_PRICING_USD_PER_1M[key] : MODEL_PRICING_USD_PER_1M.default;
};

export const estimateGeminiCostKes = (model: string, inputTokens = 0, outputTokens = 0) => {
  const pricing = pickPricing(model);
  const usd = ((inputTokens / 1_000_000) * pricing.input) + ((outputTokens / 1_000_000) * pricing.output);
  return Number((usd * KES_PER_USD).toFixed(4));
};

export const estimateElevenLabsCostKes = (characters = 0) => {
  const usdPerThousandCharacters = 0.30;
  const usd = (characters / 1000) * usdPerThousandCharacters;
  return Number((usd * KES_PER_USD).toFixed(4));
};

export const inferAiFeature = (contents: unknown, systemInstruction: unknown) => {
  const haystack = `${JSON.stringify(systemInstruction || {})} ${JSON.stringify(contents || {})}`.toLowerCase().replace(/\s+/g, ' ');
  if (haystack.includes('mark the candidate') || haystack.includes('knec chief examiner')) return 'exam_marking';
  if (haystack.includes('exam guru')) return 'exam_guru';
  if (haystack.includes('practice questions') || haystack.includes('generate 3 questions') || haystack.includes('5-question drill')) return 'practice_generation';
  const explicitQuizRequest = /(generate|create|make|build)\s+(a\s+)?quiz/.test(haystack) || /quiz\s+(questions|generator)/.test(haystack) || haystack.includes('multiple choice questions') || haystack.includes('mcq quiz');
  if (explicitQuizRequest) return 'quiz_generation';
  if (haystack.includes('study notes') || haystack.includes('detailed study notes')) return 'notes_generation';
  if (haystack.includes('talk') || haystack.includes('audio') || haystack.includes('transcribe the audio')) return 'audio_learning';
  if (haystack.includes('teacher') || haystack.includes('lesson plan') || haystack.includes('scheme of work')) return 'teacher_ai';
  return 'ai_generation';
};

export const buildGeminiUsagePayload = (
  model: string,
  contents: unknown,
  systemInstruction: unknown,
  rawResponse: any,
  feature?: string
): TrackUsageCostInput => {
  const usage = rawResponse?.usageMetadata || {};
  const inputTokens = Number(usage.promptTokenCount || usage.inputTokenCount || roughlyCountTokens({ contents, systemInstruction }));
  const outputText = rawResponse?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || '').join('\n') || '';
  const outputTokens = Number(usage.candidatesTokenCount || usage.outputTokenCount || roughlyCountTokens(outputText));
  return {
    provider: 'gemini',
    model,
    feature: feature || inferAiFeature(contents, systemInstruction),
    inputTokens,
    outputTokens,
    estimatedCostKes: estimateGeminiCostKes(model, inputTokens, outputTokens),
    metadata: {
      local_estimate: !rawResponse?.usageMetadata,
      total_tokens: usage.totalTokenCount || inputTokens + outputTokens,
    },
  };
};

export const trackUsageCost = async (event: TrackUsageCostInput) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const activeStudentCode = localStorage.getItem('soma_active_student') || localStorage.getItem('soma_pending_student_code') || null;
    const plan = localStorage.getItem('soma_subscription_plan') || localStorage.getItem('soma_active_plan') || null;

    const payload = {
      user_id: session?.user?.id || null,
      student_code: activeStudentCode,
      plan,
      provider: event.provider,
      model: event.model,
      feature: event.feature || 'unknown',
      input_tokens: event.inputTokens || 0,
      output_tokens: event.outputTokens || 0,
      estimated_cost_kes: event.estimatedCostKes || 0,
      metadata: event.metadata || {},
    };

    const { error } = await supabase.from('usage_cost_events').insert(payload);
    if (error && import.meta.env.DEV) console.warn('Usage cost tracking skipped:', error.message);
  } catch (error) {
    if (import.meta.env.DEV) console.warn('Usage cost tracking failed:', error);
  }
};
