import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPhoneRestoreSession,
  computePassStatus,
  normalizeKenyanPhone,
  normalizeKenyanPhoneLast9,
  readPhoneRestoreSession,
  recordLocalPaperPurchaseSession,
  REVISION_PASS_DURATION_MS,
  savePhoneRestoreSession,
} from '../services/examPaperBankService';
import {
  buildPoolFingerprint,
  clearLocalPool,
  computeTokenOverlap,
  extractPoolTokens,
  learnerPoolService,
} from '../services/learnerPoolService';

describe('Kenyan Phone Number Last-9 Normalization & 24h Revision Pass', () => {
  beforeEach(() => {
    localStorage.clear();
    clearPhoneRestoreSession();
  });

  it('accurately captures the last 9 digits across +254xxx, 254xxx, 0xxxx, and xxx formats', () => {
    expect(normalizeKenyanPhoneLast9('+254712345678')).toBe('712345678');
    expect(normalizeKenyanPhoneLast9('+254 712 345 678')).toBe('712345678');
    expect(normalizeKenyanPhoneLast9('254712345678')).toBe('712345678');
    expect(normalizeKenyanPhoneLast9('0712345678')).toBe('712345678');
    expect(normalizeKenyanPhoneLast9('0712-345-678')).toBe('712345678');
    expect(normalizeKenyanPhoneLast9('712345678')).toBe('712345678');
    expect(normalizeKenyanPhoneLast9('0110987654')).toBe('110987654');
    expect(normalizeKenyanPhoneLast9('110987654')).toBe('110987654');

    expect(normalizeKenyanPhone('+254712345678')).toBe('254712345678');
    expect(normalizeKenyanPhone('0712345678')).toBe('254712345678');
    expect(normalizeKenyanPhone('712345678')).toBe('254712345678');
  });

  it('rejects too-short or invalid phone inputs', () => {
    expect(normalizeKenyanPhoneLast9('')).toBeNull();
    expect(normalizeKenyanPhoneLast9('12345')).toBeNull();
    expect(normalizeKenyanPhoneLast9('abc')).toBeNull();
  });

  it('keeps the AI revision pass active within 24 hours and marks it expired after 24 hours', () => {
    const paidAt = new Date('2026-10-24T08:00:00.000Z').toISOString();

    // 6 hours after purchase -> active, 18h remaining
    const sixHoursLater = Date.parse('2026-10-24T14:00:00.000Z');
    const activeStatus = computePassStatus(paidAt, null, sixHoursLater);
    expect(activeStatus.passActive).toBe(true);
    expect(activeStatus.hoursRemaining).toBe(18);

    // 25 hours after purchase -> expired, 0h remaining
    const twentyFiveHoursLater = Date.parse('2026-10-25T09:00:00.000Z');
    const expiredStatus = computePassStatus(paidAt, null, twentyFiveHoursLater);
    expect(expiredStatus.passActive).toBe(false);
    expect(expiredStatus.hoursRemaining).toBe(0);
  });

  it('persists and restores a candidate phone session with 24h window tracking', () => {
    const created = recordLocalPaperPurchaseSession('paper-kcse-math-1', {
      name: 'Amina Wanjiku',
      phone: '0722111222',
    });
    expect(created.last9).toBe('722111222');
    expect(created.normalizedPhone).toBe('254722111222');
    expect(created.passActive).toBe(true);
    expect(created.paperIds).toContain('paper-kcse-math-1');

    const restoredNow = readPhoneRestoreSession();
    expect(restoredNow?.found).toBe(true);
    expect(restoredNow?.passActive).toBe(true);

    // Simulate 24 hours + 10 minutes later
    const futureNow = Date.now() + REVISION_PASS_DURATION_MS + 10 * 60 * 1000;
    const restoredAfter24h = readPhoneRestoreSession(futureNow);
    expect(restoredAfter24h?.found).toBe(true);
    expect(restoredAfter24h?.passActive).toBe(false);
    expect(restoredAfter24h?.hoursRemaining).toBe(0);

    // Save a renewed session
    savePhoneRestoreSession({
      ...created,
      latestPaidAt: new Date(futureNow).toISOString(),
      passExpiresAt: new Date(futureNow + REVISION_PASS_DURATION_MS).toISOString(),
      passActive: true,
      hoursRemaining: 24,
    });
    const renewed = readPhoneRestoreSession(futureNow + 1000);
    expect(renewed?.passActive).toBe(true);
  });
});

