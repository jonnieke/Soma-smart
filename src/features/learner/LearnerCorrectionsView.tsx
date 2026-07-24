import React, { useState } from 'react';
import { BookOpen, CheckCircle, XCircle, HelpCircle, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

export const LearnerCorrectionsView: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const mockCorrections = [
    {
      id: 'c1',
      questionNum: 1,
      questionText: 'Solve the quadratic equation x² - 2x - 3 = 0 using factorization or formula.',
      learnerAnswer: 'x = 3 or x = -1',
      correctAnswer: 'x = 3 or x = -1',
      isCorrect: true,
      awardedMarks: 10,
      maxMarks: 10,
      explanation: 'Factorizing (x - 3)(x + 1) = 0 gives roots x = 3 and x = -1.',
      topic: 'Algebra & Quadratic Equations',
    },
    {
      id: 'c2',
      questionNum: 2,
      questionText: 'Calculate the total surface area of a closed cylinder with radius 7cm and height 10cm.',
      learnerAnswer: 'TSA = 2πr² = 308 cm²',
      correctAnswer: 'TSA = 2πr(r + h) = 2 × (22/7) × 7 × (7 + 10) = 748 cm²',
      isCorrect: false,
      awardedMarks: 3,
      maxMarks: 10,
      explanation: 'Remember to include both circular base areas and the curved surface area 2πrh.',
      topic: 'Mensuration & Geometry',
    },
  ];

  const current = mockCorrections[currentIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" /> Assessment Corrections Mode
        </h1>
        <p className="text-xs text-slate-500 mt-1">Review step-by-step solutions, explanations, and key learning concepts.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Question {current.questionNum} of {mockCorrections.length} · {current.topic}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${current.isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {current.isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {current.awardedMarks} / {current.maxMarks} Marks
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">{current.questionText}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-1 border border-slate-100 dark:border-slate-700">
            <span className="text-xs font-bold text-slate-500 uppercase">Your Answer</span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{current.learnerAnswer}</p>
          </div>

          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl p-4 space-y-1 border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase">Correct Solution</span>
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">{current.correctAnswer}</p>
          </div>
        </div>

        <div className="bg-indigo-50/50 dark:bg-indigo-900/20 rounded-xl p-4 space-y-1 border border-indigo-100 dark:border-indigo-800">
          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Step-by-Step Explanation
          </span>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{current.explanation}</p>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 disabled:opacity-40"
          >
            Previous Question
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(mockCorrections.length - 1, prev + 1))}
            disabled={currentIndex === mockCorrections.length - 1}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-40"
          >
            Next Question
          </button>
        </div>
      </div>
    </div>
  );
};
