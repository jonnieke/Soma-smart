import { describe, expect, it } from 'vitest';
import { upgradeDestination } from '../features/subscription/upgradeDestination';
import { STUDENT_PLANS } from '../data/pricing';

describe('selected upgrade checkout handoff', () => {
  it.each(['DAILY', 'WEEKLY', 'MONTHLY'])('carries %s directly to learner checkout, not another pricing screen', duration => {
    const destination = upgradeDestination(duration, '/learner');
    expect(destination.pathname).toBe('/learner');
    expect(destination.state?.initiatePaymentFor).toEqual(STUDENT_PLANS.find(plan => plan.duration === duration));
  });
  it('does not invent a plan for an unknown selection', () => {
    expect(upgradeDestination('unknown', '/learner').pathname).toBe('/pricing');
  });
  it('does not send teacher users to a student checkout', () => {
    expect(upgradeDestination('DAILY', '/teacher').pathname).toBe('/pricing');
  });
});
