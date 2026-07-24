import {
  AssessmentAssignment,
  AssignmentStatus,
  DeliveryMode,
  ResultReleasePolicy,
  FeedbackReleasePolicy,
} from '../types/assessmentDelivery';
import { paperStudioService } from './paperStudioService';
import { supabase } from '../lib/supabase';

const ASSIGNMENTS_STORAGE_KEY = 'soma_assessment_assignments';

const SEED_ASSIGNMENTS: AssessmentAssignment[] = [
  {
    id: 'asgn_math_f4_t1_2026',
    assessmentTitle: '2026 Form 4 Mathematics Paper 1 Trial Assessment',
    paperId: 'paper_kcse_math_2026',
    schoolId: 'school_001',
    teacherId: 'teacher_kamau',
    assignedTeacherName: 'Mwalimu Kamau',
    classIds: ['class_form4_east', 'class_form4_west'],
    streamNames: ['Form 4 East', 'Form 4 West'],
    subject: 'Mathematics',
    grade: 'Form 4',
    term: 'Term 1',
    academicYear: 2026,
    deliveryMode: 'online',
    status: 'open',
    opensAt: '2026-07-20T08:00:00Z',
    closesAt: '2026-07-28T17:00:00Z',
    durationMinutes: 120,
    attemptsAllowed: 1,
    accessCode: 'MATH2026',
    resultReleasePolicy: 'AFTER_MARKING',
    feedbackReleasePolicy: 'FULL_CORRECTIONS',
    passMarkPercentage: 50,
    totalMarks: 100,
    questionCount: 15,
    instructions: [
      'Answer all questions in Section A and Section B.',
      'Show clear working for all calculations.',
      'Scientific non-programmable calculators are allowed.',
    ],
    createdAt: '2026-07-19T10:00:00Z',
    updatedAt: '2026-07-20T08:00:00Z',
  },
  {
    id: 'asgn_science_g6_t1_2026',
    assessmentTitle: 'KPSEA Grade 6 Integrated Science CAT',
    paperId: 'paper_kpsea_science_g6',
    schoolId: 'school_001',
    teacherId: 'teacher_wanjiku',
    assignedTeacherName: 'Teacher Wanjiku',
    classIds: ['class_grade6_blue'],
    streamNames: ['Grade 6 Blue'],
    subject: 'Integrated Science',
    grade: 'Grade 6',
    term: 'Term 1',
    academicYear: 2026,
    deliveryMode: 'hybrid',
    status: 'marking',
    opensAt: '2026-07-15T08:00:00Z',
    closesAt: '2026-07-15T10:00:00Z',
    durationMinutes: 60,
    attemptsAllowed: 1,
    resultReleasePolicy: 'AFTER_MODERATION',
    feedbackReleasePolicy: 'SCORES_AND_FEEDBACK',
    passMarkPercentage: 40,
    totalMarks: 50,
    questionCount: 10,
    createdAt: '2026-07-14T09:00:00Z',
    updatedAt: '2026-07-15T10:00:00Z',
  },
];

const readLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocal = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

