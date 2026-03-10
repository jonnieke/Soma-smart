import React, { useState } from 'react';
import { ArrowLeft, Search, Send, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export const ResearchAssistant: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [query, setQuery] = useState('');

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold">
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
            </button>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col items-center">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mb-6">
                    <Search className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 text-center">Research Assistant</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8 text-center">
                    Ask complex academic questions. I will search through verified academic sources and provide a well-cited, comprehensive answer.
                </p>

                <div className="w-full max-w-2xl relative">
                    <textarea
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="E.g., What are the socio-economic impacts of renewable energy adoption in East Africa?"
                        className="w-full pl-6 pr-16 py-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-3xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none hide-scrollbar text-lg font-medium dark:text-white"
                        rows={3}
                    />
                    <button
                        disabled={!query.trim()}
                        className="absolute right-3 bottom-3 p-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white rounded-2xl transition-all"
                    >
                        <Sparkles className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};
