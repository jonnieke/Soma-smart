import { supabase } from '../lib/supabase';

export type CreatorMaterialCategory = 'EXAM_PAPER' | 'REVISION_PAPER' | 'NOTES' | 'EXAM_GUIDE' | 'REVISION_PACK';
export type CreatorMaterialStatus = 'DRAFT' | 'SCREENING' | 'EDITORIAL_REVIEW' | 'CHANGES_REQUESTED' | 'RIGHTS_EVIDENCE_REQUIRED' | 'APPROVED' | 'PUBLISHED' | 'REJECTED' | 'SUSPENDED';

export interface CreatorProfileRecord {
  user_id: string;
  display_name: string;
  account_type: 'TEACHER' | 'SCHOOL';
  phone: string;
  email?: string | null;
  county?: string | null;
  school_name?: string | null;
  subjects: string[];
  grades: string[];
  experience_years: number;
  payout_method: 'MPESA' | 'BANK';
  payout_destination: string;
  kra_pin?: string | null;
  status: 'PENDING' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';
  store_slug?: string | null;
}

export interface CreatorSimilarityReportRecord {
  id: string;
  status: 'PROCESSING' | 'PASSED' | 'REVIEW_REQUIRED' | 'FAILED';
  maximum_similarity?: number | null;
  exact_duplicate: boolean;
  summary?: string | null;
  matches: Array<{ source: 'CREATOR' | 'SOMAAI'; sourceId?: string | number; title?: string; similarity: number; exactFileDuplicate?: boolean; matchedExcerpt?: string; submittedChunk?: number }>;
}

export interface CreatorMaterialRecord {
  id: string;
  creator_id: string;
  creator_name?: string | null;
  creator_slug?: string | null;
  title: string;
  description: string;
  category: CreatorMaterialCategory;
  subject: string;
  grade: string;
  curriculum: string;
  exam_body?: string | null;
  year?: number | null;
  price_kes: number;
  source_file_path: string;
  marking_scheme_path?: string | null;
  preview_file_path?: string | null;
  file_name: string;
  file_size_bytes: number;
  status: CreatorMaterialStatus;
  screening_status: 'QUEUED' | 'PROCESSING' | 'PASSED' | 'REVIEW_REQUIRED' | 'FAILED';
  similarity_score?: number | null;
  rights_evidence_required: boolean;
  review_notes?: string | null;
  sales_count: number;
  rating: number;
  published_at?: string | null;
  knowledge_base_id?: number | null;
  creator_similarity_reports?: CreatorSimilarityReportRecord[];
  created_at: string;
}

export interface CreatorEarningsSummary {
  pending_kes: number;
  cleared_kes: number;
  scheduled_kes: number;
  paid_kes: number;
  lifetime_sales: number;
}

export interface CreateCreatorMaterialInput {
  title: string;
  description: string;
  category: CreatorMaterialCategory;
  subject: string;
  grade: string;
  curriculum: string;
  examBody?: string;
  year?: number;
  priceKes: number;
  sourceFile: File;
  markingSchemeFile?: File | null;
  previewFile?: File | null;
  rightsDeclaration: string;
  aiScreeningConsent: boolean;
}

const requireUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Please log in with your teacher account.');
  return user;
};

const safeFileName = (name: string) => name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '').slice(-120) || 'material.pdf';

const uploadPrivateFile = async (userId: string, folder: string, role: string, file: File) => {
  const path = `${userId}/${folder}/${role}-${safeFileName(file.name)}`;
  const { error } = await supabase.storage.from('creator-materials').upload(path, file, { upsert: false, contentType: file.type || 'application/octet-stream' });
  if (error) throw error;
  return path;
};

