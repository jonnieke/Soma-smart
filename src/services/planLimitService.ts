import { SubscriptionTier } from '../types';

type BillableFeature =
  | 'ai_generation'
  | 'exam_guru'
  | 'exam_marking'
  | 'quiz_generation'
  | 'practice_generation'
  | 'notes_generation'
  | 'grounded_library_help'
  | 'deep_document_analysis'
  | 'teacher_ai'
  | 'listen_and_learn'
  | 'listen_and_learn_voice'
  | 'listen_and_learn_podcast'
  | 'conversational_voice';

type PlanLimitMap = Record<string, Partial<Record<BillableFeature, number>>>;

const DAILY_KEY = () => new Date().toISOString().slice(0, 10);

// UX mirror of the Edge Function limits. The backend remains authoritative.
// Keep these values aligned with supabase/functions/gemini-proxy/index.ts.
export const PLAN_LIMITS: PlanLimitMap = {
  FREE: {
    ai_generation: 10,
    exam_guru: 3,
    exam_marking: 1,
    quiz_generation: 3,
    practice_generation: 3,
    notes_generation: 3,
    grounded_library_help: 1,
    deep_document_analysis: 0,
    teacher_ai: 3,
    listen_and_learn: 3,
    listen_and_learn_voice: 30000,
    listen_and_learn_podcast: 8000,
    conversational_voice: 12000,
  },
  DAILY: {
    ai_generation: 30,
    exam_guru: 15,
    exam_marking: 6,
    quiz_generation: 10,
    practice_generation: 12,
    notes_generation: 10,
    grounded_library_help: 12,
    deep_document_analysis: 3,
    teacher_ai: 10,
    listen_and_learn: 10,
    listen_and_learn_voice: 80000,
    listen_and_learn_podcast: 30000,
    conversational_voice: 30000,
  },
  WEEKLY: {
    ai_generation: 120,
    exam_guru: 80,
    exam_marking: 35,
    quiz_generation: 60,
    practice_generation: 80,
    notes_generation: 60,
    grounded_library_help: 70,
    deep_document_analysis: 18,
    teacher_ai: 60,
    listen_and_learn: 50,
    listen_and_learn_voice: 350000,
    listen_and_learn_podcast: 140000,
    conversational_voice: 140000,
  },
  MONTHLY: {
    ai_generation: 450,
    exam_guru: 300,
    exam_marking: 150,
    quiz_generation: 250,
    practice_generation: 300,
    notes_generation: 220,
    grounded_library_help: 300,
    deep_document_analysis: 80,
    teacher_ai: 220,
    listen_and_learn: 150,
    listen_and_learn_voice: 1200000,
    listen_and_learn_podcast: 500000,
    conversational_voice: 500000,
  },
  TERMLY: {
    ai_generation: 1200,
    exam_guru: 800,
    exam_marking: 420,
    quiz_generation: 700,
    practice_generation: 850,
    notes_generation: 650,
    grounded_library_help: 850,
    deep_document_analysis: 240,
    teacher_ai: 650,
    listen_and_learn: 500,
    listen_and_learn_voice: 3500000,
    listen_and_learn_podcast: 1500000,
    conversational_voice: 1500000,
  },
  ANNUAL: {
    ai_generation: 4000,
    exam_guru: 2500,
    exam_marking: 1500,
    quiz_generation: 2200,
    practice_generation: 2800,
    notes_generation: 2000,
    grounded_library_help: 3000,
    deep_document_analysis: 900,
    teacher_ai: 2000,
    listen_and_learn: 1800,
    listen_and_learn_voice: 15000000,
    listen_and_learn_podcast: 6500000,
    conversational_voice: 6500000,
  },
  PRO: {
    ai_generation: 450,
    exam_guru: 300,
    exam_marking: 150,
    quiz_generation: 250,
    practice_generation: 300,
    notes_generation: 220,
    grounded_library_help: 300,
    deep_document_analysis: 80,
    teacher_ai: 220,
    listen_and_learn: 150,
    listen_and_learn_voice: 1200000,
    listen_and_learn_podcast: 500000,
    conversational_voice: 500000,
  },
};

