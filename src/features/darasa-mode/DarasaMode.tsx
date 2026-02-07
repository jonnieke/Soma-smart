import React, { useRef, useEffect } from 'react';
import { ArrowLeft, Loader2, BookOpen, Play, Check, Trash2, Mic, Share2, Download } from 'lucide-react';
import { AudioRecorder } from './components/AudioRecorder';
import { LessonReview } from './components/LessonReview';
import { useDarasaLesson } from './hooks/useDarasaLesson';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';
import { LoginModal } from '../../components/LoginModal';
import { UserRole } from '../../types';

interface DarasaModeProps {
    onBack: () => void;
}

export const DarasaMode: React.FC<DarasaModeProps> = ({ onBack }) => {
    const {
        state,
        lesson,
        audioBlob,
        error,
        captureAudio,
        confirmProcessing,
        saveCurrentLesson,
        history,
        reset
    } = useDarasaLesson();

    // Features
    const { role } = useApp();
    const [showLogin, setShowLogin] = React.useState(false);
    const [isStudentPreview, setIsStudentPreview] = React.useState(false);

    // Enforce Login on Entry
    useEffect(() => {
        if (role !== UserRole.TEACHER) {
            setShowLogin(true);
        }
    }, [role]);

    const handleDownloadPDF = () => {
        if (!lesson) return;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(lesson.topic, 10, 10);

        doc.setFontSize(12);
        doc.text("Summary:", 10, 20);
        const summaryLines = doc.splitTextToSize(lesson.summary, 190);
        doc.text(summaryLines, 10, 25);

        // Notes content loop
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

        // Quiz
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

        // Ensure strictly saved/logged in (redundant check but safe)
        if (role !== UserRole.TEACHER) {
            setShowLogin(true);
            return;
        }

        const shareText = `📚 *Lesson: ${lesson.topic}*\n\n${lesson.summary}\n\nStart learning on Soma Smart!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: lesson.topic,
                    text: shareText,
                    url: window.location.href
                });
            } catch (err) {
                console.warn("Share API failed/cancelled, falling back to clipboard", err);
                navigator.clipboard.writeText(shareText);
                alert("Link copied to clipboard! (Share menu closed)");
            }
        } else {
            navigator.clipboard.writeText(shareText);
            alert("Lesson details copied to clipboard!");
        }
    };

    const handleSave = async () => {
        if (role !== UserRole.TEACHER) {
            setShowLogin(true);
            return;
        }
        await saveCurrentLesson();
        alert("Lesson Saved Successfully to your Teacher Account!");
    };

    // Mode: Student Preview
    if (isStudentPreview && lesson) {
        return (
            <div className="bg-slate-50 min-h-screen pb-20 animate-in fade-in duration-300">
                <div className="sticky top-0 bg-white z-20 border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                    <button onClick={() => setIsStudentPreview(false)} className="flex items-center gap-2 text-slate-600 font-bold hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" /> Back to Editor
                    </button>
                    <div className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        Student View Preview
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
                        <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Lesson Topic</span>
                        <h1 className="text-2xl font-bold text-slate-900 mt-1 mb-2">{lesson.topic}</h1>
                        <p className="text-slate-600 leading-relaxed text-sm">{lesson.summary}</p>
                    </div>

                    <div className="space-y-4">
                        {lesson.simplifiedNotes.map((note, i) => (
                            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
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
                        <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                            <BookOpen className="w-5 h-5" /> Take Quiz ({lesson.quiz.length} Questions)
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


    // Mode: Audio Review (Intermediate Step)
    if (state === 'audio_review' && audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);

        return (
            <div className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Review Recording</h2>
                    <p className="text-slate-500">Listen to verify clarity before we analyze it.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-8">
                    <div className="bg-slate-50 rounded-xl p-6 mb-8 flex items-center justify-center">
                        <audio controls src={audioUrl} className="w-full" />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={reset}
                            className="flex-1 py-3 px-4 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-5 h-5" /> Retake
                        </button>
                        <button
                            onClick={confirmProcessing}
                            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                        >
                            <Check className="w-5 h-5" /> Analyze Lesson
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Mode: Processing
    if (state === 'processing') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full" />
                    <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative z-10" />
                </div>
                <h3 className="mt-8 text-2xl font-bold text-slate-800">Generating Lesson...</h3>
                <p className="text-slate-500 mt-2 text-center max-w-md">
                    Our AI is analyzing the audio, creating notes, highlighting key terms, and generating quiz questions.
                </p>
            </div>
        );
    }

    // Mode: Idle / Recording
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center text-slate-500 hover:text-slate-800 transition-colors gap-2"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </button>
                <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full text-sm font-medium">
                    <BookOpen className="w-4 h-4" />
                    Darasa AI Mode
                </div>
            </div>

            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                    Record Your Class
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Capture the lesson in real-time. Soma will generate comprehensive notes, summaries, and quizzes automatically.
                </p>
            </div>

            {error && (
                <div className="max-w-xl mx-auto mb-8 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-in shake">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    {error}
                </div>
            )}

            <AudioRecorder
                onCaptureComplete={captureAudio}
                onCancel={onBack}
            />

            {/* History Section */}
            {history.length > 0 && (
                <div className="mt-16 border-t border-slate-200 pt-8">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BookOpen className="w-5 h-5" />
                        Recent Lessons
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {history.map((h) => (
                            <div key={h.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <h4 className="font-bold text-slate-900 line-clamp-1">{h.topic}</h4>
                                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{h.summary}</p>
                                <div className="mt-3 flex justify-between items-center text-xs text-slate-400">
                                    <span>{new Date(h.date).toLocaleDateString()}</span>
                                    <button
                                        className="text-indigo-600 hover:text-indigo-800 p-1"
                                        onClick={() => {
                                            const shareText = `📚 *${h.topic}*\n${h.summary}`;
                                            navigator.clipboard.writeText(shareText);
                                            alert("Copied to clipboard");
                                        }}
                                    >
                                        <Share2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Login Modal Enforcement */}
            <LoginModal
                isOpen={showLogin}
                onClose={() => {
                    setShowLogin(false);
                    reset();
                    // Strict Enforcement: If still not a teacher after closing, send them back
                    if (role !== UserRole.TEACHER) {
                        onBack();
                    }
                }}
                onSuccess={() => {
                    // Keep them on Darasa Mode
                    setShowLogin(false);
                }}
                initialTab="TEACHER"
            />
        </div>
    );
};
