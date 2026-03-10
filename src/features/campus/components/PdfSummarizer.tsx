import React from 'react';
import { ArrowLeft, FileText, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

export const PdfSummarizer: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold">
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
            </button>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 md:p-12 text-center shadow-xl">
                <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4">PDF Summarizer</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto mb-8">
                    Upload your lengthy research papers, lecture notes, or textbook chapters. Somo AI will extract the key insights, main arguments, and definitions instantly.
                </p>

                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-12 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                    <UploadCloud className="w-12 h-12 text-slate-400 group-hover:text-indigo-500 mx-auto mb-4 transition-colors" />
                    <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">Click to upload or drag and drop</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-500">PDF, DOCX up to 10MB</p>
                </div>
            </div>
        </div>
    );
};
