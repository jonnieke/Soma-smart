import { supabase } from '../lib/supabase';
import type { ExamPaper } from '../types/paperStudio';

type CachedPaper = { paper: ExamPaper; revision: number | null; pending: boolean };
type PaperRow = { id: string; owner_id: string; document: ExamPaper; revision: number; deleted: boolean };
const key = (owner: string) => `soma_teacher_papers_v2_${owner}`;
const queues = new Map<string, Promise<unknown>>();
let storageNotice = '';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
const read = (owner: string): Record<string, CachedPaper> => {
    try {
        const parsed = JSON.parse(localStorage.getItem(key(owner)) || '{}');
        return Object.fromEntries(Object.entries(parsed).filter(([id, entry]) => {
            const value = entry as CachedPaper;
            return value?.paper?.ownerId === owner && value.paper.id === id;
        })) as Record<string, CachedPaper>;
    } catch { return {}; }
};
const write = (owner: string, entries: Record<string, CachedPaper>) => {
    try { localStorage.setItem(key(owner), JSON.stringify(entries)); }
    catch { throw new Error('This browser could not keep a recovery copy. Keep this page open and free browser storage before saving again.'); }
};
async function ownerId() {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session?.user.id) throw new Error('Sign in to your teacher account to open or save papers.');
    return data.session.user.id;
}
function enqueue<T>(owner: string, id: string, action: () => Promise<T>): Promise<T> {
    const queueKey = `${owner}:${id}`;
    const task = (queues.get(queueKey) || Promise.resolve()).catch(() => undefined).then(action);
    queues.set(queueKey, task);
    void task.finally(() => { if (queues.get(queueKey) === task) queues.delete(queueKey); }).catch(() => undefined);
    return task;
}

