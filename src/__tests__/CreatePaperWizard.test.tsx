import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getOwnerId: vi.fn(), getQuestionBank: vi.fn(), savePaper: vi.fn(), deductCredits: vi.fn() }));
vi.mock('../services/paperStudioService', () => ({ paperStudioService: mocks }));
import { CreatePaperWizard } from '../features/teacher/paperStudio/CreatePaperWizard';
beforeEach(() => { vi.resetAllMocks(); mocks.getOwnerId.mockResolvedValue('teacher-1'); mocks.getQuestionBank.mockResolvedValue([]); });
it('saves a complete paper with the teacher identity and calculated totals without charging AI credits', async () => {
    mocks.getQuestionBank.mockResolvedValue(Array.from({ length: 9 }, (_, index) => ({
        id: `q${index}`, sourceType: 'SOMA_BANK', visibility: 'PUBLIC', status: 'VERIFIED',
        grade: 'Grade 9', subject: 'Mathematics', curriculum: 'CBC_CBE', topic: 'Algebraic Expressions',
        questionType: index < 5 ? 'MULTIPLE_CHOICE' : 'SHORT_ANSWER', marks: index < 5 ? 2 : 5,
        questionText: `Question ${index}`, markingScheme: [{ criterion: 'Correct answer', marks: index < 5 ? 2 : 5 }],
        difficulty: 'MEDIUM', cognitiveLevel: 'APPLICATION',
    })));
    mocks.savePaper.mockResolvedValue(undefined);
    const created = vi.fn();
    render(<CreatePaperWizard teacherId="teacher-1" onCancel={vi.fn()} onPaperCreated={created} />);
    for (let step = 1; step < 6; step++) fireEvent.click(screen.getByRole('button', { name: /Next Step/ }));
    fireEvent.click(screen.getByRole('button', { name: /Assemble Examination Paper/ }));
    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(mocks.savePaper).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'teacher-1', totalMarks: 30 }));
    expect(mocks.savePaper.mock.calls[0][0].sections.flatMap((section: any) => section.questions)).toHaveLength(9);
    expect(mocks.deductCredits).not.toHaveBeenCalled();
});
it('keeps the wizard open and does not save or charge when the bank is insufficient', async () => {
    const created = vi.fn();
    render(<CreatePaperWizard teacherId="teacher-1" onCancel={vi.fn()} onPaperCreated={created} />);
    for (let step = 1; step < 6; step++) fireEvent.click(screen.getByRole('button', { name: /Next Step/ }));
    fireEvent.click(screen.getByRole('button', { name: /Assemble Examination Paper/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Paper not created');
    expect(mocks.savePaper).not.toHaveBeenCalled();
    expect(mocks.deductCredits).not.toHaveBeenCalled();
    expect(created).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Assemble Examination Paper/ })).toBeEnabled();
});
it('labels the disconnected AI mode as unavailable', () => {
    render(<CreatePaperWizard teacherId="teacher-1" onCancel={vi.fn()} onPaperCreated={vi.fn()} />);
    for (let step = 1; step < 5; step++) fireEvent.click(screen.getByRole('button', { name: /Next Step/ }));
    expect(screen.getByRole('button', { name: /Soma AI Hybrid Engine/ })).toBeDisabled();
    expect(screen.getByText(/Not available yet/)).toBeInTheDocument();
});

it('uses the signed-in session when the optional teacher profile is absent and saves edited totals', async () => {
    mocks.getQuestionBank.mockResolvedValue(['MULTIPLE_CHOICE', 'SHORT_ANSWER'].map((questionType, index) => ({
        id: `q${index}`, sourceType: 'SOMA_BANK', visibility: 'PUBLIC', status: 'VERIFIED',
        grade: 'Grade 9', subject: 'Mathematics', curriculum: 'CBC_CBE', topic: 'Algebraic Expressions',
        questionType, marks: 2, questionText: `Question ${index}`,
        markingScheme: [{ criterion: 'Correct answer', marks: 2 }], difficulty: 'MEDIUM', cognitiveLevel: 'APPLICATION',
    })));
    const created = vi.fn();
    render(<CreatePaperWizard onCancel={vi.fn()} onPaperCreated={created} />);
    fireEvent.click(screen.getByRole('button', { name: /Next Step/ }));
    fireEvent.click(screen.getByRole('button', { name: /Next Step/ }));
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[2], { target: { value: '1' } });
    fireEvent.change(inputs[3], { target: { value: '2' } });
    for (let step = 3; step < 6; step++) fireEvent.click(screen.getByRole('button', { name: /Next Step/ }));
    fireEvent.click(screen.getByRole('button', { name: /Assemble Examination Paper/ }));
    await waitFor(() => expect(created).toHaveBeenCalledTimes(1));
    expect(mocks.savePaper).toHaveBeenCalledWith(expect.objectContaining({ ownerId: 'teacher-1', totalMarks: 4 }));
});

it.each(['missing session', 'different account'])('does not save with %s', async (reason) => {
    if (reason === 'missing session') mocks.getOwnerId.mockRejectedValue(new Error('Sign in to your teacher account.'));
    else mocks.getOwnerId.mockResolvedValue('teacher-2');
    render(<CreatePaperWizard teacherId="teacher-1" onCancel={vi.fn()} onPaperCreated={vi.fn()} />);
    for (let step = 1; step < 6; step++) fireEvent.click(screen.getByRole('button', { name: /Next Step/ }));
    fireEvent.click(screen.getByRole('button', { name: /Assemble Examination Paper/ }));
    await screen.findByRole('alert');
    expect(mocks.savePaper).not.toHaveBeenCalled();
    expect(mocks.getQuestionBank).not.toHaveBeenCalled();
});
