// ============================================================
// Phase 9 — Soma Growth OS Data Models
// ============================================================

export type LifecycleStage =
  | 'visitor'
  | 'registered'
  | 'activated'
  | 'engaged'
  | 'paying'
  | 'at_risk'
  | 'churned'
  | 'reactivated';

export type ActivationStatus = 'not_started' | 'in_progress' | 'activated' | 'stalled';

export interface GrowthProfile {
  id: string;
  userId: string;
  tenantId?: string;
  userSegment: string;
  acquisitionSource?: string;
  acquisitionCampaignId?: string;
  referralCodeUsed?: string;
  referredByUserId?: string;
  firstTouchAt?: string;
  accountCreatedAt: string;
  activationStatus: ActivationStatus;
  activatedAt?: string;
  activationEvent?: string;
  lifecycleStage: LifecycleStage;
  lastMeaningfulActivityAt?: string;
  currentPlanId?: string;
  trialEndsAt?: string;
  marketingConsent: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CampaignType =
  | 'organic'
  | 'paid'
  | 'referral'
  | 'ambassador'
  | 'partner'
  | 'school_sales'
  | 'event'
  | 'content'
  | 'reactivation';

export interface GrowthCampaign {
  id: string;
  name: string;
  campaignType: CampaignType;
  audienceSegments: string[];
  channelIds: string[];
  landingPageId?: string;
  offerId?: string;
  startsAt: string;
  endsAt?: string;
  budgetAmount?: number;
  currency?: 'KES' | 'USD';
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrialConfiguration {
  id: string;
  planId: string;
  durationDays: number;
  aiCreditAllowance: number;
  teacherLimit?: number;
  learnerLimit?: number;
  requiresPaymentMethod: boolean;
  enabled: boolean;
}

export interface ProductQualifiedLead {
  id: string;
  userId?: string;
  tenantId?: string;
  entityName: string;
  entityType: 'teacher' | 'school' | 'institution';
  score: number;
  scoreBand: 'cold' | 'warm' | 'qualified' | 'high_intent';
  signals: string[];
  lastEvaluatedAt: string;
}

export type SchoolSalesStage =
  | 'new_lead'
  | 'contacted'
  | 'qualified'
  | 'demo_scheduled'
  | 'demo_completed'
  | 'trial_started'
  | 'pilot_active'
  | 'proposal_sent'
  | 'negotiation'
  | 'won'
  | 'lost'
  | 'nurture';

export interface SchoolSalesLead {
  id: string;
  schoolName: string;
  contactPerson: string;
  role: string;
  phone: string;
  email: string;
  county: string;
  estimatedLearners: number;
  estimatedTeachers: number;
  stage: SchoolSalesStage;
  assignedSalesOwner?: string;
  estimatedContractValueKes: number;
  probability: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolDemo {
  id: string;
  leadId: string;
  schoolName: string;
  contactName: string;
  contactEmail: string;
  preferredDate: string;
  attendeesCount: number;
  status: 'requested' | 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface SchoolPilot {
  id: string;
  leadId: string;
  schoolId: string;
  schoolName: string;
  startDate: string;
  endDate: string;
  targetTeachersCount: number;
  activatedTeachersCount: number;
  targetLearnersCount: number;
  aiCreditAllocation: number;
  successCriteria: string;
  status: 'planned' | 'active' | 'completed' | 'converted' | 'failed';
  createdAt: string;
}

export type ReferralRewardStatus =
  | 'pending'
  | 'qualified'
  | 'approved'
  | 'credited'
  | 'paid'
  | 'reversed'
  | 'rejected';

export interface ReferralRecord {
  id: string;
  referralCode: string;
  referrerUserId: string;
  referredUserId: string;
  referralType: 'teacher_refers_teacher' | 'teacher_refers_school' | 'school_refers_school' | 'parent_refers_parent';
  status: ReferralRewardStatus;
  rewardType: 'ai_credits' | 'subscription_days' | 'cash_commission';
  rewardValue: number;
  createdAt: string;
  qualifiedAt?: string;
}

export interface AmbassadorProfile {
  id: string;
  userId: string;
  userName: string;
  schoolName: string;
  county: string;
  roleTitle: 'School Champion' | 'County Ambassador' | 'Subject Ambassador' | 'Teacher Trainer';
  status: 'pending_review' | 'active' | 'paused' | 'suspended';
  referralsCount: number;
  totalEarningsKes: number;
  createdAt: string;
}

export interface CreatorBrief {
  id: string;
  title: string;
  curriculumOutcome: string;
  grade: string;
  subject: string;
  resourceType: 'exam_paper' | 'question_set' | 'lesson_plan' | 'revision_notes';
  payoutAmountKes: number;
  assignedCreatorId?: string;
  status: 'open' | 'assigned' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
}

export interface PartnerProfile {
  id: string;
  partnerName: string;
  partnerType: 'school_network' | 'ngo' | 'publisher' | 'county_programme' | 'sponsor';
  contactPerson: string;
  email: string;
  referredSchoolsCount: number;
  commissionRatePercentage: number;
  totalCommissionsEarnedKes: number;
  status: 'active' | 'paused';
  createdAt: string;
}

export interface CustomerHealthScore {
  id: string;
  tenantId: string;
  schoolName: string;
  score: number;
  healthBand: 'healthy' | 'monitor' | 'at_risk' | 'critical';
  factors: string[];
  renewalDate: string;
  calculatedAt: string;
}

export interface LifecycleMessage {
  id: string;
  userId?: string;
  triggerEvent: string;
  channel: 'in_app' | 'email' | 'sms' | 'whatsapp';
  title: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
  status: 'scheduled' | 'sent' | 'read' | 'clicked';
  createdAt: string;
}

export interface UnitEconomicsSnapshot {
  period: string;
  totalRevenueKes: number;
  totalAiCostKes: number;
  grossMarginPercentage: number;
  cacTeacherKes: number;
  cacSchoolKes: number;
  arpuTeacherKes: number;
  arpuSchoolKes: number;
}

