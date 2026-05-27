import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, ArrowRight, Sparkles, BookOpen, Trophy, AlertCircle } from 'lucide-react';
import { QuizData, QuizQuestion } from '../../types';
import { Button } from '../../components/Shared';

export interface QuizReviewSummary {
    score: number;
    correctCount: number;
    totalQuestions: number;
    missedQuestions: Array<{
        question: QuizQuestion;
        index: number;
        selectedAnswer: string;
    }>;
}

export const QuizRunner: React.FC<{
    data: QuizData;
    onComplete: (score: number, review: QuizReviewSummary) => void;
    onExit: () => void
}> = ({ data, onComplete, onExit }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string>("");
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [results, setResults] = useState<Record<number, { selectedAnswer: string; isCorrect: boolean }>>({});
    const [finished, setFinished] = useState(false);
    const [showMissedReview, setShowMissedReview] = useState(false);

    const question = data.questions[currentIndex];
    const isLast = currentIndex === data.questions.length - 1;
    const progress = ((currentIndex + 1) / data.questions.length) * 100;
    const correctCount = Object.values(results).filter(result => result.isCorrect).length;
    const finalScore = data.questions.length > 0 ? Math.round((correctCount / data.questions.length) * 100) : 0;
    const missedQuestions = data.questions
        .map((item, index) => ({ item, index, result: results[index] }))
        .filter(({ result }) => result && !result.isCorrect);

    const handleAnswer = (ans: string) => {
        if (showResult) return;
        setSelectedAnswer(ans);
    };

    const handleCheck = () => {
        setShowResult(true);
        const correct = selectedAnswer.toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();
        setIsCorrect(correct);
        setResults(prev => ({
            ...prev,
            [currentIndex]: { selectedAnswer, isCorrect: correct }
        }));
    };

    const handleNext = () => {
        if (isLast) {
            setFinished(true);
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer("");
            setShowResult(false);
            setIsCorrect(null);
        }
    };

    if (finished) {
        return (
            <div className="min-h-screen flex flex-col bg-slate-50 max-w-lg mx-auto shadow-2xl border-x border-slate-100">
                <div className="bg-white px-4 py-3 shadow-sm z-10 flex items-center justify-between sticky top-0">
                    <button onClick={onExit} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-xl transition-all group">
                        <X className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                        <span className="text-xs font-bold text-slate-400 group-hover:text-red-500">Dashboard</span>
                    </button>
                    <div className="text-xs font-black uppercase tracking-widest text-slate-400">Quiz Review</div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                    <div className="bg-white p-7 rounded-3xl shadow-sm border-2 border-slate-300 text-center">
                        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4 ${finalScore >= 70 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                            {finalScore >= 70 ? <Trophy className="w-10 h-10" /> : <AlertCircle className="w-10 h-10" />}
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Final Score</p>
                        <h2 className="text-5xl font-black text-slate-900">{finalScore}%</h2>
                        <p className="text-sm font-semibold text-slate-500 mt-2">
                            {correctCount}/{data.questions.length} correct on {data.topic}
                        </p>
                    </div>

                    {missedQuestions.length > 0 ? (
                        <div className="bg-white rounded-3xl border-2 border-slate-300 shadow-sm overflow-hidden">
                            <button
                                onClick={() => setShowMissedReview(prev => !prev)}
                                className="w-full p-5 flex items-center justify-between gap-3 text-left"
                            >
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 mb-1">Fix These First</p>
                                    <h3 className="font-black text-slate-900">{missedQuestions.length} missed question{missedQuestions.length === 1 ? '' : 's'}</h3>
                                </div>
                                <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform ${showMissedReview ? 'rotate-90' : ''}`} />
                            </button>
                            <AnimatePresence>
                                {showMissedReview && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden border-t border-slate-200"
                                    >
                                        <div className="p-5 space-y-4">
                                            {missedQuestions.map(({ item, index, result }) => (
                                                <div key={item.id || index} className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-2">Question {index + 1}</p>
                                                    <p className="text-sm font-bold text-slate-900 mb-3">{item.question}</p>
                                                    <div className="grid gap-2 text-xs font-semibold">
                                                        <p className="text-red-700">Your answer: {result?.selectedAnswer || 'No answer'}</p>
                                                        <p className="text-emerald-700">Correct answer: {String(item.correctAnswer)}</p>
                                                        <p className="text-slate-600 leading-relaxed pt-2 border-t border-amber-200">{item.explanation}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="bg-emerald-50 rounded-3xl border-2 border-emerald-200 p-5 text-center">
                            <Sparkles className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                            <h3 className="font-black text-emerald-900">Perfect run</h3>
                            <p className="text-sm font-semibold text-emerald-700 mt-1">Save this progress and keep your streak moving.</p>
                        </div>
                    )}
                </div>

                <div className="p-4 bg-white border-t border-slate-200 z-50">
                    <Button
                        fullWidth
                        onClick={() => onComplete(finalScore, {
                            score: finalScore,
                            correctCount,
                            totalQuestions: data.questions.length,
                            missedQuestions: missedQuestions.map(({ item, index, result }) => ({
                                question: item,
                                index,
                                selectedAnswer: result?.selectedAnswer || ''
                            }))
                        })}
                        className="py-4 text-lg rounded-xl shadow-lg shadow-blue-200"
                    >
                        Save Progress <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-slate-50 max-w-lg mx-auto shadow-2xl border-x border-slate-100">
            {/* Quiz Header */}
            <div className="bg-white px-4 py-3 shadow-sm z-10 flex items-center justify-between sticky top-0">
                <button onClick={onExit} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 rounded-xl transition-all group">
                    <X className="w-5 h-5 text-slate-400 group-hover:text-red-500 transition-colors" />
                    <span className="text-xs font-bold text-slate-400 group-hover:text-red-500">Dashboard</span>
                </button>
                <div className="flex-1 px-4">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        />
                    </div>
                </div>
                <div className="font-bold text-slate-700 text-sm">{currentIndex + 1}/{data.questions.length}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-300">
                        <h3 className="text-xl font-bold text-slate-800 leading-snug">{question.question}</h3>
                    </div>

                    {question.type === 'MCQ' && question.options && (
                        <div className="grid gap-3">
                            {question.options.map((opt, idx) => {
                                let itemClass = "w-full p-4 rounded-2xl text-left border-2 transition-all font-medium relative overflow-hidden ";

                                if (showResult) {
                                    if (opt === question.correctAnswer) itemClass += "border-green-500 bg-green-50 text-green-900 shadow-md";
                                    else if (opt === selectedAnswer) itemClass += "border-red-500 bg-red-50 text-red-900";
                                    else itemClass += "border-slate-100 text-slate-400 opacity-50";
                                } else {
                                    if (selectedAnswer === opt) itemClass += "border-blue-500 bg-blue-50 text-blue-900 shadow-md transform scale-[1.02]";
                                    else itemClass += "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm";
                                }

                                return (
                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        key={idx}
                                        className={itemClass}
                                        onClick={() => handleAnswer(opt)}
                                        disabled={showResult}
                                    >
                                        <div className="flex items-center justify-between relative z-10">
                                            <span>{opt}</span>
                                            {showResult && opt === question.correctAnswer && <CheckCircle className="w-5 h-5 text-green-600" />}
                                            {showResult && opt === selectedAnswer && opt !== question.correctAnswer && <XCircle className="w-5 h-5 text-red-600" />}
                                        </div>
                                    </motion.button>
                                )
                            })}
                        </div>
                    )}

                    {question.type === 'SHORT' && (
                        <div className="space-y-4">
                            <textarea
                                className="w-full p-5 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-0 outline-none text-lg bg-white shadow-sm"
                                placeholder="Type your answer here..."
                                rows={4}
                                value={selectedAnswer}
                                onChange={(e) => handleAnswer(e.target.value)}
                                disabled={showResult}
                            />
                            {showResult && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-5 bg-green-50 rounded-2xl border border-green-200"
                                >
                                    <p className="font-bold text-green-800 text-sm uppercase tracking-wide mb-1">Correct Answer</p>
                                    <p className="text-green-900 font-medium text-lg">{question.correctAnswer}</p>
                                </motion.div>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Footer Controls */}
            <div className="p-4 bg-white border-t border-slate-200 z-50">
                <div className="w-full">
                    <AnimatePresence mode="wait">
                        {!showResult ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} key="check">
                                <Button fullWidth onClick={handleCheck} disabled={!selectedAnswer} className="py-4 text-lg rounded-xl shadow-lg shadow-blue-200">
                                    Check Answer
                                </Button>
                            </motion.div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4" key="next">
                                <div className={`p-4 rounded-xl flex items-start gap-3 ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                    {isCorrect ? <Sparkles className="w-6 h-6 shrink-0" /> : <BookOpen className="w-6 h-6 shrink-0" />}
                                    <div>
                                        <p className="font-bold text-sm mb-1">{isCorrect ? "Correct!" : "Explanation:"}</p>
                                        <p className="text-sm leading-relaxed opacity-90">{question.explanation}</p>
                                    </div>
                                </div>
                                <Button fullWidth onClick={handleNext} className={`py-4 text-lg rounded-xl shadow-lg ${isCorrect ? 'shadow-green-200 bg-green-600 hover:bg-green-700' : 'shadow-slate-200 bg-slate-800 hover:bg-slate-900'}`}>
                                    {isLast ? "Finish Quiz" : "Next Question"} <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
