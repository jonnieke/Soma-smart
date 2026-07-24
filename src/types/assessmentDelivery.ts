// ============================================================
// Phase 5 — Soma Assessment Intelligence Data Models
// ============================================================

export type DeliveryMode = 'online' | 'paper' | 'hybrid';

export type AssignmentStatus =
  | 'draft'
  | 'scheduled'
  | 'open'
  | 'closed'
  | 'marking'
  | 'moderation'
  | 'results_ready'
  | 'released'
  | 'archived';

export type ResultReleasePolicy =
  | 'IMMEDIATE'
  | 'AFTER_MARKING'
  | 'AFTER_MODERATION'
  | 'SCHEDULED'
  | 'MANUAL_RELEASE';

export type FeedbackReleasePolicy =
  | 'SCORES_ONLY'
  | 'SCORES_AND_FEEDBACK'
  | 'FULL_CORRECTIONS'
  | 'NONE';

export interface AssessmentAssignment {
  id: string;
  assessmentTitle: string;
  paperId: string;
  paperVersionId?: string;
  schoolId?: string;
  teacherId: string;
  assignedTeacherName: string;
  moderatingTeacherId?: string;
  moderatingTeacherName?: string;
  classIds: string[]; // e.g. ['class_form3_east', 'class_form3_west']
  streamNames?: string[];
  learnerIds?: string[]; // Specific learners or empty for full class
  subject: string;
  grade: string;
  term: string;
  academicYear: number;
  deliveryMode: DeliveryMode;
  status: AssignmentStatus;
  opensAt?: string;
  closesAt?: string;
  durationMinutes?: number;
  attemptsAllowed: number;
  accessCode?: string;
  resultReleasePolicy: ResultReleasePolicy;
  feedbackReleasePolicy: FeedbackReleasePolicy;
  gradingScaleId?: string;
  passMarkPercentage: number;
  instructions?: string[];
  accommodations?: string;
  totalMarks: number;
  questionCount: number;
  randomizeQuestionOrder?: boolean;
  randomizeOptionOrder?: boolean;
  allowCopyPaste?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AttemptStatus =
  | 'not_started'
  | 'in_progress'
  | 'submitted'
  | 'awaiting_marking'
  | 'partially_marked'
  | 'marked'
  | 'moderated'
  | 'released'
  | 'voided';

export interface AssessmentAttempt {
  id: string;
  assignmentId: string;
  assessmentId: string;
  paperId: string;
  learnerId: string;
  learnerName: string;
  admissionNo?: string;
  attemptNumber: number;
  deliveryMode: DeliveryMode;
  status: AttemptStatus;
  startedAt?: string;
  submittedAt?: string;
  durationSeconds?: number;
  objectiveScore?: number;
  subjectiveScore?: number;
  totalScore?: number;
  percentage?: number;
  grade?: string;
  teacherFeedback?: string;
  isLate?: boolean;
  tabSwitchCount?: number;
  releasedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentResponse {
  id: string;
  attemptId: string;
  assessmentId: string;
  assignmentId: string;
  learnerId: string;
  questionId: string;
  questionVersionId: string;
  responseType: string;
  responseValue: unknown; // string, string[], number, Record<string, string>, etc.
  uploadedFileUrls?: string[];
  isFlagged: boolean;
  autoSaveVersion: number;
  autoMarked?: boolean;
  awardedMarks?: number;
  maxMarks: number;
  isCorrect?: boolean;
  aiSuggestedScore?: number;
  aiConfidence?: number;
  aiJustification?: string;
  teacherScore?: number;
  teacherComment?: string;
  markingStatus?: 'NOT_MARKED' | 'AUTO_MARKED' | 'AI_SUGGESTED' | 'TEACHER_REVIEWED' | 'MODERATED' | 'FINAL';
  answeredAt?: string;
  updatedAt: string;
}

export interface RubricCriterionLevel {
  id: string;
  levelName: string; // e.g. "Exceeds Expectations", "Meets Expectations", "Approaching", "Below"
  marks: number;
  descriptor: string;
}

export interface RubricCriterion {
  id: string;
  title: string;
  maxMarks: number;
  levels: RubricCriterionLevel[];
}

export interface AssessmentRubric {
  id: string;
  title: string;
  subject: string;
  grade: string;
  criteria: RubricCriterion[];
  rubricType: 'ANALYTIC' | 'HOLISTIC' | 'COMPETENCY';
  visibility: 'PRIVATE' | 'DEPARTMENT' | 'SCHOOL' | 'SOMA';
  schoolId?: string;
  createdAt: string;
}

export interface AssessmentModeration {
  id: string;
  attemptId: string;
  assignmentId: string;
  moderatorId: string;
  moderatorName: string;
  originalScore: number;
  moderatedScore: number;
  variance: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'ADJUSTED';
  createdAt: string;
}

export type ScanJobStatus =
  | 'uploaded'
  | 'queued'
  | 'processing'
  | 'review_required'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AssessmentScanPage {
  id: string;
  jobId: string;
  pageIndex: number;
  qrPayload?: string;
  schoolId?: string;
  assignmentId?: string;
  learnerId?: string;
  detectedBubbles?: { questionId: string; selectedOption: string; confidence: number }[];
  lowConfidenceCount: number;
  imageUrl: string;
  reviewRequired: boolean;
  status: 'PROCESSED' | 'NEEDS_REVIEW' | 'FAILED';
}

export interface AssessmentScanJob {
  id: string;
  assignmentId?: string;
  schoolId: string;
  uploadedByTeacherId: string;
  totalPages: number;
  processedPages: number;
  successfulPages: number;
  status: ScanJobStatus;
  pages: AssessmentScanPage[];
  contentHash: string;
  createdAt: string;
  completedAt?: string;
}

export interface LearnerMastery {
  learnerId: string;
  subject: string;
  topic: string;
  curriculumOutcomeId?: string;
  masteryScore: number; // 0-100
  confidence: number; // 0-1.0
  evidenceCount: number;
  lastAssessedAt: string;
  trend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  recommendedAction?: string;
}

export interface RevisionRecommendation {
  id: string;
  learnerId: string;
  subject: string;
  topic: string;
  strand?: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  resourceType: 'EXPLANATION' | 'WORKED_EXAMPLE' | 'PRACTICE_QUIZ' | 'FLASHCARDS' | 'RETRY_QUESTION';
  resourceTitle: string;
  resourcePayload?: Record<string, unknown>;
  isCompleted: boolean;
  createdAt: string;
}

export interface LearnerRevisionPlan {
  id: string;
  learnerId: string;
  subject: string;
  recommendations: RevisionRecommendation[];
  updatedAt: string;
}

export interface GradingBand {
  grade: string; // e.g. "A", "B", "C", "D", "E" or "Exceeding Expectations"
  minPercentage: number;
  maxPercentage: number;
  gpaPoint?: number;
  descriptor?: string;
}

export interface GradingScale {
  id: string;
  name: string;
  curriculum: string;
  schoolId?: string;
  bands: GradingBand[];
  isDefault?: boolean;
}

export interface ItemAnalysis {
  questionId: string;
  questionText: string;
  maxMarks: number;
  attemptCount: number;
  correctCount: number;
  averageMarks: number;
  facilityIndex: number; // 0-1.0 (ease)
  discriminationIndex?: number;
  mostCommonWrongAnswer?: string;
  distractorBreakdown?: Record<string, number>;
  flaggedIssue?: 'TOO_EASY' | 'TOO_HARD' | 'MISKEYED' | 'AMBIGUOUS';
}
