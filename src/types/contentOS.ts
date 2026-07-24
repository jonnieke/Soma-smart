// ============================================================
// Phase 7 — Soma Content and Curriculum Operating System Models
// ============================================================

export type CurriculumNodeType =
  | 'level'
  | 'grade'
  | 'subject'
  | 'strand'
  | 'sub_strand'
  | 'topic'
  | 'learning_outcome'
  | 'competency'
  | 'value'
  | 'issue';

export interface CurriculumFramework {
  id: string;
  name: string;
  country: string; // e.g. 'Kenya'
  authority?: string; // e.g. 'KICD'
  educationSystem: string; // e.g. 'CBC_CBE' or '8_4_4'
  version: string;
  status: 'draft' | 'active' | 'deprecated' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface CurriculumNode {
  id: string;
  frameworkId: string;
  parentId?: string;
  type: CurriculumNodeType;
  code?: string;
  title: string;
  description?: string;
  sequence?: number;
  termIds?: string[];
  status: 'draft' | 'active' | 'deprecated';
  versionId: string;
  createdAt: string;
  updatedAt: string;
}

export type EducationalResourceType =
  | 'lesson_plan'
  | 'lesson_notes'
  | 'scheme_of_work'
  | 'teaching_guide'
  | 'learner_notes'
  | 'revision_notes'
  | 'worksheet'
  | 'activity'
  | 'practical'
  | 'experiment'
  | 'worked_example'
  | 'quiz'
  | 'rubric'
  | 'teacher_reference';


export type ResourceBlockType =
  | 'heading'
  | 'paragraph'
  | 'learning_objective'
  | 'teacher_instruction'
  | 'learner_instruction'
  | 'worked_example'
  | 'question'
  | 'activity'
  | 'callout'
  | 'summary'
  | 'rubric';

export interface ResourceContentBlock {
  id: string;
  type: ResourceBlockType;
  order: number;
  content: {
    text?: string;
    teacherInstruction?: string;
    learnerInstruction?: string;
    durationMinutes?: number;
    questionText?: string;
    answerText?: string;
    exampleProblem?: string;
    exampleSolution?: string;
  };
  curriculumNodeIds?: string[];
}

export type ResourceVisibility = 'private' | 'department' | 'school' | 'soma' | 'licensed' | 'marketplace';
export type ResourceStatus = 'draft' | 'in_review' | 'changes_requested' | 'approved' | 'published' | 'deprecated';

export interface EducationalResource {
  id: string;
  ownerId: string;
  ownerType: 'teacher' | 'school' | 'soma' | 'publisher';
  schoolId?: string;
  publisherId?: string;
  title: string;
  description?: string;
  resourceType: EducationalResourceType;
  curriculumFrameworkId: string;
  curriculumNodeIds: string[];
  grade: string;
  subject: string;
  term?: string;
  language: string;
  estimatedDurationMinutes?: number;
  difficulty?: 'introductory' | 'standard' | 'advanced';
  contentBlocks: ResourceContentBlock[];
  visibility: ResourceVisibility;
  status: ResourceStatus;
  rightsId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentRights {
  id: string;
  ownerType: 'teacher' | 'school' | 'soma' | 'publisher' | 'third_party';
  ownerId: string;
  licenceType: 'private_use' | 'school_internal' | 'commercial' | 'marketplace' | 'subscription' | 'open_licence';
  permittedUses: string[];
  attributionRequired: boolean;
  attributionText?: string;
  createdAt: string;
}

export interface SchemeOfWork {
  id: string;
  schoolId?: string;
  teacherId: string;
  teacherName: string;
  grade: string;
  subject: string;
  term: string;
  year: number;
  weeks: Array<{
    weekNumber: number;
    lessonNumber: number;
    strand: string;
    subStrand: string;
    learningOutcome: string;
    learningActivity: string;
    resourcesNeeded: string;
    assessmentMethod: string;
    reflectionNotes?: string;
  }>;
  status: 'draft' | 'approved';
  createdAt: string;
  updatedAt: string;
}

export interface ContentRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  schoolId?: string;
  grade: string;
  subject: string;
  curriculumOutcome: string;
  resourceType: EducationalResourceType;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'assigned' | 'in_progress' | 'fulfilled' | 'closed';
  createdAt: string;
}

export type PublisherStatus = 'application_draft' | 'pending_verification' | 'verified' | 'restricted' | 'suspended';

export interface PublisherProfile {
  id: string;
  name: string;
  contactEmail: string;
  country: string;
  status: PublisherStatus;
  submittedCataloguesCount: number;
  createdAt: string;
}
