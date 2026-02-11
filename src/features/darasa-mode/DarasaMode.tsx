import React, { useRef, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, BookOpen, Play, Check, Trash2, Mic, Share2, Download, ShieldCheck, Zap, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioRecorder } from './components/AudioRecorder';
import { LessonReview } from './components/LessonReview';
import { useDarasaLesson } from './hooks/useDarasaLesson';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';
import { LoginModal } from '../../components/LoginModal';
import { UserRole } from '../../types';
import { translations } from '../../data/translations';

interface DarasaModeProps {
    onBack: () => void;
}

export const DarasaMode: React.FC<DarasaModeProps> = ({ onBack }) => {
    const {
        state,
        lesson,
        audioBlob,
        error: lessonError,
        captureAudio,
        confirmProcessing,
        saveCurrentLesson,
        history,
        reset
    } = useDarasaLesson();

    const { role, language, teacherDarasaUsage, incrementTeacherDarasaUsage, isPro } = useApp();
    const t = translations[language];
    const [showLogin, setShowLogin] = useState(false);
    const [isStudentPreview, setIsStudentPreview] = useState(false);

    const FREE_LIMIT = 3;
    const isLimitReached = !isPro && teacherDarasaUsage >= FREE_LIMIT;
    const remainingUses = Math.max(0, FREE_LIMIT - teacherDarasaUsage);

    // Enforce Login on Entry
    useEffect(() => {
        if (role !== UserRole.TEACHER) {
            setShowLogin(true);
        }
    }, [role]);

    const handleConfirmProcessing = async () => {
        if (isLimitReached) return;

        await confirmProcessing();
        await incrementTeacherDarasaUsage();
    };

    const handleDownloadPDF = () => {
        if (!lesson) return;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(lesson.topic, 10, 10);
        doc.setFontSize(12);
        doc.text(`${t.teacher.darasaMode.recordTitle}:`, 10, 20);
        const summaryLines = doc.splitTextToSize(lesson.summary, 190);
        doc.text(summaryLines, 10, 25);
        let y = 40 + (summaryLines.length * 5);

        lesson.simplifiedNotes.forEach((note) => {
            if (y > 270) { doc.addPage(); y = 10; }
            doc.setFontSize(14);
            doc.text(note.title, 10, y);
            y += 7;
            doc.setFontSize(11);
            const contentLines = doc.splitTextToSize(note.content, 190);
            doc.text(contentLines, 10, y);
            y += (contentLines.length * 5) + 5;
        });

        if (y > 250) { doc.addPage(); y = 10; }
        y += 10;
        doc.setFontSize(14);
        doc.text("QUIZ", 10, y);
        y += 10;
        doc.setFontSize(11);

        lesson.quiz.forEach((q, i) => {
            if (y > 270) { doc.addPage(); y = 10; }
            const qText = doc.splitTextToSize(`${i + 1}. ${q.question}`, 190);
            doc.text(qText, 10, y);
            y += (qText.length * 5);
            doc.text(`   Answer: ${q.options[q.correctAnswer]}`, 10, y);
            y += 7;
        });

        doc.save(`${lesson.topic.replace(/\s+/g, '_')}.pdf`);
    };

    const handleShare = async () => {
        if (!lesson) return;
        if (role !== UserRole.TEACHER) {
            setShowLogin(true);
            return;
        }
        const shareText = t.teacher.darasaMode.shareText.replace('{topic}', lesson.topic).replace('{summary}', lesson.summary);
        if (navigator.share) {
            try {
                await navigator.share({ title: lesson.topic, text: shareText, url: window.location.href });
            } catch (err) {
                navigator.clipboard.writeText(shareText);
                alert(t.teacher.darasaMode.copyLinkManual);
            }
        } else {
            navigator.clipboard.writeText(shareText);
            alert(t.teacher.darasaMode.lessonDetailsCopied);
        }
    };

    const handleSave = async () => {
        if (role !== UserRole.TEACHER) { setShowLogin(true); return; }
        await saveCurrentLesson();
        alert(t.teacher.darasaMode.lessonSaved);
    };

    // Mode: Student Preview
    if (isStudentPreview && lesson) {
        return (
            <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-300">
                <div className="sticky top-0 bg-white z-20 border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                    <button onClick={() => setIsStudentPreview(false)} className="flex items-center gap-2 text-slate-600 font-bold hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> {t.teacher.darasaMode.backToEditor}
                    </button>
                    <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {t.teacher.darasaMode.studentPreview}
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6 transition-all duration-300 hover:shadow-md">
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">{t.teacher.darasaMode.lessonTopic}</span>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1 mb-2">{lesson.topic}</h1>
                        <p className="text-slate-600 leading-relaxed text-sm">{lesson.summary}</p>
                    </div>

                    <div className="space-y-4">
                        {lesson.simplifiedNotes.map((note, i) => (
                            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:border-indigo-100 transition-all duration-300">
                                <h3 className="font-bold text-slate-800 mb-2 text-lg">{note.title}</h3>
                                <div className="text-slate-600 leading-relaxed prose prose-indigo prose-sm">
                                    {note.content.split('\n').map((line, l) => (
                                        <p key={l} className="mb-2 last:mb-0">{line}</p>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-8">
                        <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                            <BookOpen className="w-5 h-5" /> {t.teacher.darasaMode.takeQuiz.replace('{count}', lesson.quiz.length.toString())}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Mode: Review (Final AI Result)
    if (state === 'review' && lesson) {
        return (
            <LessonReview
                lesson={lesson}
                onBack={reset}
                onSave={handleSave}
                onDownload={handleDownloadPDF}
                onShare={handleShare}
                onPreview={() => setIsStudentPreview(true)}
            />
        );
    }

    // Mode: Audio Review
    if (state === 'audio_review' && audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);

        return (
            <div className="max-w-2xl mx-auto px-4 py-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.teacher.darasaMode.reviewTitle}</h2>
                    <p className="text-slate-500">{t.teacher.darasaMode.reviewDesc}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-8"
                >
                    <div className="bg-slate-50 rounded-xl p-6 mb-8 flex items-center justify-center border border-slate-100 italic text-slate-400">
                        <audio controls src={audioUrl} className="w-full" />
                    </div>

                    <div className="flex gap-4">
                        <button onClick={reset} className="flex-1 py-3 px-4 rounded-xl border border-red-100 text-red-500 font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2">
                            <Trash2 className="w-5 h-5" /> {t.teacher.darasaMode.retake}
                        </button>
                        <button
                            disabled={isLimitReached}
                            onClick={handleConfirmProcessing}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 ${isLimitReached ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
                        >
                            <Check className="w-5 h-5" /> {t.teacher.darasaMode.analyze}
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Mode: Processing
    if (state === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-indigo-500 blur-2xl rounded-full"
                    />
                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative z-10" />
                </div>
                <h3 className="mt-8 text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-500" /> {t.teacher.darasaMode.generatingTitle}
                </h3>
                <p className="text-slate-500 mt-2 text-center max-w-md px-4">
                    {t.teacher.darasaMode.generatingDesc}
                </p>
            </div>
        );
    }

    // Mode: Idle / Recording
    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Academic Registry Header */}
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-colors group">
                        <ArrowLeft className="w-6 h-6 text-slate-400 group-hover:text-slate-900" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{t.teacher.darasaMode.title}</h1>
                        <p className="text-sm text-slate-500 font-medium">Academic Command Center</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${isPro ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                            <Zap className="w-4 h-4" />
                        </div>
                        <div className="text-xs">
                            <p className="text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">{isPro ? (t as any).stats.unlimited : t.teacher.darasaMode.freeUses}</p>
                            <p className="text-slate-900 font-extrabold text-sm">{isPro ? "PRO ACTIVE" : `${remainingUses} / ${FREE_LIMIT} LEFT`}</p>
                        </div>
                    </div>
                    {isPro && (
                        <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> SECURE SESSION
                        </div>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Recording Station */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Mic className="w-40 h-40" />
                        </div>

                        <div className="relative z-10 text-center py-6">
                            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">{t.teacher.darasaMode.recordTitle}</h2>
                            <p className="text-slate-500 max-w-lg mx-auto mb-10 text-lg leading-relaxed">
                                {t.teacher.darasaMode.recordDesc}
                            </p>

                            <AudioRecorder
                                onCaptureComplete={(blob) => {
                                    if (isLimitReached) {
                                        // Show limit alert if somehow they get here
                                        return;
                                    }
                                    captureAudio(blob);
                                }}
                                onCancel={onBack}
                            />
                        </div>
                    </div>

                    {/* Paywall Banner if Limit reached */}
                    {isLimitReached && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-r from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden"
                        >
                            <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
                                <Zap className="w-60 h-60" />
                            </div>
                            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md">
                                    <AlertCircle className="w-12 h-12 text-white" />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-2xl font-bold mb-2">{t.teacher.darasaMode.limitReachedTitle}</h3>
                                    <p className="text-indigo-100 leading-relaxed mb-6 font-medium">
                                        {t.teacher.darasaMode.limitReachedDesc}
                                    </p>
                                    <button
                                        onClick={() => window.location.hash = '#pricing'}
                                        className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 transition-all shadow-lg active:scale-95"
                                    >
                                        {t.teacher.darasaMode.upgradeNow}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar: Registry / History */}
                <div className="space-y-6">
                    <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200/60 h-full">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> {t.teacher.darasaMode.recentLessons}
                        </h3>

                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {history.length > 0 ? history.map((h) => (
                                <motion.div
                                    whileHover={{ x: 4 }}
                                    key={h.id}
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-white hover:border-indigo-100 transition-all cursor-pointer group"
                                >
                                    <h4 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600">{h.topic}</h4>
                                    <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-medium">{h.summary}</p>
                                    <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                        <span>{new Date(h.date).toLocaleDateString()}</span>
                                        <button
                                            className="text-slate-300 hover:text-indigo-600 transition-colors p-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const shareText = `📚 *${h.topic}*\n${h.summary}`;
                                                navigator.clipboard.writeText(shareText);
                                                alert(t.teacher.darasaMode.copiedToClipboard);
                                            }}
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="text-center py-10">
                                    <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No entries yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Modal Enforcement */}
            <LoginModal
                isOpen={showLogin}
                onClose={() => {
                    setShowLogin(false);
                    reset();
                    if (role !== UserRole.TEACHER) onBack();
                }}
                onSuccess={() => setShowLogin(false)}
                initialTab="TEACHER"
            />
        </div>
    );
};
