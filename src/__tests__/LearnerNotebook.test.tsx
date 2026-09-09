import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LearnerNotebook } from '../features/learner/LearnerNotebook';
import { loadStudyNotes, saveStudyNote, deleteStudyNote } from '../services/notebookService';
import type { StudyNote } from '../types';
vi.mock('../services/notebookService', () => ({ NOTEBOOK_CHANGED_EVENT: 'notes-changed', loadStudyNotes: vi.fn(() => []), syncNotebookFromCloud: vi.fn(async () => []), saveStudyNote: vi.fn(), deleteStudyNote: vi.fn(), updateStudyNoteMastery: vi.fn() }));
vi.mock('../services/whatsappService', () => ({ formatStudyNoteForWhatsApp: vi.fn(), formatStudyPackForWhatsApp: vi.fn(), openWhatsAppShare: vi.fn() }));
vi.mock('../components/NotebookAudioPlayer', () => ({ NotebookAudioPlayer: () => null }));
const note: StudyNote = { id: 'note-1', title: 'Fractions', content: 'One half is one of two equal parts.', subject: 'Mathematics', grade: 'Grade 7', topic: 'Fractions', source: 'manual', masteryStatus: 'new', createdAt: '2026-09-09', updatedAt: '2026-09-09' };
const props = () => ({ ownerKey: 'test', isRegistered: false, onBack: vi.fn(), onOpenNote: vi.fn(), onListenNote: vi.fn(), onQuizNote: vi.fn(), onRegister: vi.fn() });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(loadStudyNotes).mockReturnValue([]); vi.mocked(saveStudyNote).mockReturnValue(note); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
describe('Learner notebook', () => {
  it('offers a clear first-note action and focuses the editor', async () => {
    render(<LearnerNotebook {...props()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Write my first note' }));
    expect(screen.getByLabelText('Title')).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Save note' })).toBeDisabled();
  });
  it('saves a note with labelled fields', async () => {
    render(<LearnerNotebook {...props()} />);
    fireEvent.click(screen.getByRole('button', { name: 'New note' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Fractions' } });
    fireEvent.change(screen.getByLabelText('Your note'), { target: { value: note.content } });
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
    expect(saveStudyNote).toHaveBeenCalledWith('test', expect.objectContaining({ title: 'Fractions', content: note.content }));
    expect(screen.getByRole('status')).toHaveTextContent('Note saved.');
  });
  it('preserves the draft when the editor is closed and reopened', () => {
    render(<LearnerNotebook {...props()} />);
    fireEvent.click(screen.getByRole('button', { name: 'New note' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'My draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close note editor' }));
    fireEvent.click(screen.getByRole('button', { name: 'New note' }));
    expect(screen.getByLabelText('Title')).toHaveValue('My draft');
  });
  it('reads a saved note in place without entering an AI answer screen', async () => {
    vi.mocked(loadStudyNotes).mockReturnValue([note]); const callbacks = props();
    render(<LearnerNotebook {...callbacks} />);
    fireEvent.click(await screen.findByRole('button', { name: 'Read note' }));
    expect(screen.getByRole('button', { name: 'Close note' })).toHaveAttribute('aria-expanded', 'true');
    expect(callbacks.onOpenNote).not.toHaveBeenCalled();
  });
  it('distinguishes an empty search from an empty notebook', async () => {
    vi.mocked(loadStudyNotes).mockReturnValue([note]); render(<LearnerNotebook {...props()} />);
    fireEvent.change(screen.getByLabelText('Search notes'), { target: { value: 'nothing' } });
    expect(await screen.findByText('No matching notes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Show all notes' }));
    expect(screen.getByText('Fractions')).toBeInTheDocument();
  });
  it('requires confirmation before deleting a saved note', async () => {
    vi.mocked(loadStudyNotes).mockReturnValue([note]); const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<LearnerNotebook {...props()} />);
    fireEvent.click(await screen.findByText('More for this note'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Fractions' }));
    expect(deleteStudyNote).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Fractions' }));
    expect(deleteStudyNote).toHaveBeenCalledWith('test', 'note-1');
  });
});
