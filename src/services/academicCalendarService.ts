import { AcademicYear, AcademicCalendarEvent } from '../types/schoolOS';

const ACADEMIC_YEARS_KEY = 'soma_academic_years';
const CALENDAR_EVENTS_KEY = 'soma_calendar_events';

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

export const academicCalendarService = {
  /** Get academic years for a tenant */
  getAcademicYears(tenantId = 'tenant_school_001'): AcademicYear[] {
    const list = readLocal<AcademicYear[]>(ACADEMIC_YEARS_KEY, []);
    if (list.length > 0) return list;

    const seed: AcademicYear[] = [
      {
        id: 'ay_2026',
        tenantId,
        name: '2026 Academic Year',
        startDate: '2026-01-05',
        endDate: '2026-11-20',
        status: 'active',
        terms: [
          { id: 't1', name: 'Term 1', startDate: '2026-01-05', endDate: '2026-04-03', isCurrent: true },
          { id: 't2', name: 'Term 2', startDate: '2026-05-04', endDate: '2026-08-07', isCurrent: false },
          { id: 't3', name: 'Term 3', startDate: '2026-08-31', endDate: '2026-11-20', isCurrent: false },
        ],
        createdAt: '2026-01-01T00:00:00Z',
      },
    ];

    writeLocal(ACADEMIC_YEARS_KEY, seed);
    return seed;
  },

  /** Get academic calendar events */
  getCalendarEvents(tenantId = 'tenant_school_001'): AcademicCalendarEvent[] {
    const list = readLocal<AcademicCalendarEvent[]>(CALENDAR_EVENTS_KEY, []);
    if (list.length > 0) return list;

    const seed: AcademicCalendarEvent[] = [
      {
        id: 'evt_001',
        tenantId,
        title: 'Form 4 Mid-Term CAT Examination',
        eventType: 'CAT',
        startDate: '2026-02-16',
        endDate: '2026-02-20',
        description: 'Compulsory CAT 1 across all secondary streams',
      },
      {
        id: 'evt_002',
        tenantId,
        title: 'End of Term 1 Examinations & Marking Window',
        eventType: 'EXAM_PERIOD',
        startDate: '2026-03-23',
        endDate: '2026-04-02',
        description: 'End-Term summative assessment and report generation',
      },
    ];

    writeLocal(CALENDAR_EVENTS_KEY, seed);
    return seed;
  },

  /** Perform Academic Year Rollover */
  performAcademicYearRollover(tenantId: string, currentYearId: string, newYearName: string): AcademicYear {
    const years = this.getAcademicYears(tenantId);
    const current = years.find((y) => y.id === currentYearId);
    if (current) current.status = 'completed';

    const newYear: AcademicYear = {
      id: `ay_${Date.now()}`,
      tenantId,
      name: newYearName,
      startDate: '2027-01-05',
      endDate: '2027-11-20',
      status: 'active',
      terms: [
        { id: `t1_${Date.now()}`, name: 'Term 1', startDate: '2027-01-05', endDate: '2027-04-03', isCurrent: true },
        { id: `t2_${Date.now()}`, name: 'Term 2', startDate: '2027-05-04', endDate: '2027-08-07', isCurrent: false },
      ],
      createdAt: new Date().toISOString(),
    };

    years.unshift(newYear);
    writeLocal(ACADEMIC_YEARS_KEY, years);
    return newYear;
  },
};
