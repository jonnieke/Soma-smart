import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, FileText, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import { creatorMarketplaceService, CreatorMaterialRecord } from '../../../services/creatorMarketplaceService';

type Decision = 'APPROVE' | 'PUBLISH' | 'REQUEST_CHANGES' | 'REQUEST_RIGHTS' | 'REJECT';

export const CreatorMaterialsView: React.FC = () => {
  const [items, setItems] = useState<CreatorMaterialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await creatorMarketplaceService.listAdminQueue()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not load the creator review queue.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const review = async (item: CreatorMaterialRecord, decision: Decision) => {
    const comment = notes[item.id]?.trim() || '';
    if (['REQUEST_CHANGES', 'REQUEST_RIGHTS', 'REJECT'].includes(decision) && !comment) {
      setError('Add clear editor notes before returning or rejecting material.'); return;
    }
    setWorkingId(item.id); setError('');
    try {
      await creatorMarketplaceService.reviewMaterial(item.id, decision, comment);
      await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Review action failed.'); }
    finally { setWorkingId(null); }
  };

  const openSource = async (item: CreatorMaterialRecord) => {
    try { window.open(await creatorMarketplaceService.createSignedSourceUrl(item.source_file_path), '_blank', 'noopener,noreferrer'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'The private source file could not be opened.'); }
  };

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><h1 className="text-2xl font-black tracking-tight text-slate-950">Creator Materials</h1><p className="mt-1 text-sm text-slate-500">Review rights signals, curriculum quality and learner value before publication.</p></div>
        <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[['Waiting review', items.filter((i) => i.status === 'EDITORIAL_REVIEW').length], ['Rights evidence', items.filter((i) => i.status === 'RIGHTS_EVIDENCE_REQUIRED').length], ['Changes requested', items.filter((i) => i.status === 'CHANGES_REQUESTED').length], ['Ready to publish', items.filter((i) => i.status === 'APPROVED').length]].map(([label, value]) => <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-2xl font-black text-slate-900">{value}</p><p className="mt-1 text-xs font-bold text-slate-500">{label}</p></div>)}
      </div>
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}
      {loading ? <div className="grid min-h-64 place-items-center"><RefreshCw className="h-7 w-7 animate-spin text-indigo-600" /></div> : items.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center"><CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" /><p className="mt-3 font-black text-slate-900">The review queue is clear.</p><p className="mt-1 text-sm text-slate-500">New teacher submissions will appear here.</p></div> : <div className="space-y-4">{items.map((item) => <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col justify-between gap-4 lg:flex-row"><div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700">{item.category.replaceAll('_', ' ')}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-600">{item.status.replaceAll('_', ' ')}</span>{item.rights_evidence_required && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase text-amber-700"><ShieldAlert className="h-3 w-3" /> Rights review</span>}</div><h2 className="mt-3 text-lg font-black text-slate-950">{item.title}</h2><p className="mt-1 text-sm text-slate-500">{item.grade} · {item.subject} · {item.curriculum} {item.exam_body ? `· ${item.exam_body}` : ''} · KES {Number(item.price_kes).toLocaleString()}</p><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">{item.description}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void openSource(item)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700"><FileText className="h-4 w-4" /> Open private source <ExternalLink className="h-3 w-3" /></button>{item.marking_scheme_path && <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Marking guide attached</span>}</div></div><div className="shrink-0 text-xs text-slate-500 lg:text-right"><p>Uploaded {new Date(item.created_at).toLocaleString()}</p><p className="mt-1">Screening: {item.screening_status.replaceAll('_', ' ').toLowerCase()}</p>{typeof item.similarity_score === 'number' && <p className="mt-1 font-bold text-amber-700">Highest similarity signal: {Math.round(item.similarity_score * 100)}%</p>}</div></div><div className="mt-5 border-t border-slate-100 pt-5"><label className="text-xs font-black uppercase tracking-wide text-slate-600">Editor notes to creator</label><textarea rows={2} value={notes[item.id] || ''} onChange={(e) => setNotes((current) => ({ ...current, [item.id]: e.target.value }))} placeholder="Be specific: page, question, missing answer, rights evidence or correction needed." className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" /><div className="mt-3 flex flex-wrap gap-2"><button disabled={workingId === item.id} onClick={() => void review(item, item.status === 'APPROVED' ? 'PUBLISH' : 'APPROVE')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" /> {item.status === 'APPROVED' ? 'Publish now' : 'Approve quality'}</button><button disabled={workingId === item.id} onClick={() => void review(item, 'REQUEST_CHANGES')} className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-black text-amber-800"><AlertTriangle className="h-4 w-4" /> Request changes</button><button disabled={workingId === item.id} onClick={() => void review(item, 'REQUEST_RIGHTS')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700"><ShieldAlert className="h-4 w-4" /> Request rights evidence</button><button disabled={workingId === item.id} onClick={() => void review(item, 'REJECT')} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-xs font-black text-red-700"><XCircle className="h-4 w-4" /> Reject</button></div></div></article>)}</div>}
    </div>
  );
};

export default CreatorMaterialsView;
