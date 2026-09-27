import { useState } from 'react';
import { curriculumPilot } from '../data/curriculumPilot';
import { curriculumSources } from '../data/curriculumSources';
import { curriculumReviewService as service, CurriculumReview } from '../services/curriculumReviewService';

const button = 'rounded-lg border border-indigo-300 px-3 py-2 text-sm text-indigo-800 disabled:opacity-50';
function ReviewCard({row, identity, busy, run}: {
  row: CurriculumReview; identity: {id: string; admin: boolean}; busy: boolean;
  run: (action: () => Promise<void>) => Promise<void>;
}) {
  const [reviewer, setReviewer] = useState(row.reviewer_id || '');
  const [note, setNote] = useState('');
  const [summaries, setSummaries] = useState(row.summaries.join('\n'));
  const source = curriculumSources.find(source => source.id === row.source_id);
  const editable = identity.admin && ['draft', 'changes_requested'].includes(row.status);
  const canReview = row.status === 'in_review' && row.reviewer_id === identity.id;
  return <article className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-slate-900">
    <h3 className="font-bold">{source?.grade} · {row.title}</h3>
    <p className="text-sm">{row.status.replaceAll('_', ' ')} · revision {row.revision} · PDF page {row.viewer_page}, printed page {row.printed_page}</p>
    {source && <a className="text-sm text-indigo-700 underline" href={source.documentUrl} target="_blank" rel="noopener noreferrer">Check original document (new tab)</a>}
    <ul className="list-disc pl-5 text-sm space-y-1">{row.summaries.map((summary, i) => <li key={i}>{summary}</li>)}</ul>
    {row.review_note && <p className="text-sm rounded bg-amber-50 p-3">Reviewer feedback: {row.review_note}</p>}
    {editable && <div className="space-y-3">
      <label className="block text-sm">Draft summaries (one per line)
        <textarea className="mt-1 block w-full rounded border p-2" rows={4} value={summaries} onChange={e => setSummaries(e.target.value)} />
      </label>
      <button className={button} disabled={busy || !summaries.trim()} onClick={() => void run(() => service.update(row, {status:'draft', summaries: summaries.split('\n').map(s => s.trim()).filter(Boolean)}))}>Save draft changes</button>
      <label className="block text-sm">Assigned reviewer’s Supabase user ID
        <input className="mt-1 block w-full rounded border p-2" placeholder="Reviewer account UUID" value={reviewer} onChange={e => setReviewer(e.target.value)} />
      </label>
      <p className="text-xs">An admin must verify the teacher’s identity before assigning their account. Authors cannot review their own mapping.</p>
      <button className={button} disabled={busy || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(reviewer.trim()) || reviewer.trim() === identity.id || reviewer.trim() === row.author_id || !summaries.trim()} onClick={() => void run(() => service.update(row, {status:'in_review', reviewer_id:reviewer.trim(), summaries:summaries.split('\n').map(s => s.trim()).filter(Boolean)}))}>Send for teacher review</button>
    </div>}
    {canReview && <div className="space-y-3">
      <label className="block text-sm">Review note: check accuracy, scope and page references
        <textarea className="mt-1 block w-full rounded border p-2" maxLength={4000} value={note} onChange={e => setNote(e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button className={button} disabled={busy || !note.trim()} onClick={() => void run(() => service.update(row, {status:'changes_requested', review_note:note.trim()}))}>Request changes</button>
        <button className={button} disabled={busy || !note.trim()} onClick={() => void run(() => service.update(row, {status:'approved', review_note:note.trim()}))}>Approve mapping accuracy</button>
      </div>
    </div>}
    {row.status === 'approved' && <p className="text-sm">Reviewed, not published. Rights clearance and publication checks are still required.</p>}
  </article>;
}

export function CurriculumReviewQueue() {
  const [rows, setRows] = useState<CurriculumReview[]>([]);
  const [identity, setIdentity] = useState<{id:string; admin:boolean} | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [loaded, setLoaded] = useState(false);
  const refresh = async () => {
    const who = await service.identity();
    const next = await service.list();
    setIdentity(who); setRows(next); setLoaded(true);
  };
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setMessage('');
    try { await action(); await refresh(); setMessage('Shared review queue updated.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not load or save. Please retry.'); }
    finally { setBusy(false); }
  };
  return <section aria-label="Shared curriculum review" className="rounded-2xl border border-slate-200 p-5 space-y-4">
    <h2 className="font-bold">Shared curriculum review</h2>
    <p className="text-sm">Private to admins and assigned reviewers. Approval checks accuracy; it does not publish or grant reproduction rights.</p>
    <button className={button} disabled={busy} onClick={() => void run(async () => {})}>{busy ? 'Working…' : loaded ? 'Refresh review queue' : 'Open shared review queue'}</button>
    {message && <p role="status" className="text-sm">{message}</p>}
    {loaded && identity?.admin && <div className="flex flex-wrap gap-2">{curriculumPilot.map(pilot => <button key={pilot.id} className={button} disabled={busy || rows.some(row => row.id === pilot.id)} onClick={() => void run(() => service.stagePilot(pilot.id))}>Share pilot: {curriculumSources.find(s => s.id === pilot.sourceId)?.grade} {pilot.topic}</button>)}</div>}
    {loaded && !rows.length && <p className="text-sm">No shared mappings available to this account. An admin can share a pilot and assign a reviewer.</p>}
    {identity && rows.map(row => <ReviewCard key={`${row.id}-${row.revision}`} row={row} identity={identity} busy={busy} run={run} />)}
  </section>;
}
