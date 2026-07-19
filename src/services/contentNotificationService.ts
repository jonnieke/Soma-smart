import { supabase } from '../lib/supabase';

export type ContentNotificationPayload = {
  sourceTable: string;
  sourceId: string | number;
  itemType: 'NOTE' | 'EXAM_PAPER' | 'CLASS_NOTE' | 'CLASS_QUIZ' | 'UPDATE';
  title: string;
  body: string;
  grade?: string | null;
  subject?: string | null;
  actionUrl?: string | null;
  targetRoles?: Array<'LEARNER' | 'TEACHER' | 'PARENT' | 'SCHOOL' | 'ADMIN'>;
  channels?: Array<'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP'>;
  targetClassId?: string | null;
  createdBy?: string | null;
};

const defaultChannels: ContentNotificationPayload['channels'] = ['IN_APP', 'EMAIL'];

export const contentNotificationService = {
  async notifyContentPublished(payload: ContentNotificationPayload) {
    const { data, error } = await supabase.functions.invoke('notify-users', {
      body: {
        ...payload,
        channels: payload.channels || defaultChannels,
      },
    });

    if (error) throw error;
    return data as { ok: boolean; notification?: { event_id: string; in_app_count: number; delivery_job_count: number } };
  },

  async notifyExamPaperPublished(paper: {
    id: string | number;
    title: string;
    grade?: string | null;
    subject?: string | null;
  }) {
    return this.notifyContentPublished({
      sourceTable: 'knowledge_base',
      sourceId: paper.id,
      itemType: 'EXAM_PAPER',
      title: `New exam paper: ${paper.title}`,
      body: `A new ${paper.subject || 'exam'} paper is ready${paper.grade ? ` for ${paper.grade}` : ''}. Open the Exam Paper Bank to view the paper and marking scheme.`,
      grade: paper.grade,
      subject: paper.subject,
      actionUrl: `/exam-papers?paper=${encodeURIComponent(String(paper.id))}`,
      targetRoles: ['LEARNER', 'TEACHER'],
      channels: ['IN_APP', 'EMAIL', 'WHATSAPP'],
    });
  },

  async notifyLearningNotesPublished(note: {
    id: string | number;
    title: string;
    grade?: string | null;
    subject?: string | null;
  }) {
    return this.notifyContentPublished({
      sourceTable: 'knowledge_base',
      sourceId: note.id,
      itemType: 'NOTE',
      title: `New notes: ${note.title}`,
      body: `Fresh ${note.subject || 'learning'} notes are available${note.grade ? ` for ${note.grade}` : ''}. Open your library to study them.`,
      grade: note.grade,
      subject: note.subject,
      actionUrl: `/learner?library=notes&material=${encodeURIComponent(String(note.id))}`,
      targetRoles: ['LEARNER', 'TEACHER'],
      channels: ['IN_APP', 'EMAIL', 'WHATSAPP'],
    });
  },

  async notifyClassPostPublished(post: {
    id: string | number;
    classId: string;
    title: string;
    subject?: string | null;
    className?: string | null;
    type: 'NOTE' | 'QUIZ';
    teacherId?: string | null;
  }) {
    return this.notifyContentPublished({
      sourceTable: 'class_posts',
      sourceId: post.id,
      itemType: post.type === 'QUIZ' ? 'CLASS_QUIZ' : 'CLASS_NOTE',
      title: post.type === 'QUIZ' ? `New class quiz: ${post.title}` : `New class notes: ${post.title}`,
      body: `${post.className || 'Your class'} has a new ${post.type === 'QUIZ' ? 'quiz' : 'lesson note'}${post.subject ? ` in ${post.subject}` : ''}.`,
      subject: post.subject,
      targetClassId: post.classId,
      createdBy: post.teacherId,
      actionUrl: `/teacher?class=${encodeURIComponent(post.classId)}`,
      targetRoles: ['LEARNER'],
      channels: ['IN_APP', 'EMAIL', 'WHATSAPP'],
    });
  },
};
