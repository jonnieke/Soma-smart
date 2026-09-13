import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TeacherNotesWorkspace } from '../features/teacher/TeacherNotesWorkspace';
import { generateTeacherNotes, type NotesResult } from '../features/teacher/teacherNotesGeneration';
vi.mock('../features/teacher/teacherNotesGeneration', () => ({ generateTeacherNotes: vi.fn() }));
vi.mock('../components/Shared', () => ({ MarkdownText: ({ content }: { content: string }) => <div>{content}</div> }));
const draft = { prompt: 'Grade 6 soil erosion notes', intent: 'CREATE' as const, source: 'TEXT' as const, generatedContent: 'Soil erosion preview.' };
const props = { owner: 'teacher-a', draft, onSave: vi.fn() };

beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
describe('teacher notes workspace', () => {
  it('keeps the preview visible during generation, then restores the full notes after remount without generating again', async () => {
    let finish!: (value: NotesResult) => void;
    vi.mocked(generateTeacherNotes).mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    const view = render(<TeacherNotesWorkspace {...props} />);
    expect(screen.getByText('Soil erosion preview.')).toBeInTheDocument();
    await act(async () => finish({ notes: 'Complete notes: causes, effects and prevention.' }));
    expect(screen.getByText('Complete notes: causes, effects and prevention.')).toBeInTheDocument();
    view.unmount();
    render(<TeacherNotesWorkspace {...props} />);
    expect(screen.getByText('Complete notes: causes, effects and prevention.')).toBeInTheDocument();
    expect(generateTeacherNotes).toHaveBeenCalledTimes(1);
  });

  it('expands without losing notes and creates a separate quiz using the expanded topic content', async () => {
    vi.mocked(generateTeacherNotes)
      .mockResolvedValueOnce({ notes: 'Full soil erosion notes.' })
      .mockResolvedValueOnce({ notes: 'Terracing on sloping farms.' })
      .mockResolvedValueOnce({ questions: '1. Explain terracing. (2 marks)', answers: '1. Terraces slow runoff. Award two marks.' });
    render(<TeacherNotesWorkspace {...props} />);
    await screen.findByText('Full soil erosion notes.');
    fireEvent.click(screen.getByRole('button', { name: 'Expand notes' }));
    await screen.findByText(/Full soil erosion notes\.\s+Terracing on sloping farms\./);
    fireEvent.click(screen.getByRole('button', { name: 'Create quiz' }));
    await screen.findByText('1. Explain terracing. (2 marks)');
    expect(screen.queryByText(/Award two marks/)).not.toBeInTheDocument();
    expect(generateTeacherNotes).toHaveBeenLastCalledWith(expect.objectContaining({
      action: 'quiz', prompt: draft.prompt, notes: 'Full soil erosion notes.\n\nTerracing on sloping farms.',
    }));
    fireEvent.click(screen.getByRole('button', { name: 'Answer key & marks' }));
    expect(screen.getByText(/Award two marks/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save to library' }));
    expect(props.onSave).toHaveBeenCalledWith('Full soil erosion notes.\n\nTerracing on sloping farms.');
  });

  it('preserves the preview on failure and permits retry', async () => {
    vi.mocked(generateTeacherNotes).mockRejectedValueOnce(new Error('Service unavailable')).mockResolvedValueOnce({ notes: 'Recovered full notes.' });
    render(<TeacherNotesWorkspace {...props} />);
    await screen.findByRole('alert');
    expect(screen.getByText('Soil erosion preview.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Generate full notes' }));
    await waitFor(() => expect(screen.getByText('Recovered full notes.')).toBeInTheDocument());
  });
});
