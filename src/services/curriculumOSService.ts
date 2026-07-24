import { CurriculumFramework, CurriculumNode } from '../types/contentOS';

const FRAMEWORKS_KEY = 'soma_curriculum_frameworks';
const NODES_KEY = 'soma_curriculum_nodes';

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

export const curriculumOSService = {
  /** Get all available curriculum frameworks */
  getFrameworks(): CurriculumFramework[] {
    const list = readLocal<CurriculumFramework[]>(FRAMEWORKS_KEY, []);
    if (list.length > 0) return list;

    const seed: CurriculumFramework[] = [
      {
        id: 'fw_kicd_cbc',
        name: 'KICD Competency-Based Curriculum (CBC / CBE)',
        country: 'Kenya',
        authority: 'KICD',
        educationSystem: 'CBC_CBE',
        version: 'v2026.1',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-07-01T00:00:00Z',
      },
      {
        id: 'fw_kcse_844',
        name: 'KICD 8-4-4 Secondary Curriculum',
        country: 'Kenya',
        authority: 'KICD',
        educationSystem: '8_4_4',
        version: 'v2025.2',
        status: 'active',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ];

    writeLocal(FRAMEWORKS_KEY, seed);
    return seed;
  },

  /** Get nodes hierarchy for a framework */
  getNodesForFramework(frameworkId = 'fw_kicd_cbc', grade = 'Grade 9', subject = 'Mathematics'): CurriculumNode[] {
    const list = readLocal<CurriculumNode[]>(NODES_KEY, []);
    if (list.length > 0) return list;

    const seed: CurriculumNode[] = [
      {
        id: 'node_strand_mensuration',
        frameworkId: 'fw_kicd_cbc',
        type: 'strand',
        code: 'STR_01',
        title: 'Measurement & Geometry',
        description: 'Surface areas, volumes, and geometric transformations',
        versionId: 'v1',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'node_substrand_cylinders',
        frameworkId: 'fw_kicd_cbc',
        parentId: 'node_strand_mensuration',
        type: 'sub_strand',
        code: 'SUB_01.1',
        title: 'Surface Area of Cylinders & Composite Solids',
        description: 'Calculating total surface area including circular bases',
        versionId: 'v1',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'node_outcome_cylinder_area',
        frameworkId: 'fw_kicd_cbc',
        parentId: 'node_substrand_cylinders',
        type: 'learning_outcome',
        code: 'LO_01.1.1',
        title: 'By the end of the sub-strand, the learner should be able to calculate total surface area of closed and open cylinders.',
        versionId: 'v1',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(NODES_KEY, seed);
    return seed;
  },

  /** Administrative CSV/JSON curriculum framework import engine */
  importCurriculumFramework(rawJson: string): { success: boolean; importedNodesCount: number; frameworkId: string } {
    try {
      const parsed = JSON.parse(rawJson);
      const frameworkId = parsed.frameworkId || `fw_${Date.now()}`;
      const nodes: CurriculumNode[] = parsed.nodes || [];

      const currentNodes = readLocal<CurriculumNode[]>(NODES_KEY, []);
      writeLocal(NODES_KEY, [...nodes, ...currentNodes]);

      return {
        success: true,
        importedNodesCount: nodes.length,
        frameworkId,
      };
    } catch {
      return { success: false, importedNodesCount: 0, frameworkId: '' };
    }
  },
};
