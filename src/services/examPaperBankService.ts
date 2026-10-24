import { supabase } from '../lib/supabase';

export const EXAM_PAPER_PRICE_KES = 20;
export const EXAM_BUNDLE_PRICE_KES = 100;
export const MAX_SUBJECTS_PER_BUNDLE = 7;

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
const PHONE_SESSION_KEY = 'soma_candidate_phone_session';
export const REVISION_PASS_DURATION_MS = 24 * 60 * 60 * 1000;

export type PhoneRestoreSession = {
  found: boolean;
  buyerToken?: string;
  buyerName?: string;
  normalizedPhone: string;
  last9: string;
  paperIds: string[];
  bundleCodes?: string[];
  latestPaidAt?: string | null;
  passExpiresAt?: string | null;
  passActive: boolean;
  hoursRemaining: number;
};

export type ExamPaperBundle = {
  bundleCode: string;
  bundleNumber: number;
  examFamily: 'KPSEA' | 'KJSEA' | 'KCSE' | 'CBC';
  gradeLabel: string;
  title: string;
  priceKes: number;
  papers: ExamPaperBankItem[];
  paperIds: string[];
  subjects: string[];
};

const normalizeBundleSubject = (raw: string | null | undefined): string => {
  const s = String(raw || '').trim().replace(/\s+/g, ' ');
  if (/^english(?:\s+language)?$/i.test(s)) return 'English';
  if (/^kiswahili/i.test(s)) return 'Kiswahili';
  if (/^(?:math|mathematics)$/i.test(s)) return 'Mathematics';
  if (/^(?:cre|ire|hre)$/i.test(s)) return s.toUpperCase();
  return s ? s.toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase()) : 'General';
};

const resolveExamFamily = (paper: ExamPaperBankItem): { family: 'KPSEA' | 'KJSEA' | 'KCSE' | 'CBC'; gradeLabel: string } => {
  const combined = `${paper.grade || ''} ${paper.exam_body || ''} ${paper.exam_type || ''} ${paper.title || ''}`.toLowerCase();
  if (combined.includes('kpsea') || /\bgrade\s*6\b/.test(combined)) {
    return { family: 'KPSEA', gradeLabel: 'Grade 6' };
  }
  if (combined.includes('kjsea') || /\bgrade\s*[789]\b/.test(combined)) {
    const gradeMatch = String(paper.grade || '').match(/grade\s*([789])/i);
    return { family: 'KJSEA', gradeLabel: gradeMatch ? `Grade ${gradeMatch[1]}` : 'Grade 9' };
  }
  if (combined.includes('kcse') || /\bform\s*[1-4]\b/.test(combined)) {
    const formMatch = String(paper.grade || '').match(/form\s*([1-4])/i);
    return { family: 'KCSE', gradeLabel: formMatch ? `Form ${formMatch[1]}` : 'Form 4' };
  }
  return { family: 'CBC', gradeLabel: String(paper.grade || 'CBC').trim() || 'CBC' };
};

/**
 * Partitions published papers into sequential exam bundles (e.g. KPSEA BDL001, KPSEA BDL002,
 * KJSEA BDL001, KCSE BDL001).
 * Rule:
 * - Each bundle contains strictly NOT MORE THAN ONE paper per subject (max 7 subjects per bundle).
 * - When a second paper for the same subject is encountered, it is placed into the next bundle set
 *   (BDL002, BDL003, etc.).
 * - Purchasing a bundle unlocks ONLY the paperIds in that specific bundle set.
 */
