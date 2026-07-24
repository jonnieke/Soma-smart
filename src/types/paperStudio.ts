export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'SHORT_ANSWER'
  | 'STRUCTURED'
  | 'ESSAY'
  | 'TRUE_FALSE'
  | 'FILL_BLANK'
  | 'MATCHING'
  | 'DIAGRAM_LABELING'
  | 'CALCULATION'
  | 'PRACTICAL'
  | 'ORAL'
  | 'RUBRIC_TASK';

export type CognitiveLevel =
  | 'RECALL'
  | 'UNDERSTANDING'
  | 'APPLICATION'
  | 'ANALYSIS'
  | 'EVALUATION'
  | 'CREATION';

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'CHALLENGING';

export type ExamType =
  | 'QUIZ'
  | 'CAT'
  | 'REVISION_PAPER'
  | 'TOPIC_TEST'
  | 'MID_TERM'
  | 'END_TERM'
  | 'MOCK'
  | 'HOMEWORK'
  | 'CUSTOM';

export type CurriculumFramework = 'CBC_CBE' | '8_4_4' | 'IGCSE';

export interface QuestionOption {
  id: string; // e.g. 'A', 'B', 'C', 'D'
  text: string;
}

export interface MarkingCriterion {
  criterion: string;
  marks: number;
  code?: string; // e.g. 'M1', 'A1', 'B1'
}

export interface Question {
  id: string;
  ownerId?: string;
  schoolId?: string;
  visibility: 'PRIVATE' | 'SCHOOL' | 'PUBLIC';
  status: 'DRAFT' | 'AI_CHECKED' | 'TEACHER_REVIEWED' | 'SCHOOL_APPROVED' | 'VERIFIED';
  questionType: QuestionType;
  questionText: string;
  options?: QuestionOption[];
  correctAnswer: string;
  explanation?: string;
  markingScheme: MarkingCriterion[];
  marks: number;
  grade: string;
  subject: string;
  curriculum: CurriculumFramework;
  strand?: string;
  subStrand?: string;
  topic?: string;
  learningOutcomeIds?: string[];
  cognitiveLevel: CognitiveLevel;
  difficulty: DifficultyLevel;
  estimatedMinutes?: number;
  imageUrls?: string[];
  sourceType: 'SOMA_BANK' | 'MY_BANK' | 'SCHOOL_BANK' | 'AI_GENERATED' | 'MANUAL' | 'UPLOADED';
  copyrightStatus?: 'ORIGINAL' | 'CURRICULUM_MAPPED' | 'FAIR_USE';
  qualityScore?: number;
  usageCount?: number;
  workingSpaceLines?: number;
  hasDiagram?: boolean;
}

export interface ExamSectionRule {
  id: string;
  title: string; // e.g. "Section A: Multiple Choice Questions"
  instructions?: string;
  questionType: QuestionType;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  difficulty: DifficultyLevel;
  topics?: string[];
  isOptional?: boolean;
}

export interface ExamBlueprint {
  id: string;
  ownerId: string;
  title: string;
  schoolName?: string;
  schoolLogoUrl?: string;
  grade: string;
  subject: string;
  curriculum: CurriculumFramework;
  examType: ExamType;
  term: string;
  year: string | number;
  durationMinutes: number;
  totalMarks: number;
  difficultyDistribution: {
    easy: number; // percentage e.g. 30
    medium: number; // percentage e.g. 50
    challenging: number; // percentage e.g. 20
  };
  cognitiveDistribution: Record<CognitiveLevel, number>;
  sections: ExamSectionRule[];
  topics: string[];
  strands?: string[];
  createdAt?: string;
}

export interface SchoolBranding {
  schoolName: string;
  logoUrl?: string;
  teacherName?: string;
  examDate?: string;
  candidateNameField: boolean;
  admissionNoField: boolean;
}

export interface ExamPaperSection {
  id: string;
  title: string;
  instructions?: string;
  questions: Question[];
  totalMarks: number;
}

export type PaperVisibility = 'PRIVATE' | 'DEPARTMENT' | 'SCHOOL' | 'MARKETPLACE';

export interface ExamPaper {
  id: string;
  ownerId: string;
  schoolId?: string;
  departmentIds?: string[];
  blueprintId?: string;
  title: string;
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PUBLISHED';
  workflowStatus?: 'DRAFT' | 'IN_PROGRESS' | 'SUBMITTED_FOR_REVIEW' | 'UNDER_REVIEW' | 'CHANGES_REQUESTED' | 'RESUBMITTED' | 'APPROVED' | 'LOCKED' | 'PRINTED' | 'ARCHIVED' | 'REJECTED';
  visibility: PaperVisibility;
  assignedReviewerIds?: string[];
  approvedByIds?: string[];
  approvedAt?: string;
  lockedAt?: string;
  lockedBy?: string;
  currentVersionId?: string;
  templateId?: string;
  assessmentDeadlineId?: string;
  grade: string;
  subject: string;
  examType: ExamType;
  term: string;
  year: string | number;
  durationMinutes: number;
  totalMarks: number;
  schoolBranding: SchoolBranding;
  instructions: string[];
  sections: ExamPaperSection[];
  version: number;
  createdAt: string;
  updatedAt: string;
  priceKes?: number;
  isMarketplaceApproved?: boolean;
}

export interface AIUsageCreditLog {
  id: string;
  userId: string;
  feature: string;
  creditsUsed: number;
  model: string;
  status: 'SUCCESS' | 'FAILED' | 'CACHED';
  createdAt: string;
}

export interface PaperStudioMetrics {
  draftCount: number;
  completedCount: number;
  savedQuestionsCount: number;
  remainingCredits: number;
  marketplaceEarningsKes: number;
}
