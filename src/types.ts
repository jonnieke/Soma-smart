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
  PARENT_OVERVIEW = 'PARENT_OVERVIEW'
}

export interface ExplanationResult {
  topic: string;
  explanation: string; // Markdown
  summaryPoints: string[];
  level: 'Simple' | 'Exam';
  relatedTopics?: string[];
  transcript?: string;
}

export interface QuizQuestion {
  id: number;
  type: 'MCQ' | 'SHORT';
  question: string;
  options?: string[];
  correctAnswer: string; // For MCQ: option text. For Short: key phrase.
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
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface LearnerProfile {
  name: string;
  code: string;
}