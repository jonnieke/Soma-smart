import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, FileText, GraduationCap, Sparkles } from 'lucide-react';

export interface CurriculumSeoGuideConfig {
    path: string;
    title: string;
    metaDescription: string;
    keywords: string;
    eyebrow: string;
    headline: string;
    subheadline: string;
    highlights: string[];
    primaryCtaLabel: string;
    primaryCtaTo: string;
    secondaryCtaLabel: string;
    secondaryCtaTo: string;
    faqQuestion: string;
    faqAnswer: string;
}

export const CURRICULUM_SEO_GUIDES: Readonly<Record<string, CurriculumSeoGuideConfig>> = {
    '/ai-tutor-kenya': {
        path: '/ai-tutor-kenya',
        title: 'AI Tutor Kenya | Ask Akili CBC, KPSEA & KCSE Homework Help | Soma AI',
        metaDescription: 'Get instant step-by-step CBC, KPSEA, and KCSE homework explanations with Ask Akili. Snap a photo or type any question with Kenyan syllabus marking points.',
        keywords: 'AI tutor Kenya, Ask Akili, Kenyan homework help, KCSE AI tutor, CBC study app',
        eyebrow: 'Kenyan AI Study Companion',
        headline: 'Step-by-step CBC, KPSEA & KCSE homework help in seconds',
        subheadline: 'Type a question, snap a photo of your exercise book, or upload a PDF. Akili explains the method clearly with KNEC-style marking points and saves notes offline.',
        highlights: [
            'Supports handwritten math, science diagrams, and PDF worksheets',
            'Built-in math symbol keyboard for mobile equations',
            'Auto-saves answers to your offline notebook for revision',
            'Unlock full 24h access from KES 20 via M-Pesa',
        ],
        primaryCtaLabel: 'Ask Akili Free',
        primaryCtaTo: '/',
        secondaryCtaLabel: 'Open My Classroom',
        secondaryCtaTo: '/learner',
        faqQuestion: 'How does Soma AI help Kenyan students with homework?',
        faqAnswer: 'Students can type a question, snap a photo, or upload a worksheet PDF to receive step-by-step explanations aligned with CBC, KPSEA, and KCSE marking schemes.',
    },
    '/kcse-past-papers': {
        path: '/kcse-past-papers',
        title: 'KCSE Past Papers & Marking Schemes Kenya | Soma AI',
        metaDescription: 'Practise verified KCSE past papers and marking schemes across Mathematics, Biology, Chemistry, Physics, English, and Kiswahili. Unlock papers or a 24h pass for KES 20.',
        keywords: 'KCSE past papers, KCSE marking schemes, Form 4 revision Kenya, KNEC KCSE papers',
        eyebrow: 'Form 4 · KNEC Preparation',
        headline: 'KCSE Past Papers with Step-by-Step Marking Schemes',
        subheadline: 'Revise Paper 1, Paper 2, and Paper 3 questions with method-mark guidance, timed practice drills, and instant phone-number restoration.',
        highlights: [
            'Official KNEC past papers and Soma AI Original mocks',
            'Includes marking schemes showing where M and A marks are awarded',
            'Restore paid papers anytime using your M-Pesa phone number',
            'KES 20 per paper or 24-hour AI Revision Pass',
        ],
        primaryCtaLabel: 'Browse KCSE Papers',
        primaryCtaTo: '/exam-papers',
        secondaryCtaLabel: 'Open Candidates Hub',
        secondaryCtaTo: '/revision',
        faqQuestion: 'How much do KCSE past papers cost on Soma AI?',
        faqAnswer: 'Individual past papers and 24-hour AI Revision Passes start at KES 20 via M-Pesa, and you can restore unlocked papers using your phone number.',
    },
    '/kpsea-past-papers': {
        path: '/kpsea-past-papers',
        title: 'KPSEA Past Papers & Grade 6 Revision Kenya | Soma AI',
        metaDescription: 'Prepare Grade 6 candidates for KPSEA with CBC-aligned past papers, Science & Math drills, Kiswahili Insha, and step-by-step Akili explanations.',
        keywords: 'KPSEA past papers, Grade 6 CBC revision, KPSEA practice questions, KNEC KPSEA',
        eyebrow: 'Grade 6 · KPSEA & CBC',
        headline: 'Grade 6 KPSEA Past Papers & Interactive Practice Drills',
        subheadline: 'Build exam speed and confidence across Mathematics, English, Kiswahili, Integrated Science, and Social Studies with child-friendly guidance.',
        highlights: [
            'KPSEA-format questions aligned with KNEC Grade 6 strands',
            'Instant feedback and simple explanations for every wrong answer',
            'Audio read-aloud support for younger learners',
            'Shareable progress for parents and teachers',
        ],
        primaryCtaLabel: 'Practise KPSEA Papers',
        primaryCtaTo: '/revision?pathway=KPSEA',
        secondaryCtaLabel: 'Browse Paper Bank',
        secondaryCtaTo: '/exam-papers',
        faqQuestion: 'Does Soma AI cover Grade 6 KPSEA subjects?',
        faqAnswer: 'Yes. Soma AI supports Grade 6 KPSEA preparation across Mathematics, English, Kiswahili, Science, and Social Studies with past papers and guided quizzes.',
    },
    '/cbc-notes-kenya': {
        path: '/cbc-notes-kenya',
        title: 'CBC Notes Kenya (Primary & Junior Secondary) | Soma AI',
        metaDescription: 'Access curriculum-aligned CBC study notes for Primary and Junior Secondary (Grade 7, 8, 9) including Mathematics, Integrated Science, Agriculture, and Kiswahili.',
        keywords: 'CBC notes Kenya, Junior Secondary notes, Grade 7 Grade 8 Grade 9 CBC notes, Soma AI library',
        eyebrow: 'CBC Primary & Junior Secondary',
        headline: 'Clear CBC & JSS Study Notes Ready for Offline Revision',
        subheadline: 'Study structured notes across Mathematics, English, Kiswahili, Integrated Science, Social Studies, and Agriculture, with instant practice checks.',
        highlights: [
            'Covers Primary and Junior Secondary (Grades 7–9)',
            'Point-form revision summaries with worked examples',
            'Save notes offline to revise without data bundles',
            'Test yourself immediately with quick understanding checks',
        ],
        primaryCtaLabel: 'Open Study Library',
        primaryCtaTo: '/learner',
        secondaryCtaLabel: 'Visit Free Revision Pool',
        secondaryCtaTo: '/free-pool',
        faqQuestion: 'Are Soma AI CBC notes aligned with the Kenyan curriculum?',
        faqAnswer: 'Yes. Notes and practice checks are structured around Kenyan CBC strands and sub-strands for Primary and Junior Secondary learners.',
    },
    '/lesson-plan-generator-kenya': {
        path: '/lesson-plan-generator-kenya',
        title: 'CBC Lesson Plan Generator for Kenyan Teachers | Soma AI',
        metaDescription: 'Generate CBC-aligned lesson plans, class notes, homework quizzes, and marking feedback in minutes with Soma AI Teacher Studio.',
        keywords: 'CBC lesson plan generator Kenya, Kenyan teacher AI tool, KICD lesson plan, Soma AI teacher',
        eyebrow: 'Teacher Studio · Kenya',
        headline: 'Generate CBC Lesson Plans, Class Notes & Homework Fast',
        subheadline: 'Save hours of weekly prep with structured Kenyan lesson plans, printable exams, and instant WhatsApp class invite codes.',
        highlights: [
            'Aligned with Kenyan CBC strands, learning outcomes, and core competencies',
            'Create and share class homework via 8-character join codes',
            'Print-ready PDF and Word (.docx) exam paper exports',
            'Auto-assisted marking and class performance insights',
        ],
        primaryCtaLabel: 'Open Teacher Studio',
        primaryCtaTo: '/teacher',
        secondaryCtaLabel: 'View School Calendar',
        secondaryCtaTo: '/guide',
        faqQuestion: 'Can Kenyan teachers create CBC lesson plans and homework on Soma AI?',
        faqAnswer: 'Yes. Teachers can generate CBC lesson plans, class notes, printable exams, and digital homework assignments shared via class links or codes.',
    },
    '/schemes-of-work-generator-kenya': {
        path: '/schemes-of-work-generator-kenya',
        title: 'Schemes of Work & Syllabus Tracker Kenya | Soma AI',
        metaDescription: 'Plan termly Kenyan CBC & 8-4-4 schemes of work, track syllabus coverage, and align class assessments with KNEC term dates.',
        keywords: 'schemes of work Kenya, CBC schemes of work generator, syllabus tracker Kenya, Kenyan teacher tools',
        eyebrow: 'Term Planning · Syllabus Tracking',
        headline: 'Termly Schemes of Work & Syllabus Coverage for Kenyan Schools',
        subheadline: 'Organise weekly strands, lesson objectives, learning resources, and assessments aligned to the Kenyan school calendar.',
        highlights: [
            'Structured by term, week, strand, and sub-strand',
            'Syncs directly with lesson plans and classroom homework',
            'Aligned with Kenyan Ministry of Education term dates',
            'Export-ready formats for school department reviews',
        ],
        primaryCtaLabel: 'Open Schemes & Syllabus',
        primaryCtaTo: '/teacher/syllabus',
        secondaryCtaLabel: 'Check Term Calendar',
        secondaryCtaTo: '/guide',
        faqQuestion: 'Does Soma AI support Kenyan termly schemes of work?',
        faqAnswer: 'Yes. Teachers can structure termly schemes of work, track syllabus progress, and link weekly topics directly to class assignments and revision papers.',
    },
};

