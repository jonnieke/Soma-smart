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
  splitAnswerForPaywallTeaser,
} from '../services/learnerPoolService';
import { formatPooledMaterialForWhatsApp } from '../services/whatsappService';

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

  it('splits deeper Akili explanations into a 1/3 visible value preview and a covered paywall section', async () => {
    const result = await learnerPoolService.askAkiliDeeperExplanation({
      grade: 'Grade 9',
      subject: 'Mathematics',
      examPathway: 'KJSEA',
      topic: 'Linear Equations & Inequalities',
      question: 'Why do we reverse the inequality sign when dividing by a negative number?',
    });

    expect(result.fullAnswer.length).toBeGreaterThan(150);
    expect(result.visiblePart.length).toBeGreaterThan(40);
    expect(result.coveredPart.length).toBeGreaterThan(80);
    expect(result.fullAnswer).toContain(result.visiblePart);
    expect(result.fullAnswer).toContain(result.coveredPart);

    // Asking a relatable follow-up should hit the pool (fromPool = true)
    const second = await learnerPoolService.askAkiliDeeperExplanation({
      grade: 'Grade 9',
      subject: 'Mathematics',
      examPathway: 'KJSEA',
      topic: 'Linear Equations & Inequalities',
      question: 'Explain why we reverse inequality signs when dividing by negative numbers',
    });
    expect(second.fromPool).toBe(true);
    expect(second.visiblePart).toBe(result.visiblePart);
    expect(second.coveredPart).toBe(result.coveredPart);

    const directSplit = splitAnswerForPaywallTeaser(result.fullAnswer);
    expect(directSplit.visiblePart).toBe(result.visiblePart);
  });

  it('pools scanned/captured exam papers & notes and supports Helpful upvoting + WhatsApp sharing', async () => {
    const capturedAnalysis = {
      subject: 'Chemistry',
      grade: 'Form 4',
      examType: 'KCSE' as const,
      questions: [
        {
          id: 1,
          number: '1a',
          text: 'State Charles Law and give its mathematical expression.',
          topic: 'Gas Laws',
          competency: 'Scientific principles',
          marks: 2,
          markingScheme: ['Volume is directly proportional to Kelvin temperature at constant pressure [1 mk]', 'V1/T1 = V2/T2 [1 mk]'],
        },
        {
          id: 2,
          number: '1b',
          text: 'A gas occupies 400 cm3 at 27°C. Calculate its volume at 127°C at constant pressure.',
          topic: 'Gas Laws',
          competency: 'Calculation',
          marks: 3,
          markingScheme: ['T1 = 300K, T2 = 400K [1 mk]', 'V2 = (400 x 400) / 300 [1 mk]', '533.33 cm3 [1 mk]'],
        },
      ],
    };

    const savedPaper = await learnerPoolService.savePooledCapturedPaper(
      capturedAnalysis,
      'KCSE Chemistry Gas Laws Captured Paper'
    );
    expect(savedPaper).not.toBeNull();
    expect(savedPaper!.itemType).toBe('REVISION_PAPER');

    // Should be retrievable as a captured paper for relatable queries
    const foundPaper = await learnerPoolService.findPooledCapturedPaper({
      subject: 'Chemistry',
      grade: 'Form 4',
      query: 'KCSE Chemistry Gas Laws paper questions',
    });
    expect(foundPaper).not.toBeNull();
    expect(foundPaper?.questions).toHaveLength(2);

    // Should also have populated a free Practice Drill in the Learner's Pool
    const chemistryPool = learnerPoolService.listLocalPool({
      grade: 'Form 4',
      subject: 'Chemistry',
      itemType: 'PRACTICE_DRILL',
    });
    expect(chemistryPool.length).toBeGreaterThanOrEqual(1);

    // Test Helpful upvoting
    const drillItem = chemistryPool[0];
    const beforeCount = drillItem.reuseCount;
    const updatedItem = await learnerPoolService.markItemHelpful(drillItem.id);
    expect(updatedItem?.reuseCount).toBe(beforeCount + 1);
    expect(learnerPoolService.hasMarkedHelpful(drillItem.id)).toBe(true);

    // Test Classmate WhatsApp formatting
    const waText = formatPooledMaterialForWhatsApp(updatedItem!);
    expect(waText).toContain('Soma AI Learner’s Revision Pool');
    expect(waText).toContain('Gas Laws');
    expect(waText).toContain('https://www.somaai.co.ke/revision');
  });

  it('rotates unseen pooled practice drills per learner and computes Admin AI cost-savings analytics', async () => {
    const drillA = await learnerPoolService.savePooledPractice(
      {
        subject: 'Physics',
        topic: 'Hookes Law & Elasticity',
        examType: 'KCSE',
        grade: 'Form 4',
      },
      [
        {
          number: 1,
          text: 'State Hookes Law.',
          marks: 1,
          topic: 'Hookes Law & Elasticity',
          modelAnswerOutline: 'Extension is proportional to force within elastic limit [1 mk]',
        },
      ]
    );
    const drillB = await learnerPoolService.savePooledPractice(
      {
        subject: 'Physics',
        topic: 'Linear Motion & Equations',
        examType: 'KCSE',
        grade: 'Form 4',
      },
      [
        {
          number: 1,
          text: 'Define uniform acceleration.',
          marks: 1,
          topic: 'Linear Motion & Equations',
          modelAnswerOutline: 'Constant rate of change of velocity [1 mk]',
        },
      ]
    );

    expect(drillA).not.toBeNull();
    expect(drillB).not.toBeNull();

    const firstPick = await learnerPoolService.getNextRotationalPoolDrill('phone:712345678', {
      grade: 'Form 4',
      subject: 'Physics',
    });
    expect(firstPick).not.toBeNull();

    // Mark the first drill completed by this learner; next rotational call should pick the other unseen drill
    learnerPoolService.markDrillCompletedByLearner('phone:712345678', firstPick!.id);

    const secondPick = await learnerPoolService.getNextRotationalPoolDrill('phone:712345678', {
      grade: 'Form 4',
      subject: 'Physics',
    });
    expect(secondPick).not.toBeNull();
    expect(secondPick!.id).not.toBe(firstPick!.id);

    // Verify Admin AI cost-savings analytics & moderation
    const analyticsBefore = await learnerPoolService.getPoolAnalytics();
    expect(analyticsBefore.totalItems).toBeGreaterThanOrEqual(2);
    expect(analyticsBefore.totalDrills).toBeGreaterThanOrEqual(2);
    expect(analyticsBefore.generationsSaved).toBeGreaterThanOrEqual(1);
    expect(analyticsBefore.estimatedSavingsKes).toBeGreaterThan(0);

    const boosted = await learnerPoolService.boostPooledItem(drillA!.id, 10);
    expect(boosted?.reuseCount).toBeGreaterThanOrEqual((drillA?.reuseCount || 1) + 10);

    const printableHtml = learnerPoolService.formatPrintableRevisionSheetHtml(boosted!);
    expect(printableHtml).toContain('Hookes Law &amp; Elasticity');
    expect(printableHtml).toContain('Soma AI · Learner’s Revision Pool (100% Free)');
    expect(printableHtml).toContain('https://www.somaai.co.ke/revision');

    const removed = await learnerPoolService.deletePooledItem(drillB!.id);
    expect(removed).toBe(true);
  });
});
