import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CurriculumReviewQueue } from '../components/CurriculumReviewQueue';
import { curriculumReviewService as service } from '../services/curriculumReviewService';
vi.mock('../services/curriculumReviewService', () => ({curriculumReviewService: {identity:vi.fn(), list:vi.fn(), update:vi.fn(), stagePilot:vi.fn()}}));
const row = {id:'test', source_id:'kicd-regular-grade6-mathematics', title:'Numbers',viewer_page:13,printed_page:'13',summaries:['Test summary'],author_id:'author',reviewer_id:'reviewer',status:'in_review' as const,review_note:'',reviewed_at:null,revision:2};
describe('Shared curriculum review queue', () => {
  beforeEach(() => {vi.clearAllMocks(); vi.mocked(service.identity).mockResolvedValue({id:'reviewer',admin:false}); vi.mocked(service.list).mockResolvedValue([row]); vi.mocked(service.update).mockResolvedValue();});
  it('loads explicitly and requires a note before approval', async () => {
    render(<CurriculumReviewQueue />);
    expect(service.list).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Open shared review queue'));
    const approve = await screen.findByText('Approve mapping accuracy');
    expect((approve as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Review note:/), {target:{value:'Verified page and accuracy'}});
    fireEvent.click(approve);
    await waitFor(() => expect(service.update).toHaveBeenCalledWith(row,{status:'approved',review_note:'Verified page and accuracy'}));
  });
  it('keeps review text when saving fails', async () => {
    vi.mocked(service.update).mockRejectedValue(new Error('Connection failed'));
    render(<CurriculumReviewQueue />);
    fireEvent.click(screen.getByText('Open shared review queue'));
    await screen.findByText('Approve mapping accuracy');
    fireEvent.change(screen.getByLabelText(/Review note:/),{target:{value:'Keep this feedback'}});
    fireEvent.click(screen.getByText('Request changes'));
    await screen.findByText('Connection failed');
    expect((screen.getByLabelText(/Review note:/) as HTMLTextAreaElement).value).toBe('Keep this feedback');
  });
  it('does not show review controls to an unassigned account', async () => {
    vi.mocked(service.identity).mockResolvedValue({id:'other',admin:false});
    render(<CurriculumReviewQueue />);
    fireEvent.click(screen.getByText('Open shared review queue'));
    await screen.findByText('Grade 6 · Numbers');
    expect(screen.queryByText('Approve mapping accuracy')).toBeNull();
  });
  it('reports an undeployed backend rather than silently using local storage', async () => {
    vi.mocked(service.list).mockRejectedValue(new Error('Shared curriculum review is not deployed yet.'));
    render(<CurriculumReviewQueue />);
    fireEvent.click(screen.getByText('Open shared review queue'));
    await screen.findByText('Shared curriculum review is not deployed yet.');
    expect(screen.queryByText('Shared review queue updated.')).toBeNull();
  });
});
