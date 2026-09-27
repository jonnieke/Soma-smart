import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  EXAM_PAPER_PRICE_KES,
  ExamPaperBankItem,
  examPaperBankService,
} from '../services/examPaperBankService';
import { FALLBACK_LATEST_PAPERS } from '../components/ExamPaperTickerBelt';
import { PaperBankCatalog } from '../components/PaperBankCatalog';
import { paperDestination, rememberPaperMode } from '../services/paperCheckoutIntent';


export const ExamPaperBankPage: React.FC = () => {
  const navigate = useNavigate();
  const { isPro } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();
  const [papers, setPapers] = React.useState<ExamPaperBankItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [loadError, setLoadError] = React.useState('');
  const [loadAttempt, setLoadAttempt] = React.useState(0);
  const [selected, setSelected] = React.useState<ExamPaperBankItem | null>(null);
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [checkoutUrl, setCheckoutUrl] = React.useState('');
  const [checkoutReference, setCheckoutReference] = React.useState('');
  const [buying, setBuying] = React.useState(false);
  const [buyer, setBuyer] = React.useState({ name: '', phone: '', email: '' });

  const [unlockedPaperIds, setUnlockedPaperIds] = React.useState<Set<string>>(new Set());
  const [purchasedPaperIds, setPurchasedPaperIds] = React.useState<Set<string>>(new Set());
  const [restoringPurchases, setRestoringPurchases] = React.useState(true);
  const [purchaseRestoreError, setPurchaseRestoreError] = React.useState('');
  const [restoreAttempt, setRestoreAttempt] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    setRestoringPurchases(true);
    setPurchaseRestoreError('');
    examPaperBankService.listPurchasedPaperIds().then(ids => {
      if (active) setPurchasedPaperIds(new Set(ids));
    }).catch(() => {
      if (active) {
        setPurchasedPaperIds(new Set());
        setPurchaseRestoreError('We could not restore your purchases. Please retry before paying again.');
      }
    }).finally(() => { if (active) setRestoringPurchases(false); });
    return () => { active = false; };
  }, [restoreAttempt]);

  const markPaperUnlocked = React.useCallback((id: string | number) => {
    setUnlockedPaperIds((prev) => new Set([...prev, String(id)]));
  }, []);

  const isPaperUnlocked = React.useCallback((id: string | number) => {
    return Boolean(isPro || unlockedPaperIds.has(String(id)) || purchasedPaperIds.has(String(id)));
  }, [isPro, unlockedPaperIds, purchasedPaperIds]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');
    examPaperBankService.listPapers()
      .then((items) => {
        if (!active) return;
        setPapers(items.filter((paper) => paper.has_exam_paper !== false && paper.has_marking_scheme !== false));
      })
      .catch(() => {
        if (active) setLoadError('We could not load the paper bank. Please refresh and try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [loadAttempt]);

  React.useEffect(() => {
    const paperId = searchParams.get('paper');
    if (!paperId) return;
    const paper = papers.find((item) => String(item.id) === paperId) ||
      (FALLBACK_LATEST_PAPERS.find((item) => String(item.id) === paperId) as unknown as ExamPaperBankItem);
    if (paper) {
      setSelected(paper);
      if (isPaperUnlocked(paper.id)) {
        // Paper already paid — jump straight to the reader.
        navigate(paperDestination(paper.id), { replace: true });
      } else {
        // Paper not yet purchased — open the checkout modal immediately so the
        // user sees the purchase flow rather than a bare dashboard.
        setCheckoutOpen(true);
      }
    }
  }, [isPaperUnlocked, navigate, papers, searchParams]);


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
          navigate(paperDestination(examId), { replace: true });
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
          navigate(paperDestination(selected.id));
        }
      } catch {
        // PesaPal confirmation is asynchronous; keep polling while checkout is open.
      }
    }, 3000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [checkoutReference, markPaperUnlocked, navigate, selected]);


  const beginPurchase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setBuying(true);
    setError('');
    try {
      const result = await examPaperBankService.initiatePurchase(selected.id, buyer);
      if (result.already_paid) {
        markPaperUnlocked(selected.id);
        navigate(paperDestination(selected.id));
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
    rememberPaperMode(paper.id, 'read');
    setSelected(paper);
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
    setSearchParams({ paper: String(paper.id) });
    setCheckoutOpen(true);
  };

  const openRevisionMode = async (paper: ExamPaperBankItem) => {
    rememberPaperMode(paper.id, 'revision');
    setSelected(paper);
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
    setSearchParams({ paper: String(paper.id) });
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
      <Helmet>
        <html lang="en" />
        <title>KCSE, KPSEA &amp; CBC Exam Paper Bank Kenya | Soma AI Past Papers</title>
        <meta name="description" content="Download and attempt KCSE, KPSEA, and CBC past papers with official marking schemes for Kenya. Practice online with timed exam revision, step-by-step answers, and instant marking." />
        <meta name="keywords" content="KCSE past papers, KPSEA past papers, CBC exam papers Kenya, KNEC revision papers, KCSE marking schemes, Form 4 revision papers, Grade 6 7 8 9 exam papers, Kenyan mock papers, Soma AI exam paper bank" />

        {/* AIO & Search Engine Optimization */}
        <meta name="smart-search-index" content="index" />
        <meta name="ai-knowledge-base" content="official-exams" />
        <meta name="educational-framework" content="KCSE, KPSEA, CBC, KNEC, 8-4-4" />
        <meta name="target-audience" content="Kenyan KCSE Candidates, KPSEA Grade 6, CBC JSS Grade 7-9, Teachers &amp; Parents" />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        {/* OpenGraph / Facebook */}
        <meta property="og:site_name" content="Soma AI" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="KCSE, KPSEA &amp; CBC Exam Paper Bank Kenya | Soma AI" />
        <meta property="og:description" content="Access official KCSE, KPSEA &amp; CBC revision papers with complete marking schemes and timed online practice." />
        <meta property="og:image" content="https://www.somaai.co.ke/hero_option_a.png" />
        <meta property="og:url" content="https://www.somaai.co.ke/exam-papers" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@somasmart" />
        <meta name="twitter:title" content="KCSE, KPSEA &amp; CBC Exam Paper Bank Kenya" />
        <meta name="twitter:description" content="Official KCSE, KPSEA &amp; CBC revision papers with marking schemes for Kenyan learners." />

        <link rel="canonical" href="https://www.somaai.co.ke/exam-papers" />

        {/* Structured Data (JSON-LD) for Search Engines & LLMs */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Soma AI KCSE, KPSEA & CBC Exam Paper Bank",
            "description": "Comprehensive collection of Kenyan KCSE, KPSEA, and CBC past examination papers with marking schemes.",
            "url": "https://www.somaai.co.ke/exam-papers",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "KCSE Mathematics Past Papers & Marking Schemes",
                "url": "https://www.somaai.co.ke/exam-papers?subject=Mathematics"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "KCSE English & Kiswahili Past Papers",
                "url": "https://www.somaai.co.ke/exam-papers?subject=English"
              },
              {
                "@type": "ListItem",
                "position": 3,
                "name": "KPSEA Grade 6 National Assessment Papers",
                "url": "https://www.somaai.co.ke/exam-papers?grade=Grade%206"
              },
              {
                "@type": "ListItem",
                "position": 4,
                "name": "CBC Grade 7, 8 & 9 Junior Secondary Revision Papers",
                "url": "https://www.somaai.co.ke/exam-papers?grade=Grade%208"
              }
            ]
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "Where can I get official KCSE past papers with marking schemes in Kenya?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Soma AI Exam Paper Bank provides official KCSE past papers with complete marking schemes for revision online or download."
                }
              },
              {
                "@type": "Question",
                "name": "Can I practice KPSEA and CBC past papers online?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes. Soma AI allows learners to attempt timed KPSEA and CBC papers online with instant AI marking and step-by-step explanations."
                }
              },
              {
                "@type": "Question",
                "name": "How much do exam papers cost on Soma AI?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Exam papers start from KES 20 per paper or are accessible via Soma AI Pro subscription plans."
                }
              }
            ]
          })}
        </script>
      </Helmet>

      <PaperBankCatalog papers={papers} loading={loading} loadError={loadError}
        restoringPurchases={restoringPurchases} purchaseRestoreError={purchaseRestoreError}
        onRestorePurchases={() => setRestoreAttempt(value => value + 1)}
        initialGrade={searchParams.get('grade') || undefined} initialSubject={searchParams.get('subject') || undefined}
        isUnlocked={isPaperUnlocked} onOpen={paper => { void openPaper(paper); }}
        onRevision={paper => { void openRevisionMode(paper); }}
        onRetry={() => setLoadAttempt(value => value + 1)}
        onClearFilters={() => setSearchParams({})} />
      {checkoutOpen && selected ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Buy exam paper">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div><p className="text-xs font-black uppercase tracking-wider text-indigo-600">Exam paper package</p><h2 className="mt-1 font-black text-slate-950">{selected.title}</h2></div>
              <button onClick={() => { setCheckoutOpen(false); setCheckoutUrl(''); setCheckoutReference(''); setSelected(null); const params = new URLSearchParams(searchParams); ['paper', 'ref', 'status'].forEach(key => params.delete(key)); setSearchParams(params, { replace: true }); }} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close checkout"><X className="h-5 w-5" /></button>
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
