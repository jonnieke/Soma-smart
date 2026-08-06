import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, FileText, GraduationCap, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { creatorMarketplaceService, CreatorMaterialRecord } from '../../services/creatorMarketplaceService';

export const CreatorPurchasedLibraryPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CreatorMaterialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await creatorMarketplaceService.listMyPurchasedMaterials()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Your purchased materials could not be loaded.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const open = async (item: CreatorMaterialRecord, asset: 'SOURCE' | 'MARKING_SCHEME') => {
    try { window.open(await creatorMarketplaceService.getMaterialAccessUrl(item.id, asset), '_blank', 'noopener,noreferrer'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'This file could not be opened.'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6"><button onClick={() => navigate('/marketplace')} className="inline-flex items-center gap-2 text-sm font-black text-slate-700"><ArrowLeft className="h-4 w-4" /> Marketplace</button><button onClick={() => navigate('/learner')} className="text-sm font-black text-indigo-700">Learner home</button></div></header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><div><span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700"><KeyRound className="h-3.5 w-3.5" /> Your permanent access</span><h1 className="mt-4 text-3xl font-black tracking-tight">My purchased materials</h1><p className="mt-2 text-sm leading-6 text-slate-600">Open your papers and notes in SomaAI. Your access follows your learner account across devices.</p></div>{error && <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}{loading ? <div className="grid min-h-72 place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div> : items.length === 0 ? <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center"><BookOpen className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-black">No purchased materials yet.</p><button onClick={() => navigate('/marketplace')} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white">Browse teacher materials</button></div> : <div className="mt-8 grid gap-4 md:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700">{item.category.replaceAll('_', ' ')}</span><CheckCircle2 className="h-5 w-5 text-emerald-600" /></div><h2 className="mt-4 text-lg font-black">{item.title}</h2><p className="mt-1 text-sm text-slate-500">{item.grade} · {item.subject}</p><p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{item.description}</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={() => void open(item, 'SOURCE')} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white"><FileText className="h-4 w-4" /> Open material</button>{item.marking_scheme_path && <button onClick={() => void open(item, 'MARKING_SCHEME')} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-black text-slate-700">Marking guide</button>}{item.knowledge_base_id && <button onClick={() => navigate(`/revision/dashboard?paper=${item.knowledge_base_id}`)} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-xs font-black text-indigo-700"><GraduationCap className="h-4 w-4" /> Revision Mode</button>}</div></article>)}</div>}</main>
    </div>
  );
};

export default CreatorPurchasedLibraryPage;
