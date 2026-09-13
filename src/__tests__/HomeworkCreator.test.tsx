import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ load: vi.fn(), save: vi.fn(), publish: vi.fn() }));
vi.mock('../services/geminiService', () => ({ generatePracticeQuestions: vi.fn() }));
vi.mock('../services/analyticsEventService', () => ({ trackAnalyticsEvent: vi.fn() }));
vi.mock('../services/teacherWorkflowService', () => ({ loadTeacherWorkflowDraft: mocks.load, saveTeacherWorkflowDraft: mocks.save }));
vi.mock('../services/teacherHomeworkService', () => ({ publishTeacherHomework: mocks.publish }));
import { HomeworkCreator } from '../features/teacher/HomeworkCreator';

describe('HomeworkCreator', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.load.mockResolvedValue({ payload: { homework: { id: 'saved-id', title: 'Fractions homework',
            questions: [{ text: 'Half of eight?', marks: 2, modelAnswerOutline: 'Four' }] } } });
        mocks.save.mockResolvedValue(undefined);
    });
    const show = () => render(<HomeworkCreator onBack={vi.fn()} subjects={['Maths']} classes={['Grade 6']} teacherId="teacher-1" />);
    it('keeps the questions and displays a posting failure', async () => {
        mocks.publish.mockRejectedValue(new Error('Posting failed. Draft kept.'));
        show();
        fireEvent.click(await screen.findByRole('button', { name: 'Post to Grade 6' }));
        expect(await screen.findByRole('alert')).toHaveTextContent('Draft kept');
        expect(screen.getByText(/Half of eight/)).toBeInTheDocument();
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
    it('waits for confirmation, prevents repeat clicks and retains the teacher copy', async () => {
        let finish!: (value: unknown) => void;
        mocks.publish.mockReturnValue(new Promise(resolve => { finish = resolve; }));
        show();
        const button = await screen.findByRole('button', { name: 'Post to Grade 6' });
        fireEvent.click(button);
        fireEvent.click(button);
        await waitFor(() => expect(mocks.publish).toHaveBeenCalledTimes(1));
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        finish({ id: 'saved-id' });
        expect(await screen.findByRole('status')).toHaveTextContent('Posted to the Grade 6 classroom stream');
        expect(screen.getByText(/Half of eight/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Posted to classroom' })).toBeDisabled();
        expect(mocks.save).toHaveBeenCalledWith('teacher-1', 'HOMEWORK', expect.objectContaining({ posted: true }), expect.anything());
    });
});
