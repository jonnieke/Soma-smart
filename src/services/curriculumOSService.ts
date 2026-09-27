import { CurriculumFramework, CurriculumNode, CurriculumNodeType } from '../types/contentOS';
import { curriculumSources } from '../data/curriculumSources';

const NODES_KEY = 'soma_curriculum_nodes';
const types: CurriculumNodeType[] = ['level', 'grade', 'subject', 'strand', 'sub_strand', 'topic', 'learning_outcome', 'competency', 'value', 'issue'];
const readNodes = (): CurriculumNode[] => {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(NODES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter(n => n && typeof n.id === 'string') : [];
  } catch { return []; }
};

export const curriculumOSService = {
  getFrameworks(): CurriculumFramework[] {
    // Registry version, not an invented official KICD edition.
    return [
      { id: 'fw_kicd_cbc', name: 'KICD Competency-Based Curriculum (CBC / CBE)', country: 'Kenya', authority: 'KICD', educationSystem: 'CBC_CBE', version: 'Soma registry 1', status: 'draft', createdAt: '2026-09-27T00:00:00Z', updatedAt: '2026-09-27T00:00:00Z' },
      { id: 'fw_kcse_844', name: '8-4-4 Secondary Curriculum — source registration pending', country: 'Kenya', authority: 'KICD', educationSystem: '8_4_4', version: 'Soma registry 1', status: 'draft', createdAt: '2026-09-27T00:00:00Z', updatedAt: '2026-09-27T00:00:00Z' },
    ];
  },
  getSources() { return curriculumSources; },
  getNodesForFramework(frameworkId = 'fw_kicd_cbc', grade = 'Grade 9', subject = 'Mathematics'): CurriculumNode[] {
    // Keep legacy samples stored, but never present unscoped data as verified outcomes.
    return readNodes().filter(n => n.frameworkId === frameworkId && n.grade === grade && n.subject === subject);
  },
  /** Local editorial staging only; this cannot grant publication or review status. */
  importCurriculumFramework(rawJson: string): { success: boolean; importedNodesCount: number; frameworkId: string; error?: string } {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || typeof parsed.frameworkId !== 'string' || !Array.isArray(parsed.nodes) || !parsed.nodes.length) throw new Error('Provide a frameworkId and a non-empty nodes array.');
      const source = curriculumSources.find(s => s.id === parsed.sourceId && s.frameworkId === parsed.frameworkId);
      if (!source) throw new Error('Choose a registered sourceId matching the framework.');
      const ids = new Set<string>();
      const nodes: CurriculumNode[] = parsed.nodes.map((node: CurriculumNode) => {
        if (!node || typeof node.id !== 'string' || !node.id.trim() || ids.has(node.id) || typeof node.title !== 'string' || !node.title.trim() || !types.includes(node.type)) throw new Error('Each node needs a unique id, title and valid type.');
        if (node.frameworkId && node.frameworkId !== parsed.frameworkId) throw new Error('Node framework does not match the import.');
        if (!Number.isInteger(node.sourcePageNumber) || (node.sourcePageNumber ?? 0) < 1 || (node.sourcePageNumber ?? 0) > source.pageCount) throw new Error(`Each node needs a sourcePageNumber between 1 and ${source.pageCount} (PDF viewer numbering).`);
        if (node.parentId !== undefined && typeof node.parentId !== 'string') throw new Error('parentId must be a string.');
        ids.add(node.id);
        const now = new Date().toISOString();
        return { id: node.id, title: node.title.trim(), type: node.type, parentId: node.parentId, sourcePageNumber: node.sourcePageNumber, frameworkId: source.frameworkId, grade: source.grade, subject: source.subject, sourceId: source.id, versionId: source.id, reviewStatus: 'unreviewed', status: 'draft', createdAt: now, updatedAt: now };
      });
      const byId = new Map(nodes.map(n => [n.id, n]));
      for (const node of nodes) {
        const seen = new Set([node.id]);
        let parent = node.parentId;
        while (parent) {
          if (!byId.has(parent) || seen.has(parent)) throw new Error('Missing parent or cycle. Import the complete hierarchy.');
          seen.add(parent);
          parent = byId.get(parent)?.parentId;
        }
      }
      const current = readNodes();
      if (current.some(n => ids.has(n.id) && n.sourceId !== source.id)) throw new Error('Node id belongs to another source.');
      localStorage.setItem(NODES_KEY, JSON.stringify([...current.filter(n => !ids.has(n.id)), ...nodes]));
      return { success: true, importedNodesCount: nodes.length, frameworkId: source.frameworkId };
    } catch (error) {
      return { success: false, importedNodesCount: 0, frameworkId: '', error: error instanceof Error ? error.message : 'Import failed.' };
    }
  },
};
