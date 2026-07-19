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
      p_exam_body: null,
    });
    if (examError) throw examError;
    return ((exams || []) as Array<Record<string, unknown>>).map((paper) => ({
      ...(paper as unknown as ExamPaperBankItem),
      has_exam_paper: Boolean(paper.file_url || paper.file_path || paper.fileUrl || paper.filePath),
      has_marking_scheme: Boolean(
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
    const { data, error } = await supabase.functions.invoke('exam-paper-bank/access', {
      body: {
        examId,
        buyerToken: getPaperBuyerToken(),
        reference: reference || undefined,
      },
    });
    if (error) throw error;
    return data as PaperAccess;
  },
};