export const buildExamPaperBundles = (papers: ExamPaperBankItem[]): ExamPaperBundle[] => {
  const validPapers = (papers || []).filter((p) => p && p.has_exam_paper !== false);
  const byFamily: Record<
    'KPSEA' | 'KJSEA' | 'KCSE' | 'CBC',
    Array<{
      bundleNumber: number;
      gradeLabel: string;
      subjectMap: Map<string, ExamPaperBankItem>;
    }>
  > = {
    KPSEA: [],
    KJSEA: [],
    KCSE: [],
    CBC: [],
  };

  for (const paper of validPapers) {
    const { family, gradeLabel } = resolveExamFamily(paper);
    const subject = normalizeBundleSubject(paper.subject);
    const familySlots = byFamily[family];

    let placed = false;
    for (const slot of familySlots) {
      if (!slot.subjectMap.has(subject) && slot.subjectMap.size < MAX_SUBJECTS_PER_BUNDLE) {
        slot.subjectMap.set(subject, paper);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const nextNumber = familySlots.length + 1;
      const subjectMap = new Map<string, ExamPaperBankItem>();
      subjectMap.set(subject, paper);
      familySlots.push({
        bundleNumber: nextNumber,
        gradeLabel,
        subjectMap,
      });
    }
  }

  const bundles: ExamPaperBundle[] = [];
  const familyOrder: Array<'KPSEA' | 'KJSEA' | 'KCSE' | 'CBC'> = ['KPSEA', 'KJSEA', 'KCSE', 'CBC'];

  for (const family of familyOrder) {
    for (const slot of byFamily[family]) {
      const slotPapers = Array.from(slot.subjectMap.values());
      // A bundle set should have at least 2 distinct subject papers to be offered as a multi-subject bundle
      if (slotPapers.length < 2) continue;
      const paddedNum = String(slot.bundleNumber).padStart(3, '0');
      const bundleCode = `${family} BDL${paddedNum}`;
      const subjects = Array.from(slot.subjectMap.keys());
      bundles.push({
        bundleCode,
        bundleNumber: slot.bundleNumber,
        examFamily: family,
        gradeLabel: slot.gradeLabel,
        title: `${bundleCode} (${slotPapers.length} Subjects · 1 Paper Each)`,
        priceKes: EXAM_BUNDLE_PRICE_KES,
        papers: slotPapers,
        paperIds: slotPapers.map((p) => String(p.id)),
        subjects,
      });
    }
  }

  return bundles;
};

export const findBundleForPaper = (
  paperId: string | number,
  bundles: ExamPaperBundle[]
): ExamPaperBundle | undefined => {
  const idStr = String(paperId);
  return bundles.find((b) => b.paperIds.includes(idStr));
};

/**
 * Extracts the canonical last 9 digits of a Kenyan phone number from formats:
 * +254xxx..., 254xxx..., 0xxxx..., or 9-digit xxx...
 */
export const normalizeKenyanPhoneLast9 = (raw: string | null | undefined): string | null => {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 9) return digits;
  if (digits.length === 10 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith('254')) return digits.slice(3);
  if (digits.length === 13 && digits.startsWith('2540')) return digits.slice(4);
  if (digits.length > 9 && (digits.startsWith('254') || digits.startsWith('0'))) return digits.slice(-9);
  return null;
};

export const normalizeKenyanPhone = (raw: string | null | undefined): string | null => {
  const last9 = normalizeKenyanPhoneLast9(raw);
  return last9 ? `254${last9}` : null;
};

export const computePassStatus = (latestPaidAt?: string | null, passExpiresAt?: string | null, now = Date.now()) => {
  const expiresMs = passExpiresAt
    ? Date.parse(passExpiresAt)
    : latestPaidAt
      ? Date.parse(latestPaidAt) + REVISION_PASS_DURATION_MS
      : NaN;
  if (!Number.isFinite(expiresMs)) {
    return { passActive: false, hoursRemaining: 0, passExpiresAt: null };
  }
  const remainingMs = expiresMs - now;
  const passActive = remainingMs > 0;
  const hoursRemaining = passActive ? Math.max(0.1, Math.round((remainingMs / 3600000) * 10) / 10) : 0;
  return {
    passActive,
    hoursRemaining,
    passExpiresAt: new Date(expiresMs).toISOString(),
  };
};

