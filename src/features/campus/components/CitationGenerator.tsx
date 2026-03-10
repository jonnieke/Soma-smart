import React, { useState } from 'react';
import { ArrowLeft, Quote, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const CitationGenerator: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [url, setUrl] = useState('');
    const [style, setStyle] = useState('APA');
    const [copied, setCopied] = useState(false);

    // Mock citation
    const generatedCitation = url ? `Smith, J. (2024). A Study on the effects of ${url.substring(0, 10)}. Journal of Education, 14(2), 112-130.` : '';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold">
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
            </button>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 shadow-xl">
                <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                    <Quote className="w-10 h-10 text-amber-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 text-center">Citation Generator</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8 text-center bg-transparent">
                    Paste a URL, DOI, or book title to instantly generate properly formatted citations in APA, MLA, or Chicago style.
                </p>

                <div className="max-w-2xl mx-auto space-y-6">
                    <div className="flex gap-4">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="Enter URL or DOI..."
                            className="flex-1 px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-lg font-medium dark:text-white transition-all shadow-sm"
                        />
                        <select
                            value={style}
                            onChange={(e) => setStyle(e.target.value)}
                            className="px-6 py-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl text-lg font-bold text-slate-700 dark:text-slate-300 outline-none focus:border-amber-500 shadow-sm"
                        >
                            <option value="APA">APA 7</option>
                            <option value="MLA">MLA 9</option>
                            <option value="CHICAGO">Chicago</option>
                            <option value="HARVARD">Harvard</option>
                        </select>
                    </div>

                    <button
                        disabled={!url.trim()}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 disabled:dark:bg-slate-700 text-white font-bold rounded-2xl text-lg transition-all shadow-md active:scale-[0.98]"
                    >
                        Generate Citation
                    </button>

                    {generatedCitation && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-2xl relative group"
                        >
                            <h4 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">{style} Format</h4>
                            <p className="text-slate-800 dark:text-slate-200 text-lg leading-relaxed pr-12 font-serif">
                                {generatedCitation}
                            </p>

                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedCitation);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                }}
                                className="absolute top-6 right-6 p-2 bg-white dark:bg-slate-800 rounded-xl shadow border border-slate-100 dark:border-slate-700 text-slate-500 hover:text-amber-600 transition-colors"
                            >
                                {copied ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};
