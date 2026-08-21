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

// Early stage adoption: Paid tiers have UNLIMITED access across all features.
const UNLIMITED_PAID_LIMITS: Record<BillableFeature, number> = {
  ai_generation: Infinity,
  exam_guru: Infinity,
  exam_marking: Infinity,
  quiz_generation: Infinity,
  practice_generation: Infinity,
  notes_generation: Infinity,
  grounded_library_help: Infinity,
  deep_document_analysis: Infinity,
  teacher_ai: Infinity,
  listen_and_learn: Infinity,
  listen_and_learn_voice: Infinity,
  listen_and_learn_podcast: Infinity,
  conversational_voice: Infinity,
};

export const PLAN_LIMITS: PlanLimitMap = {
  FREE: {
    ai_generation: 50,
    exam_guru: 20,
    exam_marking: 10,
    quiz_generation: 20,
    practice_generation: 20,
    notes_generation: 20,
    grounded_library_help: 10,
    deep_document_analysis: 5,
    teacher_ai: 20,
    listen_and_learn: 20,
    listen_and_learn_voice: 150000,
    listen_and_learn_podcast: 50000,
    conversational_voice: 60000,
  },
  DAILY: { ...UNLIMITED_PAID_LIMITS },
  WEEKLY: { ...UNLIMITED_PAID_LIMITS },
  MONTHLY: { ...UNLIMITED_PAID_LIMITS },
  TERMLY: { ...UNLIMITED_PAID_LIMITS },
  ANNUAL: { ...UNLIMITED_PAID_LIMITS },
  PRO: { ...UNLIMITED_PAID_LIMITS },
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
const CREDIT_SYNCED_AT_KEY = 'soma_learning_credits_synced_at';
const CREDIT_EVENT = 'soma-learning-credits-changed';
const MAX_REASONABLE_LEARNING_CREDITS = 1000;

const notifyCreditChange = (credits: number) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CREDIT_EVENT, { detail: { credits } }));
};

export const sanitizeLearningCredits = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  if (parsed > MAX_REASONABLE_LEARNING_CREDITS) return 0;
  return Math.floor(parsed);
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

const clearLearningCreditStorage = () => {
  try {
    localStorage.removeItem(CREDIT_KEY);
    localStorage.removeItem(CREDIT_EXPIRY_KEY);
    localStorage.removeItem(CREDIT_SYNCED_AT_KEY);
  } catch {
    // Ignore storage failures.
  }
};

const normalizeCreditExpiry = (value?: string | Date | null) => {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

export const getLearningCredits = () => {
  const expiry = getLearningCreditsExpiry();
  if (!expiry && localStorage.getItem(CREDIT_EXPIRY_KEY)) {
    return 0;
  }

  const raw = localStorage.getItem(CREDIT_KEY);
  const syncedAt = localStorage.getItem(CREDIT_SYNCED_AT_KEY);
  if (raw !== null && !syncedAt) {
    return 0;
  }
  const sanitized = sanitizeLearningCredits(raw);

  if (raw !== null && String(sanitized) !== raw) {
    try {
      if (sanitized <= 0) {
        clearLearningCreditStorage();
      } else {
        localStorage.setItem(CREDIT_KEY, String(sanitized));
      }
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
  localStorage.setItem(CREDIT_SYNCED_AT_KEY, new Date().toISOString());
  if (expiry) {
    localStorage.setItem(CREDIT_EXPIRY_KEY, expiry);
  }
  notifyCreditChange(next);
  return next;
};

export const formatLearningCredits = (credits: number) => {
  const safe = sanitizeLearningCredits(credits);
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
    localStorage.setItem(CREDIT_SYNCED_AT_KEY, new Date().toISOString());
  }
  notifyCreditChange(next);
  return true;
};

export const getPlanLimit = (feature: string, plan = getStoredPlan()) => {
  const normalized = normalizeFeature(feature);
  return PLAN_LIMITS[plan]?.[normalized] ?? PLAN_LIMITS.FREE[normalized] ?? PLAN_LIMITS.FREE.ai_generation ?? 50;
};

export const getPlanUsage = (feature: string, plan = getStoredPlan()) => {
  const normalized = normalizeFeature(feature);
  return Number(localStorage.getItem(usageKey(plan, normalized)) || 0);
};

export const assertPlanLimit = (feature: string, units = 1) => {
  const plan = getStoredPlan();
  // Paid users have unlimited access
  if (plan !== 'FREE') {
    return true;
  }

  const normalized = normalizeFeature(feature);
  const limit = getPlanLimit(normalized, plan);
  const used = getPlanUsage(normalized, plan);
  const withinLimit = limit > 0 && used + units <= limit;

  if (!withinLimit) {
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
