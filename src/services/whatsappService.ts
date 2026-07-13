import { StudyNote } from '../types';

const WHATSAPP_MESSAGE_LIMIT = 1800;
const SOMO_LEARNER_URL = 'https://somaai.co.ke/learner';

const compactText = (value: string) => value
  .replace(/\r\n/g, '\n')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export const normalizeWhatsAppPhone = (phone?: string | null) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0')) return `254${digits.slice(1)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
};

export const buildWhatsAppUrl = (message: string, phone?: string | null) => {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const recipient = normalizedPhone ? `/${normalizedPhone}` : '/';
  return `https://wa.me${recipient}?text=${encodeURIComponent(compactText(message))}`;
};

export const openWhatsAppShare = (message: string, phone?: string | null) => {
  const url = buildWhatsAppUrl(message, phone);
  const popup = window.open(url, '_blank', 'noopener,noreferrer');
  if (!popup) window.location.assign(url);
};

export const formatStudyNoteForWhatsApp = (note: StudyNote) => {
  const heading = [note.subject, note.grade].filter(Boolean).join(' | ');
  const availableForContent = Math.max(300, WHATSAPP_MESSAGE_LIMIT - heading.length - note.title.length - 180);
  const content = compactText(note.content);
  const trimmedContent = content.length > availableForContent
    ? `${content.slice(0, availableForContent).trimEnd()}...`
    : content;

  return [
    '*Somo Smart Study Note*',
    `*${compactText(note.title)}*`,
    heading,
    '',
    trimmedContent,
    '',
    `Revise, listen and practise on Somo Smart: ${SOMO_LEARNER_URL}`,
  ].filter((line, index, lines) => line || (index > 0 && lines[index - 1])).join('\n');
};

export const formatAkiliAnswerForWhatsApp = (answer: {
  topic: string;
  explanation: string;
  summaryPoints?: string[];
  subject?: string;
  grade?: string;
}) => {
  const topic = compactText(answer.topic).slice(0, 120);
  const context = [answer.subject, answer.grade]
    .filter(Boolean)
    .map(value => compactText(String(value)).slice(0, 60))
    .join(' | ');
  const summaryPoints = (answer.summaryPoints || [])
    .filter(Boolean)
    .slice(0, 5)
    .map(point => `- ${compactText(point).slice(0, 160)}`);
  const beforeExplanation = [
    '*Akili explained it*',
    `*${topic}*`,
    context,
    '',
    ...(summaryPoints.length > 0 ? ['*Key points*', ...summaryPoints, ''] : []),
  ].filter((line, index, lines) => line || (index > 0 && lines[index - 1]));
  const footer = `Learn, listen and practise on Somo Smart: ${SOMO_LEARNER_URL}`;
  const fixedMessage = [...beforeExplanation, '', footer].join('\n');
  const explanationLimit = Math.max(0, WHATSAPP_MESSAGE_LIMIT - fixedMessage.length);
  const explanation = compactText(answer.explanation);
  const shortenedExplanation = explanation.length > explanationLimit
    ? `${explanation.slice(0, Math.max(0, explanationLimit - 3)).trimEnd()}...`
    : explanation;

  return [...beforeExplanation, shortenedExplanation, '', footer].join('\n').trim();
};

export const formatWeeklyProgressForWhatsApp = (progress: {
  learnerName: string;
  grade?: string;
  streak: number;
  level: number;
  totalXP: number;
  sessionsThisWeek: number;
  quizAverage?: number;
  topSubjects?: string[];
  weakTopics?: string[];
}) => {
  const learnerName = compactText(progress.learnerName || 'Learner').slice(0, 80);
  const grade = progress.grade ? compactText(progress.grade).slice(0, 60) : 'Learner';
  const lines = [
    '*Somo Smart Weekly Progress*',
    `*${learnerName}* | ${grade}`,
    '',
    `Study streak: *${Math.max(0, Math.round(progress.streak))} day${progress.streak === 1 ? '' : 's'}*`,
    `Level ${Math.max(1, Math.round(progress.level))} | ${Math.max(0, Math.round(progress.totalXP))} XP`,
    `Sessions this week: ${Math.max(0, Math.round(progress.sessionsThisWeek))}`,
    Number.isFinite(progress.quizAverage) ? `Quiz average: ${Math.max(0, Math.min(100, Math.round(progress.quizAverage!)))}%` : '',
    progress.topSubjects?.length ? `Strong subjects: ${progress.topSubjects.slice(0, 3).map(compactText).join(', ')}` : '',
    progress.weakTopics?.length ? `Revising next: ${progress.weakTopics.slice(0, 2).map(compactText).join(', ')}` : '',
    '',
    `Keep learning with Akili: ${SOMO_LEARNER_URL}`,
  ];

  return lines.filter((line, index) => line || (index > 0 && lines[index - 1])).join('\n');
};
export const formatParentConnectionForWhatsApp = (learnerName?: string) => {
  const learner = compactText(learnerName || 'Your learner').slice(0, 80);
  return [
    '*Somo Smart parent connection*',
    '',
    `${learner} connected this number for learning updates.`,
    'Study notes and quiz progress can now be shared with you when the learner chooses. Nothing is sent automatically.',
    '',
    `Open Somo Smart: ${SOMO_LEARNER_URL}`,
  ].join('\n');
};
export const formatQuizResultForWhatsApp = (result: {
  topic: string;
  score: number;
  grade?: string;
}) => {
  const score = Math.max(0, Math.min(100, Math.round(result.score)));
  const topic = compactText(result.topic).slice(0, 120);
  const grade = result.grade ? compactText(result.grade).slice(0, 60) : '';
  const encouragement = score >= 80
    ? 'Strong work - keep the momentum going!'
    : score >= 50
      ? 'Good progress - a little more practice will make it stick.'
      : 'A useful starting point - review the topic and try again.';

  return [
    '*Somo Smart Learning Update*',
    `*${topic}*${grade ? ` | ${grade}` : ''}`,
    '',
    `Quiz score: *${score}%*`,
    encouragement,
    '',
    `Keep learning with Akili: ${SOMO_LEARNER_URL}`,
  ].join('\n');
};
export const formatStudyPackForWhatsApp = (notes: StudyNote[], grade?: string) => {
  const selectedNotes = notes.slice(0, 8);
  const packHeading = grade ? '*Daily Revision Pack | ' + compactText(grade) + '*' : '*Daily Revision Pack*';
  const fixedLength = packHeading.length + SOMO_LEARNER_URL.length + 120;
  const perNoteLimit = Math.max(120, Math.floor((WHATSAPP_MESSAGE_LIMIT - fixedLength) / Math.max(1, selectedNotes.length)));

  const noteSections = selectedNotes.map((note, index) => {
    const content = compactText(note.content);
    const shortened = content.length > perNoteLimit
      ? content.slice(0, perNoteLimit).trimEnd() + '...'
      : content;
    return (index + 1) + '. *' + compactText(note.title) + '* (' + compactText(note.subject || 'General') + ')\n' + shortened;
  });

  return [
    '*Somo Smart*',
    packHeading,
    '',
    ...noteSections.flatMap(section => [section, '']),
    'Open Somo Smart to listen, practise and test yourself: ' + SOMO_LEARNER_URL,
  ].join('\n').trim();
};