export const readPhoneRestoreSession = (now = Date.now()): PhoneRestoreSession | null => {
  try {
    const raw = localStorage.getItem(PHONE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PhoneRestoreSession;
    if (!parsed || typeof parsed.normalizedPhone !== 'string' || !Array.isArray(parsed.paperIds)) {
      return null;
    }
    const status = computePassStatus(parsed.latestPaidAt, parsed.passExpiresAt, now);
    return {
      ...parsed,
      ...status,
    };
  } catch {
    return null;
  }
};

export const savePhoneRestoreSession = (session: PhoneRestoreSession) => {
  try {
    localStorage.setItem(PHONE_SESSION_KEY, JSON.stringify(session));
    if (session.buyerToken && /^[0-9a-f-]{36}$/i.test(session.buyerToken)) {
      localStorage.setItem(TOKEN_KEY, session.buyerToken);
    }
  } catch {
    // Ignore storage quota errors
  }
};

export const clearPhoneRestoreSession = () => {
  try {
    localStorage.removeItem(PHONE_SESSION_KEY);
  } catch {
    // Ignore storage errors
  }
};

export const recordLocalPaperPurchaseSession = (examId: string | number, buyer?: Partial<PaperBuyer>) => {
  const existing = readPhoneRestoreSession();
  const last9 = normalizeKenyanPhoneLast9(buyer?.phone) || existing?.last9 || '';
  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + REVISION_PASS_DURATION_MS).toISOString();
  const nextPaperIds = Array.from(new Set([...(existing?.paperIds || []), String(examId)]));
  const session: PhoneRestoreSession = {
    found: true,
    buyerToken: localStorage.getItem(TOKEN_KEY) || undefined,
    buyerName: buyer?.name?.trim() || existing?.buyerName || 'Candidate',
    normalizedPhone: last9 ? `254${last9}` : existing?.normalizedPhone || '',
    last9,
    paperIds: nextPaperIds,
    bundleCodes: existing?.bundleCodes || [],
    latestPaidAt: nowIso,
    passExpiresAt: expiresIso,
    passActive: true,
    hoursRemaining: 24,
  };
  savePhoneRestoreSession(session);
  return session;
};

/**
 * Records a bundle purchase locally and unlocks ONLY the paperIds in that specific bundle set.
 */
