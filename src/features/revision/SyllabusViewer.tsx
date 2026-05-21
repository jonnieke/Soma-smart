import React, { useState, useEffect } from 'react';
import { ArrowLeft, BookOpen, Target, CheckCircle, GraduationCap, FileText, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
    data: any;
    onExit: () => void;
}

interface SyllabusStrand {
    title: string;
    objectives: string[];
}

export const SyllabusViewer: React.FC<Props> = ({ data, onExit }) => {
    const [loading, setLoading] = useState(true);
    const [strands, setStrands] = useState<SyllabusStrand[]>([]);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'document'>('overview');

    const title = data?.title || 'Syllabus';
    const subject = data?.subject || '';
    const grade = data?.grade || '';

    useEffect(() => {
        const init = async () => {
            try {
                if (data?.file_path) {
                    const encodedPath = data.file_path ? data.file_path.split('/').map(encodeURIComponent).join('/') : '';
                    const fallbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/syllabus-docs/${encodedPath}`;
                    const docUrl = data.file_url || data.fileUrl || fallbackUrl;
                    const isImage = data.file_path?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);

                    if (!isImage) {
                        setPdfUrl(docUrl);
                    }

                    // Try to extract strands from AI
                    try {
                        const response = await fetch(docUrl);
                        if (response.ok) {
                            // For syllabus, we just show the PDF — no AI analysis needed
                            // Generate basic structure from metadata
                        }
                    } catch (e) {
                        console.warn('Could not fetch syllabus document:', e);
                    }
                }

                // Generate overview strands from metadata
                setStrands([
                    {
                        title: 'Learning Objectives', objectives: [
                            `Understand core ${subject} concepts for ${grade}`,
                            `Apply knowledge in practical contexts`,
                            `Demonstrate competency in assessments`
                        ]
                    },
                    {
                        title: 'Assessment Standards', objectives: [
                            'Formative and summative evaluation criteria',
                            'Expected competency levels for this grade',
                            'Performance indicators and benchmarks'
                        ]
                    },
                    {
                        title: 'Scope & Coverage', objectives: [
                            `Complete ${subject} syllabus for ${grade}`,
                            'Strands, sub-strands, and specific learning outcomes',
                            'Suggested learning activities and resources'
                        ]
                    }
                ]);

                setLoading(false);
            } catch (error) {
                console.error('Error loading syllabus:', error);
                setLoading(false);
            }
        };
        init();
    }, [data]);

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Loading syllabus...</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm transition-colors">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white">{title}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-2">
                            <GraduationCap className="w-3 h-3" />
                            {subject} • {grade}
                            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                Open Access
                            </span>
                        </p>
                    </div>
                </div>

                {/* View Toggle */}
                {pdfUrl && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setViewMode('overview')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'overview'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setViewMode('document')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'document'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Full Document
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {viewMode === 'document' && pdfUrl ? (
                    /* PDF Viewer */
                    <div className="h-full">
                        <embed
                            src={pdfUrl}
                            type="application/pdf"
                            className="w-full h-full"
                            style={{ minHeight: 'calc(100vh - 80px)' }}
                        />
                    </div>
                ) : (
                    /* Overview */
                    <div className="max-w-3xl mx-auto p-6 space-y-6">
                        {/* Hero Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl text-white relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <BookOpen className="w-10 h-10 mb-4 opacity-80" />
                                <h2 className="text-2xl font-black mb-2">{title}</h2>
                                <p className="text-emerald-100 text-sm leading-relaxed max-w-lg">
                                    This syllabus outlines what learners should study, achieve, and master in {subject} at {grade} level.
                                    It's your roadmap — what to learn, not how to be examined.
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10" />
                        </motion.div>

                        {/* Info Banner */}
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Information Only — Not for Examination</p>
                                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 font-medium">
                                    The syllabus is a guide for what you should learn. It is not examined directly.
                                    Use it to understand the scope of your studies and plan your revision.
                                </p>
                            </div>
                        </div>

                        {/* Strands */}
                        {strands.map((strand, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors"
                            >
                                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                                            {idx === 0 && <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                            {idx === 1 && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                            {idx === 2 && <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-200">{strand.title}</h3>
                                    </div>
                                </div>
                                <div className="p-6 space-y-3">
                                    {strand.objectives.map((obj, objIdx) => (
                                        <div key={objIdx} className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{objIdx + 1}</span>
                                            </div>
                                            <p className="text-sm text-slate-700 dark:text-slate-400 leading-relaxed font-medium">{obj}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}

                        {/* View Full Document CTA */}
                        {pdfUrl && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                onClick={() => setViewMode('document')}
                                className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-emerald-300 dark:border-emerald-900 rounded-2xl p-6 text-center hover:border-emerald-500 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all group"
                            >
                                <FileText className="w-8 h-8 text-emerald-400 dark:text-emerald-600 mx-auto mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                                <p className="font-bold text-emerald-700 dark:text-emerald-400">View Full Syllabus Document</p>
                                <p className="text-xs text-emerald-500 dark:text-emerald-600 mt-1">Open the complete PDF document</p>
                            </motion.button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