const FEATURE_LABELS: Record<string, string> = {
  ai_generation: 'AI help',
  exam_guru: 'Exam Guru',
  exam_marking: 'Smart marking',
  quiz_generation: 'quiz generation',
  practice_generation: 'practice drills',
  notes_generation: 'notes generation',
  grounded_library_help: 'grounded library help',
  deep_document_analysis: 'deep document analysis',
  teacher_ai: 'teacher AI tools',
  listen_and_learn: 'Listen & Learn',
  listen_and_learn_voice: 'Listen & Learn voice',
  listen_and_learn_podcast: 'audio podcast lessons',
  conversational_voice: 'voice tutor',
};

export class PlanLimitError extends Error {
  feature: string;
  plan: string;
  limit: number;

  constructor(feature: string, plan: string, limit: number) {
    const label = FEATURE_LABELS[feature] || feature.replace(/_/g, ' ');
    super(`${label} limit reached for your ${plan === 'FREE' ? 'free trial' : `${plan.toLowerCase()} plan`}. Buy learning credits, upgrade your plan, or wait for the daily reset to continue.`);
    this.name = 'PlanLimitError';
    this.feature = feature;
    this.plan = plan;
    this.limit = limit;
  }
}

const getStoredPlan = (): SubscriptionTier => {
  const plan = (localStorage.getItem('soma_subscription_plan') || localStorage.getItem('soma_active_plan') || 'FREE') as SubscriptionTier;
  const expiry = localStorage.getItem('soma_subscription_expiry');
  if (plan !== 'FREE' && expiry && new Date(expiry) <= new Date()) return 'FREE';
  return plan || 'FREE';
};

const normalizeFeature = (feature: string): BillableFeature => {
  if (feature === 'audio_learning') return 'listen_and_learn';
  return (feature in FEATURE_LABELS ? feature : 'ai_generation') as BillableFeature;
};

const usageKey = (plan: string, feature: string) => `soma_plan_usage_${DAILY_KEY()}_${plan}_${feature}`;
const CREDIT_KEY = 'soma_learning_credits';
const CREDIT_EXPIRY_KEY = 'soma_learning_credits_expires_at';
const CREDIT_EVENT = 'soma-learning-credits-changed';
export const MAX_LEARNING_CREDITS = 9999;

const notifyCreditChange = (credits: number) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CREDIT_EVENT, { detail: { credits } }));
};

export const sanitizeLearningCredits = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return Math.min(MAX_LEARNING_CREDITS, Math.floor(parsed));
};

const creditUnitsForFeature = (feature: string, units: number) => {
  if (feature === 'deep_document_analysis') return Math.max(2, units * 2);
  if (feature === 'grounded_library_help') return Math.max(1, units);
  return feature.includes('voice') || feature.includes('podcast')
    ? Math.max(1, Math.ceil(units / 1000))
    : Math.max(1, units);
};


