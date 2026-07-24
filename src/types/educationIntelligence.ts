// ============================================================
// Phase 6 — Soma Education Intelligence Data Models
// ============================================================

export type EvidenceConfidence = 'insufficient' | 'low' | 'moderate' | 'high';

export type LearnerTrend =
  | 'strong_improvement'
  | 'improving'
  | 'stable'
  | 'declining'
  | 'strong_decline'
  | 'insufficient_data';

export type PriorityLevel = 'monitor' | 'practice' | 'intervention' | 'urgent_review';

export interface ProgressFactor {
  code: string;
  description: string;
  weight: number;
}

export interface LearnerProgressSignal {
  id: string;
  learnerId: string;
  learnerName: string;
  schoolId?: string;
  subject: string;
  topic?: string;
  curriculumOutcomeId?: string;
  currentMasteryScore: number;
  previousMasteryScore?: number;
  growthScore?: number;
  evidenceCount: number;
  recentEvidenceCount: number;
  evidenceConfidence: EvidenceConfidence;
  recentTrend: LearnerTrend;
  priorityLevel: PriorityLevel;
  factors: ProgressFactor[];
  recommendedActionIds: string[];
  calculatedAt: string;
}

export interface MisconceptionSignal {
  id: string;
  subject: string;
  topic: string;
  curriculumOutcomeId?: string;
  questionId?: string;
  misconceptionCode: string;
  description: string;
  affectedLearnerCount: number;
  sampleSize: number;
  confidence: EvidenceConfidence;
  detectedAt: string;
}

export type InterventionStatus = 'draft' | 'active' | 'completed' | 'paused' | 'cancelled';
export type InterventionOutcome = 'not_started' | 'in_progress' | 'improved' | 'partially_improved' | 'no_clear_change' | 'declined' | 'insufficient_evidence';

export interface InterventionSuccessCriteria {
  id: string;
  metric: 'target_mastery' | 'score_improvement_percentage' | 'revision_completion_rate';
  targetValue: number;
  actualValue?: number;
  isMet?: boolean;
}

export interface InterventionGroup {
  id: string;
  schoolId?: string;
  teacherId: string;
  teacherName: string;
  classId?: string;
  subject: string;
  name: string;
  description?: string;
  learnerIds: string[];
  curriculumOutcomeIds: string[];
  reasonCodes: string[];
  evidenceConfidence: EvidenceConfidence;
  status: InterventionStatus;
  startsAt?: string;
  endsAt?: string;
  successCriteria: InterventionSuccessCriteria[];
  outcome?: InterventionOutcome;
  createdAt: string;
  updatedAt: string;
}

export interface RevisionImpactRecord {
  id: string;
  learnerId: string;
  subject: string;
  topic: string;
  activityId: string;
  activityTitle: string;
  completedAt: string;
  preAssessmentScore: number;
  postAssessmentScore?: number;
  scoreGainPercentage?: number;
  isMeasurablyEffective?: boolean;
  evidenceConfidence: EvidenceConfidence;
}

export type QuestionQualityStatus =
  | 'insufficient_data'
  | 'performing_well'
  | 'review_recommended'
  | 'possible_miskey'
  | 'possibly_ambiguous'
  | 'too_easy_for_purpose'
  | 'too_difficult_for_purpose'
  | 'retire_recommended';

export interface QuestionQualityProfile {
  questionId: string;
  questionText: string;
  subject: string;
  grade: string;
  attemptCount: number;
  facilityIndex: number; // 0.0 to 1.0 (ease)
  discriminationIndex?: number;
  skipRatePercentage: number;
  status: QuestionQualityStatus;
  evidenceConfidence: EvidenceConfidence;
  flaggedReasons: string[];
  updatedAt: string;
}

export interface PaperQualityProfile {
  paperId: string;
  title: string;
  subject: string;
  grade: string;
  blueprintScore: number; // 0-100
  curriculumCoverageScore: number; // 0-100
  questionQualityScore: number; // 0-100
  markingQualityScore: number; // 0-100
  overallQualityScore: number; // 0-100
  evidenceConfidence: EvidenceConfidence;
  warnings: string[];
  calculatedAt: string;
}

export type CurriculumCoverageStatus = 'not_assessed' | 'lightly_assessed' | 'adequately_assessed' | 'well_assessed';

export interface CurriculumCoverageSnapshot {
  id: string;
  schoolId?: string;
  grade: string;
  subject: string;
  strand: string;
  subStrand?: string;
  outcomeCount: number;
  assessedOutcomeCount: number;
  coveragePercentage: number;
  status: CurriculumCoverageStatus;
  lastUpdated: string;
}

export interface SchoolBenchmarkSnapshot {
  id: string;
  schoolId: string;
  grade: string;
  subject: string;
  term: string;
  schoolMean: number;
  peerMedian: number;
  peerRangeMin: number;
  peerRangeMax: number;
  peerSchoolCount: number;
  cohortLearnerCount: number;
  evidenceConfidence: EvidenceConfidence;
  isSuppressedDueToSmallCohort: boolean;
  calculatedAt: string;
}

export interface IntelligenceRecommendation {
  id: string;
  schoolId?: string;
  teacherId?: string;
  learnerId?: string;
  classId?: string;
  subject: string;
  topic: string;
  recommendationType: 'RETEACH_TOPIC' | 'CREATE_INTERVENTION' | 'ASSIGN_REVISION' | 'REVIEW_QUESTION' | 'EXTENSION_ACTIVITY';
  title: string;
  reason: string;
  evidenceSummary: string;
  evidenceConfidence: EvidenceConfidence;
  priority: 'low' | 'medium' | 'high';
  status: 'suggested' | 'accepted' | 'modified' | 'dismissed' | 'completed' | 'expired';
  createdAt: string;
}
