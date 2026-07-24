import {
  InterventionGroup,
  InterventionStatus,
  InterventionOutcome,
  InterventionSuccessCriteria,
} from '../types/educationIntelligence';
import { supabase } from '../lib/supabase';

const INTERVENTIONS_STORAGE_KEY = 'soma_intervention_groups';

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

export const interventionService = {
  /** Get all intervention groups for a school or teacher */
  async getInterventionGroups(schoolId?: string, teacherId = 'teacher_kamau'): Promise<InterventionGroup[]> {
    const list = readLocal<InterventionGroup[]>(INTERVENTIONS_STORAGE_KEY, []);
    if (list.length > 0) return list;

    const seed: InterventionGroup[] = [
      {
        id: 'grp_mensuration_remedial',
        schoolId: 'school_001',
        teacherId,
        teacherName: 'Mwalimu Kamau',
        subject: 'Mathematics',
        name: 'Form 4 Mensuration Catch-Up Group',
        description: 'Targeted support on cylinder surface area & composite solids',
        learnerIds: ['learner_001', 'learner_003'],
        curriculumOutcomeIds: ['out_mensuration_01'],
        reasonCodes: ['DESCENT_TREND', 'CYLINDER_BASE_OMISSION'],
        evidenceConfidence: 'moderate',
        status: 'active',
        startsAt: '2026-07-20T00:00:00Z',
        successCriteria: [
          { id: 'sc_1', metric: 'target_mastery', targetValue: 70, actualValue: 55, isMet: false },
          { id: 'sc_2', metric: 'score_improvement_percentage', targetValue: 15, actualValue: 18, isMet: true },
        ],
        outcome: 'in_progress',
        createdAt: '2026-07-19T10:00:00Z',
        updatedAt: '2026-07-20T10:00:00Z',
      },
    ];

    writeLocal(INTERVENTIONS_STORAGE_KEY, seed);
    return seed;
  },

  /** Create a new intervention group */
  async createInterventionGroup(params: {
    teacherId: string;
    teacherName: string;
    subject: string;
    name: string;
    description?: string;
    learnerIds: string[];
    curriculumOutcomeIds?: string[];
    targetMastery?: number;
  }): Promise<InterventionGroup> {
    const group: InterventionGroup = {
      id: `grp_${Date.now()}`,
      teacherId: params.teacherId,
      teacherName: params.teacherName,
      subject: params.subject,
      name: params.name,
      description: params.description,
      learnerIds: params.learnerIds,
      curriculumOutcomeIds: params.curriculumOutcomeIds || [],
      reasonCodes: ['TEACHER_INITIATED'],
      evidenceConfidence: 'high',
      status: 'active',
      startsAt: new Date().toISOString(),
      successCriteria: [
        { id: `sc_${Date.now()}`, metric: 'target_mastery', targetValue: params.targetMastery || 70, isMet: false },
      ],
      outcome: 'in_progress',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const list = readLocal<InterventionGroup[]>(INTERVENTIONS_STORAGE_KEY, []);
    list.unshift(group);
    writeLocal(INTERVENTIONS_STORAGE_KEY, list);

    try {
      await supabase.from('intervention_groups').insert({
        id: group.id,
        teacher_id: group.teacherId,
        subject: group.subject,
        name: group.name,
        learner_ids: group.learnerIds,
        status: group.status,
        created_at: group.createdAt,
      });
    } catch {
      /* Fallback */
    }

    return group;
  },

  /** Evaluate intervention outcome after post-assessment */
  evaluateInterventionOutcome(
    preMastery: number,
    postMastery: number,
    targetMastery = 70,
  ): { outcome: InterventionOutcome; gain: number; isSuccess: boolean } {
    const gain = postMastery - preMastery;
    let outcome: InterventionOutcome = 'no_clear_change';

    if (postMastery >= targetMastery || gain >= 15) {
      outcome = 'improved';
    } else if (gain > 5) {
      outcome = 'partially_improved';
    } else if (gain < -5) {
      outcome = 'declined';
    }

    return {
      outcome,
      gain,
      isSuccess: outcome === 'improved' || outcome === 'partially_improved',
    };
  },
};
