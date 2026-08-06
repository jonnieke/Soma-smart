import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronRight, FileCheck2, GraduationCap, Search, ShieldCheck, ShoppingCart, Sparkles, X } from 'lucide-react';
import { PaymentFlow } from '../subscription/PaymentFlow';
import { creatorMarketplaceService, CreatorMaterialCategory, CreatorMaterialRecord } from '../../services/creatorMarketplaceService';

const SHELVES: Array<{ id: CreatorMaterialCategory; title: string; description: string }> = [
  { id: 'EXAM_PAPER', title: 'Latest exam papers', description: 'Complete, reviewed papers for timed practice.' },
  { id: 'NOTES', title: 'Teacher notes', description: 'Clear curriculum notes by verified educators.' },
  { id: 'REVISION_PAPER', title: 'Revision papers', description: 'Focused practice for a topic, term or exam.' },
  { id: 'EXAM_GUIDE', title: 'Exam guides', description: 'Technique, worked answers and marks guidance.' },
  { id: 'REVISION_PACK', title: 'Revision packs', description: 'Coordinated notes, drills and progress checks.' },
];

const MaterialCard: React.FC<{ item: CreatorMaterialRecord; onBuy: () => void; onPreview: () => void }> = ({ item, onBuy, onPreview }) => (
  <article className="flex w-[290px] shrink-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:w-[330px]">
    <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-indigo-700">{item.subject}</span><span className="text-xs font-bold text-slate-500">{item.grade}</span></div>
    <h3 className="mt-4 line-clamp-2 text-base font-black leading-6 text-slate-950">{item.title}</h3>
    <p className="mt-1 text-xs font-bold text-slate-500">by {item.creator_name || 'SomaAI Creator'}</p><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p>
    <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500"><span>{item.curriculum}</span>{item.exam_body && <><span>·</span><span>{item.exam_body}</span></>}{item.year && <><span>·</span><span>{item.year}</span></>}</div>
    <div className="mt-4 flex items-center gap-2 text-xs text-emerald-700"><ShieldCheck className="h-4 w-4" /><span className="font-bold">SomaAI reviewed</span>{item.marking_scheme_path && <><span>·</span><span>Marking guide</span></>}</div>
    <div className="mt-auto border-t border-slate-100 pt-4"><div className="mb-3 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase text-slate-400">One-time access</p><p className="text-xl font-black text-slate-950">KES {Number(item.price_kes).toLocaleString()}</p></div><p className="text-xs font-semibold text-slate-400">{item.sales_count || 0} learners</p></div><div className="grid grid-cols-2 gap-2"><button onClick={onPreview} className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-50">Preview</button><button onClick={onBuy} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2.5 text-xs font-black text-white hover:bg-indigo-700"><ShoppingCart className="h-3.5 w-3.5" /> Buy</button></div></div>
  </article>
);

