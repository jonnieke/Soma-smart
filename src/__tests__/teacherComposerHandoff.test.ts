import { afterEach, describe, expect, it } from 'vitest';
import {
  buildTeacherComposerRouteState,
  getTeacherComposerDestination,
  saveTeacherComposerDraft,
  loadTeacherComposerDraft,
  markTeacherComposerDraftConsumed,
} from '../types/teacherComposerHandoff';
import type { TeacherComposerDraft, TeacherComposerIntent } from '../types/teacherComposer';

const draft = (intent: TeacherComposerIntent, file?: File): TeacherComposerDraft => ({
  prompt: 'Homepage teacher request',
  intent,
  source: file ? 'UPLOAD' : 'TEXT',
  file,
  generatedContent: 'Complete generated teaching notes',
});

describe('teacher composer route contract', () => {
  afterEach(() => sessionStorage.clear());

  it('keeps the full generated notes across repeated dashboard loads without route state', async () => {
    const request = draft('CREATE');
    await saveTeacherComposerDraft(request);
    expect(await loadTeacherComposerDraft(null)).toMatchObject({
      prompt: request.prompt, generatedContent: request.generatedContent,
    });
    await markTeacherComposerDraftConsumed();
    await markTeacherComposerDraftConsumed();
    expect(await loadTeacherComposerDraft({ openWorkspace: true })).toMatchObject({
      prompt: request.prompt, generatedContent: request.generatedContent,
    });
  });

  it.each([
    ['CREATE', '/teacher', 'DASHBOARD'],
    ['MARK', '/teacher', 'MARKING'],
    ['ASSESS', '/teacher', 'QUIZ'],
    ['MARKETPLACE', '/marketplace/sell', undefined],
  ] as const)('routes %s requests to the correct destination', (intent, route, initialTab) => {
    expect(getTeacherComposerDestination(draft(intent))).toEqual({ route, initialTab });
  });

  it('opens teacher-planning tools only when the create request names them', () => {
    expect(getTeacherComposerDestination({
      ...draft('CREATE'),
      prompt: 'Create a Grade 6 lesson plan on soil erosion',
    })).toEqual({ route: '/teacher', initialTab: 'LESSON_PLAN_GENERATOR' });
    expect(getTeacherComposerDestination({
      ...draft('CREATE'),
      prompt: 'Prepare a termly scheme of work for Grade 6 Agriculture',
    })).toEqual({ route: '/teacher', initialTab: 'SCHEMES' });
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
      generatedContent: 'Complete generated teaching notes',
      fileName: 'answers.pdf',
      fileType: 'application/pdf',
      fileSize: file.size,
    });
  });
});
