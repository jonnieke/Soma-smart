import { SubscriptionTier } from '../types';

type BillableFeature =
  | 'ai_generation'
  | 'exam_guru'
  | 'exam_marking'
  | 'quiz_generation'
  | 'practice_generation'
  | 'notes_generation'
  | 'teacher_ai'
  | 'listen_and_learn_voice'
  | 'listen_and_learn_podcast'
  | 'conversational_voice';

type PlanLimitMap = Record<string, Partial<Record<BillableFeature, number>>>;

const DAILY_KEY = () => new Date().toISOString().slice(0, 10);

const PLAN_LIMITS: PlanLimitMap = {
  FREE: {
    ai_generation: 3,
    exam_guru: 3,
    exam_marking: 1,
    quiz_generation: 2,
    practice_generation: 2,
    notes_generation: 2,
    listen_and_learn_voice: 6000,
    listen_and_learn_podcast: 0,
    conversational_voice: 4000,
  },
  DAILY: {
    ai_generation: 20,
    exam_guru: 15,
    exam_marking: 6,
    quiz_generation: 10,
    practice_generation: 12,
    notes_generation: 10,
    listen_and_learn_voice: 9000,
    listen_and_learn_podcast: 7000,
    conversational_voice: 7000,
  },
  WEEKLY: {
    ai_generation: 120,
    exam_guru: 80,
    exam_marking: 35,
    quiz_generation: 60,
    practice_generation: 80,
    notes_generation: 60,
    listen_and_learn_voice: 50000,
    listen_and_learn_podcast: 35000,
    conversational_voice: 35000,
  },
  MONTHLY: {
    ai_generation: 450,
    exam_guru: 300,
    exam_marking: 150,
    quiz_generation: 250,
    practice_generation: 300,
    notes_generation: 220,
    listen_and_learn_voice: 180000,
    listen_and_learn_podcast: 120000,
    conversational_voice: 120000,
  },
  TERMLY: {
    ai_generation: 1200,
    exam_guru: 800,
    exam_marking: 420,
    quiz_generation: 700,
    practice_generation: 850,
    notes_generation: 650,
    listen_and_learn_voice: 500000,
    listen_and_learn_podcast: 330000,
    conversational_voice: 330000,
  },
  ANNUAL: {
    ai_generation: 4000,
    exam_guru: 2500,
    exam_marking: 1500,
    quiz_generation: 2200,
    practice_generation: 2800,
    notes_generation: 2000,
    listen_and_learn_voice: 1800000,
    listen_and_learn_podcast: 1200000,
    conversational_voice: 1200000,
  },
  PRO: {
    ai_generation: 450,
    exam_guru: 300,
    exam_marking: 150,
    quiz_generation: 250,
    practice_generation: 300,
    notes_generation: 220,
    listen_and_learn_voice: 180000,
    listen_and_learn_podcast: 120000,
    conversational_voice: 120000,
  },
};

const FEATURE_LABELS: Record<string, string> = {
  ai_generation: 'AI help',
  exam_guru: 'Exam Guru',
  exam_marking: 'Smart marking',
  quiz_generation: 'quiz generation',
  practice_generation: 'practice drills',
  notes_generation: 'notes generation',
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
  const plan = getStoredPlan();
  const normalized = normalizeFeature(feature);
  const limit = getPlanLimit(normalized, plan);
  const used = getPlanUsage(normalized, plan);
  if (limit <= 0 || used + units > limit) {
    const creditsNeeded = creditUnitsForFeature(normalized, units);
    if (spendLearningCredits(creditsNeeded)) return;
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
