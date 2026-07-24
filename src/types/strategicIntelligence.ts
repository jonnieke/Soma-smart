export type EvidenceConfidence = 'insufficient' | 'low' | 'moderate' | 'high';

export type KnowledgeNodeType =
  | 'country'
  | 'curriculum_framework'
  | 'curriculum_version'
  | 'education_level'
  | 'grade'
  | 'subject'
  | 'strand'
  | 'sub_strand'
  | 'topic'
  | 'learning_outcome'
  | 'competency'
  | 'prerequisite'
  | 'question'
  | 'question_version'
  | 'paper'
  | 'paper_version'
  | 'resource'
  | 'resource_version'
  | 'worked_example'
  | 'misconception'
  | 'assessment'
  | 'intervention'
  | 'revision_activity';

export interface KnowledgeNode {
  id: string;
  type: KnowledgeNodeType;
  tenantScope?: string;
  countryCode?: string;
  curriculumFrameworkId?: string;
  sourceEntityId: string;
  sourceVersionId?: string;
  title: string;
  status: 'active' | 'deprecated' | 'archived';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type KnowledgeRelationshipType =
  | 'contains'
  | 'precedes'
  | 'requires'
  | 'related_to'
  | 'assesses'
  | 'teaches'
  | 'practises'
  | 'explains'
  | 'provides_example_for'
  | 'addresses_misconception'
  | 'remediates'
  | 'extends'
  | 'derived_from'
  | 'version_of'
  | 'aligned_to'
  | 'observed_in'
  | 'recommended_after';

export interface KnowledgeRelationship {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationshipType: KnowledgeRelationshipType;
  confidence: 'verified' | 'reviewed' | 'inferred' | 'experimental';
  sourceType: 'curriculum' | 'teacher' | 'school' | 'system_rule' | 'research' | 'ai_suggestion';
  sourceReference?: string;
  reviewerId?: string;
  algorithmVersion?: string;
  status: 'suggested' | 'under_review' | 'approved' | 'rejected' | 'deprecated';
  createdAt: string;
  updatedAt: string;
}

export interface QuestionEvidenceProfile {
  id: string;
  questionId: string;
  questionVersionId: string;
  countryCode: string;
  curriculumFrameworkId: string;
  configuredDifficulty?: number;
  observedDifficulty?: number;
  discriminationEstimate?: number;
  learnerSampleSize: number;
  schoolSampleSize: number;
  assessmentSampleSize: number;
  averageScore?: number;
  skipRate?: number;
  averageResponseSeconds?: number;
  markingDisagreementRate?: number;
  challengeRate?: number;
  moderationAdjustmentRate?: number;
  evidenceConfidence: EvidenceConfidence;
  qualityStatus:
    | 'insufficient_data'
    | 'performing_well'
    | 'review_recommended'
    | 'possible_miskey'
    | 'possibly_ambiguous'
    | 'context_sensitive'
    | 'retirement_recommended';
  warnings: string[];
  algorithmVersion: string;
  calculatedAt: string;
}

export interface PaperEvidenceProfile {
  id: string;
  paperId: string;
  paperVersionId: string;
  blueprintComplianceScore?: number;
  curriculumCoverageScore?: number;
  questionQualityScore?: number;
  markingConsistencyScore?: number;
  completionSuitabilityScore?: number;
  overallEvidenceScore?: number;
  learnerSampleSize: number;
  schoolSampleSize: number;
  assessmentSampleSize: number;
  evidenceConfidence: EvidenceConfidence;
  warnings: string[];
  algorithmVersion: string;
  calculatedAt: string;
}

export interface CurriculumMisconception {
  id: string;
  countryCode: string;
  curriculumFrameworkId: string;
  subjectId: string;
  curriculumNodeIds: string[];
  title: string;
  description: string;
  misconceptionType: string;
  diagnosticQuestionIds: string[];
  remediationResourceIds: string[];
  evidenceCount: number;
  learnerSampleSize: number;
  schoolSampleSize: number;
  evidenceConfidence: EvidenceConfidence;
  status: 'suggested' | 'teacher_reviewed' | 'specialist_verified' | 'deprecated';
  createdAt: string;
  updatedAt: string;
}

export interface ContentImpactProfile {
  id: string;
  resourceId: string;
  resourceVersionId: string;
  curriculumNodeIds: string[];
  assignmentCount: number;
  completionCount: number;
  learnerSampleSize: number;
  schoolSampleSize: number;
  averagePreEvidence?: number;
  averagePostEvidence?: number;
  observedChange?: number;
  evidenceConfidence: EvidenceConfidence;
  interpretation:
    | 'insufficient_evidence'
    | 'positive_association'
    | 'mixed_results'
    | 'no_clear_change'
    | 'review_recommended';
  limitations: string[];
  algorithmVersion: string;
  calculatedAt: string;
}

export interface ContributorReputation {
  id: string;
  contributorId: string;
  verifiedRoles: string[];
  subjects: string[];
  grades: string[];
  countries: string[];
  approvedContributionCount: number;
  rejectedContributionCount: number;
  revisionRequestRate?: number;
  qualityWarningRate?: number;
  buyerRating?: number;
  reviewerRating?: number;
  reputationBand: 'new' | 'verified' | 'trusted' | 'specialist' | 'restricted';
  calculatedAt: string;
  algorithmVersion: string;
}

export interface RoyaltyAllocation {
  id: string;
  orderId: string;
  resourceId: string;
  contributorId: string;
  contributionType: string;
  allocationMethod: 'fixed' | 'percentage' | 'weighted_usage' | 'contract_rule';
  allocationValue: number;
  earningAmount: number;
  ruleVersion: string;
  createdAt: string;
}

export interface ResearchProject {
  id: string;
  title: string;
  partnerOrganizationId: string;
  principalInvestigator?: string;
  purpose: string;
  researchQuestions: string[];
  requestedDataCategories: string[];
  countryCodes: string[];
  tenantIds?: string[];
  status: 'proposal' | 'governance_review' | 'changes_required' | 'approved' | 'active' | 'paused' | 'completed' | 'rejected';
  approvalReferences: string[];
  dataAccessMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformCostEvent {
  id: string;
  tenantId?: string;
  userId?: string;
  costCategory:
    | 'ai'
    | 'ocr'
    | 'storage'
    | 'database'
    | 'export'
    | 'notification'
    | 'payment'
    | 'refund'
    | 'royalty'
    | 'commission'
    | 'moderation'
    | 'support'
    | 'onboarding'
    | 'infrastructure';
  feature: string;
  provider?: string;
  quantity?: number;
  unit?: string;
  amount: number;
  currency: string;
  relatedPaperId?: string;
  relatedAssessmentId?: string;
  relatedOrderId?: string;
  incurredAt: string;
}

export interface GrossMarginSnapshot {
  period: string;
  totalRevenueKes: number;
  totalAiCostKes: number;
  totalCloudInfraCostKes: number;
  totalPaymentFeesKes: number;
  totalSellerPayoutsKes: number;
  grossMarginKes: number;
  grossMarginPercentage: number;
  calculatedAt: string;
}

export interface PaperEconomicsProfile {
  paperId: string;
  title: string;
  aiGenerationCostKes: number;
  ocrCostKes: number;
  exportCostKes: number;
  storageCostKes: number;
  questionReuseRatePct: number;
  totalDirectCostKes: number;
  allocatedRevenueKes: number;
  grossMarginPercentage: number;
}

export interface StrategicAsset {
  id: string;
  name: string;
  category: string;
  description: string;
  ownerTeam: string;
  assetHealth: 'early' | 'developing' | 'strong' | 'at_risk';
  sizeMetric?: number;
  qualityMetric?: number;
  uniquenessMetric?: number;
  reuseMetric?: number;
  revenueContribution?: number;
  risks: string[];
  nextActions: string[];
  calculatedAt: string;
}

export interface SchoolValueReport {
  tenantId: string;
  schoolName: string;
  period: string;
  teacherHoursSavedEstimate: number;
  papersCreatedCount: number;
  assessmentsDeliveredCount: number;
  markingAutomatedCount: number;
  curriculumCoveragePct: number;
  parentReportsGenerated: number;
  generatedAt: string;
}

export interface TeacherValueReport {
  userId: string;
  period: string;
  papersCreated: number;
  questionsReused: number;
  timeSavingHoursEstimate: number;
  learnersSupported: number;
  marketplaceEarningsKes: number;
  generatedAt: string;
}
