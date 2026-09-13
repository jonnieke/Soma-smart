import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), notice: vi.fn() }));
vi.mock('../services/paperStudioService', () => ({ paperStudioService: { getPaperById: mocks.load, savePaper: mocks.save, getPaperStorageNotice: mocks.notice } }));
vi.mock('../services/assessmentEngine/assessmentAIProvider', () => ({ assessmentAIProvider: {} }));
vi.mock('../features/teacher/paperStudio/PrintablePaperView', () => ({ PrintablePaperView: () => null }));
import { ExaminationEditor } from '../features/teacher/paperStudio/ExaminationEditor';
beforeEach(() => { vi.resetAllMocks(); mocks.notice.mockReturnValue(''); });
it('shows a useful missing-paper message instead of an endless spinner', async () => {
    mocks.load.mockResolvedValue(null);
    render(<ExaminationEditor paperId="missing" onBackToWorkspace={vi.fn()} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('not found for your account');
    expect(screen.getByRole('button', { name: 'Back to my papers' })).toBeInTheDocument();
});
it('retains the paper and explains when save confirmation fails', async () => {
    mocks.load.mockResolvedValue({ id: 'p', title: 'My retained paper', grade: 'Grade 6', subject: 'Maths', totalMarks: 0, durationMinutes: 30, sections: [], schoolBranding: { schoolName: 'Fixture School' }, instructions: [] });
    mocks.save.mockRejectedValue(new Error('Saved on this device, but cloud sync was not confirmed.'));
    render(<ExaminationEditor paperId="p" onBackToWorkspace={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Save Draft' }));
    expect(await screen.findByRole('status')).toHaveTextContent('cloud sync was not confirmed');
    expect(screen.getAllByText('My retained paper').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Save Draft' })).toBeEnabled();
});
