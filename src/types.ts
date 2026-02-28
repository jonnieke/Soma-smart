export enum UserRole {
  LEARNER = 'LEARNER',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT',
  REVISION = 'REVISION',
  SCHOOL = 'SCHOOL',
  GUEST = 'GUEST',
  NONE = 'NONE'
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  SCAN_EXPLAIN = 'SCAN_EXPLAIN',
  SCAN = 'SCAN',
  QUIZ = 'QUIZ',
  HISTORY = 'HISTORY',
  UPLOAD_CONVERT = 'UPLOAD_CONVERT',
  VOICE_NOTES = 'VOICE_NOTES',
  QUIZ_GENERATOR = 'QUIZ_GENERATOR',
  PARENT_OVERVIEW = 'PARENT_OVERVIEW',
  REVISION = 'REVISION',
  PRICING = 'PRICING',
  PROFILE = 'PROFILE'
}

export type SubscriptionTier = 'FREE' | 'PRO' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'TERMLY' | 'ANNUAL';
export type UserSegment = 'STUDENT' | 'TEACHER' | 'SCHOOL';

export interface SubtopicBlock {
  type: 'paragraph' | 'list';
  text?: string;
  items?: string[];
}

export interface Subtopic {
  title: string;
  content?: string; // Legacy markdown content
  blocks?: SubtopicBlock[]; // New structured content for readable formatting
}

export interface RecapNode {
  point: string;   // Short summary point
  details: string; // Detailed paragraph explaining the point
}

export interface ExplanationResult {
  topic: string;
  explanation: string; // Markdown (Overview)
  subtopics?: Subtopic[]; // Deeper scrollable topics
  recapNodes?: RecapNode[]; // Interactive detailed checklists
  summaryPoints: string[]; // Keep for backward compatibility
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
  type: 'EXPLANATION' | 'QUIZ' | 'STUDY';
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
  parentPhone?: string;
  parentPin?: string; // 4-digit PIN set by parent to approve chat
  chatApproved?: boolean; // Whether parent has approved learner-teacher chat
  sessionId?: string; // For backward compatibility? Or primary current session?
  activeSessions?: string[]; // New: list of active session IDs (max 2)
}