describe('Shared Learner Knowledge Pool & Relatable Query Deduplication', () => {
  beforeEach(() => {
    localStorage.clear();
    clearLocalPool();
  });

  it('normalizes relatable syllabus queries into canonical tokens and fingerprints', () => {
    const q1 = 'Please explain Linear Equations and Inequalities for me';
    const q2 = 'What are linear equation & inequality questions?';

    const tokens1 = extractPoolTokens(q1, 'Mathematics');
    const tokens2 = extractPoolTokens(q2, 'Mathematics');
    expect(tokens1).toEqual(tokens2);
    expect(computeTokenOverlap(tokens1, tokens2)).toBe(1);

    const fp1 = buildPoolFingerprint({
      itemType: 'PRACTICE_DRILL',
      grade: 'Grade 9',
      subject: 'Mathematics',
      query: q1,
    });
    const fp2 = buildPoolFingerprint({
      itemType: 'PRACTICE_DRILL',
      grade: 'Grade 9',
      subject: 'Mathematics',
      query: q2,
    });
    expect(fp1).toBe(fp2);
  });

  it('reuses pooled practice drills for relatable queries instead of regenerating', async () => {
    const sampleQuestions = [
      {
        number: 1,
        text: 'Solve for x: 4x - 7 = 13',
        marks: 2,
        topic: 'Linear Equations',
        guidance: 'Add 7 to both sides, then divide by 4.',
        modelAnswerOutline: '4x = 20 [1 mk]; x = 5 [1 mk]',
      },
      {
        number: 2,
        text: 'Solve the inequality: 2x + 3 < 11',
        marks: 2,
        topic: 'Linear Equations',
        guidance: 'Subtract 3, then divide by 2.',
        modelAnswerOutline: '2x < 8 [1 mk]; x < 4 [1 mk]',
      },
      {
        number: 3,
        text: 'Form and solve a linear equation for three consecutive integers summing to 36.',
        marks: 3,
        topic: 'Linear Equations',
        guidance: 'Let integers be n, n+1, n+2.',
        modelAnswerOutline: '3n + 3 = 36 [1 mk]; n = 11 [1 mk]; 11, 12, 13 [1 mk]',
      },
    ];

    await learnerPoolService.savePooledPractice(
      {
        subject: 'Mathematics',
        topic: 'Solving linear equations and inequalities',
        examType: 'KJSEA',
        grade: 'Grade 9',
      },
      sampleQuestions
    );

    // Another learner searches with a differently phrased relatable query
    const pooled = await learnerPoolService.findPooledPractice({
      subject: 'Mathematics',
      topic: 'Explain linear equation & inequality practice questions',
      grade: 'Grade 9',
      count: 3,
    });

    expect(pooled).not.toBeNull();
    expect(pooled).toHaveLength(3);
    expect(pooled?.[0].text).toContain('Solve for x');
  });

  it('reuses pooled explanations and increments reuseCount for relatable study queries', async () => {
    const explanation =
      'Photosynthesis takes place in the chloroplast. Stage 1 is the light-dependent stage (photolysis of water in the grana). Stage 2 is carbon dioxide fixation in the stroma [2 mks].';

    await learnerPoolService.savePooledExplanation(
      {
        subject: 'Biology',
        grade: 'Form 4',
        topic: 'Photosynthesis light and dark stages',
        prompt: 'Explain the light and dark stages of photosynthesis',
      },
      explanation
    );

    const found = await learnerPoolService.findPooledExplanation({
      subject: 'Biology',
      grade: 'Form 4',
      prompt: 'What happens in light and dark stage of photosynthesis?',
    });

    expect(found).toBe(explanation);

    const list = await learnerPoolService.listPool({
      grade: 'Form 4',
      subject: 'Biology',
    });
    const item = list.find((entry) => entry.topic.includes('Photosynthesis'));
    expect(item).toBeDefined();
    expect(item!.reuseCount).toBeGreaterThanOrEqual(2);
  });
});
