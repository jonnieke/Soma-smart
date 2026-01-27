import React, { useState } from 'react';
import { Play, Pause, FileText, HelpCircle, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { LessonResult } from '../../../types';

interface StudentLessonViewProps {
    lesson: LessonResult;
    onExit: () => void;
}

export const StudentLessonView: React.FC<StudentLessonViewProps> = ({ lesson, onExit }) => {
    const [activeTab, setActiveTab] = useState<'READ' | 'LISTEN' | 'QUIZ'>('READ');
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
    const [showResults, setShowResults] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);

    const handleAnswer = (questionId: string | number, optionIndex: number) => {
        if (showResults) return;
        setQuizAnswers(prev => ({ ...prev, [String(questionId)]: optionIndex }));
    };

    const calculateScore = () => {
        let score = 0;
        lesson.quiz.forEach(q => {
            if (quizAnswers[q.id] === q.correctAnswer) score++;
        });
        return score;
    };

    return (
        <div className="bg-slate-50 min-h-screen pb-20 font-sans">
            {/* Student Nav */}
            <div className="bg-white px-4 py-3 shadow-sm sticky top-0 z-10 flex items-center justify-between">
                <button onClick={onExit} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div className="text-center">
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lesson</div>
                    <h1 className="font-bold text-slate-800 leading-none">{lesson.topic}</h1>
                </div>
                <div className="w-8" /> {/* Spacer */}
            </div>

            {/* Audio Player Sticky Bar (if Listen mode or generally available) */}
            <div className="bg-indigo-900 text-white px-4 py-3 flex items-center gap-3 shadow-md">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-900 hover:scale-105 transition-transform"
                >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>
                <div className="flex-1">
                    <div className="text-xs text-indigo-200">Audio Lesson</div>
                    <div className="h-1 bg-indigo-700 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-yellow-400 w-1/3 animate-pulse" />
                    </div>
                </div>
                <div className="text-xs font-mono text-indigo-200">
                    02:15 / 05:30
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('READ')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'READ' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                >
                    <span className="flex items-center justify-center gap-2"><FileText className="w-4 h-4" /> Notes</span>
                </button>
                <button
                    onClick={() => setActiveTab('QUIZ')}
                    className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'QUIZ' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}
                >
                    <span className="flex items-center justify-center gap-2"><HelpCircle className="w-4 h-4" /> Quiz</span>
                </button>
            </div>

            <div className="p-4 max-w-lg mx-auto">
                {activeTab === 'READ' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-indigo-900 text-sm leading-relaxed">
                            <span className="font-bold block mb-1">Summary</span>
                            {lesson.summary}
                        </div>

                        {lesson.simplifiedNotes.map((note, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                <h3 className="font-bold text-lg text-slate-800 mb-2">{note.title}</h3>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'QUIZ' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {showResults && (
                            <div className="bg-green-100 border border-green-200 text-green-800 p-4 rounded-xl text-center mb-4">
                                <h3 className="font-bold text-xl mb-1">You scored {calculateScore()}/{lesson.quiz.length}</h3>
                                <p>Great effort! Review the answers below.</p>
                            </div>
                        )}

                        {lesson.quiz.map((q, idx) => {
                            const isCorrect = quizAnswers[q.id] === q.correctAnswer;
                            const hasAnswered = quizAnswers[q.id] !== undefined;

                            return (
                                <div key={q.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Question {idx + 1}</span>
                                    <h3 className="font-bold text-lg text-slate-800 mb-4">{q.question}</h3>

                                    <div className="space-y-2">
                                        {q.options.map((opt, optIdx) => {
                                            let btnClass = "w-full text-left p-3 rounded-lg border text-sm transition-all ";

                                            if (showResults) {
                                                if (optIdx === Number(q.correctAnswer)) btnClass += "bg-green-100 border-green-300 text-green-900 font-bold";
                                                else if (hasAnswered && optIdx === quizAnswers[String(q.id)] && optIdx !== Number(q.correctAnswer)) btnClass += "bg-red-100 border-red-300 text-red-900";
                                                else btnClass += "bg-slate-50 border-slate-200 text-slate-400";
                                            } else {
                                                if (hasAnswered && optIdx === quizAnswers[String(q.id)]) btnClass += "bg-indigo-100 border-indigo-300 text-indigo-900 font-bold";
                                                else btnClass += "bg-white border-slate-200 text-slate-600 hover:bg-slate-50";
                                            }

                                            return (
                                                <button
                                                    key={optIdx}
                                                    onClick={() => handleAnswer(q.id, optIdx)}
                                                    className={btnClass}
                                                    disabled={showResults}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        {opt}
                                                        {showResults && optIdx === q.correctAnswer && <CheckCircle className="w-4 h-4 text-green-600" />}
                                                        {showResults && hasAnswered && optIdx === quizAnswers[q.id] && optIdx !== q.correctAnswer && <XCircle className="w-4 h-4 text-red-600" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {showResults && (
                                        <div className="mt-4 pt-3 border-t border-slate-100 text-sm text-slate-500 italic">
                                            {q.explanation}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {!showResults ? (
                            <button
                                onClick={() => setShowResults(true)}
                                disabled={Object.keys(quizAnswers).length !== lesson.quiz.length}
                                className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 transition-all"
                            >
                                Submit Quiz
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    setShowResults(false);
                                    setQuizAnswers({});
                                    setActiveTab('READ');
                                }}
                                className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl shadow-lg transform active:scale-95 transition-all"
                            >
                                Try Again / Review Notes
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