const normalizeCreditExpiry = (value?: string | Date | null) => {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

const clearLearningCreditStorage = () => {
  try {
    localStorage.removeItem(CREDIT_KEY);
    localStorage.removeItem(CREDIT_EXPIRY_KEY);
  } catch {
    // Ignore storage failures.
  }
};

export const getLearningCreditsExpiry = () => {
  const raw = localStorage.getItem(CREDIT_EXPIRY_KEY);
  if (!raw) return null;
  const expiry = new Date(raw);
  if (!Number.isFinite(expiry.getTime())) {
    clearLearningCreditStorage();
    return null;
  }
  if (expiry.getTime() <= Date.now()) {
    clearLearningCreditStorage();
    notifyCreditChange(0);
    return null;
  }
  return expiry.toISOString();
};

export const getCreditPackExpiry = (duration?: string | null) => {
  const plan = String(duration || '').toUpperCase();
  const now = new Date();
  const expiry = new Date(now);
  switch (plan) {
    case 'DAILY':
      expiry.setDate(now.getDate() + 1);
      break;
    case 'WEEKLY':
      expiry.setDate(now.getDate() + 7);
      break;
    case 'MONTHLY':
      expiry.setDate(now.getDate() + 30);
      break;
    case 'TERMLY':
      expiry.setDate(now.getDate() + 90);
      break;
    case 'ANNUAL':
      expiry.setFullYear(now.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return expiry.toISOString();
};

export const getLearningCredits = () => {
  const expiry = getLearningCreditsExpiry();
  if (!expiry && localStorage.getItem(CREDIT_EXPIRY_KEY)) {
    return 0;
  }

  const raw = localStorage.getItem(CREDIT_KEY);
  const sanitized = sanitizeLearningCredits(raw);

  if (raw !== null && String(sanitized) !== raw) {
    try {
      localStorage.setItem(CREDIT_KEY, String(sanitized));
      notifyCreditChange(sanitized);
    } catch {
      // Ignore storage write failures.
    }
  }

  return sanitized;
};

export const grantLearningCredits = (credits: number, expiresAt?: string | Date | null) => {
  const next = sanitizeLearningCredits(getLearningCredits() + sanitizeLearningCredits(credits));
  const expiry = normalizeCreditExpiry(expiresAt);
  localStorage.setItem(CREDIT_KEY, String(next));
  if (expiry) {
    localStorage.setItem(CREDIT_EXPIRY_KEY, expiry);
  }
  notifyCreditChange(next);
  return next;
};

export const formatLearningCredits = (credits: number) => {
  const safe = sanitizeLearningCredits(credits);
  if (safe >= MAX_LEARNING_CREDITS) return '9,999+';
  return safe.toLocaleString('en-US');
};

export const spendLearningCredits = (credits: number) => {
  const current = getLearningCredits();
  const spend = sanitizeLearningCredits(credits);
  if (current < spend) return false;
  const next = sanitizeLearningCredits(current - spend);
  if (next <= 0) {
    clearLearningCreditStorage();
  } else {
    localStorage.setItem(CREDIT_KEY, String(next));
  }
  notifyCreditChange(next);
  return true;
};

export const getPlanLimit = (feature: string, plan = getStoredPlan()) => {
  const normalized = normalizeFeature(feature);
  return PLAN_LIMITS[plan]?.[normalized] ?? PLAN_LIMITS.FREE[normalized] ?? PLAN_LIMITS.FREE.ai_generation ?? 3;
};

export const getPlanUsage = (feature: string, plan = getStoredPlan()) => {
  const normalized = normalizeFeature(feature);
  return Number(localStorage.getItem(usageKey(plan, normalized)) || 0);
};

export const assertPlanLimit = (feature: string, units = 1) => {
  const plan = getStoredPlan();
  const normalized = normalizeFeature(feature);
  const limit = getPlanLimit(normalized, plan);
  const used = getPlanUsage(normalized, plan);
  const withinLimit = limit > 0 && used + units <= limit;

  if (!withinLimit) {
    // This is an advisory UI signal only. The Edge Function verifies the
    // account, consumes database credits, and decides whether to allow usage.
    try {
      window.dispatchEvent(new CustomEvent('soma-plan-limit-near', {
        detail: { feature: normalized, plan, limit, used, units }
      }));
    } catch {
      // Ignore environments without a browser event target.
    }
  }

  return withinLimit;
};

export const recordPlanUsage = (feature: string, units = 1) => {
  const plan = getStoredPlan();
  const normalized = normalizeFeature(feature);
  const key = usageKey(plan, normalized);
  const next = getPlanUsage(normalized, plan) + units;
  localStorage.setItem(key, String(next));
  localStorage.setItem('soma_plan_usage_date', DAILY_KEY());
  return next;
};
