import { supabase } from '../lib/supabase';

export const EXAM_PAPER_PRICE_KES = 20;

export type ExamPaperBankItem = {
  id: string | number;
  title: string;
  subject: string;
  grade: string;
  exam_body?: string | null;
  exam_type?: string | null;
  exam_year?: string | number | null;
  paper_number?: string | number | null;
  duration_minutes?: number | null;
  total_marks?: number | null;
  source?: string | null;
  homepage_featured?: boolean | null;
  has_exam_paper?: boolean;
  has_marking_scheme?: boolean;
};

export type PaperBuyer = {
  name: string;
  phone: string;
  email?: string;
};

export type PaperAccess = {
  paid: boolean;
  subscribed?: boolean;
  canStudy?: boolean;
  canDownload?: boolean;
  examId: string | number;
  paperUrl?: string | null;
  markingSchemeUrl?: string | null;
  title?: string;
  expiresAt?: string | null;
};

const TOKEN_KEY = 'soma_exam_paper_buyer_token';

export const getPaperBuyerToken = () => {
  try {
    const existing = localStorage.getItem(TOKEN_KEY);
    if (existing) return existing;
    const token = crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch {
    return crypto.randomUUID();
  }
};

export const examPaperBankService = {
  async listPurchasedPaperIds(): Promise<string[]> {
    // Do not create a new identity just to restore purchases. A missing token
    // means this browser has no prior guest-purchase identity to look up.
    const buyerToken = localStorage.getItem(TOKEN_KEY);
    if (!buyerToken) return [];
    const ids = new Set<string>();
    let offset = 0;
    for (let page = 0; page < 51; page += 1) {
      const { data, error } = await supabase.functions.invoke('exam-paper-library', {
        body: { buyerToken, offset },
      });
      if (error) throw error;
      if (!data || !Array.isArray(data.paperIds) || !data.paperIds.every((id: unknown) => typeof id === 'string' && /^\d+$/.test(id))) {
        throw new Error('Invalid purchase library response');
      }
      data.paperIds.forEach((id: string) => ids.add(id));
      if (data.nextOffset === null) return [...ids];
      if (data.nextOffset !== offset + 200) throw new Error('Invalid purchase library pagination');
      offset = data.nextOffset;
    }
    throw new Error('Purchase library is too large to restore. Please contact support.');
  },

  async listPapers(): Promise<ExamPaperBankItem[]> {
    const { data, error } = await supabase.rpc('list_exam_paper_bank', {
      p_grade: null,
      p_subject: null,
      p_exam_body: null,
    });

    if (!error) return (data || []) as ExamPaperBankItem[];

    // Compatibility while the paper-bank migration is being deployed.
    const { data: exams, error: examError } = await supabase.rpc('list_published_exams', {
      p_grade: null,
      p_subject: null,
    });
    if (examError) throw examError;
    return ((exams || []) as Array<Record<string, unknown>>).map((paper) => ({
      ...(paper as unknown as ExamPaperBankItem),
      has_exam_paper: typeof paper.has_exam_paper === 'boolean' ? paper.has_exam_paper : Boolean(paper.file_url || paper.file_path || paper.fileUrl || paper.filePath),
      has_marking_scheme: typeof paper.has_marking_scheme === 'boolean' ? paper.has_marking_scheme : Boolean(
        paper.marking_scheme_url || paper.marking_scheme_path || paper.markingSchemeUrl || paper.markingSchemePath,
      ),
    }));
  },

  async initiatePurchase(examId: string | number, buyer: PaperBuyer) {
    const buyerToken = getPaperBuyerToken();
    const { data, error } = await supabase.functions.invoke('exam-paper-bank/initiate', {
      body: { examId, buyerToken, buyer },
    });
    if (error) throw error;
    return data as { redirect_url?: string; order_tracking_id?: string; reference: string; already_paid?: boolean };
  },

  async getAccess(examId: string | number, reference?: string | null): Promise<PaperAccess> {
    const learnerCode = localStorage.getItem('soma_active_student');
    const learnerPin = localStorage.getItem('soma_active_student_pin');
    const { data, error } = await supabase.functions.invoke('exam-paper-bank/access', {
      body: {
        examId,
        buyerToken: getPaperBuyerToken(),
        reference: reference || undefined,
        ...(learnerCode && learnerPin ? { learnerCode, learnerPin } : {}),
      },
    });
    if (error) throw error;
    return data as PaperAccess;
  },
};
