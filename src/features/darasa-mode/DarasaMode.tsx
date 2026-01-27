import React, { useState, useEffect } from 'react';
import { Mic, BookOpen, PlayCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { AudioRecorder } from './components/AudioRecorder';
import { LessonReview } from './components/LessonReview';
import { StudentLessonView } from './components/StudentLessonView';
import { processLessonAudio, processRevisionFile, getLessonsFromStorage, saveLessonToStorage } from './services/darasaService';
import { LessonResult } from '../../types';

export const DarasaMode: React.FC = () => {
    const navigate = useNavigate();
    const { role } = useApp();
    const [view, setView] = useState<'DASHBOARD' | 'RECORDING' | 'PROCESSING' | 'REVIEW' | 'PREVIEW'>('DASHBOARD');
    const [currentLesson, setCurrentLesson] = useState<LessonResult | null>(null);

    const [recentLessons, setRecentLessons] = useState<LessonResult[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (role === 'TEACHER') {
            setLoadingHistory(true);
            getLessonsFromStorage()
                .then(setRecentLessons)
                .finally(() => setLoadingHistory(false));
        } else {
            setRecentLessons([]);
        }
    }, [view, role]);
    // ... existing code ...
    <div className="space-y-3">
        {recentLessons.map((lesson, index) => (
            <div
                key={`${lesson.id}-${index}`}
                onClick={() => {
                    setCurrentLesson(lesson);
                    setView('REVIEW');
                }}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
            >
                <div>
                    <h4 className="font-bold text-slate-800">{lesson.topic}</h4>
                    <p className="text-sm text-slate-500 line-clamp-1">{lesson.summary}</p>
                    <div className="flex gap-2 mt-1">
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{new Date(lesson.date).toLocaleDateString()}</span>
                        <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{lesson.quiz.length} Questions</span>
                    </div>
                </div>
                <div className="text-indigo-600">
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                </div>
            </div>
        ))}
    </div>

    const handleCaptureComplete = async (blob: Blob) => {
        if (role !== 'TEACHER') {
            alert("Please login as a Teacher to save lessons.");
            // Proceed to review but warn they can't save? 
            // Or maybe just let them proceed but save will fail.
            // Let's let them proceed to review, but auto-save will skip if not auth.
        }

        setView('PROCESSING');
        try {
            const result = await processLessonAudio(blob);
            setCurrentLesson(result);

            if (role === 'TEACHER') {
                await saveLessonToStorage(result);
            }

            setView('REVIEW');
        } catch (error) {
            console.error("Processing failed", error);
            alert("Failed to process audio. Please try again.");
            setView('DASHBOARD');
        }
    };

    const handleRevisionUpload = async (file: File) => {
        setView('PROCESSING');
        try {
            const result = await processRevisionFile(file);
            setCurrentLesson(result);

            if (role === 'TEACHER') {
                await saveLessonToStorage(result);
            }

            setView('REVIEW');
        } catch (error) {
            console.error("Revision processing failed", error);
            alert("Failed to process revision notes. Please ensure the file is a clear image or PDF.");
            setView('DASHBOARD');
        }
    };

    const handleSaveLesson = async (lesson: LessonResult) => {
        if (role !== 'TEACHER') {
            // Direct redirect to simplify flow
            navigate('/teacher');
            return;
        }

        try {
            await saveLessonToStorage(lesson);
            alert("Lesson saved securely to cloud!");
            setView('DASHBOARD');
        } catch (e) {
            alert("Failed to save to cloud.");
        }
    };

    const handleDownload = (lesson: LessonResult) => {
        if (role !== 'TEACHER') {
            // Direct redirect to simplify flow
            navigate('/teacher');
            return;
        }

        // Generate Readable Text Format
        let content = `TOPIC: ${lesson.topic.toUpperCase()}\n`;
        content += `DATE: ${new Date(lesson.date).toLocaleDateString()}\n`;
        content += `----------------------------------------\n\n`;

        content += `SUMMARY:\n${lesson.summary}\n\n`;

        content += `NOTES:\n`;
        lesson.simplifiedNotes.forEach((note, i) => {
            content += `${i + 1}. ${note.title}\n${note.content}\n\n`;
        });

        content += `----------------------------------------\n`;
        content += `QUIZ (${lesson.quiz.length} Questions):\n\n`;

        lesson.quiz.forEach((q, i) => {
            content += `Q${i + 1}: ${q.question}\n`;
            if (q.options) {
                q.options.forEach((opt, oi) => content += `   ${['A', 'B', 'C', 'D'][oi]}. ${opt}\n`);
            }
            content += `   ANSWER: ${q.correctAnswer}\n`;
            content += `   EXPLANATION: ${q.explanation}\n\n`;
        });

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lesson-${lesson.topic.replace(/\s+/g, '-').replace(/[^a-z0-9-]/gi, '')}.txt`;
        a.click();
    };

    if (view === 'PREVIEW' && currentLesson) {
        return (
            <StudentLessonView
                lesson={currentLesson}
                onExit={() => setView('REVIEW')}
            />
        )
    }

    if (view === 'REVIEW' && currentLesson) {
        return (
            <LessonReview
                lesson={currentLesson}
                onBack={() => setView('DASHBOARD')}
                onSave={handleSaveLesson}
                onDownload={handleDownload}
                onPreview={() => setView('PREVIEW')}
            />
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                        if (view === 'RECORDING') setView('DASHBOARD');
                        else navigate('/teacher');
                    }}>
                        <div className="bg-indigo-600 p-1.5 rounded-lg">
                            <Mic className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="font-bold text-xl text-slate-800">Darasa Mode</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        {view === 'RECORDING' && (
                            <button onClick={() => setView('DASHBOARD')} className="text-sm font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1">
                                <ArrowLeft className="w-4 h-4" /> Cancel
                            </button>
                        )}
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                            T
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-3xl mx-auto px-4 py-8">

                {view === 'DASHBOARD' && (
                    <>
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-slate-900 mb-3">Good Morning, Teacher.</h2>
                            <p className="text-slate-600 text-lg">What would you like to capture today?</p>
                        </div>

                        {/* Action Cards */}
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Capture Card */}
                            <div
                                onClick={() => setView('RECORDING')}
                                className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-50 hover:shadow-xl transition-all cursor-pointer group"
                            >
                                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Mic className="w-7 h-7 text-indigo-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Capture Lesson</h3>
                                <p className="text-slate-500 mb-4">Record your explanation and let AI create notes and quizzes instantly.</p>
                                <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                                    Start Recording
                                </button>
                            </div>

                            <div className="bg-white p-6 rounded-2xl shadow-lg border border-orange-50 hover:shadow-xl transition-all cursor-pointer group relative">
                                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <BookOpen className="w-7 h-7 text-orange-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Create Revision</h3>
                                <p className="text-slate-500 mb-4">Upload past notes (PDF/Image) to generate a revision quiz.</p>

                                <label className="w-full py-2 bg-orange-100 text-orange-700 rounded-lg font-bold hover:bg-orange-200 transition-colors text-center block cursor-pointer">
                                    Upload Notes
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*,.pdf"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleRevisionUpload(file);
                                        }}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="mt-12">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <PlayCircle className="w-5 h-5 text-slate-400" /> Recent Sessions
                            </h3>

                            {recentLessons.length === 0 ? (
                                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                                    No recent sessions found. Start your first class!
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentLessons.map((lesson, index) => (
                                        <div
                                            key={`${lesson.id}-${index}`}
                                            onClick={() => {
                                                setCurrentLesson(lesson);
                                                setView('REVIEW');
                                            }}
                                            className="bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                                        >
                                            <div>
                                                <h4 className="font-bold text-slate-800">{lesson.topic}</h4>
                                                <p className="text-sm text-slate-500 line-clamp-1">{lesson.summary}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{new Date(lesson.date).toLocaleDateString()}</span>
                                                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">{lesson.quiz.length} Questions</span>
                                                </div>
                                            </div>
                                            <div className="text-indigo-600">
                                                <ArrowLeft className="w-5 h-5 rotate-180" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {view === 'RECORDING' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh]">
                        <AudioRecorder
                            onCaptureComplete={handleCaptureComplete}
                            onCancel={() => setView('DASHBOARD')}
                        />
                    </div>
                )}

                {view === 'PROCESSING' && (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-indigo-500 rounded-full opacity-20 animate-ping"></div>
                            <div className="relative bg-white p-4 rounded-full shadow-xl">
                                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">Understanding Lesson...</h3>
                        <p className="text-slate-500 max-w-sm">
                            We're converting your audio into simplified notes and generating a quiz. This takes about 10 seconds.
                        </p>
                    </div>
                )}

            </main>
        </div>
    );
};