export interface TeacherProfile {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  classes: string[]; // e.g. ["Grade 4", "Grade 5"]
  subjects: string[]; // e.g. ["Math", "Science"]
  schoolId?: string;
  sessionId?: string;
  activeSessions?: string[];
  isAvailable?: boolean;
  rating?: number;
  verifiedBadge?: boolean;
  walletBalance?: number;
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

export interface SchoolProfile {
  id: string;
  name: string;
  email: string;
  teacherLimit: number;
  studentLimit: number;
  subscriptionStatus: 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  expiry: string;
  daysRemaining?: number;
  sessionId?: string;
  activeSessions?: string[];
}
// --- School Types ---
export interface SchoolStats {
  teachers: number;
  students: number;
  lessons: number;
  storageUsed: number; // in GB
  teacherTrend: string;
  studentTrend: string;
  lessonTrend: string;
}

export interface SchoolTeacher {
  id: string;
  name: string;
  subject: string;
  impact: string;
  lessons: number;
}

export interface SchoolMaterial {
  id: string;
  school_id: string;
  teacher_id: string;
  teacher_name?: string;
  title: string;
  description: string;
  file_url: string;
  category: 'NOTES' | 'EXAM' | 'ASSIGNMENT' | 'OTHER';
  target_grade: string;
  target_subject: string;
  is_public: boolean;
  created_at: string;
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

// --- EXAM PRACTICE TYPES ---

export enum ExamPracticeMode {
  TIMED_QUIZ = 'TIMED_QUIZ',
  PRACTICE_BY_TOPIC = 'PRACTICE_BY_TOPIC',
  FULL_PAPER = 'FULL_PAPER'
}

export interface AnswerAttempt {
  questionId: number;
  questionNumber: string;
  questionText: string;
  learnerAnswer: string;
  marksAwarded: number;
  marksAvailable: number;
  modelAnswer: string;
  feedback: string;       // Why marks were gained/lost
  examTip?: string;       // "In KCSE 2024, this topic appeared as..."
  isCorrect: boolean;
  topic: string;
  timeTakenSeconds?: number;
}

export interface ExamPracticeResult {
  id: string;
  date: string;
  subject: string;
  grade: string;
  paperTitle?: string;
  mode: ExamPracticeMode;
  totalMarks: number;
  marksObtained: number;
  percentage: number;
  timeLimitSeconds?: number;
  timeTakenSeconds: number;
  attempts: AnswerAttempt[];
  weakTopics: string[];
  strongTopics: string[];
}

export interface PerformanceRecord {
  id: string;
  date: string;
  subject: string;
  grade: string;
  score: number;          // percentage
  totalQuestions: number;
  correctAnswers: number;
  timeSpentSeconds: number;
  weakTopics: string[];
  mode: ExamPracticeMode;
}

export interface MarkingResult {
  marksAwarded: number;
  marksAvailable: number;
  isCorrect: boolean;
  modelAnswer: string;
  feedback: string;
  examTip: string;
}

// --- AI STRUCTURED NOTES TYPES ---

export interface StudyTopic {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  examRelevance: 'Low' | 'Medium' | 'High' | 'Very High';
  keyConcepts: string[];
  content: string;          // Detailed markdown content
  examTips: string[];       // How this topic appears in exams
  commonMistakes: string[]; // What candidates get wrong
}

export interface StructuredStudyNotes {
  subject: string;
  grade: string;
  title: string;
  overview: string;         // 2-3 sentence summary
  topics: StudyTopic[];
  totalTopics: number;
}

export interface QuestionExplanation {
  whatItTests: string;       // "This question tests your understanding of..."
  keyConcepts: string[];     // Concepts needed to answer
  approachStrategy: string;  // Step-by-step approach
  commonPitfalls: string[];  // What to avoid
  examContext: string;       // "This type of question appears in KCSE Paper 1..."
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
  teacherLimit?: number;
  studentLimit?: number;
  features?: string[];
}

// --- MONETIZATION TYPES ---

export interface TutoringRequest {
  id: string;
  studentId: string;
  studentName?: string;
  teacherId?: string;
  topic: string;
  description: string;
  grade?: string; // New
  subject?: string; // New
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';
  price: number;
  pricingType: 'FREE' | 'FIXED' | 'RATE_ME'; // New
  response?: string;
  responseType?: 'TEXT' | 'VOICE' | 'VIDEO';
  attachments?: string[]; // New: URLs for video/files
  rating?: number; // New: Learner's rating
  feedback?: string; // New: Learner's feedback
  createdAt: string;
  completedAt?: string;
}

export interface TeacherWallet {
  balance: number;
  currency: string;
  lastWithdrawal?: string;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'EARNING' | 'WITHDRAWAL';
  amount: number;
  description: string;
  date: string;
  status: 'COMPLETED' | 'PENDING';
}

export interface MaterialListing {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string;
  description: string;
  price: number;
  grade: string;
  subject: string;
  category: 'NOTES' | 'REVISION_PAPER' | 'MARKING_SCHEME' | 'RECORDED_LESSON';
  downloadCount: number;
  rating: number;
  fileUrl: string;
  previewUrl?: string;
  createdAt: string;
}

// Chat Message Types
export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  senderRole: 'STUDENT' | 'TEACHER';
  messageType: 'TEXT' | 'VOICE' | 'VIDEO';
  content: string;
  mediaUrl?: string;
  createdAt: string;
}

// Podcast Types
export interface PodcastSegment {
  speaker: 'Host' | 'Guest';
  text: string;
}

export interface PodcastScript {
  title: string;
  script: PodcastSegment[];
}

// --- SUPER TEACHER PHASE 2: ADAPTIVE TUTORING TYPES ---

export type LearningStyle = 'Visual' | 'Analogical' | 'Technical';

export interface MasteryRecord {
  topic: string;
  subject?: string;
  subStrand?: string;
  grade?: string;
  masteryLevel: number;    // 0-100
  timesTested: number;
  lastTested: string;      // ISO date
}

export interface SpacedRepetitionItem {
  topic: string;
  subject?: string;
  grade?: string;
  nextReviewDate: string;  // ISO date
  intervalDays: number;
  easeFactor: number;      // SM-2 ease factor (default 2.5)
  lastScore: number;       // 0-100
  reviewCount: number;
}

export interface SuperTeacherMemory {
  masteryGraph: Record<string, number>;  // topic → 0-100% mastery
  preferredStyle: LearningStyle;
  recentHurdles: string[];               // topics student struggles with
  spacedRepetitionQueue: SpacedRepetitionItem[];
}

// --- SUPER TEACHER PHASE 3: EVOLUTIONARY EDUCATOR TYPES ---

export type TeachingPersona = 'Coach' | 'Professor' | 'Mentor' | 'DrillSergeant';

export interface TeachingStrategy {
  id: string;
  insight: string;
  rootCause: string;
  strategy: string;          // The actual prompt instruction text
  expectedImpact: string;
  targetGrade?: string;
  targetTopic?: string;
  targetSubject?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE';
  effectivenessScore?: number;
  createdAt: string;
  approvedAt?: string;
}

export interface TopicAnalytics {
  topic: string;
  subject: string;
  grade: string;
  avgMastery: number;
  studentCount: number;
  avgAttempts: number;
}

export interface PedagogicalAnalytics {
  topicBreakdown: TopicAnalytics[];
  bottomTopics: TopicAnalytics[];     // Lowest mastery topics
  topTopics: TopicAnalytics[];        // Highest mastery topics
  totalStudentsAnalyzed: number;
  totalTopicsTracked: number;
  overallAvgMastery: number;
  computedAt: string;
}

export interface StrategyRefinement {
  strategyId: string;
  originalPrompt: string;
  refinedPrompt: string;
  appliedAt: string;
  rolledBackAt?: string;
}

