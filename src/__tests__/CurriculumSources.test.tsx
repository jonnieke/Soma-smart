import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { curriculumOSService as service } from '../services/curriculumOSService';
import { CurriculumSources } from '../components/CurriculumSources';
import { curriculumPilot } from '../data/curriculumPilot';
import { curriculumSources } from '../data/curriculumSources';

const payload = (nodes = [{ id: 'g6-test', title: 'Test draft', type: 'strand', sourcePageNumber: 1 }]) => JSON.stringify({ frameworkId: 'fw_kicd_cbc', sourceId: 'kicd-regular-grade6-mathematics', nodes });
describe('Source-linked curriculum staging', () => {
  beforeEach(() => localStorage.clear());
  it('links the verified source and marks mapping as pending', () => {
    render(<CurriculumSources grade="Grade 6" />);
    expect(screen.getByRole('link', { name: /Open KICD/ }).getAttribute('href')).toContain('1ki1N1YnslIpZomG-0IoYogkzek7CKx0j');
    expect(screen.getByText(/Outcome mapping awaiting review/)).toBeTruthy();
    expect(screen.queryByText(/Grade 9/)).toBeNull();
  });
  it('isolates grade, subject and framework and deduplicates repeated imports', () => {
    expect(service.importCurriculumFramework(payload()).success).toBe(true);
    service.importCurriculumFramework(payload());
    expect(service.getNodesForFramework('fw_kicd_cbc', 'Grade 6', 'Mathematics')).toHaveLength(1);
    expect(service.getNodesForFramework()).toEqual([]);
    expect(service.getNodesForFramework('fw_kcse_844', 'Grade 6', 'Mathematics')).toEqual([]);
    expect(service.getNodesForFramework('fw_kicd_cbc', 'Grade 6', 'English')).toEqual([]);
  });
  it('keeps pilot summaries traceable, partial and awaiting review', () => {
    const ids = curriculumPilot.flatMap(pilot => pilot.outcomes.map(outcome => outcome.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const pilot of curriculumPilot) {
      const source = curriculumSources.find(source => source.id === pilot.sourceId);
      expect(source).toBeDefined();
      expect(pilot.viewerPage).toBeLessThanOrEqual(source!.pageCount);
      expect(pilot.reviewStatus).toBe('awaiting_teacher_review');
      expect(pilot.coverage).toBe('partial');
    }
  });
  it('distinguishes viewer page from printed page for Grade 9', () => {
    render(<CurriculumSources grade="Grade 9" />);
    expect(screen.getByText(/PDF viewer page 13 of 69; printed page 1/)).toBeTruthy();
    expect(screen.getByText(/Partial pilot only/)).toBeTruthy();
  });
  it('rejects page references beyond the source document', () => {
    expect(service.importCurriculumFramework(payload([{id:'bad-page',title:'Test',type:'strand',sourcePageNumber:58}])).success).toBe(false);
  });
  it('cannot import an active or reviewed assertion', () => {
    const input = JSON.parse(payload());
    input.nodes[0].status = 'active'; input.nodes[0].reviewStatus = 'reviewed';
    service.importCurriculumFramework(JSON.stringify(input));
    expect(service.getNodesForFramework('fw_kicd_cbc', 'Grade 6', 'Mathematics')[0]).toMatchObject({status: 'draft', reviewStatus: 'unreviewed'});
  });
  it('rejects malformed, unregistered, duplicate and untraceable imports', () => {
    for (const input of ['null', '{}', '{', JSON.stringify({frameworkId: 'fake', nodes: [{}]}), payload([{id:'x',title:'x',type:'strand',sourcePageNumber:0}]), payload([{id:'x',title:'x',type:'strand',sourcePageNumber:1},{id:'x',title:'x',type:'strand',sourcePageNumber:1}])]) {
      expect(service.importCurriculumFramework(input).success).toBe(false);
    }
  });
  it('rejects cycles and missing parents without changing stored data', () => {
    service.importCurriculumFramework(payload());
    const saved = localStorage.getItem('soma_curriculum_nodes');
    for (const parentId of ['g6-test', 'absent']) {
      const input = JSON.parse(payload()); input.nodes[0].parentId = parentId;
      expect(service.importCurriculumFramework(JSON.stringify(input)).success).toBe(false);
      expect(localStorage.getItem('soma_curriculum_nodes')).toBe(saved);
    }
  });
  it('reports storage failure instead of claiming success', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage full'); });
    expect(service.importCurriculumFramework(payload())).toMatchObject({success:false, error:'Storage full'});
    spy.mockRestore();
  });
});