export const assessmentAssignmentService = {
  /** Get all assignments for a school or teacher */
  async getAssignments(schoolId?: string, teacherId?: string): Promise<AssessmentAssignment[]> {
    const custom = readLocal<AssessmentAssignment[]>(ASSIGNMENTS_STORAGE_KEY, []);
    const all = [...custom, ...SEED_ASSIGNMENTS];

    return all.filter((a) => {
      if (schoolId && a.schoolId && a.schoolId !== schoolId) return false;
      if (teacherId && a.teacherId !== teacherId) return false;
      return true;
    });
  },

  /** Get assignment by ID */
  async getAssignmentById(assignmentId: string): Promise<AssessmentAssignment | null> {
    const assignments = await this.getAssignments();
    return assignments.find((a) => a.id === assignmentId) ?? null;
  },

  /** Get active assignments available for a specific learner */
  async getLearnerAssignments(learnerId: string, classId?: string): Promise<AssessmentAssignment[]> {
    const assignments = await this.getAssignments();
    return assignments.filter((a) => {
      if (a.status !== 'open' && a.status !== 'marking' && a.status !== 'results_ready' && a.status !== 'released') {
        return false;
      }
      if (classId && !a.classIds.includes(classId)) return false;
      if (a.learnerIds && a.learnerIds.length > 0 && !a.learnerIds.includes(learnerId)) return false;
      return true;
    });
  },

  /** Create a new assessment assignment */
  async createAssignment(params: {
    paperId: string;
    schoolId?: string;
    teacherId: string;
    teacherName: string;
    classIds: string[];
    streamNames?: string[];
    learnerIds?: string[];
    deliveryMode: DeliveryMode;
    opensAt?: string;
    closesAt?: string;
    durationMinutes?: number;
    attemptsAllowed?: number;
    accessCode?: string;
    resultReleasePolicy?: ResultReleasePolicy;
    feedbackReleasePolicy?: FeedbackReleasePolicy;
    passMarkPercentage?: number;
    instructions?: string[];
  }): Promise<AssessmentAssignment> {
    const paper = await paperStudioService.getPaperById(params.paperId);

    const assignment: AssessmentAssignment = {
      id: `asgn_${Date.now()}`,
      assessmentTitle: paper ? paper.title : 'Assessment',
      paperId: params.paperId,
      paperVersionId: paper?.currentVersionId,
      schoolId: params.schoolId,
      teacherId: params.teacherId,
      assignedTeacherName: params.teacherName,
      classIds: params.classIds,
      streamNames: params.streamNames,
      learnerIds: params.learnerIds,
      subject: paper?.subject ?? 'General',
      grade: paper?.grade ?? 'Form 1',
      term: paper?.term ?? 'Term 1',
      academicYear: Number(paper?.year ?? new Date().getFullYear()),
      deliveryMode: params.deliveryMode,
      status: params.opensAt && new Date(params.opensAt) > new Date() ? 'scheduled' : 'open',
      opensAt: params.opensAt ?? new Date().toISOString(),
      closesAt: params.closesAt,
      durationMinutes: params.durationMinutes ?? paper?.durationMinutes ?? 60,
      attemptsAllowed: params.attemptsAllowed ?? 1,
      accessCode: params.accessCode,
      resultReleasePolicy: params.resultReleasePolicy ?? 'AFTER_MARKING',
      feedbackReleasePolicy: params.feedbackReleasePolicy ?? 'SCORES_AND_FEEDBACK',
      passMarkPercentage: params.passMarkPercentage ?? 50,
      totalMarks: paper?.totalMarks ?? 100,
      questionCount: paper?.sections.reduce((s, sec) => s + sec.questions.length, 0) ?? 10,
      instructions: params.instructions ?? paper?.instructions ?? [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const custom = readLocal<AssessmentAssignment[]>(ASSIGNMENTS_STORAGE_KEY, []);
    custom.unshift(assignment);
    writeLocal(ASSIGNMENTS_STORAGE_KEY, custom);

    try {
      await supabase.from('assessment_assignments').insert({
        id: assignment.id,
        assessment_title: assignment.assessmentTitle,
        paper_id: assignment.paperId,
        school_id: assignment.schoolId,
        teacher_id: assignment.teacherId,
        class_ids: assignment.classIds,
        delivery_mode: assignment.deliveryMode,
        status: assignment.status,
        opens_at: assignment.opensAt,
        closes_at: assignment.closesAt,
        duration_minutes: assignment.durationMinutes,
        attempts_allowed: assignment.attemptsAllowed,
        total_marks: assignment.totalMarks,
        created_at: assignment.createdAt,
      });
    } catch {
      /* Fallback gracefully */
    }

    return assignment;
  },

  /** Update assignment status (e.g. publish, pause, close, release) */
  async updateAssignmentStatus(assignmentId: string, newStatus: AssignmentStatus): Promise<AssessmentAssignment | null> {
    const custom = readLocal<AssessmentAssignment[]>(ASSIGNMENTS_STORAGE_KEY, []);
    const idx = custom.findIndex((a) => a.id === assignmentId);
    if (idx >= 0) {
      custom[idx].status = newStatus;
      custom[idx].updatedAt = new Date().toISOString();
      writeLocal(ASSIGNMENTS_STORAGE_KEY, custom);
      return custom[idx];
    }

    const seedItem = SEED_ASSIGNMENTS.find((a) => a.id === assignmentId);
    if (seedItem) {
      const updated = { ...seedItem, status: newStatus, updatedAt: new Date().toISOString() };
      custom.unshift(updated);
      writeLocal(ASSIGNMENTS_STORAGE_KEY, custom);
      return updated;
    }

    return null;
  },

  /** Duplicate assignment for another class or term */
  async duplicateAssignment(assignmentId: string, newTeacherId: string, newTeacherName: string): Promise<AssessmentAssignment | null> {
    const existing = await this.getAssignmentById(assignmentId);
    if (!existing) return null;

    return this.createAssignment({
      paperId: existing.paperId,
      schoolId: existing.schoolId,
      teacherId: newTeacherId,
      teacherName: newTeacherName,
      classIds: existing.classIds,
      streamNames: existing.streamNames,
      deliveryMode: existing.deliveryMode,
      durationMinutes: existing.durationMinutes,
      attemptsAllowed: existing.attemptsAllowed,
      resultReleasePolicy: existing.resultReleasePolicy,
      feedbackReleasePolicy: existing.feedbackReleasePolicy,
      passMarkPercentage: existing.passMarkPercentage,
    });
  },
};
