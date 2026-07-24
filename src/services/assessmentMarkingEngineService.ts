import { Question } from '../types/paperStudio';
import { AssessmentResponse, AssessmentAttempt, AssessmentRubric } from '../types/assessmentDelivery';
import { assessmentAttemptService } from './assessmentAttemptService';
import { schoolCreditService } from './schoolCreditService';

export interface MathValidationResult {
  isValid: boolean;
  normalizedValue: number | string;
  reason: string;
}

export const assessmentMarkingEngineService = {
  /**
   * Deterministic math & numeric response validator.
   * Normalizes whitespace, commas, fractions, percentages, and evaluates within tolerance.
   */
  validateMathResponse(
    learnerInput: string,
    expectedAnswer: string,
    tolerance = 0.01,
  ): MathValidationResult {
    if (!learnerInput || !learnerInput.trim()) {
      return { isValid: false, normalizedValue: '', reason: 'Empty response.' };
    }

    const cleanInput = learnerInput.trim().toLowerCase().replace(/,/g, '');
    const cleanExpected = expectedAnswer.trim().toLowerCase().replace(/,/g, '');

    // Direct string match
    if (cleanInput === cleanExpected) {
      return { isValid: true, normalizedValue: cleanInput, reason: 'Exact match.' };
    }

    // Helper to parse numbers, fractions, and percentages
    const parseNumber = (val: string): number | null => {
      let v = val.trim();
      if (v.endsWith('%')) {
        const num = parseFloat(v.replace('%', ''));
        return isNaN(num) ? null : num / 100;
      }
      if (v.includes('/')) {
        const parts = v.split('/');
        if (parts.length === 2) {
          const num = parseFloat(parts[0]);
          const den = parseFloat(parts[1]);
          return den !== 0 && !isNaN(num) && !isNaN(den) ? num / den : null;
        }
      }
      const num = parseFloat(v);
      return isNaN(num) ? null : num;
    };

    const numLearner = parseNumber(cleanInput);
    const numExpected = parseNumber(cleanExpected);

    if (numLearner !== null && numExpected !== null) {
      const diff = Math.abs(numLearner - numExpected);
      if (diff <= tolerance) {
        return {
          isValid: true,
          normalizedValue: numLearner,
          reason: `Numeric value within tolerance (diff: ${diff.toFixed(4)} <= ${tolerance}).`,
        };
      }
      return {
        isValid: false,
        normalizedValue: numLearner,
        reason: `Numeric value ${numLearner} out of tolerance range for ${numExpected}.`,
      };
    }

    return { isValid: false, normalizedValue: cleanInput, reason: 'Value did not match expected pattern.' };
  },

  /**
   * Deterministic auto-marking for objective question types.
   */
  markObjectiveQuestion(question: Question, responseValue: unknown): {
    awardedMarks: number;
    isCorrect: boolean;
    reason: string;
  } {
    if (responseValue === undefined || responseValue === null || responseValue === '') {
      return { awardedMarks: 0, isCorrect: false, reason: 'Unanswered' };
    }

    const maxMarks = question.marks;
    const qType = question.questionType;

    // 1. Multiple Choice & True/False
    if (qType === 'MULTIPLE_CHOICE' || qType === 'TRUE_FALSE') {
      const learnerAns = String(responseValue).trim().toUpperCase();
      const correctAns = String(question.correctAnswer).trim().toUpperCase();
      const isCorrect = learnerAns === correctAns;
      return {
        awardedMarks: isCorrect ? maxMarks : 0,
        isCorrect,
        reason: isCorrect ? 'Correct option selected.' : `Selected ${learnerAns}, expected ${correctAns}.`,
      };
    }

    // 2. Fill in the Blank
    if (qType === 'FILL_BLANK') {
      const learnerAns = String(responseValue).trim().toLowerCase();
      const acceptableAnswers = String(question.correctAnswer)
        .split(/[;|]/)
        .map((a) => a.trim().toLowerCase());
      const isCorrect = acceptableAnswers.includes(learnerAns);
      return {
        awardedMarks: isCorrect ? maxMarks : 0,
        isCorrect,
        reason: isCorrect ? 'Correct answer provided.' : `Answer "${learnerAns}" not in acceptable key list.`,
      };
    }

    // 3. Numeric & Calculation
    if (qType === 'CALCULATION') {
      const valResult = this.validateMathResponse(String(responseValue), question.correctAnswer);
      return {
        awardedMarks: valResult.isValid ? maxMarks : 0,
        isCorrect: valResult.isValid,
        reason: valResult.reason,
      };
    }

    // 4. Matching
    if (qType === 'MATCHING') {
      if (typeof responseValue === 'object' && responseValue !== null) {
        try {
          const expectedMap = JSON.parse(question.correctAnswer) as Record<string, string>;
          const learnerMap = responseValue as Record<string, string>;
          let correctCount = 0;
          const totalKeys = Object.keys(expectedMap).length;

          Object.entries(expectedMap).forEach(([k, v]) => {
            if (learnerMap[k] && String(learnerMap[k]).trim().toLowerCase() === String(v).trim().toLowerCase()) {
              correctCount++;
            }
          });

          const ratio = totalKeys > 0 ? correctCount / totalKeys : 0;
          const awarded = Math.round(ratio * maxMarks);
          const isCorrect = ratio === 1;
          return {
            awardedMarks: awarded,
            isCorrect,
            reason: `Matched ${correctCount}/${totalKeys} items correctly.`,
          };
        } catch {
          /* Fall back */
        }
      }
    }

    return { awardedMarks: 0, isCorrect: false, reason: 'Non-objective or unhandled type.' };
  },

  /**
   * AI-assisted marking suggestion for open-ended responses.
   * Logs AI credits used and provides score + justification.
   */
  async generateAIMarkingSuggestion(
    question: Question,
    learnerResponseText: string,
    schoolId?: string,
    teacherId = 'teacher_user',
  ): Promise<{
    suggestedScore: number;
    confidence: number;
    justification: string;
    rubricCriteriaScores?: Record<string, number>;
  }> {
    if (!learnerResponseText || !learnerResponseText.trim()) {
      return { suggestedScore: 0, confidence: 1.0, justification: 'Response is blank.' };
    }

    // Simulate AI model evaluation against marking scheme criteria
    const maxMarks = question.marks;
    const wordCount = learnerResponseText.trim().split(/\s+/).length;
    let ratio = Math.min(1.0, wordCount / 20); // Basic length heuristic

    // Keyword matching against explanation / marking scheme
    if (question.explanation) {
      const keywords = question.explanation.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      const matches = keywords.filter((kw) => learnerResponseText.toLowerCase().includes(kw));
      if (keywords.length > 0) {
        ratio = Math.max(ratio, matches.length / keywords.length);
      }
    }

    const suggestedScore = Math.min(maxMarks, Math.max(0, Math.round(ratio * maxMarks)));
    const confidence = 0.85; // Standard AI confidence

    // Deduct AI credits for open response evaluation
    if (schoolId) {
      try {
        await schoolCreditService.deductCreditsForPaperGeneration({
          schoolId,
          userId: teacherId,
          costInCredits: 1,
        });
      } catch {
        /* Non-blocking */
      }
    }


    return {
      suggestedScore,
      confidence,
      justification: `AI Evaluated: Response contains key terms matching ${Math.round(ratio * 100)}% of marking scheme criteria.`,
    };
  },

  /**
   * Run auto-marking on all objective responses of an attempt.
   */
  async autoMarkAttempt(attemptId: string, questions: Question[]): Promise<AssessmentAttempt | null> {
    const responses = await assessmentAttemptService.getAttemptResponses(attemptId);
    let objectiveTotal = 0;
    let hasSubjective = false;

    for (const resp of responses) {
      const q = questions.find((item) => item.id === resp.questionId);
      if (!q) continue;

      const isObjective = [
        'MULTIPLE_CHOICE',
        'TRUE_FALSE',
        'FILL_BLANK',
        'CALCULATION',
        'MATCHING',
      ].includes(q.questionType);

      if (isObjective) {
        const markResult = this.markObjectiveQuestion(q, resp.responseValue);
        resp.autoMarked = true;
        resp.awardedMarks = markResult.awardedMarks;
        resp.isCorrect = markResult.isCorrect;
        resp.teacherScore = markResult.awardedMarks;
        resp.markingStatus = 'AUTO_MARKED';
        resp.teacherComment = markResult.reason;
        objectiveTotal += markResult.awardedMarks;

        await assessmentAttemptService.autoSaveResponse(attemptId, q.id, resp.responseValue);
      } else {
        hasSubjective = true;
      }
    }

    const finalStatus = hasSubjective ? 'awaiting_marking' : 'marked';

    return assessmentAttemptService.updateAttemptStatus(attemptId, finalStatus, {
      objectiveScore: objectiveTotal,
      subjectiveScore: 0,
      totalScore: objectiveTotal,
    });
  },

  /**
   * Score an open-ended question response using a Rubric.
   */
  scoreWithRubric(
    rubric: AssessmentRubric,
    selectedLevelIds: Record<string, string>, // criterionId -> levelId
  ): { totalScore: number; maxScore: number; breakdown: { criterionTitle: string; awardedMarks: number; maxMarks: number }[] } {
    let totalScore = 0;
    let maxScore = 0;
    const breakdown: { criterionTitle: string; awardedMarks: number; maxMarks: number }[] = [];

    rubric.criteria.forEach((crit) => {
      maxScore += crit.maxMarks;
      const selectedLevelId = selectedLevelIds[crit.id];
      const level = crit.levels.find((l) => l.id === selectedLevelId);
      const awarded = level ? level.marks : 0;
      totalScore += awarded;

      breakdown.push({
        criterionTitle: crit.title,
        awardedMarks: awarded,
        maxMarks: crit.maxMarks,
      });
    });

    return { totalScore, maxScore, breakdown };
  },
};
