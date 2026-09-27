import { describe, it, expect, vi, beforeEach } from 'vitest';
import { curriculumReviewService as service, CurriculumReview } from '../services/curriculumReviewService';
const mocks = vi.hoisted(() => ({from:vi.fn()}));
vi.mock('../lib/supabase', () => ({supabase:{from:mocks.from}}));
describe('curriculum review persistence', () => {
  beforeEach(() => vi.clearAllMocks());
  it('reports a missing migration without a local fallback', async () => {
    mocks.from.mockReturnValue({select:()=>({order:async()=>({data:null,error:{code:'PGRST205',message:'missing'}})})});
    await expect(service.list()).rejects.toThrow('not deployed yet');
  });
  it('updates using both identity and expected revision', async () => {
    const select = vi.fn().mockResolvedValue({data:[{id:'test'}],error:null});
    const revision = vi.fn().mockReturnValue({select});
    const id = vi.fn().mockReturnValue({eq:revision});
    mocks.from.mockReturnValue({update:()=>({eq:id})});
    await service.update({id:'test',revision:4} as CurriculumReview,{status:'approved',review_note:'Checked'});
    expect(id).toHaveBeenCalledWith('id','test'); expect(revision).toHaveBeenCalledWith('revision',4);
  });
  it('does not claim success for zero updated rows', async () => {
    mocks.from.mockReturnValue({update:()=>({eq:()=>({eq:()=>({select:async()=>({data:[],error:null})})})})});
    await expect(service.update({id:'test',revision:4} as CurriculumReview,{status:'approved'})).rejects.toThrow('Refresh');
  });
});
