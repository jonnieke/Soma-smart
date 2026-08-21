import { afterEach, describe, expect, it } from 'vitest';
import { clearStoredTeacherComposerDraft, getTeacherComposerDraft } from '../types/teacherComposer';

describe('teacher composer draft handoff', () => {
  afterEach(() => sessionStorage.clear());

  it('prefers the live route draft so attached files survive an in-page login', () => {
    const file = new File(['answer'], 'answers.txt', { type: 'text/plain' });
    const draft = { prompt: 'Mark this work', intent: 'MARK' as const, source: 'UPLOAD' as const, file };

    expect(getTeacherComposerDraft({ teacherComposerDraft: draft })).toEqual(draft);
  });

  it('recovers a recent text draft from session storage after a refresh', () => {
    sessionStorage.setItem('soma_teacher_composer_draft', JSON.stringify({
      prompt: 'Create a Grade 8 lesson plan',
      intent: 'CREATE',
      source: 'TEXT',
      savedAt: new Date().toISOString(),
    }));

    expect(getTeacherComposerDraft(null)).toMatchObject({
      prompt: 'Create a Grade 8 lesson plan',
      intent: 'CREATE',
      source: 'TEXT',
    });
  });

  it('ignores expired stored drafts', () => {
    sessionStorage.setItem('soma_teacher_composer_draft', JSON.stringify({
      prompt: 'Old request',
      intent: 'ASSESS',
      source: 'TEXT',
      savedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    }));

    expect(getTeacherComposerDraft(null)).toBeNull();
  });

  it('consumes the stored draft after a destination restores it', () => {
    sessionStorage.setItem('soma_teacher_composer_draft', JSON.stringify({
      prompt: 'Create a quiz',
      intent: 'ASSESS',
      source: 'TEXT',
      savedAt: new Date().toISOString(),
    }));

    clearStoredTeacherComposerDraft();

    expect(sessionStorage.getItem('soma_teacher_composer_draft')).toBeNull();
  });
});
