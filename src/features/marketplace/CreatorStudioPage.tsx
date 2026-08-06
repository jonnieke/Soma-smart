import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BadgeCheck, Banknote, BookOpen, CheckCircle2, ChevronRight,
  Clock3, FileCheck2, FileText, GraduationCap, Plus, Send, Share2, ShieldCheck,
  Sparkles, Upload, WalletCards, X,
} from 'lucide-react';
import {
  creatorMarketplaceService,
  CreatorEarningsSummary,
  CreatorMaterialCategory,
  CreatorMaterialRecord,
  CreatorProfileRecord,
} from '../../services/creatorMarketplaceService';

const CATEGORIES: Array<{ id: CreatorMaterialCategory; label: string; help: string }> = [
  { id: 'EXAM_PAPER', label: 'Exam paper', help: 'A complete assessment, preferably with a marking guide.' },
  { id: 'REVISION_PAPER', label: 'Revision paper', help: 'A focused practice paper for a topic, term or examination.' },
  { id: 'NOTES', label: 'Notes', help: 'Curriculum-aligned teaching or learner notes.' },
  { id: 'EXAM_GUIDE', label: 'Exam guide', help: 'Technique, worked examples and marks guidance.' },
  { id: 'REVISION_PACK', label: 'Revision pack', help: 'A coordinated bundle of drills, notes and checks.' },
];

const emptyEarnings: CreatorEarningsSummary = { pending_kes: 0, cleared_kes: 0, scheduled_kes: 0, paid_kes: 0, lifetime_sales: 0 };

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';
const labelClass = 'mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-600';

const statusLabel: Record<string, string> = {
  DRAFT: 'Draft', SCREENING: 'Checking originality', EDITORIAL_REVIEW: 'Editorial review',
  CHANGES_REQUESTED: 'Changes requested', RIGHTS_EVIDENCE_REQUIRED: 'Rights evidence needed',
  APPROVED: 'Approved', PUBLISHED: 'Published', REJECTED: 'Not approved', SUSPENDED: 'Paused',
};

const CreatorOnboarding: React.FC<{ onComplete: (profile: CreatorProfileRecord) => void }> = ({ onComplete }) => {
  const [form, setForm] = useState({
    display_name: '', account_type: 'TEACHER' as const, phone: '', email: '', county: '', school_name: '',
    subjects: '', grades: '', experience_years: 0, payout_method: 'MPESA' as 'MPESA' | 'BANK', payout_destination: '', kra_pin: '',
  });
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accepted) return setError('Please accept the Creator Agreement before continuing.');
    setSaving(true); setError('');
    try {
      const profile = await creatorMarketplaceService.saveProfile({
        ...form,
        subjects: form.subjects.split(',').map((item) => item.trim()).filter(Boolean),
        grades: form.grades.split(',').map((item) => item.trim()).filter(Boolean),
      });
      onComplete(profile);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'We could not save your creator profile.');
    } finally { setSaving(false); }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-7">
        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"><Sparkles className="h-3.5 w-3.5" /> SomaAI Creator Programme</span>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Teach more learners. Earn from work you own.</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Create your verified teacher profile once. Your documents remain private while SomaAI checks quality and rights before publication.</p>
      </div>
      <form onSubmit={submit} className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className={labelClass}>Full name</span><input required className={inputClass} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} /></label>
          <label><span className={labelClass}>Phone</span><input required type="tel" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label><span className={labelClass}>Email</span><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label><span className={labelClass}>School (optional)</span><input className={inputClass} value={form.school_name} onChange={(e) => setForm({ ...form, school_name: e.target.value })} /></label>
          <label><span className={labelClass}>County</span><input className={inputClass} value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} /></label>
          <label><span className={labelClass}>Teaching experience</span><input min={0} type="number" className={inputClass} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} /></label>
          <label><span className={labelClass}>Subjects</span><input required className={inputClass} placeholder="Mathematics, Science" value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} /></label>
          <label><span className={labelClass}>Grades/classes</span><input required className={inputClass} placeholder="Grade 6, Form 4" value={form.grades} onChange={(e) => setForm({ ...form, grades: e.target.value })} /></label>
          <label><span className={labelClass}>Monthly payout method</span><select className={inputClass} value={form.payout_method} onChange={(e) => setForm({ ...form, payout_method: e.target.value as 'MPESA' | 'BANK' })}><option value="MPESA">M-Pesa</option><option value="BANK">Bank account</option></select></label>
          <label><span className={labelClass}>Payout phone/account</span><input required className={inputClass} value={form.payout_destination} onChange={(e) => setForm({ ...form, payout_destination: e.target.value })} /></label>
          <label><span className={labelClass}>KRA PIN (required before payout)</span><input className={inputClass} value={form.kra_pin} onChange={(e) => setForm({ ...form, kra_pin: e.target.value.toUpperCase() })} /></label>
        </div>
        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-indigo-600" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span className="text-sm leading-6 text-slate-700">I accept the Creator Agreement. I will submit only work I own or am authorized to distribute, and I grant SomaAI a non-exclusive licence to review, display and sell approved materials.</span>
        </label>
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-60">{saving ? 'Creating profile…' : 'Join the Creator Programme'} <ChevronRight className="h-4 w-4" /></button>
      </form>
    </div>
  );
};