export const creatorMarketplaceService = {
  async getMyProfile(): Promise<CreatorProfileRecord | null> {
    const user = await requireUser();
    const { data, error } = await supabase.from('creator_profiles').select('*').eq('user_id', user.id).maybeSingle();
    if (error) throw error;
    return data as CreatorProfileRecord | null;
  },

  async saveProfile(input: Omit<CreatorProfileRecord, 'user_id' | 'status'>): Promise<CreatorProfileRecord> {
    const user = await requireUser();
    const { data, error } = await supabase.from('creator_profiles').upsert({ ...input, user_id: user.id, email: input.email || user.email || null, copyright_accepted_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select('*').single();
    if (error) throw error;
    return data as CreatorProfileRecord;
  },

  async listMyMaterials(): Promise<CreatorMaterialRecord[]> {
    const user = await requireUser();
    const { data, error } = await supabase.from('creator_materials').select('*').eq('creator_id', user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []) as CreatorMaterialRecord[];
  },

  async listPublished(category?: CreatorMaterialCategory): Promise<CreatorMaterialRecord[]> {
    let query = supabase.from('creator_materials').select('*').eq('status', 'PUBLISHED').order('published_at', { ascending: false });
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as CreatorMaterialRecord[];
  },

  async submitMaterial(input: CreateCreatorMaterialInput): Promise<CreatorMaterialRecord> {
    const user = await requireUser();
    const folder = `${Date.now()}-${crypto.randomUUID()}`;
    const uploadedPaths: string[] = [];
    try {
      const sourcePath = await uploadPrivateFile(user.id, folder, 'source', input.sourceFile);
      uploadedPaths.push(sourcePath);
      const markingPath = input.markingSchemeFile ? await uploadPrivateFile(user.id, folder, 'marking-scheme', input.markingSchemeFile) : null;
      if (markingPath) uploadedPaths.push(markingPath);
      const previewPath = input.previewFile ? await uploadPrivateFile(user.id, folder, 'preview', input.previewFile) : null;
      if (previewPath) uploadedPaths.push(previewPath);
      const { data, error } = await supabase.from('creator_materials').insert({
        creator_id: user.id,
        title: input.title.trim(), description: input.description.trim(), category: input.category,
        subject: input.subject.trim(), grade: input.grade.trim(), curriculum: input.curriculum.trim() || 'CBC',
        exam_body: input.examBody?.trim() || null, year: input.year || null, price_kes: input.priceKes,
        source_file_path: sourcePath, marking_scheme_path: markingPath, preview_file_path: previewPath,
        file_name: input.sourceFile.name, file_size_bytes: input.sourceFile.size,
        rights_declaration: input.rightsDeclaration,
        ai_screening_consent_at: input.aiScreeningConsent ? new Date().toISOString() : null,
        ai_screening_provider: input.aiScreeningConsent ? 'GOOGLE_GEMINI' : null,
        status: 'EDITORIAL_REVIEW', screening_status: input.aiScreeningConsent ? 'QUEUED' : 'PASSED',
      }).select('*').single();
      if (error) throw error;
      if (input.aiScreeningConsent) {
        void supabase.functions.invoke('screen-creator-material', { body: { materialId: data.id } }).then(({ error: screeningError }) => {
          if (screeningError) console.warn('Creator material remains in human review because AI screening could not start:', screeningError);
        });
      }
      return data as CreatorMaterialRecord;
    } catch (error) {
      if (uploadedPaths.length) await supabase.storage.from('creator-materials').remove(uploadedPaths);
      throw error;
    }
  },

  async getEarningsSummary(): Promise<CreatorEarningsSummary> {
    await requireUser();
    const { data, error } = await supabase.rpc('get_creator_earnings_summary');
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return { pending_kes: Number(row?.pending_kes || 0), cleared_kes: Number(row?.cleared_kes || 0), scheduled_kes: Number(row?.scheduled_kes || 0), paid_kes: Number(row?.paid_kes || 0), lifetime_sales: Number(row?.lifetime_sales || 0) };
  },

  async listAdminQueue(): Promise<CreatorMaterialRecord[]> {
    const { data, error } = await supabase.from('creator_materials').select('*,creator_similarity_reports(*)').in('status', ['EDITORIAL_REVIEW', 'RIGHTS_EVIDENCE_REQUIRED', 'CHANGES_REQUESTED', 'APPROVED']).order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []) as CreatorMaterialRecord[];
  },

  async screenMaterial(materialId: string) {
    const { data, error } = await supabase.functions.invoke('screen-creator-material', { body: { materialId } });
    if (error) throw error;
    return data as { success: boolean; status: string; maximumSimilarity?: number; humanReviewRequired: boolean };
  },

  async reviewMaterial(materialId: string, decision: 'APPROVE' | 'PUBLISH' | 'REQUEST_CHANGES' | 'REQUEST_RIGHTS' | 'REJECT', notes: string) {
    const { data, error } = await supabase.rpc('review_creator_material', { p_material_id: materialId, p_decision: decision, p_notes: notes || null });
    if (error) throw error;
    return data as CreatorMaterialRecord;
  },

  async createSignedSourceUrl(path: string, expiresIn = 900): Promise<string> {
    const { data, error } = await supabase.storage.from('creator-materials').createSignedUrl(path, expiresIn);
    if (error) throw error;
    return data.signedUrl;
  },

  async getMaterialAccessUrl(materialId: string, asset: 'PREVIEW' | 'SOURCE' | 'MARKING_SCHEME'): Promise<string> {
    const { data, error } = await supabase.functions.invoke('creator-material-access', { body: { materialId, asset } });
    if (error) throw error;
    if (!data?.url) throw new Error(data?.error || 'The material could not be opened.');
    return data.url;
  },

  async listMyPurchasedMaterials(): Promise<CreatorMaterialRecord[]> {
    const user = await requireUser();
    const { data, error } = await supabase.from('material_entitlements').select('creator_materials(*)').eq('buyer_id', user.id).eq('access_status', 'ACTIVE').order('granted_at', { ascending: false });
    if (error) throw error;
    return (data || []).map((row: any) => row.creator_materials).filter(Boolean) as CreatorMaterialRecord[];
  },
};
