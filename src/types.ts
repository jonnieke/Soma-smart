export enum UserRole {
  LEARNER = 'LEARNER',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  NONE = 'NONE'
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  SCAN_EXPLAIN = 'SCAN_EXPLAIN',
  QUIZ = 'QUIZ',
  HISTORY = 'HISTORY',
  UPLOAD_CONVERT = 'UPLOAD_CONVERT',
  VOICE_NOTES = 'VOICE_NOTES',
  QUIZ_GENERATOR = 'QUIZ_GENERATOR',
  PARENT_OVERVIEW = 'PARENT_OVERVIEW',
  REVISION = 'REVISION',
  PRICING = 'PRICING'
}

export type SubscriptionTier = 'FREE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'TERMLY' | 'ANNUAL';
export type UserSegment = 'STUDENT' | 'TEACHER' | 'SCHOOL';

export interface ExplanationResult {
  topic: string;
  explanation: string; // Markdown
  summaryPoints: string[];
  level: 'Simple' | 'Exam';
  relatedTopics?: string[];
  transcript?: string;
}

export interface QuizQuestion {
  id: number | string;
  type: 'MCQ' | 'SHORT';
  question: string;
  options?: string[];
  correctAnswer: string | number; // For MCQ: option text/index. For Short: key phrase.
  explanation: string;
}

export interface QuizData {
  topic: string;
  questions: QuizQuestion[];
}

export interface TeacherNote {
  id: string;
  topic: string;
  structuredNotes: string;
  simplifiedNotes: string;
  date: string;
}

export interface LearnerActivity {
  id: string;
  type: 'EXPLANATION' | 'QUIZ';
  topic: string;
  date: string;
  score?: number; // percentage
  details?: string;
  pendingSync?: boolean;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface LearnerProfile {
  id?: string;
  name: string;
  code: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiry: string | null;
  schoolId?: string;
}

export interface TeacherProfile {
  id: string;
  name: string;
  email?: string;
  classes: string[]; // e.g. ["Grade 4", "Grade 5"]
  subjects: string[]; // e.g. ["Math", "Science"]
}

export interface TeacherActivity {
  id: string;
  type: 'NOTE' | 'QUIZ';
  title: string;
  className: string;
  subject: string;
  date: string;
  content: any; // The full Note or Quiz object
  pendingSync?: boolean;
}

// --- REVISION ASSISTANT TYPES ---

export enum RevisionMode {
  LEARN = 'LEARN',
  EXAM = 'EXAM',
  WEAK_AREAS = 'WEAK_AREAS'
}

export enum TutoringStep {
  A_UNDERSTAND = 'A_UNDERSTAND',
  B_THINKING = 'B_THINKING',
  C_SOLUTION = 'C_SOLUTION',
  D_REFLECTION = 'D_REFLECTION'
}

export interface ExamQuestion {
  id: number;
  number: string; // "1a", "2", etc.
  text: string;    // Extracted text
  topic: string;
  subStrand?: string;
  competency?: string;
  marks?: number;
}

export interface ExamAnalysis {
  subject: string;
  grade: string;
  questions: ExamQuestion[];
}

export interface TutorResponse {
  text: string; // The main teaching text
  step: TutoringStep;

  nextStep: TutoringStep | 'COMPLETE';
  hint?: string; // Optional hint
}

export interface LessonRecap {
  topic: string;
  summary: string; // Brief overview
  keyPoints: string[]; // Bullet points
  examTips: string[]; // "This often comes in exams as..."
  definitions: { term: string; definition: string }[];
  teacherNotes?: string; // Teacher specific field
}

// --- DARASA MODE TYPES ---

export interface NoteSection {
  title: string;
  content: string;
}

export interface LessonResult {
  id: string;
  topic: string;
  date: string;
  simplifiedNotes: NoteSection[];
  quiz: QuizQuestion[];
  summary: string;
}

export interface School {
  id: string;
  name: string;
  teacherLimit: number;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  expiry: string;
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  segment: UserSegment;
  name: string;
  price: number;
  duration: SubscriptionTier;
  savings?: string;
}