export const CreatorMarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [items, setItems] = useState<CreatorMaterialRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState('ALL');
  const [subject, setSubject] = useState('ALL');
  const [buying, setBuying] = useState<CreatorMaterialRecord | null>(null);
  const [purchased, setPurchased] = useState<CreatorMaterialRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setItems(await creatorMarketplaceService.listPublished()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'The marketplace could not be loaded.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const grades = useMemo(() => ['ALL', ...new Set(items.map((item) => item.grade))], [items]);
  const subjects = useMemo(() => ['ALL', ...new Set(items.map((item) => item.subject))], [items]);
  const filtered = useMemo(() => items.filter((item) => {
    const text = `${item.title} ${item.description} ${item.subject} ${item.grade}`.toLowerCase();
    return (!query || text.includes(query.toLowerCase())) && (grade === 'ALL' || item.grade === grade) && (subject === 'ALL' || item.subject === subject) && (!params.get('creator') || item.creator_id === params.get('creator') || item.creator_slug === params.get('creator'));
  }), [items, query, grade, subject, params]);

  const preview = async (item: CreatorMaterialRecord) => {
    try { window.open(await creatorMarketplaceService.getMaterialAccessUrl(item.id, 'PREVIEW'), '_blank', 'noopener,noreferrer'); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'A preview is not available.'); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Helmet><title>Teacher Materials Marketplace | SomaAI</title><meta name="description" content="Buy reviewed exam papers, teacher notes, revision papers and exam guides from verified Kenyan educators." /></Helmet>
      {buying && <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm"><div className="relative mx-auto my-4 max-w-2xl overflow-hidden rounded-3xl bg-white"><button onClick={() => setBuying(null)} className="absolute right-4 top-4 z-20 rounded-xl bg-white p-2 text-slate-500 shadow"><X className="h-5 w-5" /></button><PaymentFlow plan={{ id: `creator_${buying.id}`, name: buying.title, price: Number(buying.price_kes), duration: 'ONE_TIME', segment: 'STUDENT' }} materialId={buying.id} onCancel={() => setBuying(null)} onSuccess={() => { setPurchased(buying); setBuying(null); }} /></div></div>}
      {purchased && <div className="fixed bottom-5 right-5 z-50 max-w-sm rounded-2xl bg-emerald-600 p-4 text-white shadow-xl"><div className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0" /><div><p className="font-black">Material unlocked</p><p className="mt-1 text-sm text-emerald-50">{purchased.title} is now attached to your learner account.</p><button onClick={() => navigate('/marketplace/purchased')} className="mt-2 text-xs font-black underline">Open my materials</button></div></div></div>}
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><button onClick={() => navigate('/')} className="inline-flex items-center gap-2 text-sm font-black text-slate-700"><ArrowLeft className="h-4 w-4" /> SomaAI home</button><div className="flex gap-2"><button onClick={() => navigate('/marketplace/purchased')} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700">My materials</button><button onClick={() => navigate('/teacher/creator-studio')} className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white">Sell your materials</button></div></div></header>
      <main>
        <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16"><span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700"><Sparkles className="h-3.5 w-3.5" /> Teacher-created. SomaAI reviewed.</span><h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">Find the material that helps you learn next.</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Preview before you pay. Buy once and keep access through your learner account. Exam papers include Revision Mode when the listing supports it.</p><div className="mt-7 grid max-w-4xl gap-3 sm:grid-cols-[1fr_190px_190px]"><label className="relative"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, subject or grade" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500" /></label><select value={grade} onChange={(e) => setGrade(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold"><option value="ALL">All grades</option>{grades.slice(1).map((item) => <option key={item}>{item}</option>)}</select><select value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold"><option value="ALL">All subjects</option>{subjects.slice(1).map((item) => <option key={item}>{item}</option>)}</select></div></div></section>
        <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6">
          {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}
          {loading ? <div className="grid min-h-72 place-items-center"><div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div> : filtered.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 bg-white py-16 text-center"><BookOpen className="mx-auto h-10 w-10 text-slate-300" /><p className="mt-3 font-black">No reviewed materials match these filters yet.</p><p className="mt-1 text-sm text-slate-500">Try another grade or subject.</p></div> : SHELVES.map((shelf) => { const shelfItems = filtered.filter((item) => item.category === shelf.id); if (!shelfItems.length) return null; return <section key={shelf.id}><div className="mb-4 flex items-end justify-between gap-4"><div><h2 className="text-2xl font-black tracking-tight">{shelf.title}</h2><p className="mt-1 text-sm text-slate-500">{shelf.description}</p></div><button className="hidden items-center gap-1 text-xs font-black text-indigo-700 sm:inline-flex">View all <ChevronRight className="h-4 w-4" /></button></div><div className="flex gap-4 overflow-x-auto pb-3">{shelfItems.map((item) => <MaterialCard key={item.id} item={item} onBuy={() => setBuying(item)} onPreview={() => void preview(item)} />)}</div></section>; })}
          <section className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 sm:grid-cols-3 sm:p-8">{[{ icon: FileCheck2, title: 'Reviewed first', text: 'Materials are checked before they reach the public shelf.' }, { icon: GraduationCap, title: 'Built for learners', text: 'Grade, subject and curriculum metadata make the right work easy to find.' }, { icon: ShieldCheck, title: 'Access stays with you', text: 'Purchases are linked to your learner account, not a temporary download.' }].map(({ icon: Icon, title, text }) => <div key={title}><Icon className="h-6 w-6 text-indigo-600" /><h3 className="mt-3 font-black">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{text}</p></div>)}</section>
        </div>
      </main>
    </div>
  );
};

export default CreatorMarketplacePage;
