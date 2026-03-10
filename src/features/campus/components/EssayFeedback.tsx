import React from 'react';
import { ArrowLeft, PenTool, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export const EssayFeedback: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold">
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
            </button>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                    <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-6">
                        <PenTool className="w-8 h-8 text-purple-500" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Essay Feedback</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Submit your essay for comprehensive AI analysis. We'll check for clarity, flow, argumentation, and grammar before you hand it in.
                    </p>

                    <textarea
                        placeholder="Paste your essay here..."
                        className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none resize-none text-base dark:text-white mb-4"
                        rows={10}
                    />

                    <button className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-2xl text-lg transition-all shadow-md shadow-purple-600/20 active:scale-[0.98]">
                        Analyze Essay
                    </button>
                </div>

                <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-4">What we check:</h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Thesis Clarity</span>
                                <p className="text-xs text-slate-500 mt-1">Is your main argument strong and clear?</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Structural Flow</span>
                                <p className="text-xs text-slate-500 mt-1">Do your paragraphs transition smoothly?</p>
                            </div>
                        </li>
                        <li className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                                <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">Grammar & Tone</span>
                                <p className="text-xs text-slate-500 mt-1">Is the academic tone consistent?</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