interface CurriculumSeoPageProps {
    guideKey: string;
}

export const CurriculumSeoPage: React.FC<CurriculumSeoPageProps> = ({ guideKey }) => {
    const navigate = useNavigate();
    const guide = CURRICULUM_SEO_GUIDES[guideKey] || CURRICULUM_SEO_GUIDES['/ai-tutor-kenya'];
    const canonicalUrl = `https://www.somaai.co.ke${guide.path}`;

    return (
        <div className="min-h-screen bg-[#fbf9f4] text-slate-900">
            <Helmet>
                <html lang="en" />
                <title>{guide.title}</title>
                <meta name="description" content={guide.metaDescription} />
                <meta name="keywords" content={guide.keywords} />
                <meta name="ai-search-index" content="index" />
                <meta name="ai-knowledge-base" content="official" />
                <meta name="educational-framework" content="CBC, KCSE, KPSEA, KJSEA" />
                <meta name="robots" content="index, follow, max-image-preview:large" />
                <meta property="og:site_name" content="Soma AI" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={guide.title} />
                <meta property="og:description" content={guide.metaDescription} />
                <meta property="og:url" content={canonicalUrl} />
                <link rel="canonical" href={canonicalUrl} />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'FAQPage',
                        mainEntity: [
                            {
                                '@type': 'Question',
                                name: guide.faqQuestion,
                                acceptedAnswer: {
                                    '@type': 'Answer',
                                    text: guide.faqAnswer,
                                },
                            },
                        ],
                    })}
                </script>
            </Helmet>

            <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 space-y-8 pb-24">
                <section className="rounded-3xl border border-indigo-100 bg-white p-6 sm:p-10 shadow-sm space-y-5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">
                        <Sparkles className="h-3.5 w-3.5" />
                        {guide.eyebrow}
                    </span>

                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
                        {guide.headline}
                    </h1>

                    <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                        {guide.subheadline}
                    </p>

                    <div className="flex flex-wrap gap-3 pt-2">
                        <button
                            type="button"
                            onClick={() => navigate(guide.primaryCtaTo)}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-indigo-700 transition"
                        >
                            {guide.primaryCtaLabel}
                            <ArrowRight className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(guide.secondaryCtaTo)}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                        >
                            {guide.secondaryCtaLabel}
                        </button>
                    </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                    <h2 className="text-lg font-black text-slate-900">What is included</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {guide.highlights.map((item) => (
                            <li key={item} className="flex items-start gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 text-sm font-medium text-slate-700">
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-3">
                    <h2 className="text-lg font-black text-slate-900">{guide.faqQuestion}</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">{guide.faqAnswer}</p>
                    <div className="flex flex-wrap gap-3 pt-2 text-xs font-bold text-indigo-700">
                        <button type="button" onClick={() => navigate('/exam-papers')} className="inline-flex items-center gap-1 hover:underline">
                            <FileText className="h-3.5 w-3.5" /> Exam Paper Bank
                        </button>
                        <button type="button" onClick={() => navigate('/revision')} className="inline-flex items-center gap-1 hover:underline">
                            <BookOpen className="h-3.5 w-3.5" /> Candidates Hub
                        </button>
                        <button type="button" onClick={() => navigate('/learner')} className="inline-flex items-center gap-1 hover:underline">
                            <GraduationCap className="h-3.5 w-3.5" /> My Classroom
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};
