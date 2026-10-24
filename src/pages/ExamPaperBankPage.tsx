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
  buildExamPaperBundles,
  EXAM_BUNDLE_PRICE_KES,
  EXAM_PAPER_PRICE_KES,
  ExamPaperBankItem,
  ExamPaperBundle,
  examPaperBankService,
  findBundleForPaper,
  readPhoneRestoreSession,
  recordLocalBundlePurchaseSession,
  recordLocalPaperPurchaseSession,
} from '../services/examPaperBankService';
import { PaperBankCatalog } from '../components/PaperBankCatalog';
import { paperDestination, rememberPaperMode } from '../services/paperCheckoutIntent';
import { canStudyExamPaper } from '../services/examPaperEntitlement';
import { PurchaseThankYou } from '../components/PurchaseThankYou';


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
  const [selectedBundle, setSelectedBundle] = React.useState<ExamPaperBundle | null>(null);
  const [purchaseOption, setPurchaseOption] = React.useState<'SINGLE' | 'BUNDLE'>('SINGLE');
  const [checkoutOpen, setCheckoutOpen] = React.useState(false);
  const [checkoutUrl, setCheckoutUrl] = React.useState('');
  const [checkoutReference, setCheckoutReference] = React.useState('');
  const [buying, setBuying] = React.useState(false);
  const [buyer, setBuyer] = React.useState(() => {
    const savedSession = readPhoneRestoreSession();
    return {
      name: savedSession?.buyerName || '',
      phone: savedSession?.normalizedPhone || '',
      email: '',
    };
  });
  const [confirmedPaper, setConfirmedPaper] = React.useState<{
    id: string;
    title: string;
    bundleCode?: string;
    bundlePapers?: ExamPaperBankItem[];
  } | null>(null);
  const isRenewingPass = searchParams.get('renew') === '1';
  const allBundles = React.useMemo(() => buildExamPaperBundles(papers), [papers]);

  const [unlockedPaperIds, setUnlockedPaperIds] = React.useState<Set<string>>(new Set());
  const [purchasedPaperIds, setPurchasedPaperIds] = React.useState<Set<string>>(new Set());
  const [restoringPurchases, setRestoringPurchases] = React.useState(true);
  const [purchaseRestoreError, setPurchaseRestoreError] = React.useState('');
  const [restoreAttempt, setRestoreAttempt] = React.useState(0);
  const [phoneRestoreMessage, setPhoneRestoreMessage] = React.useState('');
  const [phoneRestoring, setPhoneRestoring] = React.useState(false);
  const verifyingPaperIds = React.useRef(new Set<string>());

  React.useEffect(() => {
    const prefilledPhone = searchParams.get('phone');
    if (prefilledPhone) {
      setBuyer((prev) => ({ ...prev, phone: prefilledPhone }));
    }
  }, [searchParams]);

  const handleRestoreByPhone = React.useCallback(async (rawPhone: string) => {
    setPhoneRestoring(true);
    setPhoneRestoreMessage('');
    setPurchaseRestoreError('');
    try {
      const session = await examPaperBankService.restoreByPhone(rawPhone);
      if (session.found && session.paperIds.length > 0) {
        setPurchasedPaperIds((prev) => new Set([...prev, ...session.paperIds.map(String)]));
        setUnlockedPaperIds((prev) => new Set([...prev, ...session.paperIds.map(String)]));
        setBuyer((prev) => ({
          ...prev,
          name: session.buyerName || prev.name,
          phone: session.normalizedPhone || prev.phone,
        }));
        setPhoneRestoreMessage(
          session.passActive
            ? `Welcome back${session.buyerName ? `, ${session.buyerName}` : ''}! Restored ${session.paperIds.length} ${session.paperIds.length === 1 ? 'paper' : 'papers'} and your 24-hour AI Revision Pass (${session.hoursRemaining}h left).`
            : `Welcome back! Restored ${session.paperIds.length} ${session.paperIds.length === 1 ? 'paper' : 'papers'}. Your 24h AI Revision Pass expired — renew for KES 20 or buy another paper for free 24h revision access.`
        );
      } else {
        setPurchaseRestoreError(
          'No paid papers were found for that phone number. Try the exact M-Pesa number used at checkout (+254..., 07..., or last 9 digits).'
        );
      }
    } catch (err: any) {
      setPurchaseRestoreError(
        err instanceof Error ? err.message : 'Could not verify that phone number right now. Please try again.'
      );
    } finally {
      setPhoneRestoring(false);
    }
  }, []);

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

  const markBundleUnlocked = React.useCallback((bundle: ExamPaperBundle) => {
    setUnlockedPaperIds((prev) => new Set([...prev, ...bundle.paperIds.map(String)]));
    setPurchasedPaperIds((prev) => new Set([...prev, ...bundle.paperIds.map(String)]));
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
        setPapers(items.filter((paper) => paper.has_exam_paper !== false));
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
    let active = true;
    let verificationKey: string | null = null;
    const paperId = searchParams.get('paper');
    if (!paperId) return () => { active = false; };
    // Let the verification flow finish and retain its thank-you until Continue.
    if (searchParams.get('status') === 'verifying' || confirmedPaper) return () => { active = false; };
    const paper = papers.find((item) => String(item.id) === paperId) || (isRenewingPass && papers[0] ? papers[0] : undefined);
    if (paper) {
      setSelected(paper);
      if (isRenewingPass) {
        rememberPaperMode(paper.id, 'revision');
        setCheckoutOpen(true);
        return () => { active = false; };
      }
      if (isPaperUnlocked(paper.id)) {
        // Paper already paid — jump straight to the reader.
        navigate(paperDestination(paper.id), { replace: true });
        return () => { active = false; };
      }
      if (loading || restoringPurchases) return () => { active = false; };
      if (purchaseRestoreError) {
        setError('We could not restore your purchases. Retry restoration before paying for this paper.');
        return () => { active = false; };
      }
      const key = String(paper.id);
      if (verifyingPaperIds.current.has(key)) return () => { active = false; };
      verificationKey = key;
      verifyingPaperIds.current.add(key);
      void examPaperBankService.getAccess(paper.id).then((access) => {
        verifyingPaperIds.current.delete(key);
        if (!active) return;
        if (canStudyExamPaper(access)) {
          markPaperUnlocked(paper.id);
          navigate(paperDestination(paper.id), { replace: true });
          return;
        }
        setCheckoutOpen(true);
      }).catch(() => {
        verifyingPaperIds.current.delete(key);
        if (!active) return;
        setError('We could not verify previous access. Select the paper again to retry; no payment has been started.');
      });
    } else if (!loading && !loadError) {
      setError('That paper is not in the published catalogue. Browse the bank to choose an available paper.');
    }
    return () => {
      active = false;
      if (verificationKey) verifyingPaperIds.current.delete(verificationKey);
    };
  }, [isPaperUnlocked, loadError, loading, markPaperUnlocked, navigate, papers, purchaseRestoreError, restoringPurchases, searchParams, confirmedPaper]);


  React.useEffect(() => {
    if (searchParams.get('status') !== 'verifying') return;
    const examId = searchParams.get('paper');
    const reference = searchParams.get('ref');
    const bundleCodeParam = searchParams.get('bundle');
    if (!examId || !reference || confirmedPaper) return;

    let cancelled = false;
    let attempts = 0;
    const check = async () => {
      attempts += 1;
      try {
        const access = await examPaperBankService.getAccess(examId, reference);
        if (!cancelled && access.paid) {
          const matchedBundle = bundleCodeParam
            ? allBundles.find((b) => b.bundleCode === bundleCodeParam) || findBundleForPaper(examId, allBundles)
            : undefined;
          if (matchedBundle) {
            recordLocalBundlePurchaseSession(matchedBundle, buyer);
            markBundleUnlocked(matchedBundle);
            setCheckoutOpen(false);
            setConfirmedPaper({
              id: examId,
              title: `${matchedBundle.bundleCode} (${matchedBundle.papers.length} Subject Papers)`,
              bundleCode: matchedBundle.bundleCode,
              bundlePapers: matchedBundle.papers,
            });
          } else {
            recordLocalPaperPurchaseSession(examId, buyer);
            markPaperUnlocked(examId);
            setCheckoutOpen(false);
            setConfirmedPaper({ id: examId, title: access.title || 'Your exam paper' });
          }
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
  }, [allBundles, buyer, markBundleUnlocked, markPaperUnlocked, searchParams, confirmedPaper]);

  React.useEffect(() => {
    if (!checkoutReference || !selected || confirmedPaper) return;
    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const access = await examPaperBankService.getAccess(selected.id, checkoutReference);
        if (!cancelled && access.paid) {
          window.clearInterval(interval);
          setCheckoutOpen(false);
          if (purchaseOption === 'BUNDLE' && selectedBundle) {
            recordLocalBundlePurchaseSession(selectedBundle, buyer);
            markBundleUnlocked(selectedBundle);
            setConfirmedPaper({
              id: String(selected.id),
              title: `${selectedBundle.bundleCode} (${selectedBundle.papers.length} Subject Papers)`,
              bundleCode: selectedBundle.bundleCode,
              bundlePapers: selectedBundle.papers,
            });
          } else {
            recordLocalPaperPurchaseSession(selected.id, buyer);
            markPaperUnlocked(selected.id);
            setConfirmedPaper({ id: String(selected.id), title: access.title || selected.title });
          }
        }
      } catch {
        // PesaPal confirmation is asynchronous; keep polling while checkout is open.
      }
    }, 3000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [buyer, checkoutReference, markBundleUnlocked, markPaperUnlocked, purchaseOption, selected, selectedBundle, confirmedPaper]);


  const beginPurchase = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selected) return;
    setBuying(true);
    setError('');
    try {
      const isBuyingBundle = purchaseOption === 'BUNDLE' && selectedBundle && selectedBundle.papers.length >= 2;
      const result = await examPaperBankService.initiatePurchase(selected.id, buyer, {
        renewPass: isRenewingPass,
        ...(isBuyingBundle
          ? {
              bundleCode: selectedBundle.bundleCode,
              bundlePaperIds: selectedBundle.paperIds,
              amountKes: selectedBundle.priceKes,
            }
          : {}),
      });
      if (result.already_paid && !isRenewingPass && !isBuyingBundle) {
        recordLocalPaperPurchaseSession(selected.id, buyer);
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

  const openBundleCheckout = (bundle: ExamPaperBundle) => {
    const primaryPaper = bundle.papers[0];
    if (!primaryPaper) return;
    setError('');
    rememberPaperMode(primaryPaper.id, 'read');
    setSelected(primaryPaper);
    setSelectedBundle(bundle);
    setPurchaseOption('BUNDLE');
    setCheckoutOpen(true);
  };

  const openPaper = async (paper: ExamPaperBankItem) => {
    setError('');
    rememberPaperMode(paper.id, 'read');
    setSelected(paper);
    setSelectedBundle(findBundleForPaper(paper.id, allBundles) || null);
    setPurchaseOption('SINGLE');
    if (isPaperUnlocked(paper.id)) {
      navigate(`/exam-papers/${encodeURIComponent(String(paper.id))}/read`);
      return;
    }
    try {
      const access = await examPaperBankService.getAccess(paper.id);
      if (canStudyExamPaper(access)) {
        markPaperUnlocked(paper.id);
        navigate(`/exam-papers/${encodeURIComponent(String(paper.id))}/read`);
        return;
      }
    } catch {
      setError('We could not verify previous access. Select the paper again to retry; no payment has been started.');
      return;
    }
    setSearchParams({ paper: String(paper.id) });
    setCheckoutOpen(true);
  };

  const openRevisionMode = async (paper: ExamPaperBankItem) => {
    setError('');
    rememberPaperMode(paper.id, 'revision');
    setSelected(paper);
    setSelectedBundle(findBundleForPaper(paper.id, allBundles) || null);
    setPurchaseOption('SINGLE');
    if (isPaperUnlocked(paper.id)) {
      navigate(`/revision?paper=${encodeURIComponent(String(paper.id))}`);
      return;
    }
    try {
      const access = await examPaperBankService.getAccess(paper.id);
      if (canStudyExamPaper(access)) {
        markPaperUnlocked(paper.id);
        navigate(`/revision?paper=${encodeURIComponent(String(paper.id))}`);
        return;
      }
    } catch {
      setError('We could not verify previous access. Select the paper again to retry; no payment has been started.');
      return;
    }
    setSearchParams({ paper: String(paper.id) });
    setCheckoutOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-950">
      <Helmet>
        <html lang="en" />
        <title>KCSE, KPSEA &amp; CBC Exam Paper Bank Kenya | Soma AI Past Papers</title>
        <meta name="description" content="Browse KCSE, KPSEA, and CBC exam papers published on Soma AI. Check each paper's stated source and marking-scheme availability, then read or practise online." />
        <meta name="keywords" content="KCSE past papers, KPSEA past papers, CBC exam papers Kenya, KNEC revision papers, KCSE marking schemes, Form 4 revision papers, Grade 6 7 8 9 exam papers, Kenyan mock papers, Soma AI exam paper bank" />

        {/* AIO & Search Engine Optimization */}
        <meta name="smart-search-index" content="index" />
        <meta name="ai-knowledge-base" content="Kenyan exam practice papers" />
        <meta name="educational-framework" content="KCSE, KPSEA, CBC, KNEC, 8-4-4" />
        <meta name="target-audience" content="Kenyan KCSE Candidates, KPSEA Grade 6, CBC JSS Grade 7-9, Teachers &amp; Parents" />
        <meta name="robots" content="index, follow, max-image-preview:large" />

        {/* OpenGraph / Facebook */}
        <meta property="og:site_name" content="Soma AI" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="KCSE, KPSEA &amp; CBC Exam Paper Bank Kenya | Soma AI" />
        <meta property="og:description" content="Browse KCSE, KPSEA, and CBC exam papers published on Soma AI, with source and marking-scheme availability shown per paper." />
        <meta property="og:image" content="https://www.somaai.co.ke/hero_option_a.png" />
        <meta property="og:url" content="https://www.somaai.co.ke/exam-papers" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@somasmart" />
        <meta name="twitter:title" content="KCSE, KPSEA &amp; CBC Exam Paper Bank Kenya" />
        <meta name="twitter:description" content="Browse KCSE, KPSEA, and CBC papers published on Soma AI, with source and scheme availability shown for each listing." />

        <link rel="canonical" href="https://www.somaai.co.ke/exam-papers" />

        {/* Structured Data (JSON-LD) for Search Engines & LLMs */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Soma AI KCSE, KPSEA & CBC Exam Paper Bank",
            "description": "KCSE, KPSEA, and CBC exam papers published on Soma AI, with each listing's stated source and marking-scheme availability.",
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
                "name": "Where can I find KCSE past papers with marking schemes in Kenya?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Soma AI's Exam Paper Bank lists KCSE papers and shows the stated source and marking-scheme availability for each listing."
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

      {confirmedPaper && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Paper purchase confirmed">
        <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-3xl bg-white p-6 shadow-xl">
          <PurchaseThankYou receipt={{ status: 'SUCCESS', type: 'PAST_PAPER' }} title={confirmedPaper.title} guest
            continueLabel={paperDestination(confirmedPaper.id).startsWith('/revision') ? 'Continue revision' : 'Open your paper'}
            onContinue={() => navigate(paperDestination(confirmedPaper.id), { replace: true })} />
          {confirmedPaper.bundleCode && confirmedPaper.bundlePapers && (
            <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-indigo-800">
                📦 Bundle Set {confirmedPaper.bundleCode} Unlocked ({confirmedPaper.bundlePapers.length} Subject Papers)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {confirmedPaper.bundlePapers.map((bp) => (
                  <button
                    key={bp.id}
                    type="button"
                    onClick={() => navigate(`/exam-papers/${encodeURIComponent(String(bp.id))}/read`, { replace: true })}
                    className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-900 hover:bg-indigo-100"
                  >
                    {bp.subject}: {bp.title} →
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-800">
              ✨ 24-Hour Unlimited AI Revision &amp; Homework Pass Active
            </p>
            <p className="mt-1 text-xs font-medium text-emerald-700">
              Your M-Pesa phone number now unlocks 24 hours of unlimited AI revision, homework help, and smart marking across Soma AI:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate(`/exam-papers/${confirmedPaper.id}/read`, { replace: true })}
                className="rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-900 hover:bg-emerald-100"
              >
                Read Paper &amp; Scheme →
              </button>
              <button
                type="button"
                onClick={() => navigate(`/revision?paper=${encodeURIComponent(confirmedPaper.id)}`, { replace: true })}
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-800 hover:bg-indigo-100"
              >
                Timed AI Revision →
              </button>
              <button
                type="button"
                onClick={() => navigate('/learner', { replace: true })}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100"
              >
                Ask Akili Homework →
              </button>
              <button
                type="button"
                onClick={() => navigate('/free-pool', { replace: true })}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 hover:bg-slate-100"
              >
                Free Revision Pool →
              </button>
            </div>
          </div>
        </div>
      </div>}

      <PaperBankCatalog papers={papers} loading={loading} loadError={loadError}
        restoringPurchases={restoringPurchases} purchaseRestoreError={purchaseRestoreError}
        onRestorePurchases={() => setRestoreAttempt(value => value + 1)}
        onRestoreByPhone={handleRestoreByPhone}
        phoneRestoring={phoneRestoring}
        phoneRestoreMessage={phoneRestoreMessage}
        initialGrade={searchParams.get('grade') || undefined} initialSubject={searchParams.get('subject') || undefined}
        isUnlocked={isPaperUnlocked} onOpen={paper => { void openPaper(paper); }}
        onRevision={paper => { void openRevisionMode(paper); }}
        onBuyBundle={openBundleCheckout}
        onRetry={() => setLoadAttempt(value => value + 1)}
        onClearFilters={() => setSearchParams({})} />
      {checkoutOpen && selected ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-label="Buy exam paper">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-indigo-600">
                  {isRenewingPass
                    ? '24-Hour AI Revision Pass Renewal'
                    : purchaseOption === 'BUNDLE' && selectedBundle
                      ? `Exam Set Bundle · ${selectedBundle.bundleCode}`
                      : 'Exam paper package'}
                </p>
                <h2 className="mt-1 font-black text-slate-950">
                  {isRenewingPass
                    ? `Continue 24h Revision · ${selected.title}`
                    : purchaseOption === 'BUNDLE' && selectedBundle
                      ? `${selectedBundle.bundleCode} · ${selectedBundle.papers.length} Subject Papers (1 per subject)`
                      : selected.title}
                </h2>
              </div>
              <button onClick={() => { setCheckoutOpen(false); setCheckoutUrl(''); setCheckoutReference(''); setSelected(null); setSelectedBundle(null); setPurchaseOption('SINGLE'); const params = new URLSearchParams(searchParams); ['paper', 'ref', 'status', 'renew', 'phone', 'bundle'].forEach(key => params.delete(key)); setSearchParams(params, { replace: true }); }} className="rounded-full p-2 text-slate-500 hover:bg-slate-100" aria-label="Close checkout"><X className="h-5 w-5" /></button>
            </div>
            {checkoutUrl ? (
              <div className="p-4"><iframe title="M-Pesa checkout" src={checkoutUrl} className="h-[620px] w-full rounded-2xl border border-slate-200" allow="payment" /></div>
            ) : (
              <form onSubmit={beginPurchase} className="grid gap-6 p-6 md:grid-cols-[1fr_280px]">
                <div>
                  {(() => {
                    const activeBundle = selectedBundle || findBundleForPaper(selected.id, allBundles);
                    if (!activeBundle || activeBundle.papers.length < 2) return null;
                    return (
                      <div className="mb-4 grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Choose single paper or exam set bundle">
                        <button
                          type="button"
                          onClick={() => setPurchaseOption('SINGLE')}
                          className={`rounded-2xl border-2 p-3 text-left transition-all ${
                            purchaseOption === 'SINGLE'
                              ? 'border-indigo-600 bg-indigo-50/70'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">1 Paper Only</span>
                            <span className="rounded-md bg-indigo-100 px-2 py-0.5 text-xs font-black text-indigo-800">
                              KES {EXAM_PAPER_PRICE_KES}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] font-medium text-slate-600 truncate">
                            {selected.subject}: {selected.title}
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBundle(activeBundle);
                            setPurchaseOption('BUNDLE');
                          }}
                          className={`rounded-2xl border-2 p-3 text-left transition-all ${
                            purchaseOption === 'BUNDLE'
                              ? 'border-emerald-600 bg-emerald-50/70'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900">{activeBundle.bundleCode} Set</span>
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800">
                              KES {activeBundle.priceKes}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] font-medium text-slate-600">
                            {activeBundle.papers.length} subjects (1 paper each): {activeBundle.subjects.join(', ')}
                          </p>
                        </button>
                      </div>
                    );
                  })()}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="flex items-center gap-2 text-sm font-black"><CheckCircle2 className="h-5 w-5 text-emerald-600" /> No account needed</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {purchaseOption === 'BUNDLE' && selectedBundle
                        ? `Enter your M-Pesa details once to unlock all ${selectedBundle.papers.length} subject papers inside ${selectedBundle.bundleCode} (1 paper per subject: ${selectedBundle.subjects.join(', ')}) + marking schemes + 24-hour free AI Revision Pass.`
                        : 'Enter your M-Pesa details below. Payments are processed securely via Pesapal (Authorized Payment Agent for M-Pesa & Airtel Money). Includes the full past paper, marking scheme, and 24-hour free AI Revision Pass.'}
                    </p>
                  </div>
                  <div className="mt-5 space-y-4">
                    <label className="block text-sm font-bold text-slate-700">Your name<input required value={buyer.name} onChange={(event) => setBuyer({ ...buyer, name: event.target.value })} className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-indigo-400" /></label>
                    <label className="block text-sm font-bold text-slate-700">M-Pesa phone<input required inputMode="tel" placeholder="07XX XXX XXX" value={buyer.phone} onChange={(event) => setBuyer({ ...buyer, phone: event.target.value })} className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-indigo-400" /></label>
                    <label className="block text-sm font-bold text-slate-700">Email <span className="font-medium text-slate-400">(optional receipt)</span><input type="email" value={buyer.email} onChange={(event) => setBuyer({ ...buyer, email: event.target.value })} className="mt-1 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-indigo-400" /></label>
                  </div>
                </div>
                <aside className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
                  <Smartphone className="h-8 w-8 text-indigo-600" />
                  <p className="mt-4 text-sm font-bold text-slate-600">Total</p>
                  <p className="text-3xl font-black">
                    KES {purchaseOption === 'BUNDLE' && selectedBundle ? selectedBundle.priceKes : EXAM_PAPER_PRICE_KES}
                  </p>
                  <div className="my-5 h-px bg-indigo-100" />
                  <p className="text-sm font-semibold leading-6 text-slate-600">
                    {purchaseOption === 'BUNDLE' && selectedBundle
                      ? `Unlocks the ${selectedBundle.papers.length} papers in ${selectedBundle.bundleCode} + marking schemes + 24-hour AI Revision Pass.`
                      : 'Includes the exam paper, marking scheme, and 24-hour free AI Revision Pass. Access is remembered on this device.'}
                  </p>
                  <button disabled={buying} className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white disabled:opacity-60">{buying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} Pay with M-Pesa (Pesapal)</button>
                  <p className="mt-3 text-center text-[11px] font-bold text-slate-500">🔒 Secured by Pesapal · Instant STK Push</p>
                </aside>
              </form>
            )}
          </div>
        </div>
      ) : null}
      {error ? <div className="fixed bottom-4 left-1/2 z-[120] w-[min(92vw,620px)] -translate-x-1/2 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-rose-700 shadow-xl" role="alert">{error}</div> : null}
    </div>
  );
};
