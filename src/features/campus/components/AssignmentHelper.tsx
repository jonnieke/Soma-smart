import React from 'react';
import { ArrowLeft, BookOpen, Clock, Target } from 'lucide-react';
import { motion } from 'framer-motion';

export const AssignmentHelper: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold">
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
            </button>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl">
                <div className="flex items-center gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                    <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-3xl flex items-center justify-center shrink-0">
                        <BookOpen className="w-10 h-10 text-emerald-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Assignment Helper</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Break down complex assignments into manageable milestones with AI guidance.
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                            <Target className="w-5 h-5 text-emerald-500" />
                            Paste your assignment prompt
                        </h3>
                        <textarea
                            placeholder="E.g., Write a 2000-word essay analyzing the impact of AI on modern education, citing at least 5 peer-reviewed sources."
                            className="w-full p-4 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-emerald-500 outline-none resize-none hide-scrollbar text-sm dark:text-white"
                            rows={4}
                        />

                        <div className="flex gap-4 mt-4">
                            <button className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md">
                                Generate Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