export const teacherPaperRepository = {
    getOwnerId: ownerId,
    getPaperStorageNotice: () => storageNotice,
    async getAllPapers(): Promise<ExamPaper[]> {
        const owner = await ownerId();
        storageNotice = '';
        let cached = read(owner);
        let unverifiedLegacy = false;
        // Never guess ownership of legacy teacher_user/default drafts. Leave the old key untouched.
        try {
            const legacy: ExamPaper[] = JSON.parse(localStorage.getItem('soma_paper_studio_papers') || '[]');
            const importKey = `${key(owner)}_legacy_imports`;
            const imported = new Set<string>(JSON.parse(localStorage.getItem(importKey) || '[]'));
            for (const paper of Array.isArray(legacy) ? legacy : []) {
                if (!paper.ownerId || paper.ownerId === 'teacher_user' || paper.ownerId === 'teacher_default') unverifiedLegacy = true;
                if (paper.ownerId === owner && !imported.has(paper.id)) {
                    if (!cached[paper.id]) cached[paper.id] = { paper, revision: null, pending: true };
                    imported.add(paper.id);
                }
            }
            write(owner, cached);
            localStorage.setItem(importKey, JSON.stringify([...imported]));
        } catch { /* Leave malformed legacy data untouched for manual recovery. */ }
        const requestCache = clone(cached);
        try {
            if (!navigator.onLine) throw new Error('offline');
            const result = await supabase.from('teacher_paper_documents').select('id,owner_id,document,revision,deleted').eq('owner_id', owner);
            if (result.error) throw result.error;
            const merged: Record<string, CachedPaper> = {};
            for (const row of (result.data || []) as PaperRow[]) {
                if (row.owner_id === owner && row.document?.ownerId === owner && row.document.id === row.id && !row.deleted) {
                    merged[row.id] = { paper: row.document, revision: row.revision, pending: false };
                }
            }
            // Edits not yet confirmed must never be overwritten by older remote content.
            cached = read(owner); // A save may have started while the list request was in flight.
            for (const [id, entry] of Object.entries(cached)) {
                if (entry.pending || (entry.revision || 0) > (requestCache[id]?.revision || 0) || (merged[id] && (entry.revision || 0) > (merged[id].revision || 0))) merged[id] = entry;
            }
            cached = merged;
        } catch {
            cached = read(owner);
            storageNotice = 'Cloud papers could not be loaded. Showing this account’s device copies only; other devices may have newer work.';
        }
        if (await ownerId() !== owner) throw new Error('Your account changed. Reload your papers.');
        write(owner, cached);
        if (!storageNotice && Object.values(cached).some(entry => entry.pending)) storageNotice = 'Some papers have device-only changes. Open them and choose Save Draft to sync. A conflicting remote version will not be overwritten.';
        if (unverifiedLegacy) storageNotice += ' Older device drafts with unverified ownership are preserved but hidden. Contact support for recovery; do not clear browser data.';
        return Object.values(cached).map(entry => entry.paper).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },
    async getPaperById(id: string) {
        return (await this.getAllPapers()).find(paper => paper.id === id) || null;
    },
    async savePaper(paper: ExamPaper): Promise<ExamPaper> {
        const snapshot = clone({ ...paper, updatedAt: new Date().toISOString() });
        const owner = await ownerId();
        if (snapshot.ownerId !== owner) throw new Error('This paper belongs to a different or unverified account. It was not saved.');
        const cached = read(owner);
        cached[snapshot.id] = { paper: snapshot, revision: cached[snapshot.id]?.revision ?? null, pending: true };
        write(owner, cached);
        return enqueue(owner, snapshot.id, async () => {
            if (await ownerId() !== owner) throw new Error('Your account changed. The recovery copy remains with its original account.');
            if (!navigator.onLine) throw new Error('Saved on this device only. Reconnect and choose Save Draft to sync.');
            const current = read(owner)[snapshot.id];
            const revision = current?.revision ?? null;
            const row = { id: snapshot.id, owner_id: owner, document: snapshot, revision: (revision || 0) + 1, deleted: false };
            const result = revision === null
                ? await supabase.from('teacher_paper_documents').insert(row).select('revision').single()
                : await supabase.from('teacher_paper_documents').update(row).eq('owner_id', owner).eq('id', snapshot.id).eq('revision', revision).eq('deleted', false).select('revision').maybeSingle();
            if (result.error || !result.data) {
                throw new Error('Saved on this device, but cloud sync was not confirmed. Another device may have changed this paper. Your edits are kept; do not close this device’s copy until you resolve or copy the draft.');
            }
            const latest = read(owner);
            if (latest[snapshot.id]) {
                const unchanged = JSON.stringify(latest[snapshot.id].paper) === JSON.stringify(snapshot);
                latest[snapshot.id] = { ...latest[snapshot.id], revision: result.data.revision, pending: !unchanged };
                write(owner, latest);
            }
            return snapshot;
        });
    },
    async duplicatePaper(id: string) {
        const paper = await this.getPaperById(id);
        if (!paper) return null;
        return this.savePaper({ ...paper, id: crypto.randomUUID(), title: `${paper.title} (Copy)`, status: 'DRAFT',
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    },
    async deletePaper(id: string) {
        const owner = await ownerId();
        return enqueue(owner, id, async () => {
            if (!navigator.onLine || await ownerId() !== owner) throw new Error('Reconnect to the same account before deleting a paper.');
            const cached = read(owner);
            const entry = cached[id];
            if (!entry) throw new Error('Reload your papers before deleting.');
            // Retain a tombstone remotely so another device cannot recreate a deleted paper.
            const row = { id, owner_id: owner, document: entry.paper, revision: (entry.revision || 0) + 1, deleted: true };
            const result = entry.revision === null
                ? await supabase.from('teacher_paper_documents').insert(row).select('revision').single()
                : await supabase.from('teacher_paper_documents').update(row).eq('owner_id', owner).eq('id', id).eq('revision', entry.revision).select('revision').maybeSingle();
            if (result.error || !result.data) throw new Error('Deletion was not confirmed. Your device copy has been kept. Reload and try again.');
            const latest = read(owner);
            if (JSON.stringify(latest[id]?.paper) === JSON.stringify(entry.paper)) delete latest[id];
            write(owner, latest);
            return true;
        });
    },
};
