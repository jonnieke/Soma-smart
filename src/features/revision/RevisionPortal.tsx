import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, Award, BookOpen, Brain, CheckCircle, Clock, FileText, Loader2, LogOut, ShieldCheck, Sparkles, Star, Target, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { LoginModal } from '../../components/LoginModal';
import { RegistrationModal } from '../../components/RegistrationModal';
import { LogoutModal } from '../../components/LogoutModal';
import { examService } from '../../services/examService';

type CandidatePathway = 'KPSEA' | 'KJSEA' | 'KCSE';
type PublishedExam = Record<string, any> & { id: string | number; title: string; subject: string; grade: string };

const PATHWAYS: Array<{ id: CandidatePathway; grade: string; label: string }> = [
    { id: 'KPSEA', grade: 'Grade 6', label: 'Grade 6' },
    { id: 'KJSEA', grade: 'Grade 9', label: 'Grade 9' },
    { id: 'KCSE', grade: 'Form 4', label: 'Form 4' },
];

const subjectVisual = (index: number) => [
    { icon: <Brain className="h-6 w-6" />, style: 'bg-slate-100 text-slate-600 border border-slate-200' },
    { icon: <BookOpen className="h-6 w-6" />, style: 'bg-slate-100 text-slate-600 border border-slate-200' },
    { icon: <Star className="h-6 w-6" />, style: 'bg-slate-100 text-slate-600 border border-slate-200' },
    { icon: <Zap className="h-6 w-6" />, style: 'bg-slate-100 text-slate-600 border border-slate-200' },
][index % 4];

