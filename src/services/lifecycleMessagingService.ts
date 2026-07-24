import { LifecycleMessage } from '../types/growthOS';

export const lifecycleMessagingService = {
  /** Get recommended onboarding & lifecycle messages */
  getMessagesForUser(userId: string, lifecycleStage: string): { title: string; body: string; ctaText: string; ctaUrl: string }[] {
    if (lifecycleStage === 'registered') {
      return [
        {
          title: 'Create Your First Exam Paper in 2 Minutes',
          body: 'Use Soma Paper Studio to generate a CBC or KCSE mock paper aligned to KICD topics.',
          ctaText: 'Open Paper Studio',
          ctaUrl: '/teacher/paper-studio/create',
        },
      ];
    }

    return [
      {
        title: 'Invite a Colleague and Earn 500 AI Credits',
        body: 'Share your personal SomaAI referral link with fellow teachers to claim bonus AI credits.',
        ctaText: 'Get Referral Link',
        ctaUrl: '/teacher/referrals',
      },
    ];
  },
};
