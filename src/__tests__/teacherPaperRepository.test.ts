import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ExamPaper } from '../types/paperStudio';
const mocks = vi.hoisted(() => ({ from: vi.fn(), getSession: vi.fn() }));
vi.mock('../lib/supabase', () => ({ supabase: { from: mocks.from, auth: { getSession: mocks.getSession } } }));
import { teacherPaperRepository as repository } from '../services/teacherPaperRepository';

const paper: ExamPaper = {
    id: 'paper-1', ownerId: 'owner-1', title: 'Fractions', status: 'DRAFT', visibility: 'PRIVATE',
    grade: 'Grade 6', subject: 'Maths', examType: 'CAT', term: 'Term 2', year: 2026, durationMinutes: 25,
    totalMarks: 2, schoolBranding: { schoolName: 'Test School', teacherName: 'Test Teacher', candidateNameField: true, admissionNoField: false },
    instructions: ['Show working'], sections: [{ id: 'a', title: 'Section A', totalMarks: 2, questions: [] }],
    version: 1, createdAt: '2026-09-01T00:00:00.000Z', updatedAt: '2026-09-01T00:00:00.000Z',
};
let owner: string | null;
let rows: Map<string, any>;
let failWrites: boolean;
let failReads: boolean;
beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    localStorage.clear(); owner = 'owner-1'; rows = new Map(); failWrites = false; failReads = false;
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    mocks.getSession.mockImplementation(async () => ({ data: { session: owner ? { user: { id: owner } } : null }, error: null }));
    mocks.from.mockImplementation((table: string) => {
        expect(table).toBe('teacher_paper_documents');
        let op = 'read'; let value: any; const filters: [string, unknown][] = [];
        const execute = async () => {
            if ((op === 'read' && failReads) || (op !== 'read' && failWrites)) return { data: null, error: { message: 'unavailable' } };
            const matches = [...rows.values()].filter(row => filters.every(([field, expected]) => row[field] === expected));
            if (op === 'read') return { data: matches, error: null };
            const key = `${value.owner_id}:${value.id}`;
            if (op === 'insert' && rows.has(key)) return { data: null, error: { code: '23505' } };
            if (op === 'update' && !matches.length) return { data: null, error: null };
            rows.set(key, structuredClone(value));
            return { data: { revision: value.revision }, error: null };
        };
        const query: any = {
            select: vi.fn(() => query),
            eq: vi.fn((field, expected) => { filters.push([field, expected]); return query; }),
            insert: vi.fn(row => { op = 'insert'; value = row; return query; }),
            update: vi.fn(row => { op = 'update'; value = row; return query; }),
            single: execute, maybeSingle: execute,
            then: (resolve: any, reject: any) => execute().then(resolve, reject),
        };
        return query;
    });
});

describe('teacher paper persistence', () => {
    it('restores the complete document on a device with no local cache', async () => {
        const saved = await repository.savePaper(paper);
        localStorage.clear();
        expect(await repository.getPaperById(paper.id)).toEqual(saved);
        expect(rows.get('owner-1:paper-1').document.instructions).toEqual(['Show working']);
        expect(repository.getPaperStorageNotice()).toBe('');
    });
    it('separates accounts and rejects a mismatched document owner', async () => {
        await repository.savePaper(paper);
        owner = 'owner-2';
        expect(await repository.getAllPapers()).toEqual([]);
        await expect(repository.savePaper(paper)).rejects.toThrow('different or unverified account');
        expect(rows.size).toBe(1);
    });
    it('requires a signed-in session even when a device has cached papers', async () => {
        await repository.savePaper(paper); owner = null;
        await expect(repository.getAllPapers()).rejects.toThrow('Sign in');
    });
    it('does not seed a fake paper or adopt an ambiguous legacy draft', async () => {
        const old = JSON.stringify([{ ...paper, ownerId: 'teacher_user' }]);
        localStorage.setItem('soma_paper_studio_papers', old);
        expect(await repository.getAllPapers()).toEqual([]);
        expect(localStorage.getItem('soma_paper_studio_papers')).toBe(old);
    });
    it('retains an offline recovery copy and syncs the same draft on retry', async () => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
        await expect(repository.savePaper(paper)).rejects.toThrow('device only');
        expect((await repository.getAllPapers())[0].title).toBe('Fractions');
        expect(repository.getPaperStorageNotice()).toContain('device copies');
        Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
        await repository.savePaper(paper);
        expect(rows.size).toBe(1);
    });
    it('retains unsynced changes after a server failure and later read', async () => {
        await repository.savePaper(paper); failWrites = true;
        await expect(repository.savePaper({ ...paper, title: 'Edited offline title' })).rejects.toThrow('cloud sync was not confirmed');
        expect((await repository.getAllPapers())[0].title).toBe('Edited offline title');
        expect(rows.get('owner-1:paper-1').document.title).toBe('Fractions');
    });
    it('does not overwrite a newer revision from another device', async () => {
        await repository.savePaper(paper);
        const row = rows.get('owner-1:paper-1'); row.revision = 2; row.document.title = 'Newer remote title';
        await expect(repository.savePaper({ ...paper, title: 'My unsynced edit' })).rejects.toThrow('cloud sync was not confirmed');
        expect(rows.get('owner-1:paper-1').document.title).toBe('Newer remote title');
        expect((await repository.getAllPapers())[0].title).toBe('My unsynced edit');
    });
    it('serializes rapid edits and leaves the latest complete snapshot', async () => {
        await Promise.all([
            repository.savePaper({ ...paper, title: 'First' }),
            repository.savePaper({ ...paper, title: 'Second' }),
            repository.savePaper({ ...paper, title: 'Third' }),
        ]);
        expect(rows.get('owner-1:paper-1')).toMatchObject({ revision: 3, document: { title: 'Third' } });
        expect((await repository.getAllPapers())[0].title).toBe('Third');
    });
    it('keeps the device copy when deletion fails', async () => {
        await repository.savePaper(paper); failWrites = true;
        await expect(repository.deletePaper(paper.id)).rejects.toThrow('Deletion was not confirmed');
        expect(await repository.getPaperById(paper.id)).not.toBeNull();
    });
    it('uses a remote tombstone and does not resurrect an imported legacy paper', async () => {
        localStorage.setItem('soma_paper_studio_papers', JSON.stringify([paper]));
        await repository.getAllPapers();
        await repository.savePaper(paper);
        await repository.deletePaper(paper.id);
        expect(rows.get('owner-1:paper-1').deleted).toBe(true);
        expect(await repository.getAllPapers()).toEqual([]);
        expect(localStorage.getItem('soma_paper_studio_papers')).not.toBeNull();
    });
    it('does not claim a save when recovery storage is full', async () => {
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
        await expect(repository.savePaper(paper)).rejects.toThrow('recovery copy');
        expect(rows.size).toBe(0);
    });
    it('warns rather than claiming an unavailable server is an empty account', async () => {
        failReads = true;
        expect(await repository.getAllPapers()).toEqual([]);
        expect(repository.getPaperStorageNotice()).toContain('could not be loaded');
    });
});
