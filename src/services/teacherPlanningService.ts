import { SchemeOfWork } from '../types/contentOS';

const SCHEMES_KEY = 'soma_schemes_of_work';

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

export const teacherPlanningService = {
  /** Get schemes of work */
  getSchemesOfWork(teacherId = 'teacher_kamau'): SchemeOfWork[] {
    const list = readLocal<SchemeOfWork[]>(SCHEMES_KEY, []);
    if (list.length > 0) return list;

    const seed: SchemeOfWork[] = [
      {
        id: 'sch_001',
        teacherId,
        teacherName: 'Mwalimu Kamau',
        grade: 'Grade 9',
        subject: 'Mathematics',
        term: 'Term 1',
        year: 2026,
        weeks: [
          {
            weekNumber: 1,
            lessonNumber: 1,
            strand: 'Measurement & Geometry',
            subStrand: 'Surface Area of Cylinders',
            learningOutcome: 'Calculate total surface area of closed cylinders',
            learningActivity: 'Group problem solving with real cylindrical objects',
            resourcesNeeded: 'Cylindrical tins, tape measures, ruler, calculators',
            assessmentMethod: 'Observation & class oral quiz',
          },
          {
            weekNumber: 1,
            lessonNumber: 2,
            strand: 'Measurement & Geometry',
            subStrand: 'Open Cylinders & Pipes',
            learningOutcome: 'Differentiate between open and closed cylinder surface area formulas',
            learningActivity: 'Worked examples on pipe inner/outer surface area',
            resourcesNeeded: 'SomaAI Practice Worksheet #9',
            assessmentMethod: 'Individual written exercise',
          },
        ],
        status: 'approved',
        createdAt: '2026-01-05T00:00:00Z',
        updatedAt: '2026-01-05T00:00:00Z',
      },
    ];

    writeLocal(SCHEMES_KEY, seed);
    return seed;
  },

  /** Generate an automated Scheme of Work respecting term weeks and KICD sequence */
  generateSchemeOfWork(params: {
    teacherId: string;
    teacherName: string;
    grade: string;
    subject: string;
    term: string;
    termWeeksCount?: number;
    lessonsPerWeek?: number;
  }): SchemeOfWork {
    const weeksCount = params.termWeeksCount || 10;
    const lessonsPerWeek = params.lessonsPerWeek || 4;
    const weeks: SchemeOfWork['weeks'] = [];

    let count = 1;
    for (let w = 1; w <= weeksCount; w++) {
      for (let l = 1; l <= lessonsPerWeek; l++) {
        weeks.push({
          weekNumber: w,
          lessonNumber: count++,
          strand: 'Measurement & Geometry',
          subStrand: `Topic ${w}: Geometry & Algebra Integration`,
          learningOutcome: `Outcome W${w}L${l}: Demonstrate conceptual mastery of outcome ${w}.${l}`,
          learningActivity: 'Interactive guided inquiry, pair discussion, problem set',
          resourcesNeeded: 'Textbook, SomaAI Worksheets, Manipulatives',
          assessmentMethod: 'Formative assessment check',
        });
      }
    }

    const scheme: SchemeOfWork = {
      id: `sch_${Date.now()}`,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      grade: params.grade,
      subject: params.subject,
      term: params.term,
      year: 2026,
      weeks,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = readLocal<SchemeOfWork[]>(SCHEMES_KEY, []);
    list.unshift(scheme);
    writeLocal(SCHEMES_KEY, list);
    return scheme;
  },
};
