import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadStudyNotes,
  migrateGuestNotebook,
  saveStudyNote,
  updateStudyNoteMastery,
} from '../services/notebookService';

describe('learner notebook persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and reloads a note for its learner', () => {
    saveStudyNote('SOMA-1000', {
      title: 'Photosynthesis',
      content: 'Plants use light energy to make food.',
      subject: 'Biology',
      source: 'ai_answer',
    });

    expect(loadStudyNotes('SOMA-1000')).toMatchObject([
      { title: 'Photosynthesis', subject: 'Biology', masteryStatus: 'new' },
    ]);
  });

  it('updates an existing source and title instead of creating duplicates', () => {
    saveStudyNote('SOMA-1000', { title: 'Fractions', content: 'First version.', source: 'manual' });
    saveStudyNote('SOMA-1000', { title: 'fractions', content: 'Improved version.', source: 'manual' });

    const notes = loadStudyNotes('SOMA-1000');
    expect(notes).toHaveLength(1);
    expect(notes[0].content).toBe('Improved version.');
  });

  it('records mastery without losing the note', () => {
    const note = saveStudyNote('SOMA-1000', { title: 'Cells', content: 'Cells are basic units of life.' });
    updateStudyNoteMastery('SOMA-1000', note.id, 'understood');

    expect(loadStudyNotes('SOMA-1000')[0].masteryStatus).toBe('understood');
  });

  it('moves guest notes into the registered learner notebook', () => {
    saveStudyNote('guest', { title: 'Weather', content: 'Weather changes daily.' });

    expect(migrateGuestNotebook('SOMA-1000')).toBe(1);
    expect(loadStudyNotes('guest')).toHaveLength(0);
    expect(loadStudyNotes('SOMA-1000')[0].title).toBe('Weather');
  });
});
