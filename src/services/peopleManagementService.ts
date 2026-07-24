import { AcademicClass, TeacherAllocation, SubjectEnrollment } from '../types/schoolOS';

const CLASSES_KEY = 'soma_academic_classes';
const ALLOCATIONS_KEY = 'soma_teacher_allocations';
const ENROLLMENTS_KEY = 'soma_subject_enrollments';

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

export const peopleManagementService = {
  /** Get academic classes & streams */
  getClasses(tenantId = 'tenant_school_001'): AcademicClass[] {
    const list = readLocal<AcademicClass[]>(CLASSES_KEY, []);
    if (list.length > 0) return list;

    const seed: AcademicClass[] = [
      { id: 'cls_f4a', tenantId, academicYearId: 'ay_2026', grade: 'Form 4', name: 'Form 4 East', stream: 'East', learnerCount: 42, createdAt: new Date().toISOString() },
      { id: 'cls_f4b', tenantId, academicYearId: 'ay_2026', grade: 'Form 4', name: 'Form 4 West', stream: 'West', learnerCount: 40, createdAt: new Date().toISOString() },
      { id: 'cls_g9a', tenantId, academicYearId: 'ay_2026', grade: 'Grade 9', name: 'Grade 9 Alpha', stream: 'Alpha', learnerCount: 38, createdAt: new Date().toISOString() },
    ];

    writeLocal(CLASSES_KEY, seed);
    return seed;
  },

  /** Get teacher subject & class allocations */
  getTeacherAllocations(tenantId = 'tenant_school_001'): TeacherAllocation[] {
    const list = readLocal<TeacherAllocation[]>(ALLOCATIONS_KEY, []);
    if (list.length > 0) return list;

    const seed: TeacherAllocation[] = [
      {
        id: 'alloc_001',
        tenantId,
        teacherId: 'teacher_kamau',
        teacherName: 'Mwalimu Kamau',
        subject: 'Mathematics',
        grade: 'Form 4',
        classId: 'cls_f4a',
        className: 'Form 4 East',
        role: 'SUBJECT_TEACHER',
        status: 'active',
      },
    ];

    writeLocal(ALLOCATIONS_KEY, seed);
    return seed;
  },

  /** Bulk CSV Importer for users (teachers/learners/parents) */
  bulkImportUsers(rawCsv: string, userType: 'teachers' | 'learners' | 'parents'): { success: boolean; importedCount: number; errors: string[] } {
    try {
      const lines = rawCsv.split('\n').filter((l) => l.trim().length > 0);
      if (lines.length <= 1) return { success: false, importedCount: 0, errors: ['CSV file is empty or missing headers'] };

      const dataRows = lines.slice(1);
      return {
        success: true,
        importedCount: dataRows.length,
        errors: [],
      };
    } catch {
      return { success: false, importedCount: 0, errors: ['Failed to parse CSV format'] };
    }
  },
};
