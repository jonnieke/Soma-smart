import { describe, expect, it } from 'vitest';
import { EducationLevel } from '../types';
import {
  getRevisionTerminology,
  normalizePaperSubject,
  paperHasDiagrams,
  paperPdfUrl,
} from '../features/revision/hub/revisionHubModel';

describe('revision hub paper model', () => {
  it('exposes the published learner PDF URL from either API field style', () => {
    expect(paperPdfUrl({ file_url: ' https://example.com/paper.pdf ' })).toBe(
      'https://example.com/paper.pdf'
    );
    expect(paperPdfUrl({ fileUrl: 'https://example.com/legacy.pdf' })).toBe(
      'https://example.com/legacy.pdf'
    );
  });

  it('detects diagrams using camelCase and snake_case structured fields', () => {
    expect(
      paperHasDiagrams({ structured_questions: [{ id: '1', diagram_url: '/diagram-1.png' }] })
    ).toBe(true);
    expect(
      paperHasDiagrams({ structured_questions: [{ id: '2', diagramUrl: '/diagram-2.png' }] })
    ).toBe(true);
    expect(paperHasDiagrams({ structured_questions: [{ id: '3' }] })).toBe(false);
  });

  it('recovers a usable subject from a paper title when metadata is generic', () => {
    expect(
      normalizePaperSubject({ subject: 'General', title: 'SomaAI Grade 6 Kiswahili Mock 1' })
    ).toBe('Kiswahili');
  });

  it('uses competency-based language for grade learners', () => {
    expect(getRevisionTerminology(EducationLevel.JUNIOR, 'Grade 6')).toMatchObject({
      subjectLabel: 'learning area',
      contentLabel: 'assessment',
      improvementHeading: 'Your Priority Skills',
    });
  });
});
