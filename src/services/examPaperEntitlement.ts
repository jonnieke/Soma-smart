import type { PaperAccess } from './examPaperBankService';

// The server verifies either a purchase or an active learner subscription.
// Client plan flags and a missing response never grant document access.
export const canStudyExamPaper = (access: Partial<PaperAccess> | null | undefined): boolean =>
  access?.canStudy === undefined ? access?.paid === true : access.canStudy === true;
