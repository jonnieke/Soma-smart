import { describe, expect, it } from 'vitest';
import { studyDocumentId, validateStudyGuide } from '../services/studyGuideValidation';
import type { ExplanationResult } from '../types';
const guide: ExplanationResult = {
  topic: 'Fractions',
  explanation: 'Fractions are equal parts of a whole.',
  level: 'Simple',
  summaryPoints: [],
  subtopics: [
    { title: 'Halves', blocks: [{ type: 'paragraph', text: 'Two equal parts make two halves.' }] },
  ],
};
describe('Study guide boundary', () => {
  it('uses real takeaways if a metadata-only overview was stripped', () => {
    expect(validateStudyGuide({...guide, explanation: '', summaryPoints: ['Two halves make a whole.']}).explanation).toBe('Two halves make a whole.');
  });
  it('uses the indexed real ID instead of the library display ID', () =>
    expect(studyDocumentId({ id: 'v-123', realId: 123 })).toBe('123'));
  it('accepts native indexed IDs', () => expect(studyDocumentId({ id: 123 })).toBe('123'));
  it.each(['v-123', 'teacher-uuid', '', 0])('rejects unsupported IDs: %s', (id) =>
    expect(() => studyDocumentId({ id })).toThrow('indexed source')
  );
  it('accepts a readable guide', () => expect(validateStudyGuide(guide)).toEqual(guide));
  it.each(['', '  ', undefined])('rejects empty introductions: %s', (explanation) =>
    expect(() => validateStudyGuide({ ...guide, explanation } as ExplanationResult)).toThrow(
      'empty introduction'
    )
  );
  it('rejects empty sections', () =>
    expect(() => validateStudyGuide({ ...guide, subtopics: [] })).toThrow('no readable'));
  it('removes blank sections rather than creating empty pages', () =>
    expect(
      validateStudyGuide({
        ...guide,
        subtopics: [...guide.subtopics!, { title: 'Blank', blocks: [] }],
      }).subtopics
    ).toHaveLength(1));
});
