import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { QuizData } from '../../types';
import { Button } from '../../components/Shared';

export const QuizRunner: React.FC<{
    data: QuizData;
    onComplete: (score: number) => void;
    onExit: () => void
}> = ({ data, onComplete, onExit }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<string>("");
    const [showResult, setShowResult] = useState(false);
    const [score, setScore] = useState(0);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const question = data.questions[currentIndex];
    const isLast = currentIndex === data.questions.length - 1;
    const progress = ((currentIndex + 1) / data.questions.length) * 100;

    const handleAnswer = (ans: string) => {
        if (showResult) return;
        setSelectedAnswer(ans);
    };

    const handleCheck = () => {
        setShowResult(true);
        const correct = selectedAnswer.toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();
        setIsCorrect(correct);
        if (correct) setScore(s => s + 1);
    };

    const handleNext = () => {
        if (isLast) {
            onComplete(Math.round((score / data.questions.length) * 100));
        } else {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer("");
            setShowResult(false);
            setIsCorrect(null);
        }
    };

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
