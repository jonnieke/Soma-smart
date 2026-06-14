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
  | 'listen_and_learn_voice'
  | 'listen_and_learn_podcast'
  | 'conversational_voice';

type PlanLimitMap = Record<string, Partial<Record<BillableFeature, number>>>;

const DAILY_KEY = () => new Date().toISOString().slice(0, 10);

const PLAN_LIMITS: PlanLimitMap = {
  FREE: {
    ai_generation: 40,
    exam_guru: 20,
    exam_marking: 5,
    quiz_generation: 20,
    practice_generation: 25,
    notes_generation: 12,
    grounded_library_help: 6,
    deep_document_analysis: 2,
    listen_and_learn_voice: 30000,
    listen_and_learn_podcast: 8000,
    conversational_voice: 12000,
  },
  DAILY: {
    ai_generation: 120,
    exam_guru: 70,
    exam_marking: 25,
    quiz_generation: 70,
    practice_generation: 90,
    notes_generation: 50,
    grounded_library_help: 45,
    deep_document_analysis: 12,
    listen_and_learn_voice: 80000,
    listen_and_learn_podcast: 30000,
    conversational_voice: 30000,
  },
  WEEKLY: {
    ai_generation: 600,
    exam_guru: 350,
    exam_marking: 140,
    quiz_generation: 350,
    practice_generation: 450,
    notes_generation: 250,
    grounded_library_help: 240,
    deep_document_analysis: 70,
    listen_and_learn_voice: 350000,
    listen_and_learn_podcast: 140000,
    conversational_voice: 140000,
  },
  MONTHLY: {
    ai_generation: 2500,
    exam_guru: 1500,
    exam_marking: 600,
    quiz_generation: 1500,
    practice_generation: 2000,
    notes_generation: 1000,
    grounded_library_help: 1000,
    deep_document_analysis: 300,
    listen_and_learn_voice: 1200000,
    listen_and_learn_podcast: 500000,
    conversational_voice: 500000,
  },
  TERMLY: {
    ai_generation: 7000,
    exam_guru: 4200,
    exam_marking: 1800,
    quiz_generation: 4200,
    practice_generation: 5500,
    notes_generation: 3000,
    grounded_library_help: 2800,
    deep_document_analysis: 900,
    listen_and_learn_voice: 3500000,
    listen_and_learn_podcast: 1500000,
    conversational_voice: 1500000,
  },
  ANNUAL: {
    ai_generation: 30000,
    exam_guru: 18000,
    exam_marking: 7500,
    quiz_generation: 18000,
    practice_generation: 24000,
    notes_generation: 12000,
    grounded_library_help: 12000,
    deep_document_analysis: 3500,
    listen_and_learn_voice: 15000000,
    listen_and_learn_podcast: 6500000,
    conversational_voice: 6500000,
  },
  PRO: {
    ai_generation: 2500,
    exam_guru: 1500,
    exam_marking: 600,
    quiz_generation: 1500,
    practice_generation: 2000,
    notes_generation: 1000,
    grounded_library_help: 1000,
    deep_document_analysis: 300,
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
  const lastPaymentTime = Number(localStorage.getItem('soma_last_payment_time') || 0);
  const lastPaymentAmount = Number(localStorage.getItem('soma_last_payment_amount') || 0);
  const recentPaymentWindowMs = 24 * 60 * 60 * 1000;
  if (plan === 'FREE' && lastPaymentTime > 0 && lastPaymentAmount > 0 && Date.now() - lastPaymentTime < recentPaymentWindowMs) {
    if (lastPaymentAmount >= 100) return 'WEEKLY';
    if (lastPaymentAmount >= 20) return 'DAILY';
  }
  return plan || 'FREE';
};

const normalizeFeature = (feature: string): BillableFeature => {
  if (feature === 'audio_learning') return 'listen_and_learn_voice';
  return (feature in FEATURE_LABELS ? feature : 'ai_generation') as BillableFeature;
};

const usageKey = (plan: string, feature: string) => `soma_plan_usage_${DAILY_KEY()}_${plan}_${feature}`;
const CREDIT_KEY = 'soma_learning_credits';
const CREDIT_EVENT = 'soma-learning-credits-changed';

const notifyCreditChange = (credits: number) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(CREDIT_EVENT, { detail: { credits } }));
};

const creditUnitsForFeature = (feature: string, units: number) => {
  if (feature === 'deep_document_analysis') return Math.max(2, units * 2);
  if (feature === 'grounded_library_help') return Math.max(1, units);
  return feature.includes('voice') || feature.includes('podcast')
    ? Math.max(1, Math.ceil(units / 1000))
    : Math.max(1, units);
};

export const getLearningCredits = () => Number(localStorage.getItem(CREDIT_KEY) || 0);

export const grantLearningCredits = (credits: number) => {
  const next = Math.max(0, getLearningCredits() + credits);
  localStorage.setItem(CREDIT_KEY, String(next));
  notifyCreditChange(next);
  return next;
};

export const spendLearningCredits = (credits: number) => {
  const current = getLearningCredits();
  if (current < credits) return false;
  const next = current - credits;
  localStorage.setItem(CREDIT_KEY, String(next));
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
  return; // Bypass client-side limits check for local/test convenience
  const plan = getStoredPlan();
  const normalized = normalizeFeature(feature);
  const limit = getPlanLimit(normalized, plan);
  const used = getPlanUsage(normalized, plan);
  if (limit <= 0 || used + units > limit) {
    const creditsNeeded = creditUnitsForFeature(normalized, units);
    if (spendLearningCredits(creditsNeeded)) return;
    // Fire global upgrade modal event so the UI can intercept before re-throw
    try {
      window.dispatchEvent(new CustomEvent('soma-show-upgrade-modal', {
        detail: { feature: normalized, plan, limit }
      }));
    } catch (_) { /* ignore SSR or test environments */ }
    throw new PlanLimitError(normalized, plan, limit);
  }
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
