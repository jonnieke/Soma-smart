import { ResearchProject } from '../types/strategicIntelligence';

const RESEARCH_PROJECTS_KEY = 'soma_research_projects';

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

export const researchGovernanceService = {
  /** Get research projects */
  getProjects(): ResearchProject[] {
    const list = readLocal<ResearchProject[]>(RESEARCH_PROJECTS_KEY, []);
    if (list.length > 0) return list;

    const seed: ResearchProject[] = [
      {
        id: 'res_proj_001',
        title: 'Evaluating CBC Numeracy Misconception Remediation in Primary Schools',
        partnerOrganizationId: 'org_uon_edu_dept',
        principalInvestigator: 'Dr. Wanjiku Mwangi',
        purpose: 'Study the effectiveness of structured abacus and visual diagram remediation on Grade 4 place value mastery.',
        researchQuestions: ['Does structured misconception remediation improve termly assessment scores?'],
        requestedDataCategories: ['aggregated_mastery', 'anonymized_item_scores'],
        countryCodes: ['KE'],
        status: 'approved',
        approvalReferences: ['IRB_UON_2026_042', 'SOMA_GOV_2026_019'],
        dataAccessMethod: 'privacy_preserving_cell_suppression',
        createdAt: '2026-07-01T09:00:00Z',
        updatedAt: '2026-07-05T14:00:00Z',
      },
    ];

    writeLocal(RESEARCH_PROJECTS_KEY, seed);
    return seed;
  },

  /** Enforce small-cell privacy suppression threshold (< 10 learners) */
  suppressSmallCells<T extends Record<string, unknown>>(items: T[], countField: keyof T, threshold = 10): T[] {
    return items.filter((item) => {
      const count = Number(item[countField] || 0);
      return count >= threshold;
    });
  },
};
