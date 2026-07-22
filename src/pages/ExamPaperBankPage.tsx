import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  FileCheck2,
  FileText,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Unlock,
  X,
} from 'lucide-react';
import logoImg from '../assets/images/main_logo.png';
import { useApp } from '../context/AppContext';
import {
  EXAM_PAPER_PRICE_KES,
  ExamPaperBankItem,
  examPaperBankService,
} from '../services/examPaperBankService';

const normalise = (value?: string | null) => String(value || '').trim();

export const ExamPaperBankPage: React.FC = () => {
  const navigate = useNavigate();
  const { isPro } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [papers, setPapers] = React.useState<ExamPaperBankItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [query, setQuery] = React.useState('');
  const [subject, setSubject] = React.useState('All subjects');
  const [grade, setGrade] = React.useState('All grades');
  const [examBody, setExamBody] = React.useState('All exam bodies');
  const [selected, setSelected] = React.useState<ExamPaperBankItem | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [checkoutUrl, setCheckoutUrl] = React.useState('');
  const [checkoutReference, setCheckoutReference] = React.useState('');
  const [buying, setBuying] = React.useState(false);
  const [buyer, setBuyer] = React.useState({ name: '', phone: '', email: '' });

  const [unlockedPaperIds, setUnlockedPaperIds] = React.useState<Set<string>>(new Set());

  const markPaperUnlocked = React.useCallback((id: string | number) => {
    setUnlockedPaperIds((prev) => new Set([...prev, String(id)]));
  }, []);

  const isPaperUnlocked = React.useCallback((id: string | number) => {
    return Boolean(isPro || unlockedPaperIds.has(String(id)));
  }, [isPro, unlockedPaperIds]);

  React.useEffect(() => {
    let active = true;
    examPaperBankService.listPapers()
      .then((items) => {
        if (!active) return;
        setPapers(items.filter((paper) => paper.has_exam_paper !== false && paper.has_marking_scheme !== false));
      })
      .catch(() => {
        if (active) setError('We could not load the paper bank. Please refresh and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    const paperId = searchParams.get('paper');
    if (!paperId || papers.length === 0) return;
    const paper = papers.find((item) => String(item.id) === paperId);
    if (paper) setSelected(paper);
  }, [papers, searchParams]);

  React.useEffect(() => {
    if (searchParams.get('status') !== 'verifying') return;
    const examId = searchParams.get('paper');
    const reference = searchParams.get('ref');
    if (!examId) return;

    let cancelled = false;
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      try {
        const access = await examPaperBankService.getAccess(examId, reference);
        if (!cancelled && access.paid) {
          markPaperUnlocked(examId);
          navigate(`/exam-papers/${encodeURIComponent(String(examId))}/read`, { replace: true });
          return;
        }
      } catch {
        // Payment confirmation can take a few seconds after returning from M-Pesa.
      }
      if (!cancelled && attempts < 20) window.setTimeout(check, 3000);
      if (!cancelled && attempts >= 20) setError('Payment confirmation is taking longer than expected. Tap the paper again to retry.');
    };
    void check();
    return () => { cancelled = true; };
  }, [markPaperUnlocked, navigate, searchParams]);

  React.useEffect(() => {
    if (!checkoutReference || !selected) return;
    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const access = await examPaperBankService.getAccess(selected.id, checkoutReference);
        if (!cancelled && access.paid) {
          markPaperUnlocked(selected.id);
          window.clearInterval(interval);
          navigate(`/exam-papers/${encodeURIComponent(String(selected.id))}/read`);
        }
      } catch {
        // PesaPal confirmation is asynchronous; keep polling while checkout is open.
      }
    }, 3000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [checkoutReference, markPaperUnlocked, navigate, selected]);

  const subjects = React.useMemo(
    () => ['All subjects', ...Array.from(new Set(papers.map((paper) => normalise(paper.subject)).filter(Boolean))).sort()],
    [papers],
  );
  const grades = React.useMemo(
    () => ['All grades', ...Array.from(new Set(papers.map((paper) => normalise(paper.grade)).filter(Boolean))).sort()],
    [papers],
  );
  const examBodies = React.useMemo(
    () => ['All exam bodies', ...Array.from(new Set(papers.map((paper) => normalise(paper.exam_body)).filter(Boolean))).sort()],
    [papers],
  );
  const filtered = papers.filter((paper) => {
    const haystack = `${paper.title} ${paper.subject} ${paper.grade} ${paper.exam_body || ''} ${paper.exam_type || ''}`.toLowerCase();
    return (!query.trim() || haystack.includes(query.toLowerCase()))
      && (subject === 'All subjects' || paper.subject === subject)
      && (grade === 'All grades' || paper.grade === grade)
      && (examBody === 'All exam bodies' || paper.exam_body === examBody);
  });

  const beginPurchase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setBuying(true);
    setError('');
    try {
      const result = await examPaperBankService.initiatePurchase(selected.id, buyer);
      if (result.already_paid) {
        markPaperUnlocked(selected.id);
        navigate(`/exam-papers/${encodeURIComponent(String(selected.id))}/read`);
        return;
      }
      if (!result?.redirect_url) throw new Error('Checkout unavailable');
      setCheckoutUrl(result.redirect_url);
      setCheckoutReference(result.reference);
    } catch {
      setError('We could not start M-Pesa checkout. Confirm your details and try again.');
    } finally {
      setBuying(false);
    }
  };

  const openPaper = async (paper: ExamPaperBankItem) => {
    setSelected(paper);
    setSearchParams({ paper: String(paper.id) });
    if (isPaperUnlocked(paper.id)) {
      navigate(`/exam-papers/${encodeURIComponent(String(paper.id))}/read`);
      return;
    }
    try {
      const access = await examPaperBankService.getAccess(paper.id);
      if (access.paid) {
        markPaperUnlocked(paper.id);
        navigate(`/exam-papers/${encodeURIComponent(String(paper.id))}/read`);
        return;
      }
    } catch {
      // A new buyer will continue through checkout.
    }
    setCheckoutOpen(true);
  };

  const openRevisionMode = async (paper: ExamPaperBankItem) => {
    setSelected(paper);
    setSearchParams({ paper: String(paper.id) });
    if (isPaperUnlocked(paper.id)) {
      navigate(`/revision?paper=${encodeURIComponent(String(paper.id))}`);
      return;
    }
    try {
      const access = await examPaperBankService.getAccess(paper.id);
      if (access.paid) {
        markPaperUnlocked(paper.id);
        navigate(`/revision?paper=${encodeURIComponent(String(paper.id))}`);
        return;
      }
    } catch {
      // Unpaid or unverified buyers should go through the paper checkout.
    }
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
      <Helmet>
        <title>Exam Paper Bank | Soma AI</title>
        <meta name="description" content="Buy SomaAI original exam papers with marking schemes for KES 20. Browse by grade and subject without signing in." />
      </Helmet>

      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2" aria-label="Soma AI homepage">
            <img src={logoImg} alt="" className="h-10 w-10 object-contain" />
            <span className="text-xl font-black text-[#07133f]">Soma AI</span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="hidden rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 sm:inline-flex">Home</button>
            <button onClick={() => navigate('/revision')} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">Revision Mode</button>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
            <button onClick={() => navigate('/')} className="mb-7 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600"><ArrowLeft className="h-4 w-4" /> Back home</button>
            <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
              <div>
                <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-indigo-700">Open to everyone · No login required</span>
                <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-tight text-[#07133f] sm:text-5xl">Exam papers, ready when you are.</h1>
                <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600 sm:text-lg">Find a SomaAI Original paper by grade and subject. Get the exam paper and its marking scheme together for KES {EXAM_PAPER_PRICE_KES}.</p>
              </div>
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">One clear price</p>
                <p className="mt-1 text-3xl font-black text-slate-950">KES {EXAM_PAPER_PRICE_KES}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Exam paper + marking scheme. Read inside Soma AI and return on this device.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-[1fr_190px_190px_190px]">
              <label className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Mathematics, English, KCSE..." className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-4 text-sm font-semibold outline-none focus:border-indigo-400" />
              </label>
              <label className="relative">
                <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select value={grade} onChange={(event) => setGrade(event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold outline-none focus:border-indigo-400">{grades.map((item) => <option key={item}>{item}</option>)}</select>
              </label>
              <select value={subject} onChange={(event) => setSubject(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-indigo-400">{subjects.map((item) => <option key={item}>{item}</option>)}</select>
              <select value={examBody} onChange={(event) => setExamBody(event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-indigo-400">{examBodies.map((item) => <option key={item}>{item}</option>)}</select>
            </div>
          </div>

          {loading ? <div className="flex min-h-72 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div> : null}
          {!loading && filtered.length > 0 ? (
            <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((paper) => {
                const unlocked = isPaperUnlocked(paper.id);

                return (
                  <article
                    key={paper.id}
                    className={`flex flex-col rounded-2xl border p-5 shadow-sm transition hover:shadow-md ${
                      unlocked
                        ? 'border-emerald-300/80 bg-gradient-to-b from-emerald-50/20 via-white to-white'
                        : 'border-slate-200 bg-white hover:border-indigo-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {unlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/60 bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-800">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          {isPro ? 'Unlocked with Pro' : 'Purchased'}
                        </span>
                      ) : (
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-indigo-700">
                          SomaAI Original
                        </span>
                      )}

                      {unlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                          <Unlock className="h-3.5 w-3.5 text-emerald-600" /> Unlocked
                        </span>
                      ) : (
                        <span className="text-lg font-black text-slate-950">
                          KES {EXAM_PAPER_PRICE_KES}
                        </span>
                      )}
                    </div>

                    <h2 className="mt-4 text-lg font-black leading-snug text-[#07133f]">{paper.title}</h2>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                      <span>{paper.subject}</span><span>·</span><span>{paper.grade}</span>{paper.exam_body ? <><span>·</span><span>{paper.exam_body}</span></> : null}
                      {paper.duration_minutes ? <><span>·</span><span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {paper.duration_minutes} min</span></> : null}
                    </div>

                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-600">
                      <p className="flex items-center gap-2"><FileText className="h-4 w-4 text-indigo-600" /> Complete exam paper</p>
                      <p className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-emerald-600" /> {paper.has_marking_scheme ? 'Marking scheme included' : 'Marking scheme being prepared'}</p>
                    </div>

                    <div className="mt-auto grid grid-cols-2 gap-2 pt-6">
                      <button
                        onClick={() => void openPaper(paper)}
                        className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-black transition-all ${
                          unlocked
                            ? 'bg-slate-900 text-white hover:bg-slate-800'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        <span>{unlocked ? 'Read Paper' : 'Get Paper'}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      <button
                        onClick={() => void openRevisionMode(paper)}
                        title={unlocked ? 'Open in Revision Mode (Unlocked)' : 'Unlock Revision Mode (KES 20 or Pro)'}
                        className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-xs font-black transition-all ${
                          unlocked
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:text-indigo-700'
                        }`}
                      >
                        {unlocked ? (
                          <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                        )}
                        <span>Revision</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}
          {!loading && filtered.length === 0 ? <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-12 text-center"><FileText className="mx-auto h-10 w-10 text-slate-300" /><h2 className="mt-4 text-lg font-black">No matching papers</h2><p className="mt-2 text-sm text-slate-500">Try another grade, subject, or search term.</p></div> : null}
        </section>
      </main>

      {checkoutOpen && selected ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Buy exam paper">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div><p className="text-xs font-black uppercase tracking-wider text-indigo-600">Exam paper package</p><h2 className="mt-1 font-black text-slate-950">{selected.title}</h2></div>
              <button onClick={() => { setCheckoutOpen(false); setCheckoutUrl(''); setCheckoutReference(''); }} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close checkout"><X className="h-5 w-5" /></button>
            </div>
            {checkoutUrl ? (
              <div className="p-4"><iframe title="M-Pesa checkout" src={checkoutUrl} className="h-[620px] w-full rounded-2xl border border-slate-200" allow="payment" /></div>
            ) : (
              <form onSubmit={beginPurchase} className="grid gap-6 p-6 md:grid-cols-[1fr_280px]">
                <div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-black"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> No account needed</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Enter the M-Pesa contact details below. After payment, the paper and marking scheme open inside Soma AI.</p>
                  </div>
                  <div className="mt-5 space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Your name<input required value={buyer.name} onChange={(event) => setBuyer({ ...buyer, name: event.target.value })} className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-indigo-400" /></label>
                    <label className="block text-sm font-bold text-slate-700">M-Pesa phone<input required inputMode="tel" placeholder="07XX XXX XXX" value={buyer.phone} onChange={(event) => setBuyer({ ...buyer, phone: event.target.value })} className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-indigo-400" /></label>
                    <label className="block text-sm font-bold text-slate-700">Email <span className="font-medium text-slate-400">(optional receipt)</span><input type="email" value={buyer.email} onChange={(event) => setBuyer({ ...buyer, email: event.target.value })} className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-indigo-400" /></label>
                  </div>
                </div>
                <aside className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <Smartphone className="h-8 w-8 text-indigo-600" />
                  <p className="mt-4 text-sm font-bold text-slate-600">Total</p><p className="text-3xl font-black">KES {EXAM_PAPER_PRICE_KES}</p>
                  <div className="my-5 h-px bg-indigo-100" />
                  <p className="text-sm font-semibold leading-6 text-slate-600">Includes the exam paper and available marking scheme. Your access is remembered on this device.</p>
                  <button disabled={buying} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white disabled:opacity-60">{buying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} Pay with M-Pesa</button>
                </aside>
              </form>
            )}
          </div>
        </div>
      ) : null}
      {error ? <div className="fixed bottom-4 left-1/2 z-[120] w-[min(92vw,620px)] -translate-x-1/2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-700 shadow-xl">{error}</div> : null}
    </div>
  );
};