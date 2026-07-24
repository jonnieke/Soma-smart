export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';

export interface PlatformService {
  id: string;
  name: string;
  description: string;
  ownerTeam: string;
  criticality: 'critical' | 'high' | 'standard' | 'low';
  runtime: string;
  environments: string[];
  dependencyIds: string[];
  dataClassification: DataClassification;
  sloId?: string;
  runbookUrl?: string;
  status: 'active' | 'degraded' | 'deprecated';
  createdAt: string;
  updatedAt: string;
}

export interface ServiceLevelObjective {
  id: string;
  serviceId: string;
  name: string;
  indicator: string;
  targetPercentage: number;
  measurementWindowDays: number;
  thresholdMs?: number;
  errorBudgetPolicyId?: string;
  status: 'draft' | 'active' | 'retired';
}

export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4';
export type IncidentStatus = 'detected' | 'investigating' | 'identified' | 'mitigating' | 'monitoring' | 'resolved' | 'closed';

export interface PlatformIncident {
  id: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  serviceIds: string[];
  affectedTenantIds?: string[];
  startedAt: string;
  detectedAt: string;
  resolvedAt?: string;
  commanderId?: string;
  customerImpact: string;
  internalSummary?: string;
  publicSummary?: string;
  rootCause?: string;
  mitigation?: string;
  followUpActionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryObjective {
  id: string;
  serviceId: string;
  recoveryPointObjectiveMinutes: number;
  recoveryTimeObjectiveMinutes: number;
  criticality: string;
  approvedBy: string;
  reviewedAt: string;
}

export interface AIModelRegistryEntry {
  id: string;
  provider: string;
  modelName: string;
  modelVersion?: string;
  capabilities: string[];
  approvedUseCases: string[];
  prohibitedUseCases: string[];
  riskLevel: 'low' | 'moderate' | 'high';
  inputDataClasses: DataClassification[];
  supportsStructuredOutput: boolean;
  supportsBatch: boolean;
  costProfileId?: string;
  evaluationStatus: 'not_evaluated' | 'testing' | 'approved' | 'restricted' | 'retired';
  rolloutPercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface PromptRegistryEntry {
  id: string;
  useCaseId: string;
  name: string;
  version: string;
  systemPrompt: string;
  outputSchemaId?: string;
  modelConstraints?: string[];
  status: 'draft' | 'testing' | 'approved' | 'deprecated' | 'retired';
  evaluationRunIds: string[];
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelEvaluationRun {
  id: string;
  modelRegistryId: string;
  promptVersionId: string;
  evaluationSuiteId: string;
  environment: string;
  datasetVersion: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  scoreSummary: Record<string, number>;
  estimatedCost: number;
  startedAt: string;
  completedAt?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
}

export interface DeveloperApplication {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  ownerUserId: string;
  environment: 'sandbox' | 'production';
  status: 'draft' | 'pending_review' | 'approved' | 'restricted' | 'suspended';
  allowedScopes: string[];
  allowedOrigins?: string[];
  rateLimitPolicyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiKeyCredential {
  id: string;
  applicationId: string;
  keyPrefix: string;
  hashedSecret: string;
  name: string;
  scopes: string[];
  expiresAt?: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface WebhookSubscription {
  id: string;
  tenantId: string;
  applicationId?: string;
  targetUrl: string;
  eventTypes: string[];
  secretKey: string;
  status: 'active' | 'paused' | 'disabled';
  createdAt: string;
}

export type CountryLaunchStatus =
  | 'research'
  | 'curriculum_mapping'
  | 'content_preparation'
  | 'localization'
  | 'partner_validation'
  | 'pilot'
  | 'review'
  | 'active'
  | 'paused';

export interface CountryConfiguration {
  id: string;
  countryCode: string;
  name: string;
  status: CountryLaunchStatus;
  defaultLanguage: string;
  supportedLanguages: string[];
  defaultTimezone: string;
  currencyCode: string;
  curriculumFrameworkIds: string[];
  paymentProviderIds: string[];
  enabledFeatureFlags: string[];
  dataGovernancePolicyId: string;
  createdAt: string;
  updatedAt: string;
}

export type PrivacyRequestStatus =
  | 'submitted'
  | 'identity_verification'
  | 'under_review'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface PrivacyRequest {
  id: string;
  userId: string;
  tenantId?: string;
  requestType: 'access' | 'export' | 'erasure' | 'correction' | 'consent_withdrawal';
  status: PrivacyRequestStatus;
  details?: string;
  submittedAt: string;
  completedAt?: string;
}

export interface DataRetentionPolicy {
  id: string;
  dataType: string;
  tenantType?: string;
  countryCode?: string;
  retentionDays?: number;
  archiveAfterDays?: number;
  deletionMethod: string;
  legalHoldSupported: boolean;
  status: 'draft' | 'active' | 'retired';
}

export type VulnerabilityStatus =
  | 'open'
  | 'triaged'
  | 'mitigating'
  | 'resolved'
  | 'accepted_risk'
  | 'false_positive';

export interface VulnerabilityRecord {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedService: string;
  status: VulnerabilityStatus;
  discoveredAt: string;
  resolvedAt?: string;
}

export interface ComplianceEvidence {
  id: string;
  title: string;
  category: 'backup_test' | 'access_review' | 'incident_postmortem' | 'model_evaluation' | 'security_audit';
  evidenceUrl?: string;
  owner: string;
  verifiedAt: string;
  notes?: string;
}
