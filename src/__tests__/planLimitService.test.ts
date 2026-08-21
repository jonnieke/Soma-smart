import { beforeEach, describe, expect, it } from 'vitest';
import {
  PLAN_LIMITS,
  assertPlanLimit,
  getPlanLimit,
  recordPlanUsage,
} from '../services/planLimitService';

describe('plan limit enforcement', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('keeps paid tiers unlimited for early stage adoption', () => {
    expect(PLAN_LIMITS.FREE.ai_generation).toBe(50);
    expect(PLAN_LIMITS.DAILY.ai_generation).toBe(Infinity);
    expect(PLAN_LIMITS.MONTHLY.ai_generation).toBe(Infinity);
    expect(getPlanLimit('teacher_ai', 'TERMLY')).toBe(Infinity);
    expect(getPlanLimit('ai_generation', 'PRO')).toBe(Infinity);
  });

  it('allows paid subscribers unlimited assertions', () => {
    localStorage.setItem('soma_subscription_plan', 'MONTHLY');
    localStorage.setItem('soma_subscription_expiry', new Date(Date.now() + 86400000).toISOString());

    // Record high usage
    for (let index = 0; index < 500; index += 1) {
      recordPlanUsage('ai_generation');
    }

    expect(assertPlanLimit('ai_generation')).toBe(true);
  });

  it('reports the mirrored threshold for free users after exceeding limit', () => {
    localStorage.setItem('soma_subscription_plan', 'FREE');
    for (let index = 0; index < 50; index += 1) {
      recordPlanUsage('ai_generation');
    }

    expect(assertPlanLimit('ai_generation')).toBe(false);
  });
});