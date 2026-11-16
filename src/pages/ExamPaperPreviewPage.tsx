import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    BookOpen,
    Clock,
    FileCheck2,
    FileText,
    Loader2,
    Lock,
    Sparkles,
    Unlock,
} from 'lucide-react';
import {
    EXAM_PAPER_PRICE_KES,
    ExamPaperBankItem,
    examPaperBankService,
} from '../services/examPaperBankService';
import { canStudyExamPaper } from '../services/examPaperEntitlement';
import { useApp } from '../context/AppContext';

export const ExamPaperPreviewPage: React.FC = () => {
    const { id = '' } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { isPro } = useApp();
    const [paper, setPaper] = React.useState<ExamPaperBankItem | null>(null);
    const [unlocked, setUnlocked] = React.useState(false);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        let active = true;
        setLoading(true);
        setError('');

        Promise.all([
            examPaperBankService.listPapers().catch(() => [] as ExamPaperBankItem[]),
            examPaperBankService.getAccess(id).catch(() => null),
        ])
            .then(([papers, access]) => {
                if (!active) return;
                const matched = papers.find((item) => String(item.id) === String(id)) || null;
                if (matched) {
                    setPaper(matched);
                } else if (access?.title) {
                    setPaper({
                        id,
                        title: access.title,
                        subject: 'General',
                        grade: 'KCSE / CBC',
                        has_marking_scheme: Boolean(access.markingSchemeUrl),
                    });
                } else {
                    setError('We could not find that exam paper. Browse all available papers below.');
                }

                const phoneSession = examPaperBankService.readPhoneSession?.();
                const hasAccess = Boolean(
                    isPro ||
                        (access && canStudyExamPaper(access)) ||
                        phoneSession?.paperIds?.map(String).includes(String(id))
                );
                setUnlocked(hasAccess);
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [id, isPro]);

    const title = paper?.title || 'Past Paper Preview';
    const subject = paper?.subject || 'Kenyan Curriculum';
    const grade = paper?.grade || 'KCSE / CBC';
    const examBody = paper?.exam_body || 'KNEC / Soma AI';
    const canonicalUrl = `https://www.somaai.co.ke/exam-papers/${encodeURIComponent(id)}`;
    const metaDescription = `Practise ${title} (${grade} ${subject}) with ${
        paper?.has_marking_scheme ? 'verified marking scheme and ' : ''
    }step-by-step Akili guidance on Soma AI. Unlock for KES ${EXAM_PAPER_PRICE_KES}.`;

    return (
        <div className="min-h-screen bg-[#fbf9f4] text-slate-900 pb-24">
            <Helmet>
                <html lang="en" />
                <title>{`${title} | ${grade} ${subject} | Soma AI`}</title>
                <meta name="description" content={metaDescription} />
                <meta name="ai-search-index" content="index" />
                <meta name="ai-knowledge-base" content="official" />
                <meta name="robots" content="index, follow, max-image-preview:large" />
                <meta property="og:site_name" content="Soma AI" />
                <meta property="og:type" content="article" />
                <meta property="og:title" content={`${title} | ${grade} ${subject}`} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:url" content={canonicalUrl} />
                <link rel="canonical" href={canonicalUrl} />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'LearningResource',
                        name: title,
                        educationalLevel: grade,
                        about: subject,
                        provider: {
                            '@type': 'EducationalOrganization',
                            name: 'Soma AI',
                            url: 'https://www.somaai.co.ke',
                        },
                        offers: {
                            '@type': 'Offer',
                            price: String(EXAM_PAPER_PRICE_KES),
                            priceCurrency: 'KES',
                        },
                    })}
                </script>
            </Helmet>

            <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12 space-y-6">
                <button
                    type="button"
                    onClick={() => navigate('/exam-papers')}
                    className="inline-flex items-center gap-2 text-xs font-black text-slate-600 hover:text-indigo-700 transition"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Exam Paper Bank
                </button>

                {loading ? (
                    <div className="flex min-h-[260px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
                        <Loader2 className="h-7 w-7 animate-spin text-indigo-600" />
                    </div>
                ) : error || !paper ? (
                    <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-4 shadow-xs">
                        <FileText className="mx-auto h-10 w-10 text-slate-300" />
                        <h1 className="text-xl font-black text-slate-900">Exam paper unavailable</h1>
                        <p className="text-sm text-slate-600">{error || 'This paper could not be loaded.'}</p>
                        <button
                            type="button"
                            onClick={() => navigate('/exam-papers')}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white hover:bg-indigo-700 transition"
                        >
                            Browse All Past Papers
                        </button>
                    </div>
                ) : (
                    <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-9 shadow-sm space-y-6">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                                {grade}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                                {subject}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                                {examBody}
                            </span>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-950">
                                {title}
                            </h1>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {metaDescription}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 flex items-center gap-3">
                                <Clock className="h-5 w-5 text-indigo-600 shrink-0" />
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-slate-400">Duration</p>
                                    <p className="text-sm font-black text-slate-900">
                                        {paper.duration_minutes ? `${paper.duration_minutes} mins` : 'Timed Exam'}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 flex items-center gap-3">
                                <FileCheck2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-slate-400">Marking Scheme</p>
                                    <p className="text-sm font-black text-slate-900">
                                        {paper.has_marking_scheme ? 'Included' : 'Check in Reader'}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 flex items-center gap-3">
                                {unlocked ? (
                                    <Unlock className="h-5 w-5 text-emerald-600 shrink-0" />
                                ) : (
                                    <Lock className="h-5 w-5 text-amber-600 shrink-0" />
                                )}
                                <div>
                                    <p className="text-[11px] font-bold uppercase text-slate-400">Access</p>
                                    <p className="text-sm font-black text-slate-900">
                                        {unlocked ? 'Unlocked' : `KES ${EXAM_PAPER_PRICE_KES} + 24h Pass`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 pt-2">
                            {unlocked ? (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/exam-papers/${encodeURIComponent(String(paper.id))}/read`)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-700 transition"
                                >
                                    <FileText className="h-4 w-4" />
                                    Open Full Paper &amp; Scheme
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/exam-papers?paper=${encodeURIComponent(String(paper.id))}`)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-indigo-700 transition"
                                >
                                    <Sparkles className="h-4 w-4" />
                                    Unlock Paper &amp; 24h AI Pass · KES {EXAM_PAPER_PRICE_KES}
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => navigate(`/revision?paper=${encodeURIComponent(String(paper.id))}`)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                            >
                                <BookOpen className="h-4 w-4 text-violet-600" />
                                Practise in Candidates Hub
                            </button>
                        </div>
                    </article>
                )}
            </main>
        </div>
    );
};
