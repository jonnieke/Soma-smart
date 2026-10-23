import { describe, expect, it } from 'vitest';
import { OFFICIAL_2026, officialExam, paperDates } from '../features/revision/knecTimetable';

const iso = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

describe('KNEC 2026 timetable data', () => {
  it('holds ISO dates in order for every published exam', () => {
    for (const exam of Object.values(OFFICIAL_2026)) {
      expect(iso(exam!.start) && iso(exam!.end)).toBe(true);
      expect(exam!.start <= exam!.end).toBe(true);
      if (exam!.rehearsal) expect(exam!.rehearsal < exam!.start).toBe(true);
      const dates = exam!.days.map((d) => d.date);
      expect([...dates].sort()).toEqual(dates);
      dates.forEach((d) => expect(d >= exam!.start && d <= exam!.end).toBe(true));
    }
  });
  it('matches the dates published by KNEC', () => {
    expect(officialExam('KPSEA')).toMatchObject({ start: '2026-10-26', end: '2026-10-28', rehearsal: '2026-10-23' });
    expect(officialExam('KJSEA')).toMatchObject({ start: '2026-10-26', end: '2026-10-30', rehearsal: '2026-10-23' });
    expect(officialExam('KCSE')).toMatchObject({ start: '2026-11-02', end: '2026-11-20', rehearsal: '2026-10-16' });
    expect(officialExam('CBC')).toBeNull();
  });
});

describe('finding a learner’s own paper date', () => {
  it('maps app subject names to timetable names', () => {
    expect(paperDates('KJSEA', 'Mathematics').map((d) => d.date)).toEqual(['2026-10-28']);
    expect(paperDates('KJSEA', 'English').map((d) => d.date)).toEqual(['2026-10-26']);
    expect(paperDates('KJSEA', 'Kiswahili').map((d) => d.date)).toEqual(['2026-10-27']);
    expect(paperDates('KJSEA', 'CRE').map((d) => d.date)).toEqual(['2026-10-30']);
    expect(paperDates('KJSEA', 'Creative Arts').map((d) => d.date)).toEqual(['2026-10-29']);
    expect(paperDates('KPSEA', 'Science and Technology').map((d) => d.date)).toEqual(['2026-10-27']);
    expect(paperDates('KPSEA', 'Social Studies').map((d) => d.date)).toEqual(['2026-10-28']);
  });
  it('never invents a date for subjects or exams KNEC has not listed', () => {
    expect(paperDates('KJSEA', 'IRE')).toEqual([]);
    expect(paperDates('KPSEA', 'Agriculture')).toEqual([]);
    expect(paperDates('KCSE', 'Mathematics')).toEqual([]);
    expect(paperDates('CBC', 'Mathematics')).toEqual([]);
  });
});