const SubmitMaterialModal: React.FC<{ onClose: () => void; onCreated: (record: CreatorMaterialRecord) => void }> = ({ onClose, onCreated }) => {
  const [form, setForm] = useState({ title: '', description: '', category: 'EXAM_PAPER' as CreatorMaterialCategory, subject: '', grade: '', curriculum: 'CBC', examBody: '', year: new Date().getFullYear(), priceKes: 50 });
  const [source, setSource] = useState<File | null>(null);
  const [scheme, setScheme] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const teacherShare = Math.round(form.priceKes * 0.6 * 100) / 100;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!source) return setError('Attach the material learners will receive.');
    if (!rights) return setError('Confirm that you have the rights to publish this material.');
    setSaving(true); setError('');
    try {
      const result = await creatorMarketplaceService.submitMaterial({
        ...form, sourceFile: source, markingSchemeFile: scheme, previewFile: preview,
        rightsDeclaration: 'I own this work or hold written authorization to distribute it commercially.',
        aiScreeningConsent: aiConsent,
      });
      onCreated(result);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The material could not be submitted.');
    } finally { setSaving(false); }
  };

  const fileInput = (label: string, help: string, value: File | null, setter: (file: File | null) => void, required = false) => (
    <label className="block rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 hover:border-indigo-400">
      <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><Upload className="h-4 w-4 text-indigo-600" /> {label}{required ? ' *' : ''}</span>
      <span className="mt-1 block text-xs text-slate-500">{value?.name || help}</span>
      <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" onChange={(e) => setter(e.target.files?.[0] || null)} />
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="mx-auto my-4 max-w-3xl rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between rounded-t-3xl border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
          <div><h2 className="text-xl font-black text-slate-950">Submit teaching material</h2><p className="mt-1 text-sm text-slate-500">Upload once, review clearly, publish with confidence.</p></div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-6 p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className={labelClass}>Title</span><input required className={inputClass} placeholder="Grade 6 Mathematics Term 2 Revision Paper" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
            <label><span className={labelClass}>Material type</span><select className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as CreatorMaterialCategory })}>{CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
            <label><span className={labelClass}>Price (KES)</span><input min={10} max={5000} type="number" className={inputClass} value={form.priceKes} onChange={(e) => setForm({ ...form, priceKes: Number(e.target.value) })} /></label>
            <label><span className={labelClass}>Subject</span><input required className={inputClass} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
            <label><span className={labelClass}>Grade/class</span><input required className={inputClass} value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} /></label>
            <label><span className={labelClass}>Curriculum</span><input required className={inputClass} value={form.curriculum} onChange={(e) => setForm({ ...form, curriculum: e.target.value })} /></label>
            <label><span className={labelClass}>Exam body (optional)</span><input className={inputClass} placeholder="KPSEA, KCSE, school mock" value={form.examBody} onChange={(e) => setForm({ ...form, examBody: e.target.value })} /></label>
            <label><span className={labelClass}>Year</span><input type="number" className={inputClass} value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} /></label>
            <label className="sm:col-span-2"><span className={labelClass}>What will the learner gain?</span><textarea required rows={4} maxLength={800} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {fileInput('Learner material', 'PDF or DOCX, up to 50 MB', source, setSource, true)}
            {fileInput('Marking guide', 'Recommended for papers', scheme, setScheme)}
            {fileInput('Free preview', 'Optional sample pages', preview, setPreview)}
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-emerald-800">Estimated split per sale</p>
            <div className="mt-2 flex items-end justify-between gap-4"><div><p className="text-sm text-emerald-900">You receive 60% of net receipts</p><p className="text-2xl font-black text-emerald-800">About KES {teacherShare}</p></div><p className="text-right text-xs text-emerald-700">Paid monthly<br />after the clearing period</p></div>
          </div>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"><input type="checkbox" className="mt-1 h-4 w-4 accent-indigo-600" checked={rights} onChange={(e) => setRights(e.target.checked)} /><span className="text-sm leading-6 text-slate-700"><strong>Rights declaration:</strong> I created this material or hold written commercial distribution rights. Images, extracts and diagrams are original, licensed or properly authorized.</span></label>
          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 p-4"><input type="checkbox" className="mt-1 h-4 w-4 accent-indigo-600" checked={aiConsent} onChange={(e) => setAiConsent(e.target.checked)} /><span className="text-sm leading-6 text-slate-700"><strong>Optional AI-assisted originality screening:</strong> I permit SomaAI to send this document to Google Gemini to extract text and compare similarity signals against the SomaAI library and prior submissions. Google processes the document for this check; a human editor—not AI—makes every publication decision.</span></label>
          {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 px-5 py-5 sm:flex-row sm:justify-end sm:px-7"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700">Keep as draft later</button><button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-60"><Send className="h-4 w-4" /> {saving ? 'Uploading securely…' : 'Submit for review'}</button></div>
      </form>
    </div>
  );
};

