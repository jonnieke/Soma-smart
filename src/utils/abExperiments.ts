export type CtaVariant = 'A' | 'B';

const assignVariant = (key: string): CtaVariant => {
  const storageKey = `soma_exp_${key}`;
  const existing = localStorage.getItem(storageKey);
  if (existing === 'A' || existing === 'B') return existing;
  const assigned: CtaVariant = Math.random() < 0.5 ? 'A' : 'B';
  localStorage.setItem(storageKey, assigned);
  return assigned;
};

export const getLearnerCtaVariant = (): CtaVariant => assignVariant('learner_first_run_cta');
export const getTeacherCtaVariant = (): CtaVariant => assignVariant('teacher_first_run_cta');
