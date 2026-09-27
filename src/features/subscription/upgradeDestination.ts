import { STUDENT_PLANS } from '../../data/pricing';

export function upgradeDestination(planId: string, pathname: string) {
  // Teacher/school offerings use their own plan catalogue.
  if (pathname.startsWith('/teacher') || pathname.startsWith('/school')) return { pathname: '/pricing', state: undefined };
  const plan = STUDENT_PLANS.find(item => item.duration === planId);
  return plan
    ? { pathname: '/learner', state: { initiatePaymentFor: plan } }
    : { pathname: '/pricing', state: undefined };
}
