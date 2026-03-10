import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, FileText, Brain, Mic, ScanLine, FileUp, Zap, ChevronRight } from 'lucide-react';

interface CreationHubProps {
    onNavigateToTool: (tool: 'CONVERT' | 'QUIZ' | 'DARASA_MODE' | 'MARKING' | 'SCHEMES' | 'LESSON_POLISH' | 'HOMEWORK') => void;
}

export const CreationHub: React.FC<CreationHubProps> = ({ onNavigateToTool }) => {
    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-indigo-100 text-xs font-black tracking-widest uppercase mb-4 border border-white/10">
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            AI Powered
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Creation Hub</h2>
                        <p className="text-indigo-100 font-medium max-w-xl text-lg opacity-90">
                            Supercharge your teaching. Generate CBC notes, construct custom exams, and digitize syllabus documents in seconds.
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
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => onNavigateToTool('DARASA_MODE')}
                    className="cursor-pointer bg-white p-8 rounded-[2rem] border-2 border-indigo-100 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-indigo-50/50 transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -z-10 group-hover:bg-indigo-100 transition-colors"></div>
                    <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 group-hover:scale-110 transition-transform">
                        <Mic className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Darasa Mode</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                        Record your live class sessions. AI will instantly transcribe, summarize, and generate targeted CBC quizzes for your students.
                    </p>
                    <div className="flex items-center text-sm font-black text-indigo-600 tracking-wider uppercase">
                        Start Recording <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* Exam Generator */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => onNavigateToTool('QUIZ')}
                    className="cursor-pointer bg-white p-8 rounded-[2rem] border-2 border-purple-100 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-purple-50/50 transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-bl-[100px] -z-10 group-hover:bg-purple-100 transition-colors"></div>
                    <div className="w-14 h-14 bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
                        <Brain className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Exam Builder</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                        Input a topic, drop in a scheme of work, or specify learning outcomes. We'll generate a complete, formatted exam paper.
                    </p>
                    <div className="flex items-center text-sm font-black text-purple-600 tracking-wider uppercase">
                        Build Assessment <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* Document Convert */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => onNavigateToTool('CONVERT')}
                    className="cursor-pointer bg-white p-8 rounded-[2rem] border-2 border-blue-100 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-blue-50/50 transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -z-10 group-hover:bg-blue-100 transition-colors"></div>
                    <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                        <FileUp className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Smart Digitize</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                        Upload messy PDFs, old lesson plans, or syllabi. We will convert them into rich, structured markdown notes ready for distribution.
                    </p>
                    <div className="flex items-center text-sm font-black text-blue-600 tracking-wider uppercase">
                        Upload Document <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* Auto Grader (Coming Soon) */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => onNavigateToTool('MARKING')}
                    className="cursor-pointer bg-white p-8 rounded-[2rem] border-2 border-emerald-100 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-emerald-50/50 transition-all opacity-80"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-[100px] -z-10 group-hover:bg-emerald-100 transition-colors"></div>
                    <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform relative">
                        <ScanLine className="w-7 h-7" />
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest border-2 border-white">Beta</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Auto Grader</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                        Snap a photo of handwritten student work. We will use OCR and AI to evaluate it against CBC rubrics and identify knowledge gaps.
                    </p>
                    <div className="flex items-center text-sm font-black text-emerald-600 tracking-wider uppercase">
                        Scan & Mark <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* AI Schemes of Work */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => onNavigateToTool('SCHEMES')}
                    className="cursor-pointer bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] border-2 border-slate-700 relative overflow-hidden group shadow-xl transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -z-10 group-hover:bg-white/10 transition-colors"></div>
                    <div className="w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-400/20 group-hover:scale-110 transition-transform">
                        <Zap className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-tight mb-2">AI Schemes of Work</h3>
                    <p className="text-slate-400 font-medium text-sm mb-6 leading-relaxed">
                        Generate comprehensive, KICD-compliant schemes for any term. Includes automated time-allocation and resource mapping.
                    </p>
                    <div className="flex items-center text-sm font-black text-blue-400 tracking-wider uppercase">
                        Generate Now <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* Lesson Plan Polisher */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => onNavigateToTool('LESSON_POLISH')}
                    className="cursor-pointer bg-white p-8 rounded-[2rem] border-2 border-amber-100 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-amber-50/50 transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-[100px] -z-10 group-hover:bg-amber-100 transition-colors"></div>
                    <div className="w-14 h-14 bg-amber-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-200 group-hover:scale-110 transition-transform">
                        <FileText className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Lesson Polisher</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                        Paste your lesson plan. We will cross-reference it with your student's recorded weak points to suggest remedial focus areas.
                    </p>
                    <div className="flex items-center text-sm font-black text-amber-600 tracking-wider uppercase">
                        Refine Plan <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>

                {/* Homework Creator */}
                <motion.div
                    variants={{
                        hidden: { opacity: 0, y: 20 },
                        visible: { opacity: 1, y: 0 }
                    }}
                    whileHover={{ y: -5, scale: 1.02 }}
                    onClick={() => onNavigateToTool('HOMEWORK')}
                    className="cursor-pointer bg-white p-8 rounded-[2rem] border-2 border-rose-100 relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-rose-50/50 transition-all"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-[100px] -z-10 group-hover:bg-rose-100 transition-colors"></div>
                    <div className="w-14 h-14 bg-rose-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-rose-200 group-hover:scale-110 transition-transform">
                        <Sparkles className="w-7 h-7" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Homework Generator</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6 leading-relaxed">
                        Instantly create engaging, CBC-aligned homework assignments based on today's lesson, mapped to your class profile.
                    </p>
                    <div className="flex items-center text-sm font-black text-rose-600 tracking-wider uppercase">
                        Create Task <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};
