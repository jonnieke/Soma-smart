import {
  SchoolMembership,
  SchoolInvitation,
  SchoolDepartment,
  SchoolTemplate,
  AssessmentDeadline,
  SchoolSettings,
  SchoolRole,
  PaperVisibility,
  InvitationStatus,
} from '../types/schoolWorkspace';
import { ExamPaper, Question, SchoolBranding } from '../types/paperStudio';
import { paperStudioService } from './paperStudioService';
import { schoolAuditService } from './schoolAuditService';
import { supabase } from '../lib/supabase';

const SCHOOL_MEMBERSHIPS_KEY = 'soma_school_memberships';
const SCHOOL_INVITATIONS_KEY = 'soma_school_invitations';
const SCHOOL_DEPARTMENTS_KEY = 'soma_school_departments';
const SCHOOL_TEMPLATES_KEY = 'soma_school_templates';
const SCHOOL_DEADLINES_KEY = 'soma_school_deadlines';
const SCHOOL_SETTINGS_KEY = 'soma_school_settings';
const SCHOOL_BRANDING_KEY = 'soma_school_branding';

export const schoolWorkspaceService = {
  /**
   * Evaluates user permissions based on school roles
   */
  hasPermission(roles: SchoolRole[], action: 'MANAGE_SCHOOL' | 'MANAGE_USERS' | 'MANAGE_DEPARTMENTS' | 'MANAGE_TEMPLATES' | 'APPROVE_PAPERS' | 'LOCK_PAPERS' | 'VIEW_ALL'): boolean {
    if (roles.includes('OWNER') || roles.includes('ADMIN')) return true;

    switch (action) {
      case 'MANAGE_SCHOOL':
      case 'MANAGE_USERS':
        return roles.includes('OWNER') || roles.includes('ADMIN');
      case 'MANAGE_DEPARTMENTS':
      case 'MANAGE_TEMPLATES':
        return roles.includes('ADMIN') || roles.includes('EXAM_COORDINATOR');
      case 'APPROVE_PAPERS':
      case 'LOCK_PAPERS':
        return (
          roles.includes('EXAM_COORDINATOR') ||
          roles.includes('HOD') ||
          roles.includes('REVIEWER')
        );
      case 'VIEW_ALL':
        return (
          roles.includes('EXAM_COORDINATOR') ||
          roles.includes('ADMIN') ||
          roles.includes('OWNER')
        );
      default:
        return false;
    }
  },

  /**
   * School Settings
   */
  async getSettings(schoolId: string): Promise<SchoolSettings> {
    try {
      const raw = localStorage.getItem(SCHOOL_SETTINGS_KEY);
      if (raw) {
        const parsed: SchoolSettings = JSON.parse(raw);
        if (parsed.schoolId === schoolId) return parsed;
      }
    } catch (_) {}

    const defaultSettings: SchoolSettings = {
      schoolId,
      schoolName: 'Nairobi Academy High School',
      defaultCurriculum: 'CBC_CBE',
      currentTerm: 'Term 1',
      currentAcademicYear: '2026',
      gradingSystem: 'CBC_4_POINT',
      requiredApprovalStages: ['HOD'],
      requireIndependentReviewer: true,
      allowTeacherPersonalCredits: true,
      defaultPaperVisibility: 'DEPARTMENT',
      defaultReviewDeadlineDays: 3,
      allowDepartmentLevelApproval: true,
      allowTeachersToExportDrafts: false,
      allowReviewersToEditQuestions: true,
      lowCreditThreshold: 100,
      defaultWatermarkText: 'CONFIDENTIAL - SCHOOL EXAM',
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SCHOOL_SETTINGS_KEY, JSON.stringify(defaultSettings));
    } catch (_) {}

    return defaultSettings;
  },

  async saveSettings(settings: SchoolSettings, actorId: string, actorName: string, actorRole: string): Promise<SchoolSettings> {
    const updated = { ...settings, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(SCHOOL_SETTINGS_KEY, JSON.stringify(updated));
    } catch (_) {}

    await schoolAuditService.logEvent({
      schoolId: settings.schoolId,
      actorId,
      actorName,
      actorRole,
      action: 'SETTINGS_UPDATED',
      targetType: 'settings',
      targetId: settings.schoolId,
      targetTitle: settings.schoolName,
    });

    return updated;
  },

  /**
   * Department Management
   */
  async getDepartments(schoolId: string = 'default_school'): Promise<SchoolDepartment[]> {
    try {
      const raw = localStorage.getItem(SCHOOL_DEPARTMENTS_KEY);
      if (raw) {
        const parsed: SchoolDepartment[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    const defaultDepts: SchoolDepartment[] = [
      {
        id: 'dept_math',
        schoolId,
        name: 'Mathematics Department',
        description: 'Mathematics & Further Math',
        subjectIds: ['Mathematics'],
        gradeIds: ['Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'],
        headUserIds: ['user_hod_math'],
        memberUserIds: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'dept_science',
        schoolId,
        name: 'Sciences Department',
        description: 'Chemistry, Physics, Biology & Integrated Science',
        subjectIds: ['Integrated Science', 'Chemistry', 'Physics', 'Biology'],
        gradeIds: ['Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'],
        headUserIds: ['user_hod_science'],
        memberUserIds: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'dept_lang',
        schoolId,
        name: 'Languages Department',
        description: 'English, Kiswahili, Literature & Foreign Languages',
        subjectIds: ['English', 'Kiswahili'],
        gradeIds: ['Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'],
        headUserIds: ['user_hod_lang'],
        memberUserIds: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'dept_humanities',
        schoolId,
        name: 'Humanities Department',
        description: 'History, Geography, CRE, IRE, HRE',
        subjectIds: ['Social Studies', 'History', 'Geography', 'CRE'],
        gradeIds: ['Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'],
        headUserIds: ['user_hod_hum'],
        memberUserIds: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'dept_tech',
        schoolId,
        name: 'Technical & Creative Arts',
        description: 'Agriculture, Business Studies, Computer Science, Home Science, Art',
        subjectIds: ['Agriculture', 'Business Studies', 'Computer Studies'],
        gradeIds: ['Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'],
        headUserIds: ['user_hod_tech'],
        memberUserIds: [],
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    try {
      localStorage.setItem(SCHOOL_DEPARTMENTS_KEY, JSON.stringify(defaultDepts));
    } catch (_) {}

    return defaultDepts;
  },

  async saveDepartment(dept: SchoolDepartment, actorId: string, actorName: string, actorRole: string): Promise<SchoolDepartment> {
    const depts = await this.getDepartments(dept.schoolId);
    const updated = { ...dept, updatedAt: new Date().toISOString() };
    const index = depts.findIndex((d) => d.id === dept.id);

    if (index >= 0) depts[index] = updated;
    else depts.push(updated);

    try {
      localStorage.setItem(SCHOOL_DEPARTMENTS_KEY, JSON.stringify(depts));
    } catch (_) {}

    await schoolAuditService.logEvent({
      schoolId: dept.schoolId,
      actorId,
      actorName,
      actorRole,
      action: 'DEPARTMENT_ASSIGNED',
      targetType: 'department',
      targetId: dept.id,
      targetTitle: dept.name,
    });

    return updated;
  },

  /**
   * Teacher Membership & Invitations
   */
  async getMemberships(schoolId: string = 'default_school'): Promise<SchoolMembership[]> {
    try {
      const raw = localStorage.getItem(SCHOOL_MEMBERSHIPS_KEY);
      if (raw) {
        const parsed: SchoolMembership[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    const defaultMembers: SchoolMembership[] = [
      {
        id: 'mem_owner',
        schoolId,
        userId: 'user_principal',
        userName: 'Principal Dr. Otieno',
        userEmail: 'principal@nairobiacademy.ac.ke',
        roles: ['OWNER', 'ADMIN'],
        departmentIds: [],
        status: 'active',
        invitedBy: 'system',
        invitedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mem_hod_math',
        schoolId,
        userId: 'user_hod_math',
        userName: 'Mr. Kamau (HOD Math)',
        userEmail: 'kamau@nairobiacademy.ac.ke',
        roles: ['HOD', 'TEACHER'],
        departmentIds: ['dept_math'],
        subjectIds: ['Mathematics'],
        status: 'active',
        invitedBy: 'user_principal',
        invitedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mem_teacher_peterson',
        schoolId,
        userId: 'teacher_default',
        userName: 'Mwalimu Peterson',
        userEmail: 'peterson@nairobiacademy.ac.ke',
        roles: ['TEACHER'],
        departmentIds: ['dept_math', 'dept_science'],
        subjectIds: ['Mathematics', 'Integrated Science'],
        status: 'active',
        invitedBy: 'user_hod_math',
        invitedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    try {
      localStorage.setItem(SCHOOL_MEMBERSHIPS_KEY, JSON.stringify(defaultMembers));
    } catch (_) {}

    return defaultMembers;
  },

  async createInvitation(params: {
    schoolId: string;
    schoolName: string;
    inviteeName: string;
    inviteeEmail: string;
    inviteePhone?: string;
    roles: SchoolRole[];
    departmentIds: string[];
    subjectIds?: string[];
    invitedBy: string;
    invitedByName: string;
  }): Promise<SchoolInvitation> {
    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    const newInvite: SchoolInvitation = {
      id: `inv_rec_${Date.now()}`,
      schoolId: params.schoolId,
      schoolName: params.schoolName,
      inviteeName: params.inviteeName,
      inviteeEmail: params.inviteeEmail,
      inviteePhone: params.inviteePhone,
      roles: params.roles,
      departmentIds: params.departmentIds,
      subjectIds: params.subjectIds || [],
      token,
      status: 'pending',
      invitedBy: params.invitedBy,
      invitedByName: params.invitedByName,
      invitedAt: new Date().toISOString(),
      expiresAt,
    };

    try {
      const raw = localStorage.getItem(SCHOOL_INVITATIONS_KEY);
      const list: SchoolInvitation[] = raw ? JSON.parse(raw) : [];
      list.unshift(newInvite);
      localStorage.setItem(SCHOOL_INVITATIONS_KEY, JSON.stringify(list));
    } catch (_) {}

    await schoolAuditService.logEvent({
      schoolId: params.schoolId,
      actorId: params.invitedBy,
      actorName: params.invitedByName,
      actorRole: 'ADMIN',
      action: 'TEACHER_INVITED',
      targetType: 'teacher',
      targetId: newInvite.id,
      targetTitle: params.inviteeName,
      metadata: { email: params.inviteeEmail, roles: params.roles },
    });

    return newInvite;
  },

  async getInvitations(schoolId: string): Promise<SchoolInvitation[]> {
    try {
      const raw = localStorage.getItem(SCHOOL_INVITATIONS_KEY);
      if (raw) {
        const parsed: SchoolInvitation[] = JSON.parse(raw);
        return parsed.filter((i) => i.schoolId === schoolId);
      }
    } catch (_) {}
    return [];
  },

  async acceptInvitation(token: string, userId: string, userName: string): Promise<SchoolMembership> {
    const rawInvites = localStorage.getItem(SCHOOL_INVITATIONS_KEY);
    const invites: SchoolInvitation[] = rawInvites ? JSON.parse(rawInvites) : [];
    const invite = invites.find((i) => i.token === token && i.status === 'pending');

    if (!invite) throw new Error('Invalid or expired invitation token.');

    if (new Date(invite.expiresAt) < new Date()) {
      invite.status = 'expired';
      localStorage.setItem(SCHOOL_INVITATIONS_KEY, JSON.stringify(invites));
      throw new Error('Invitation link has expired. Please ask your school administrator to re-invite you.');
    }

    invite.status = 'accepted';
    invite.acceptedAt = new Date().toISOString();
    localStorage.setItem(SCHOOL_INVITATIONS_KEY, JSON.stringify(invites));

    const newMembership: SchoolMembership = {
      id: `mem_${Date.now()}`,
      schoolId: invite.schoolId,
      userId,
      userName,
      userEmail: invite.inviteeEmail,
      userPhone: invite.inviteePhone,
      roles: invite.roles,
      departmentIds: invite.departmentIds,
      subjectIds: invite.subjectIds,
      status: 'active',
      invitedBy: invite.invitedBy,
      invitedAt: invite.invitedAt,
      joinedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const memberships = await this.getMemberships(invite.schoolId);
    memberships.push(newMembership);
    localStorage.setItem(SCHOOL_MEMBERSHIPS_KEY, JSON.stringify(memberships));

    await schoolAuditService.logEvent({
      schoolId: invite.schoolId,
      actorId: userId,
      actorName: userName,
      actorRole: invite.roles[0] || 'TEACHER',
      action: 'TEACHER_JOINED',
      targetType: 'teacher',
      targetId: newMembership.id,
      targetTitle: userName,
    });

    return newMembership;
  },

  /**
   * School Templates
   */
  async getTemplates(schoolId: string = 'default_school'): Promise<SchoolTemplate[]> {
    try {
      const raw = localStorage.getItem(SCHOOL_TEMPLATES_KEY);
      if (raw) {
        const parsed: SchoolTemplate[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    const defaultTemplate: SchoolTemplate = {
      id: 'tpl_std_exam',
      schoolId,
      name: 'Standard National CBC Examination Format',
      description: 'Official school header with candidate fields, sections A/B/C, and footer rules.',
      headerConfiguration: {
        schoolName: 'NAIROBI ACADEMY HIGH SCHOOL',
        showMotto: true,
        mottoText: 'Strive for Excellence in Knowledge & Character',
        addressText: 'P.O. Box 40112 - 00100 Nairobi',
        phoneText: '+254 700 123 456',
        emailText: 'exams@nairobiacademy.ac.ke',
      },
      candidateFields: {
        studentName: true,
        admissionNo: true,
        streamClass: true,
        date: true,
        signature: true,
      },
      instructions: [
        'Write your name, admission number, and class stream in the spaces provided above.',
        'Answer all questions in Section A and Section B.',
        'Show all your mathematical working clearly in the spaces provided.',
        'Non-programmable scientific calculators may be used where appropriate.',
      ],
      sectionLayouts: [
        { id: 'sec_mcq', title: 'Section A: Multiple Choice Questions (10 Marks)', questionType: 'MULTIPLE_CHOICE', suggestedCount: 10, suggestedMarks: 1 },
        { id: 'sec_struct', title: 'Section B: Structured & Analytical Questions (40 Marks)', questionType: 'STRUCTURED', suggestedCount: 8, suggestedMarks: 5 },
      ],
      footerText: 'Page %p of %P — Nairobi Academy Internal Examination Board',
      pageNumberStyle: 'PAGE_X_OF_Y',
      workingSpaceStyle: 'STANDARD',
      markingSchemeStyle: 'SEPARATE',
      defaultDurationMinutes: 90,
      defaultTotalMarks: 50,
      isDefault: true,
      createdBy: 'system',
      createdByName: 'System Presets',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(SCHOOL_TEMPLATES_KEY, JSON.stringify([defaultTemplate]));
    } catch (_) {}

    return [defaultTemplate];
  },

  async saveTemplate(template: SchoolTemplate, actorId: string, actorName: string, actorRole: string): Promise<SchoolTemplate> {
    const templates = await this.getTemplates(template.schoolId);
    const updated = { ...template, updatedAt: new Date().toISOString() };
    const index = templates.findIndex((t) => t.id === template.id);

    if (index >= 0) templates[index] = updated;
    else templates.unshift(updated);

    try {
      localStorage.setItem(SCHOOL_TEMPLATES_KEY, JSON.stringify(templates));
    } catch (_) {}

    await schoolAuditService.logEvent({
      schoolId: template.schoolId,
      actorId,
      actorName,
      actorRole,
      action: 'TEMPLATE_CHANGED',
      targetType: 'template',
      targetId: template.id,
      targetTitle: template.name,
    });

    return updated;
  },

  /**
   * Assessment Deadlines / Calendar
   */
  async getAssessmentDeadlines(schoolId: string = 'default_school'): Promise<AssessmentDeadline[]> {
    try {
      const raw = localStorage.getItem(SCHOOL_DEADLINES_KEY);
      if (raw) {
        const parsed: AssessmentDeadline[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    const sampleDeadlines: AssessmentDeadline[] = [
      {
        id: 'dl_midterm_g9_math',
        schoolId,
        title: 'Grade 9 Mathematics Mid-Term Assessment',
        term: 'Term 1',
        academicYear: '2026',
        grade: 'Grade 9',
        subject: 'Mathematics',
        departmentId: 'dept_math',
        paperOwnerName: 'Mwalimu Peterson',
        draftDueDate: '2026-03-01',
        reviewDueDate: '2026-03-05',
        approvalDueDate: '2026-03-08',
        printingDate: '2026-03-10',
        examDate: '2026-03-15',
        status: 'IN_PROGRESS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    try {
      localStorage.setItem(SCHOOL_DEADLINES_KEY, JSON.stringify(sampleDeadlines));
    } catch (_) {}

    return sampleDeadlines;
  },

  /**
   * Legacy Helper Support & School Branding
   */
  getSchoolBranding(): SchoolBranding {
    try {
      const raw = localStorage.getItem(SCHOOL_BRANDING_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}

    return {
      schoolName: 'Nairobi Academy High School',
      logoUrl: '',
      teacherName: 'Mwalimu Peterson',
      candidateNameField: true,
      admissionNoField: true,
    };
  },

  saveSchoolBranding(branding: SchoolBranding): SchoolBranding {
    try {
      localStorage.setItem(SCHOOL_BRANDING_KEY, JSON.stringify(branding));
    } catch (_) {}
    return branding;
  },
};
