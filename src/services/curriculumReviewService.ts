import { supabase } from '../lib/supabase';
import { curriculumPilot } from '../data/curriculumPilot';

export interface CurriculumReview {
  id: string; source_id: string; title: string; viewer_page: number; printed_page: string;
  summaries: string[]; author_id: string; reviewer_id: string | null;
  status: 'draft' | 'in_review' | 'changes_requested' | 'approved';
  review_note: string; reviewed_at: string | null; revision: number;
}
const table = 'curriculum_mapping_reviews';
function fail(error: {message: string; code?: string}): never {
  if (['42P01', 'PGRST205'].includes(error.code || '')) throw new Error('Shared curriculum review is not deployed yet. Your local drafts are unchanged.');
  throw new Error(error.message);
}
export const curriculumReviewService = {
  async list(): Promise<CurriculumReview[]> {
    const { data, error } = await supabase.from(table).select('*').order('updated_at', {ascending: false});
    if (error) fail(error);
    return data || [];
  },
  async identity() {
    const {data, error} = await supabase.auth.getUser();
    if (error || !data.user) throw new Error('Sign in to use shared curriculum review.');
    const admin = await supabase.rpc('is_soma_admin');
    if (admin.error) fail(admin.error);
    return {id: data.user.id, admin: admin.data === true};
  },
  async stagePilot(pilotId: string) {
    const pilot = curriculumPilot.find(p => p.id === pilotId);
    if (!pilot) throw new Error('Unknown pilot mapping.');
    const identity = await this.identity();
    if (!identity.admin) throw new Error('Admin access required.');
    const {error} = await supabase.from(table).insert({
      id: pilot.id, source_id: pilot.sourceId, title: `${pilot.strand} / ${pilot.topic}`,
      viewer_page: pilot.viewerPage, printed_page: pilot.printedPage,
      summaries: pilot.outcomes.map(o => o.summary), author_id: identity.id,
    });
    if (error?.code === '23505') throw new Error('This pilot is already shared. Refresh the queue to review it.');
    if (error) fail(error);
  },
  async update(row: CurriculumReview, patch: Partial<Pick<CurriculumReview, 'status' | 'reviewer_id' | 'review_note' | 'summaries'>>) {
    const {data, error} = await supabase.from(table).update(patch).eq('id', row.id).eq('revision', row.revision).select('id');
    if (error) fail(error);
    if (!data?.length) throw new Error('This mapping changed or access was removed. Refresh before trying again.');
  },
};
