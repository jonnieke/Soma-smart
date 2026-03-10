import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { DashboardLayout } from '../../components/DashboardLayout';
import { SidebarTab } from '../../components/DashboardSidebar';
import {
    FileText, Search as SearchIcon, Quote, BookOpen,
    PenTool, Users, ArrowRight, Sparkles, GraduationCap
} from 'lucide-react';

// Stub components (will be split later or implemented within the dashboard based on mode)
import { PdfSummarizer } from './components/PdfSummarizer';
import { ResearchAssistant } from './components/ResearchAssistant';
import { CitationGenerator } from './components/CitationGenerator';
import { AssignmentHelper } from './components/AssignmentHelper';
import { EssayFeedback } from './components/EssayFeedback';

type CampusMode = 'OVERVIEW' | 'PDF_SUMMARIZER' | 'RESEARCH' | 'CITATION' | 'ASSIGNMENT' | 'ESSAY';

export const CampusDashboard: React.FC = () => {
    const { studentProfile, isPro } = useApp();
    const navigate = useNavigate();
    const [mode, setMode] = useState<CampusMode>('OVERVIEW');

    const tools = [
        { id: 'PDF_SUMMARIZER', name: 'PDF Summarizer', icon: FileText, desc: 'Upload research papers and get instant, readable summaries.', color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
        { id: 'RESEARCH', name: 'Research Assistant', icon: SearchIcon, desc: 'Ask complex academic questions and get cited answers.', color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
        { id: 'CITATION', name: 'Citation Generator', icon: Quote, desc: 'Generate APA, MLA, or Chicago citations instantly.', color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
        { id: 'ASSIGNMENT', name: 'Assignment Helper', icon: BookOpen, desc: 'Get structured help breaking down and tackling assignments.', color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
        { id: 'ESSAY', name: 'Essay Feedback', icon: PenTool, desc: 'Submit your essays for AI grading and critique.', color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
        { id: 'STUDY_ROOMS', name: 'Campus Study Rooms', icon: Users, desc: 'Join collaborative study groups for your courses.', color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30', action: () => navigate('/exam-rooms') }
    ];

    const handleTabChange = (tab: SidebarTab) => {
        switch (tab) {
            case 'HOME':
                setMode('OVERVIEW');
                break;
            case 'EXAM_ROOMS':
                navigate('/exam-rooms');
                break;
            // Map other tabs as needed...
            default:
                break;
        }
    };

    const renderContent = () => {
        switch (mode) {
            case 'PDF_SUMMARIZER': return <PdfSummarizer onBack={() => setMode('OVERVIEW')} />;
            case 'RESEARCH': return <ResearchAssistant onBack={() => setMode('OVERVIEW')} />;
            case 'CITATION': return <CitationGenerator onBack={() => setMode('OVERVIEW')} />;
            case 'ASSIGNMENT': return <AssignmentHelper onBack={() => setMode('OVERVIEW')} />;
            case 'ESSAY': return <EssayFeedback onBack={() => setMode('OVERVIEW')} />;
            case 'OVERVIEW':
            default:
                return (
                    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div className="space-y-2">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-bold uppercase tracking-widest mb-2">
                                    <GraduationCap className="w-4 h-4" />
                                    Campus Edition
                                </div>
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Welcome back, {studentProfile?.name?.split(' ')[0] || 'Scholar'}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-lg">
                                    What are we working on today? Select an academic tool below to get started.
                                </p>
                            </div>
                        </div>

                        {/* Tools Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tools.map((tool, i) => (
                                <motion.button
                                    key={tool.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => tool.action ? tool.action() : setMode(tool.id as CampusMode)}
                                    className="group flex flex-col items-start p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-left relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${tool.bg} shadow-sm group-hover:scale-110 transition-transform`}>
                                        <tool.icon className={`w-7 h-7 ${tool.color}`} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {tool.name}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                        {tool.desc}
                                    </p>
                                </motion.button>
                            ))}
                        </div>

                        {/* Pro Callout */}
                        {!isPro && (
                            <div className="mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-indigo-900/20">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur">
                                        <Sparkles className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold mb-1">Unlock Campus Pro</h3>
                                        <p className="text-indigo-100 max-w-md">
                                            Get unlimited PDF summaries, deeper research analysis, and plagiarism checks with Somo Smart Pro.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate('/pricing')}
                                    className="px-6 py-3 bg-white text-indigo-600 hover:bg-slate-50 rounded-xl font-bold whitespace-nowrap shadow-sm transition-transform hover:-translate-y-0.5"
                                >
                                    Upgrade Now
                                </button>
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <DashboardLayout activeTab="HOME" onTabChange={handleTabChange}>
            <AnimatePresence mode="wait">
                <motion.div
                    key={mode}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {renderContent()}
                </motion.div>
            </AnimatePresence>
        </DashboardLayout>
    );
};
