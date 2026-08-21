import { afterEach, describe, expect, it } from 'vitest';
import {
  buildTeacherComposerRouteState,
  getTeacherComposerDestination,
  saveTeacherComposerDraft,
} from '../types/teacherComposerHandoff';
import type { TeacherComposerDraft, TeacherComposerIntent } from '../types/teacherComposer';

const draft = (intent: TeacherComposerIntent, file?: File): TeacherComposerDraft => ({
  prompt: 'Homepage teacher request',
  intent,
  source: file ? 'UPLOAD' : 'TEXT',
  file,
});

describe('teacher composer route contract', () => {
  afterEach(() => sessionStorage.clear());

  it.each([
    ['CREATE', '/teacher', 'LESSON_PLAN_GENERATOR'],
    ['MARK', '/teacher', 'MARKING'],
    ['ASSESS', '/teacher', 'QUIZ'],
    ['MARKETPLACE', '/marketplace/sell', undefined],
  ] as const)('routes %s requests to the correct destination', (intent, route, initialTab) => {
    expect(getTeacherComposerDestination(draft(intent))).toEqual({ route, initialTab });
  });

  it('routes create requests with an attachment to the converter', () => {
    const file = new File(['lesson'], 'lesson.pdf', { type: 'application/pdf' });
    expect(getTeacherComposerDestination(draft('CREATE', file))).toEqual({
      route: '/teacher',
      initialTab: 'CONVERT',
    });
  });

  it('builds the state used to continue after login or registration', () => {
    const request = draft('MARK');
    expect(buildTeacherComposerRouteState(request)).toEqual({
      teacherComposerDraft: request,
      source: 'homepage_teacher_composer',
      initialTab: 'MARKING',
    });
  });

  it('stores refresh-safe metadata while the attachment is written to IndexedDB', async () => {
    const file = new File(['answers'], 'answers.pdf', { type: 'application/pdf' });
    await saveTeacherComposerDraft(draft('MARK', file));

    expect(JSON.parse(sessionStorage.getItem('soma_teacher_composer_draft') || 'null')).toMatchObject({
      prompt: 'Homepage teacher request',
      intent: 'MARK',
      source: 'UPLOAD',
      fileName: 'answers.pdf',
      fileType: 'application/pdf',
      fileSize: file.size,
    });
  });
});