export const CreatorStudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<CreatorProfileRecord | null | undefined>(undefined);
  const [materials, setMaterials] = useState<CreatorMaterialRecord[]>([]);
  const [earnings, setEarnings] = useState<CreatorEarningsSummary>(emptyEarnings);
  const [showSubmit, setShowSubmit] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const creator = await creatorMarketplaceService.getMyProfile();
      setProfile(creator);
      if (creator) {
        const [items, summary] = await Promise.all([creatorMarketplaceService.listMyMaterials(), creatorMarketplaceService.getEarningsSummary()]);
        setMaterials(items); setEarnings(summary);
      }
    } catch (caught) {
      setProfile(null);
      setError(caught instanceof Error ? caught.message : 'Creator Studio is temporarily unavailable.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const shareCreatorPage = async () => {
    const url = `${window.location.origin}/marketplace?creator=${profile?.store_slug || profile?.user_id || ''}`;
    const text = `Explore ${profile?.display_name || 'my'} original learning materials on SomaAI.`;
    if (navigator.share) await navigator.share({ title: 'SomaAI Creator', text, url });
    else { await navigator.clipboard.writeText(`${text} ${url}`); alert('Creator link copied.'); }
  };
  const published = useMemo(() => materials.filter((item) => item.status === 'PUBLISHED').length, [materials]);

  if (profile === undefined) return <div className="grid min-h-[70vh] place-items-center bg-slate-50"><div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>;
  if (!profile) return <CreatorOnboarding onComplete={setProfile} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {showSubmit && <SubmitMaterialModal onClose={() => setShowSubmit(false)} onCreated={(record) => { setMaterials((current) => [record, ...current]); setShowSubmit(false); }} />}
      <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6"><button onClick={() => navigate('/teacher')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-700"><ArrowLeft className="h-4 w-4" /> Teacher home</button><div className="flex gap-2"><button onClick={shareCreatorPage} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-700"><Share2 className="h-4 w-4" /> Share shop</button><button onClick={() => setShowSubmit(true)} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-black text-white hover:bg-indigo-700"><Plus className="h-4 w-4" /> Add material</button></div></div></header>
      <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 sm:px-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-sm font-bold text-indigo-700"><BadgeCheck className="h-5 w-5" /> Creator profile · {profile.status.toLowerCase()}</div><h1 className="mt-2 text-3xl font-black tracking-tight">Welcome, {profile.display_name.split(' ')[0]}.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Submit original teaching resources, follow every review decision, and see exactly what SomaAI owes you each month.</p></div><div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-5 py-4 text-sm text-indigo-900"><p className="font-black">60% belongs to you</p><p className="mt-1 text-xs leading-5 text-indigo-700">Monthly payout · transparent statement · no instant withdrawal wallet</p></div></div></section>
        {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p>}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[{ label: 'Materials', value: materials.length, icon: BookOpen }, { label: 'Published', value: published, icon: FileCheck2 }, { label: 'Pending clearance', value: `KES ${earnings.pending_kes.toLocaleString()}`, icon: Clock3 }, { label: 'Next payout', value: `KES ${earnings.cleared_kes.toLocaleString()}`, icon: WalletCards }, { label: 'Paid to date', value: `KES ${earnings.paid_kes.toLocaleString()}`, icon: Banknote }].map(({ label, value, icon: Icon }) => <div key={label} className="rounded-2xl border border-slate-200 bg-white p-4"><Icon className="h-5 w-5 text-indigo-600" /><p className="mt-4 text-xl font-black">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{label}</p></div>)}
        </section>
        <section className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-black">Your materials</h2><p className="mt-1 text-sm text-slate-500">A clear record from upload to publication.</p></div><button onClick={() => setShowSubmit(true)} className="text-sm font-black text-indigo-700">Submit new</button></div>{materials.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center"><FileText className="mx-auto h-9 w-9 text-slate-300" /><p className="mt-3 font-bold">Your first material starts here.</p><p className="mt-1 text-sm text-slate-500">A complete exam paper with its marking guide is a strong first listing.</p><button onClick={() => setShowSubmit(true)} className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white">Upload material</button></div> : <div className="divide-y divide-slate-100">{materials.map((item) => <article key={item.id} className="py-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase text-indigo-700">{CATEGORIES.find((category) => category.id === item.category)?.label}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${item.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700' : item.status.includes('RIGHTS') || item.status.includes('CHANGES') ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{statusLabel[item.status] || item.status}</span></div><h3 className="mt-2 truncate font-black text-slate-900">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.grade} · {item.subject} · KES {Number(item.price_kes).toLocaleString()} · {item.sales_count || 0} sales</p>{item.review_notes && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">Editor: {item.review_notes}</p>}</div><div className="text-left sm:text-right"><p className="text-xs font-semibold text-slate-400">Uploaded {new Date(item.created_at).toLocaleDateString()}</p><p className="mt-1 text-xs text-slate-500">Screening: {item.screening_status.toLowerCase().replace('_', ' ')}</p></div></div></article>)}</div>}</div>
          <aside className="space-y-4"><div className="rounded-3xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-black"><ShieldCheck className="h-5 w-5 text-emerald-600" /> How review works</h2><ol className="mt-4 space-y-4">{['Secure upload', 'Originality and rights screening', 'Curriculum and answer review', 'Publish to the correct shelf'].map((step, index) => <li key={step} className="flex gap-3 text-sm text-slate-600"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-black text-slate-700">{index + 1}</span>{step}</li>)}</ol></div><div className="rounded-3xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-black"><GraduationCap className="h-5 w-5 text-indigo-600" /> Bring your learners</h2><p className="mt-2 text-sm leading-6 text-slate-600">Share your shop through WhatsApp or a class QR code. Learners receive access after payment; you see aggregate sales, not private learner activity.</p><button onClick={shareCreatorPage} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 px-4 py-3 text-sm font-black text-indigo-700"><Share2 className="h-4 w-4" /> Share creator shop</button></div><div className="rounded-3xl border border-slate-200 bg-white p-5"><h2 className="flex items-center gap-2 font-black"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Monthly statements</h2><p className="mt-2 text-sm leading-6 text-slate-600">Pending sales clear after the refund period, then enter the next monthly payout batch. Tax and adjustments appear line by line.</p></div></aside>
        </section>
      </main>
    </div>
  );
};

export default CreatorStudioPage;