export const recordLocalBundlePurchaseSession = (
  bundle: Pick<ExamPaperBundle, 'bundleCode' | 'paperIds'>,
  buyer?: Partial<PaperBuyer>
) => {
  const existing = readPhoneRestoreSession();
  const last9 = normalizeKenyanPhoneLast9(buyer?.phone) || existing?.last9 || '';
  const nowIso = new Date().toISOString();
  const expiresIso = new Date(Date.now() + REVISION_PASS_DURATION_MS).toISOString();
  const nextPaperIds = Array.from(
    new Set([...(existing?.paperIds || []), ...bundle.paperIds.map(String)])
  );
  const nextBundleCodes = Array.from(
    new Set([...(existing?.bundleCodes || []), bundle.bundleCode])
  );
  const session: PhoneRestoreSession = {
    found: true,
    buyerToken: localStorage.getItem(TOKEN_KEY) || undefined,
    buyerName: buyer?.name?.trim() || existing?.buyerName || 'Candidate',
    normalizedPhone: last9 ? `254${last9}` : existing?.normalizedPhone || '',
    last9,
    paperIds: nextPaperIds,
    bundleCodes: nextBundleCodes,
    latestPaidAt: nowIso,
    passExpiresAt: expiresIso,
    passActive: true,
    hoursRemaining: 24,
  };
  savePhoneRestoreSession(session);
  return session;
};

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

  readPhoneSession: readPhoneRestoreSession,
  clearPhoneSession: clearPhoneRestoreSession,
  recordLocalPaperPurchase: recordLocalPaperPurchaseSession,
  recordLocalBundlePurchase: recordLocalBundlePurchaseSession,
  recordPurchaseSession: recordLocalPaperPurchaseSession,
  buildBundles: buildExamPaperBundles,
  findBundleForPaper,

  async restoreByPhone(rawPhone: string): Promise<PhoneRestoreSession> {
    const last9 = normalizeKenyanPhoneLast9(rawPhone);
    if (!last9) {
      throw new Error('Please enter a valid Kenyan phone number (last 9 digits required).');
    }
    const normalizedPhone = `254${last9}`;

    let rawResult: Record<string, any> | null = null;
    const { data: rpcData, error: rpcError } = await supabase.rpc('restore_candidate_by_phone', {
      p_phone: normalizedPhone,
    });

    if (!rpcError && rpcData && typeof rpcData === 'object') {
      rawResult = rpcData as Record<string, any>;
    } else {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('exam-paper-bank/restore-phone', {
        body: { phone: normalizedPhone },
      });
      if (fnError) throw fnError;
      rawResult = (fnData || null) as Record<string, any> | null;
    }

    if (!rawResult || !rawResult.found) {
      return {
        found: false,
        normalizedPhone,
        last9,
        paperIds: [],
        passActive: false,
        hoursRemaining: 0,
      };
    }

    const paperIds = Array.isArray(rawResult.paperIds)
      ? rawResult.paperIds.map((id: unknown) => String(id)).filter((id: string) => Boolean(id))
      : [];
    const status = computePassStatus(
      rawResult.latestPaidAt ? String(rawResult.latestPaidAt) : null,
      rawResult.passExpiresAt ? String(rawResult.passExpiresAt) : null
    );
    const session: PhoneRestoreSession = {
      found: true,
      buyerToken: typeof rawResult.buyerToken === 'string' ? rawResult.buyerToken : undefined,
      buyerName: typeof rawResult.buyerName === 'string' ? rawResult.buyerName : 'Candidate',
      normalizedPhone,
      last9,
      paperIds,
      latestPaidAt: rawResult.latestPaidAt ? String(rawResult.latestPaidAt) : null,
      passExpiresAt: status.passExpiresAt,
      passActive: typeof rawResult.passActive === 'boolean' ? rawResult.passActive : status.passActive,
      hoursRemaining: typeof rawResult.hoursRemaining === 'number' ? rawResult.hoursRemaining : status.hoursRemaining,
    };

    savePhoneRestoreSession(session);
    return session;
  },

  async initiatePurchase(
    examId: string | number,
    buyer: PaperBuyer,
    options?: {
      renewPass?: boolean;
      bundleCode?: string;
      bundlePaperIds?: Array<string | number>;
      amountKes?: number;
    }
  ) {
    let buyerToken = getPaperBuyerToken();
    const normalizedPhone = normalizeKenyanPhone(buyer.phone) || buyer.phone;
    const bundlePayload =
      options?.bundleCode && Array.isArray(options.bundlePaperIds) && options.bundlePaperIds.length >= 2
        ? {
            bundleCode: options.bundleCode,
            bundlePaperIds: options.bundlePaperIds.map(String),
            amountKes: options.amountKes || EXAM_BUNDLE_PRICE_KES,
          }
        : {};
    const { data, error } = await supabase.functions.invoke('exam-paper-bank/initiate', {
      body: {
        examId,
        buyerToken,
        buyer: { ...buyer, phone: normalizedPhone },
        ...(options?.renewPass ? { renewPass: true } : {}),
        ...bundlePayload,
      },
    });
    if (error) throw error;
    const response = data as {
      redirect_url?: string;
      order_tracking_id?: string;
      reference: string;
      already_paid?: boolean;
      bundleCode?: string;
      bundlePaperIds?: string[];
    };

    // Compatibility fallback if the deployed edge function has not yet picked up `renewPass` or `bundleCode`:
    // rotate a fresh buyerToken so Pesapal creates a new order tied to the buyer's phone.
    if ((options?.renewPass || options?.bundleCode) && response?.already_paid && !response?.redirect_url) {
      buyerToken = crypto.randomUUID();
      try {
        localStorage.setItem(TOKEN_KEY, buyerToken);
      } catch {
        // ignore storage quota errors
      }
      const retry = await supabase.functions.invoke('exam-paper-bank/initiate', {
        body: {
          examId,
          buyerToken,
          buyer: { ...buyer, phone: normalizedPhone },
          ...(options?.renewPass ? { renewPass: true } : {}),
          ...bundlePayload,
        },
      });
      if (retry.error) throw retry.error;
      return retry.data as {
        redirect_url?: string;
        order_tracking_id?: string;
        reference: string;
        already_paid?: boolean;
        bundleCode?: string;
        bundlePaperIds?: string[];
      };
    }

    return response;
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