export const RevisionPortal: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestedPaperId = searchParams.get('paper');
    const { isRegistered, studentCode, setRole, logout, studentProfile } = useApp();
    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [pathway, setPathway] = useState<CandidatePathway>('KPSEA');
    const [publishedExams, setPublishedExams] = useState<PublishedExam[]>([]);
    const [loadingExams, setLoadingExams] = useState(true);

    useEffect(() => {
        let active = true;
        examService.listPublishedExams()
            .then(exams => { if (active) setPublishedExams(exams as unknown as PublishedExam[]); })
            .catch(error => console.error('Could not load public exam catalogue:', error))
            .finally(() => { if (active) setLoadingExams(false); });
        return () => { active = false; };
    }, []);

    const pathwayConfig = PATHWAYS.find(item => item.id === pathway) || PATHWAYS[0];
    const isSomaOriginalExam = (exam: PublishedExam) => {
        const source = String(exam.source || '').toUpperCase();
        const title = String(exam.title || '').toLowerCase();
        return source.includes('STRUCTURED_IMPORT') || /somaai\s+original|original mock|originals/.test(title);
    };

    const pathwayExams = useMemo(() => publishedExams.filter(exam => {
        const examType = String(exam.exam_type || exam.examType || '').toUpperCase().replace(/[_ -]?STYLE$/, '');
        return examType === pathway || String(exam.grade || '').toLowerCase() === pathwayConfig.grade.toLowerCase();
    }), [pathway, pathwayConfig.grade, publishedExams]);

    const subjectCounts = useMemo(() => Array.from(pathwayExams.reduce((counts, exam) => {
        const subject = exam.subject || 'General';
        counts.set(subject, (counts.get(subject) || 0) + 1);
        return counts;
    }, new Map<string, number>()).entries()).map(([name, count], index) => ({ name, count, ...subjectVisual(index) })), [pathwayExams]);

    const startRevision = (openExamId?: string | number) => {
        setRole(UserRole.REVISION);
        if (openExamId) {
            const paper = pathwayExams.find(exam => String(exam.id) === String(openExamId)) || pathwayExams[0];
            if (paper) sessionStorage.setItem('soma_pending_exam', JSON.stringify(paper));
        }
        navigate('/revision/dashboard');
    };

    useEffect(() => {
        if (!requestedPaperId || loadingExams) return;
        if (!isRegistered) {
            setShowLogin(true);
            return;
        }
        startRevision(requestedPaperId);
    }, [requestedPaperId, loadingExams, isRegistered]);

    const openExamLibrary = () => {
        if (!isRegistered) {
            setShowRegister(true);
            return;
        }
        startRevision(pathwayExams[0]?.id);
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900 md:pb-0">
            <Helmet>
                <title>SomaAI Exam Prep | KPSEA, KJSEA &amp; KCSE</title>
                <meta name="description" content="Attempt realistic mock examinations, discover where you lose marks, and follow a personal recovery plan for KPSEA, KJSEA and KCSE." />
            </Helmet>

            <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur-xl sm:px-8">
                <button onClick={() => navigate('/')} className="flex items-center gap-2 font-black"><ArrowRight className="h-5 w-5 rotate-180 text-slate-400" /> SomaAI <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-600">Exam Prep</span></button>
                {isRegistered ? (
                    <div className="flex items-center gap-3">
                        <div className="hidden text-right sm:block"><p className="text-sm font-black">{studentProfile?.name?.split(' ')[0] || 'Candidate'}</p><p className="text-[10px] font-bold text-slate-400">{studentCode}</p></div>
                        <button onClick={() => startRevision()} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">My Exam Prep</button>
                        <button onClick={() => setShowLogoutModal(true)} className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500"><LogOut className="h-5 w-5" /></button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2"><button onClick={() => setShowLogin(true)} className="px-3 py-2 text-sm font-black text-slate-600">Login</button><button onClick={() => setShowRegister(true)} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-black text-white">Start free</button></div>
                )}
            </header>

            <main className="mx-auto max-w-6xl space-y-20 px-4 py-10 sm:px-8 sm:py-16">
                <section className="text-center">
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-4xl space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-600"><Award className="h-4 w-4 text-indigo-500" /> Your candidate success space</div>
                        <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-7xl">Published papers first.<br /><span className="text-indigo-600">Open one and start improving.</span></h1>
                        <p className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-slate-600 -slate-300">Choose a real paper, open it fast, and use marks and feedback to recover weak areas before exam day.</p>
                        <div className="flex flex-wrap justify-center gap-3 pt-3">
                            {PATHWAYS.map(item => <button key={item.id} onClick={() => setPathway(item.id)} className={`rounded-2xl border px-6 py-3 text-left transition ${pathway === item.id ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}><span className="block text-sm font-black">{item.id}</span><span className={`block text-[10px] font-bold ${pathway === item.id ? 'text-indigo-100' : 'text-slate-400'}`}>{item.label}</span></button>)}
                        </div>
                        <button onClick={openExamLibrary} className="inline-flex items-center gap-3 rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-black text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700">{isRegistered ? 'Start paper' : 'Start free'} <ArrowRight className="h-5 w-5" /></button>
                        {pathwayExams.length > 0 && <div className="grid gap-3 pt-2 sm:grid-cols-3">{pathwayExams.slice(0, 3).map(exam => <button key={exam.id} onClick={() => startRevision(exam.id)} className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"><span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-600">Paper ready</span><span className="mt-3 block text-sm font-black leading-snug text-slate-900">{exam.title}</span><span className="mt-2 block text-[11px] font-bold text-slate-400">{exam.subject} / {exam.grade}</span></button>)}</div>}
                        <div className="flex flex-wrap justify-center gap-5 text-xs font-bold text-slate-500"><span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-indigo-500" /> Papers first</span><span className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-indigo-500" /> {publishedExams.length} published exam{publishedExams.length === 1 ? '' : 's'}</span></div>
                    </motion.div>
                </section>

                <section className="rounded-[2.5rem] border border-slate-200 bg-white p-6 -slate-800 -slate-900 sm:p-10">
                    <div className="mb-8 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Paper library</p><h2 className="mt-2 text-3xl font-black">{pathway} papers ready to open</h2><p className="mt-2 text-sm text-slate-500">Start with one paper, then move through the rest at your pace.</p></div><button onClick={openExamLibrary} className="hidden items-center gap-2 text-sm font-black text-indigo-600 sm:flex">View all <ArrowRight className="h-4 w-4" /></button></div>
                    {loadingExams ? <div className="flex justify-center gap-2 py-12 text-sm font-bold text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading published papers...</div> : pathwayExams.length ? <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            {pathwayExams.slice(0, 3).map(exam => (
                                <button key={exam.id} onClick={() => startRevision(exam.id)} className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white -slate-800 -slate-950">
                                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-600">Paper ready</span>
                                    <span className="mt-3 block text-base font-black leading-snug">{exam.title}</span>
                                    <span className="mt-2 block text-[11px] font-bold text-slate-400">{exam.subject} / {exam.grade}</span>
                                    <span className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                                        {exam.duration_minutes && <span className="rounded-full bg-slate-100 px-2 py-1 -slate-800">{exam.duration_minutes} min</span>}
                                        {Array.isArray(exam.structured_questions) && <span className="rounded-full bg-slate-100 px-2 py-1 -slate-800">{exam.structured_questions.length} questions</span>}
                                        {exam.total_marks && <span className="rounded-full bg-slate-100 px-2 py-1 -slate-800">{exam.total_marks} marks</span>}
                                    </span>
                                    <span className="mt-4 inline-flex items-center gap-2 text-xs font-black text-indigo-600 group-hover:translate-x-0.5 transition-transform">Start paper <ArrowRight className="h-3.5 w-3.5" /></span>
                                </button>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{subjectCounts.map(subject => <button key={subject.name} onClick={openExamLibrary} className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white -slate-800 -slate-950"><span className={`flex h-12 w-12 items-center justify-center rounded-xl ${subject.style}`}>{subject.icon}</span><span className="mt-4 block text-lg font-black text-slate-900">{subject.name}</span><span className="mt-1 block text-xs font-bold text-slate-400">{subject.count} published paper{subject.count === 1 ? '' : 's'}</span></button>)}</div>
                    </div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-black text-slate-900">More {pathway} papers are coming soon.</p><p className="mt-1 text-sm text-slate-500">Switch pathways or open another paper that is already ready.</p></div>}
                </section>

                {pathwayExams.length > 0 && <section><div className="mb-7 text-center"><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Ready to attempt</p><h2 className="mt-2 text-3xl font-black">Published {pathway} papers</h2></div><div className="grid gap-4 md:grid-cols-2">{pathwayExams.slice(0, 6).map(exam => <button key={exam.id} onClick={() => startRevision(exam.id)} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left hover:border-indigo-300 hover:shadow-sm"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><FileText className="h-6 w-6" /></span><span className="min-w-0 flex-1">{isSomaOriginalExam(exam) && <span className="mb-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-700">Published paper</span>}<span className="block font-black leading-snug text-slate-900">{exam.title}</span><span className="mt-2 flex flex-wrap gap-2 text-[10px] font-bold text-slate-400"><span>{exam.subject}</span><span>{exam.grade}</span>{exam.duration_minutes && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {exam.duration_minutes} min</span>}{Array.isArray(exam.structured_questions) && <span>{exam.structured_questions.length} questions</span>}{exam.total_marks && <span>{exam.total_marks} marks</span>}</span></span><ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-500" /></button>)}</div></section>}

                <section><div className="mb-10 text-center"><h2 className="text-3xl font-black">Attempt → Mark → Diagnose → Recover → Retest</h2><p className="mt-2 text-slate-500">Every paper should tell the learner what to do next.</p></div><div className="grid gap-5 md:grid-cols-3">{[
                    { icon: <Target className="h-8 w-8" />, title: 'Attempt honestly', text: 'Use Timed Exam for real exam conditions or Practice Mode for guided learning.' },
                    { icon: <Sparkles className="h-8 w-8" />, title: 'Find lost marks', text: 'See weak topics and question-level feedback after the original is submitted.' },
                    { icon: <CheckCircle className="h-8 w-8" />, title: 'Recover and retest', text: 'Practise the priority skills, then return to prove the improvement.' },
                ].map(step => <div key={step.title} className="rounded-3xl border border-slate-200 bg-white p-7"><span className="text-indigo-600">{step.icon}</span><h3 className="mt-5 text-xl font-black text-slate-900">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-slate-500">{step.text}</p></div>)}</div></section>

                <section className="rounded-[2.5rem] border border-slate-200 bg-white p-9 text-center sm:p-14"><h2 className="text-3xl font-black text-slate-900 sm:text-5xl">Your next paper is ready.</h2><p className="mx-auto mt-4 max-w-xl text-slate-500">Start with one paper, see where marks are lost, and keep moving at your pace.</p><button onClick={openExamLibrary} className="mt-8 rounded-2xl bg-indigo-600 px-8 py-4 font-black text-white">{isRegistered ? 'Continue my exam prep' : 'Create free learner account'}</button></section>
            </main>

            {!isRegistered && <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between border-t border-slate-200 bg-white/95 p-4 backdrop-blur-xl md:hidden"><div><p className="text-sm font-black text-slate-900">Start your exam prep</p><p className="text-[10px] font-bold text-indigo-600">Browse real exams first</p></div><button onClick={() => setShowRegister(true)} className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-black text-white">Start free</button></div>}

            <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} onSuccess={() => startRevision(requestedPaperId || undefined)} onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true); }} />
            <RegistrationModal isOpen={showRegister} onClose={() => setShowRegister(false)} onSuccess={() => startRevision(requestedPaperId || undefined)} onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true); }} initialRole="STUDENT" />
            <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={() => { logout(); navigate('/'); }} title="Leaving Exam Prep?" message="Your saved attempts will be here when you return." />
        </div>
    );
};


