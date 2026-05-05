import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Brain, Mic, ScanLine, FileUp, Zap, ChevronRight } from 'lucide-react';

interface CreationHubProps {
    onNavigateToTool: (tool: 'CONVERT' | 'QUIZ' | 'DARASA_MODE' | 'MARKING' | 'SCHEMES' | 'LESSON_POLISH' | 'HOMEWORK') => void;
}

export const CreationHub: React.FC<CreationHubProps> = ({ onNavigateToTool }) => {
    const cardClass = "cursor-pointer bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/50 dark:border-slate-800 relative overflow-hidden group shadow-xl shadow-slate-200/40 dark:shadow-none hover:-translate-y-2 hover:shadow-2xl hover:border-emerald-200 dark:hover:border-emerald-500/50 transition-all duration-300";

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-emerald-900/40 border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-emerald-100 text-xs font-black tracking-widest uppercase mb-4 border border-white/10 shadow-inner">
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            Smart Engine
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3 text-white">Creation Hub</h2>
                        <p className="text-emerald-100 font-medium max-w-xl text-lg opacity-90 leading-relaxed">
                            Supercharge your teaching. Generate CBC notes, construct custom exams, and digitize syllabus documents instantly.
                        </p>
                    </div>
                </div>
            </div>

            {/* Tool Grid */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                    hidden: { opacity: 0 },
                    visible: {
                        opacity: 1,
                        transition: {
                            staggerChildren: 0.1
                        }
                    }
                }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12"
            >
                {/* Darasa Mode Card */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    onClick={() => onNavigateToTool('DARASA_MODE')}
                    className={cardClass}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-[100px] -z-10 group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                        <Mic className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Darasa Mode</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-6 leading-relaxed">
                        Record your live class sessions. The Smart Assistant will instantly transcribe, summarize, and generate targeted CBC quizzes for your students.
                    </p>
                    <div className="flex items-center text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-auto">
                        Start Recording <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* Exam Generator */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    onClick={() => onNavigateToTool('QUIZ')}
                    className={cardClass}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-bl-[100px] -z-10 group-hover:bg-teal-500/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-teal-700 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-500/30 group-hover:scale-110 transition-transform">
                        <Brain className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Smart Exam Builder</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-6 leading-relaxed">
                        Input a topic, drop in a scheme of work, or specify learning outcomes. We'll generate a complete, formatted exam paper.
                    </p>
                    <div className="flex items-center text-sm font-black text-teal-600 dark:text-teal-400 tracking-wider uppercase mt-auto">
                        Build Assessment <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* Document Convert */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    onClick={() => onNavigateToTool('CONVERT')}
                    className={cardClass}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-bl-[100px] -z-10 group-hover:bg-blue-500/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                        <FileUp className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Smart Digitize</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-6 leading-relaxed">
                        Upload messy PDFs, old lesson plans, or syllabi. We will rapidly convert them into rich, structured KNEC-aligned notes.
                    </p>
                    <div className="flex items-center text-sm font-black text-blue-600 dark:text-blue-400 tracking-wider uppercase mt-auto">
                        Upload Document <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* Auto Grader */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    onClick={() => onNavigateToTool('MARKING')}
                    className={cardClass}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-[100px] -z-10 group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform relative">
                        <ScanLine className="w-7 h-7" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border-2 border-white shadow-sm">Beta</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Smart Auto-Grader</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-6 leading-relaxed">
                        Snap a photo of handwritten student work. We will use OCR and Smart rules to evaluate it against CBC rubrics and pinpoint gaps.
                    </p>
                    <div className="flex items-center text-sm font-black text-emerald-600 dark:text-emerald-400 tracking-wider uppercase mt-auto">
                        Scan & Mark <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* Schemes of Work */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    onClick={() => onNavigateToTool('SCHEMES')}
                    className="cursor-pointer bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-[2.5rem] border border-slate-700/50 relative overflow-hidden group shadow-2xl hover:-translate-y-2 hover:shadow-emerald-500/20 transition-all duration-300"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -z-10 group-hover:bg-white/10 transition-colors"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-emerald-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                        <Zap className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight mb-2">Smart Schemes</h3>
                    <p className="text-slate-400 font-medium text-sm mb-6 leading-relaxed">
                        Generate comprehensive, KICD-compliant schemes for any term. Includes automated time-allocation and resource mapping.
                    </p>
                    <div className="flex items-center text-sm font-black text-blue-400 tracking-wider uppercase mt-auto">
                        Generate Now <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* Lesson Plan Polisher */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    onClick={() => onNavigateToTool('LESSON_POLISH')}
                    className={cardClass}
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-bl-[100px] -z-10 group-hover:bg-amber-500/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                        <FileText className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Lesson Polisher</h3>
                    <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-6 leading-relaxed">
                        Paste your lesson plan. We will cross-reference it with your student's weak points to suggest remedial focus areas automatically.
                    </p>
                    <div className="flex items-center text-sm font-black text-amber-600 dark:text-amber-500 tracking-wider uppercase mt-auto">
                        Refine Plan <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};
