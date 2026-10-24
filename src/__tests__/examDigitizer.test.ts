import { beforeEach, describe, expect, it } from 'vitest';
import {
  examDigitizerService,
  sanitizeSvg,
} from '../services/examDigitizerService';

describe('Exam Paper Digitizer & Verification Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('sanitizes and validates self-contained SVG code', () => {
    const rawMarkdownSvg = `\`\`\`xml
<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <circle cx="200" cy="150" r="80" stroke="black" />
</svg>
\`\`\``;

    const cleaned = sanitizeSvg(rawMarkdownSvg);
    expect(cleaned).toContain('<svg viewBox="0 0 400 300"');
    expect(cleaned).toContain('</svg>');
    expect(cleaned).not.toContain('```');

    // Invalid non-SVG returns empty string
    expect(sanitizeSvg('<div>Not an SVG</div>')).toBe('');
  });

  it('creates an upload batch and runs AI deconstruction into structured questions with marking rubrics', async () => {
    const batch = await examDigitizerService.createBatch({
      title: 'KCSE 2024 Physics Paper 1',
      grade: 'Form 4',
      subject: 'Physics',
      exam_type: 'KCSE',
      raw_file_url: 'https://example.com/kcse_physics_2024.pdf',
      target_bundle_code: 'KCSE BDL001',
    });

    expect(batch.id).toBeDefined();
    expect(batch.status).toBe('UPLOADED');
    expect(batch.target_bundle_code).toBe('KCSE BDL001');

    const result = await examDigitizerService.runDeconstruction(batch);
    expect(result.batch.status).toBe('READY_FOR_REVIEW');
    expect(result.questions.length).toBeGreaterThanOrEqual(2);

    const firstQ = result.questions[0];
    expect(firstQ.marks).toBeGreaterThanOrEqual(1);
    expect(firstQ.topic).toBeDefined();
    expect(firstQ.marking_scheme).toContain('[1 mk]');
    expect(firstQ.admin_verified).toBe(false);
  });

  it('prevents publishing unverified questions and publishes once admin marks them verified', async () => {
    const batch = await examDigitizerService.createBatch({
      title: 'KPSEA 2024 Mathematics',
      grade: 'Grade 6',
      subject: 'Mathematics',
      exam_type: 'KPSEA',
      raw_file_url: 'https://example.com/kpsea_math_2024.pdf',
      target_bundle_code: 'KPSEA BDL001',
    });

    const { questions } = await examDigitizerService.runDeconstruction(batch);

    // Attempting to publish without admin verification must fail
    const blockedPublish = await examDigitizerService.publishBatchToPaperBank(batch.id);
    expect(blockedPublish.success).toBe(false);
    expect(blockedPublish.error).toContain('not been verified');

    // Mark all questions as verified
    for (const q of questions) {
      await examDigitizerService.updateQuestion({
        ...q,
        admin_verified: true,
      });
    }

    const successfulPublish = await examDigitizerService.publishBatchToPaperBank(
      batch.id,
      'KPSEA BDL001'
    );
    expect(successfulPublish.success).toBe(true);
    expect(successfulPublish.publishedItem?.title).toContain('Soma AI Original');
  });
});
