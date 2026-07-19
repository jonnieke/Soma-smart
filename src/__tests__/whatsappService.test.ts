import { describe, expect, it } from 'vitest';
import { buildWhatsAppUrl, formatAkiliAnswerForWhatsApp, formatParentConnectionForWhatsApp, formatQuizResultForWhatsApp, formatStudyNoteForWhatsApp, formatStudyPackForWhatsApp, formatWeeklyProgressForWhatsApp, normalizeWhatsAppPhone } from '../services/whatsappService';
import { StudyNote } from '../types';

const note: StudyNote = {
  id: 'private-note-id',
  studentCode: 'SOMA-PRIVATE',
  title: 'Photosynthesis recap',
  content: 'Plants use sunlight, water and carbon dioxide to make glucose and oxygen.',
  subject: 'Biology',
  grade: 'Grade 7',
  source: 'ai_answer',
  createdAt: '2026-07-13T00:00:00.000Z',
  updatedAt: '2026-07-13T00:00:00.000Z',
  masteryStatus: 'learning',
};

describe('WhatsApp learning shares', () => {
  it('normalizes common Kenyan phone formats', () => {
    expect(normalizeWhatsAppPhone('0712 345 678')).toBe('254712345678');
    expect(normalizeWhatsAppPhone('+254 712 345 678')).toBe('254712345678');
    expect(normalizeWhatsAppPhone('712345678')).toBe('254712345678');
  });

  it('builds contact-picker and direct-recipient URLs', () => {
    expect(buildWhatsAppUrl('Hello class')).toContain('https://wa.me/?text=Hello%20class');
    expect(buildWhatsAppUrl('Hello parent', '0712345678')).toContain('https://wa.me/254712345678?text=Hello%20parent');
  });

  it('shares note content without private account identifiers', () => {
    const message = formatStudyNoteForWhatsApp(note);
    expect(message).toContain('Photosynthesis recap');
    expect(message).toContain('Biology | Grade 7');
    expect(message).not.toContain(note.id);
    expect(message).not.toContain(note.studentCode);
  });

  it('formats an Akili answer as a concise WhatsApp learning card', () => {
    const message = formatAkiliAnswerForWhatsApp({
      topic: 'Why leaves are green',
      explanation: 'Chlorophyll absorbs red and blue light while reflecting green light.',
      summaryPoints: ['Chlorophyll is the main green pigment.', 'Green light is reflected.'],
      subject: 'Biology',
      grade: 'Grade 7',
    });

    expect(message).toContain('Akili explained it');
    expect(message).toContain('Why leaves are green');
    expect(message).not.toContain('*');
    expect(message).toContain('Biology | Grade 7');
    expect(message).toContain('Key points');
    expect(message.length).toBeLessThanOrEqual(1800);
  });
  it('formats a weekly progress update without private account identifiers', () => {
    const message = formatWeeklyProgressForWhatsApp({
      learnerName: 'Amina',
      grade: 'Grade 7',
      streak: 4,
      level: 3,
      totalXP: 240,
      sessionsThisWeek: 5,
      quizAverage: 82,
      topSubjects: ['Mathematics', 'Science'],
      weakTopics: ['Fractions'],
    });

    expect(message).toContain('*Somo Smart Weekly Progress*');
    expect(message).toContain('*Amina* | Grade 7');
    expect(message).toContain('Quiz average: 82%');
    expect(message).toContain('Revising next: Fractions');
    expect(message).not.toContain('student_id');
    expect(message.length).toBeLessThanOrEqual(1800);
  });
  it('explains the parent connection without promising automatic messages', () => {
    const message = formatParentConnectionForWhatsApp('Amina');

    expect(message).toContain('*Somo Smart parent connection*');
    expect(message).toContain('Amina connected this number');
    expect(message).toContain('Nothing is sent automatically');
  });
  it('formats a parent-friendly quiz progress update', () => {
    const message = formatQuizResultForWhatsApp({
      topic: 'Fractions and decimals',
      score: 84.6,
      grade: 'Grade 7',
    });

    expect(message).toContain('*Somo Smart Learning Update*');
    expect(message).toContain('*Fractions and decimals* | Grade 7');
    expect(message).toContain('Quiz score: *85%*');
    expect(message).toContain('Strong work');
  });
  it('combines selected notes into one bounded revision pack', () => {
    const pack = formatStudyPackForWhatsApp([
      note,
      { ...note, id: 'second-private-id', title: 'Cell structure', subject: 'Science' },
    ], 'Grade 7');

    expect(pack).toContain('Daily Revision Pack | Grade 7');
    expect(pack).toContain('1. *Photosynthesis recap*');
    expect(pack).toContain('2. *Cell structure*');
    expect(pack.length).toBeLessThanOrEqual(1800);
    expect(pack).not.toContain('private-id');
  });
});
