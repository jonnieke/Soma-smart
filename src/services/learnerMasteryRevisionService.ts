import {
  LearnerMastery,
  RevisionRecommendation,
  LearnerRevisionPlan,
  AssessmentResponse,
} from '../types/assessmentDelivery';
import { assessmentAttemptService } from './assessmentAttemptService';
import { paperStudioService } from './paperStudioService';
import { updateMastery, getWeakTopics } from './spacedRepetitionService';

const MASTERY_STORAGE_KEY = 'soma_learner_mastery';
const REVISION_PLANS_STORAGE_KEY = 'soma_learner_revision_plans';

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

export const learnerMasteryRevisionService = {
  /** Update learner mastery graph from an assessment attempt */
  async updateMasteryFromAttempt(attemptId: string): Promise<LearnerMastery[]> {
    const attempt = await assessmentAttemptService.getAttemptById(attemptId);
    if (!attempt) return [];

    const responses = await assessmentAttemptService.getAttemptResponses(attemptId);
    const paper = await paperStudioService.getPaperById(attempt.paperId);
    if (!paper) return [];

    const allMastery = readLocal<LearnerMastery[]>(MASTERY_STORAGE_KEY, []);
    const updatedMasteries: LearnerMastery[] = [];

    // Group responses by question topic/strand
    const topicScores: Record<string, { totalAwarded: number; totalMax: number }> = {};

    for (const resp of responses) {
      // Find question in paper sections
      let topic = paper.subject;
      for (const sec of paper.sections) {
        const q = sec.questions.find((item) => item.id === resp.questionId);
        if (q) {
          topic = q.topic || q.strand || paper.subject;
          break;
        }
      }

      if (!topicScores[topic]) {
        topicScores[topic] = { totalAwarded: 0, totalMax: 0 };
      }
      topicScores[topic].totalAwarded += resp.awardedMarks ?? 0;
      topicScores[topic].totalMax += resp.maxMarks ?? 10;
    }

    Object.entries(topicScores).forEach(([topic, data]) => {
      const scorePct = data.totalMax > 0 ? Math.round((data.totalAwarded / data.totalMax) * 100) : 0;
      const existingIdx = allMastery.findIndex((m) => m.learnerId === attempt.learnerId && m.topic === topic);

      let masteryScore = scorePct;
      let evidenceCount = 1;
      let trend: LearnerMastery['trend'] = 'stable';

      if (existingIdx >= 0) {
        const prev = allMastery[existingIdx];
        masteryScore = Math.round(prev.masteryScore * 0.6 + scorePct * 0.4);
        evidenceCount = prev.evidenceCount + 1;
        trend = masteryScore > prev.masteryScore ? 'improving' : masteryScore < prev.masteryScore ? 'declining' : 'stable';
      }

      const record: LearnerMastery = {
        learnerId: attempt.learnerId,
        subject: paper.subject,
        topic,
        masteryScore,
        confidence: Math.min(1.0, 0.5 + evidenceCount * 0.1),
        evidenceCount,
        lastAssessedAt: new Date().toISOString(),
        trend,
        recommendedAction: masteryScore < 50 ? `Needs practice in ${topic}` : masteryScore >= 80 ? `Ready for extension in ${topic}` : `Consolidate ${topic}`,
      };

      if (existingIdx >= 0) {
        allMastery[existingIdx] = record;
      } else {
        allMastery.push(record);
      }
      updatedMasteries.push(record);
    });

    writeLocal(MASTERY_STORAGE_KEY, allMastery);
    return updatedMasteries;
  },

  /** Get all topic masteries for a learner */
  getLearnerMastery(learnerId: string, subject?: string): LearnerMastery[] {
    const all = readLocal<LearnerMastery[]>(MASTERY_STORAGE_KEY, []);
    return all.filter((m) => m.learnerId === learnerId && (!subject || m.subject.toLowerCase() === subject.toLowerCase()));
  },

  /** Get weak topics (< 50% mastery) for a learner */
  getWeakMasteryTopics(learnerId: string, subject?: string): LearnerMastery[] {
    return this.getLearnerMastery(learnerId, subject).filter((m) => m.masteryScore < 50);
  },

  /** Generate or retrieve a personalized revision plan connecting weak topics to SomaAI resources */
  async generateRevisionPlan(learnerId: string, subject = 'Mathematics'): Promise<LearnerRevisionPlan> {
    const weak = this.getWeakMasteryTopics(learnerId, subject);

    const recommendations: RevisionRecommendation[] = weak.map((w, idx) => ({
      id: `rec_${Date.now()}_${idx}`,
      learnerId,
      subject: w.subject,
      topic: w.topic,
      reason: `Mastery score is ${w.masteryScore}% based on ${w.evidenceCount} assessment attempt(s).`,
      priority: w.masteryScore < 35 ? 'HIGH' : 'MEDIUM',
      resourceType: idx % 2 === 0 ? 'WORKED_EXAMPLE' : 'PRACTICE_QUIZ',
      resourceTitle: `SomaAI Step-by-Step ${w.topic} Revision Pack`,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    }));

    // Add fallback if no weak topics found
    if (recommendations.length === 0) {
      recommendations.push({
        id: `rec_${Date.now()}_default`,
        learnerId,
        subject,
        topic: `${subject} Core Concepts`,
        reason: 'Consolidate core competencies and review previous assessment papers.',
        priority: 'LOW',
        resourceType: 'EXPLANATION',
        resourceTitle: `SomaAI Comprehensive ${subject} Review Notes`,
        isCompleted: false,
        createdAt: new Date().toISOString(),
      });
    }

    const plan: LearnerRevisionPlan = {
      id: `plan_${learnerId}_${subject}`,
      learnerId,
      subject,
      recommendations,
      updatedAt: new Date().toISOString(),
    };

    const plans = readLocal<LearnerRevisionPlan[]>(REVISION_PLANS_STORAGE_KEY, []);
    const idx = plans.findIndex((p) => p.learnerId === learnerId && p.subject === subject);
    if (idx >= 0) plans[idx] = plan;
    else plans.push(plan);
    writeLocal(REVISION_PLANS_STORAGE_KEY, plans);

    return plan;
  },

  /** Mark a revision recommendation as completed */
  markRecommendationComplete(learnerId: string, recommendationId: string): boolean {
    const plans = readLocal<LearnerRevisionPlan[]>(REVISION_PLANS_STORAGE_KEY, []);
    for (const plan of plans) {
      if (plan.learnerId === learnerId) {
        const rec = plan.recommendations.find((r) => r.id === recommendationId);
        if (rec) {
          rec.isCompleted = true;
          plan.updatedAt = new Date().toISOString();
          writeLocal(REVISION_PLANS_STORAGE_KEY, plans);
          return true;
        }
      }
    }
    return false;
  },
};
