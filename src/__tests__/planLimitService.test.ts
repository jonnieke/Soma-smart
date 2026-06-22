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

  it('keeps the client limit mirror aligned with launch tiers', () => {
    expect(PLAN_LIMITS.FREE.ai_generation).toBe(10);
    expect(PLAN_LIMITS.DAILY.ai_generation).toBe(30);
    expect(PLAN_LIMITS.MONTHLY.ai_generation).toBe(450);
    expect(getPlanLimit('teacher_ai', 'TERMLY')).toBe(650);
  });

  it('does not grant paid access from local payment timestamps', () => {
    localStorage.setItem('soma_subscription_plan', 'FREE');
    localStorage.setItem('soma_last_payment_time', String(Date.now()));
    localStorage.setItem('soma_last_payment_amount', '499');

    expect(getPlanLimit('ai_generation')).toBe(10);
  });

  it('reports the mirrored threshold without blocking the backend entitlement check', () => {
    for (let index = 0; index < 10; index += 1) {
      recordPlanUsage('ai_generation');
    }

    expect(assertPlanLimit('ai_generation')).toBe(false);
  });
});