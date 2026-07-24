import { KnowledgeNode, KnowledgeRelationship } from '../types/strategicIntelligence';

const GRAPH_NODES_KEY = 'soma_knowledge_graph_nodes';
const GRAPH_RELS_KEY = 'soma_knowledge_graph_rels';

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

export const curriculumKnowledgeGraphService = {
  /** Get graph nodes */
  getNodes(): KnowledgeNode[] {
    const list = readLocal<KnowledgeNode[]>(GRAPH_NODES_KEY, []);
    if (list.length > 0) return list;

    const seed: KnowledgeNode[] = [
      {
        id: 'node_num_place_val',
        type: 'learning_outcome',
        countryCode: 'KE',
        curriculumFrameworkId: 'kicd_cbc_2024',
        sourceEntityId: 'out_place_val_g4',
        title: 'Grade 4 Numeracy: Place Value up to 100,000',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'node_num_addition',
        type: 'learning_outcome',
        countryCode: 'KE',
        curriculumFrameworkId: 'kicd_cbc_2024',
        sourceEntityId: 'out_addition_g4',
        title: 'Grade 4 Numeracy: Multi-Digit Addition with Carrying',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'node_misc_place_val',
        type: 'misconception',
        countryCode: 'KE',
        curriculumFrameworkId: 'kicd_cbc_2024',
        sourceEntityId: 'misc_001',
        title: 'Treating zero in place value as a blank placeholder',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(GRAPH_NODES_KEY, seed);
    return seed;
  },

  /** Get graph relationships */
  getRelationships(): KnowledgeRelationship[] {
    const list = readLocal<KnowledgeRelationship[]>(GRAPH_RELS_KEY, []);
    if (list.length > 0) return list;

    const seed: KnowledgeRelationship[] = [
      {
        id: 'rel_001',
        fromNodeId: 'node_num_place_val',
        toNodeId: 'node_num_addition',
        relationshipType: 'precedes',
        confidence: 'verified',
        sourceType: 'curriculum',
        sourceReference: 'KICD Grade 4 Mathematics Curriculum Design Page 14',
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'rel_002',
        fromNodeId: 'node_misc_place_val',
        toNodeId: 'node_num_place_val',
        relationshipType: 'addresses_misconception',
        confidence: 'verified',
        sourceType: 'teacher',
        sourceReference: 'Soma Subject Specialist Verification',
        status: 'approved',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    writeLocal(GRAPH_RELS_KEY, seed);
    return seed;
  },

  /** Get prerequisites for a target outcome node */
  getPrerequisites(targetNodeId: string): KnowledgeNode[] {
    const rels = this.getRelationships().filter(
      (r) => r.toNodeId === targetNodeId && (r.relationshipType === 'precedes' || r.relationshipType === 'requires') && r.status === 'approved'
    );

    const nodes = this.getNodes();
    return nodes.filter((n) => rels.some((r) => r.fromNodeId === n.id));
  },
};
