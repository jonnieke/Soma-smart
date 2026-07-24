import React from 'react';
import { motion } from 'framer-motion';
import {
    LogIn, UserPlus, CheckCircle, Smartphone, Award, ChartBar, BookOpen, Clock,
    ChevronRight, Star, ArrowRight, Sparkles, FileText, Zap, Mic, ShieldCheck,
    MessageCircle, Users, Layers, Trophy, CheckCircle2, GraduationCap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logoImg from '../assets/images/main_logo.png';

interface TeacherLandingProps {
    onLogin: () => void;
    onRegister: () => void;
    onExploreTool?: (tab: string) => void;
}

export const TeacherLanding: React.FC<TeacherLandingProps> = ({ onLogin, onRegister, onExploreTool }) => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Clock className="w-6 h-6 text-white" />,
            title: "Save 2+ Hours Daily",
            desc: "Generate complete CBC schemes of work, lesson plans, and homework drafts in minutes.",
            bg: "bg-indigo-600"
        },
        {
            icon: <ChartBar className="w-6 h-6 text-white" />,
            title: "Automated Marking",
            desc: "Mark student quizzes and assignments instantly with structured KNEC marking schemes.",
            bg: "bg-emerald-600"
        },
        {
            icon: <Mic className="w-6 h-6 text-white" />,
            title: "Darasa Class Recaps",
            desc: "Record a 2-minute summary after class to generate parent recaps and absent student notes.",
            bg: "bg-purple-600"
        },
        {
            icon: <BookOpen className="w-6 h-6 text-white" />,
            title: "KICD/CBC Compliant",
            desc: "Curriculum-aligned templates for Primary, JSS (Grades 7-9), and Senior Secondary (Forms 1-4).",
            bg: "bg-amber-600"
        }
    ];

    const teacherTools = [
        {
            id: 'LESSON_PLAN_GENERATOR',
            title: 'CBC Schemes & Lesson Plans',
            desc: 'Generate complete KICD-compliant schemes of work and structured lesson plans in seconds.',
            icon: <FileText className="w-6 h-6 text-indigo-400" />,
            badge: 'Popular',
            actionText: 'Generate Lesson Plan',
        },
        {
            id: 'HOMEWORK_CREATOR',
            title: 'Quiz & Homework Creator',
            desc: 'Create topical quizzes with answer keys and printable student worksheets.',
            icon: <Zap className="w-6 h-6 text-emerald-400" />,
            badge: 'Fast Prep',
            actionText: 'Create Quiz Draft',
        },
        {
            id: 'MARKING',
            title: 'Automated Assignment Marker',
            desc: 'Scan or paste student answers to get instant marking feedback and mark allocations.',
            icon: <CheckCircle2 className="w-6 h-6 text-purple-400" />,
            badge: 'Instant Feedback',
            actionText: 'Open Assignment Marker',
        },
        {
            id: 'DARASA_MODE',
            title: 'Darasa Classroom Recap',
            desc: 'Record voice recaps after class to generate summary notes for parents and students.',
            icon: <Mic className="w-6 h-6 text-sky-400" />,
            badge: 'Audio AI',
            actionText: 'Try Darasa Mode',
        },
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">

            {/* Top Navigation */}
            <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/90 backdrop-blur-xl px-4 py-3.5 sm:px-8">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <button
                        onClick={() => navigate('/teacher')}
                        className="flex items-center gap-2.5 transition hover:opacity-90"
                    >
                        <img src={logoImg} alt="Somo Smart Logo" className="h-9 w-9 object-contain" />
                        <span className="text-xl font-black text-white">Somo Smart</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-indigo-300 border border-indigo-500/30">
                            <GraduationCap className="w-3 h-3 text-indigo-400" /> Teacher Studio
                        </span>
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/contact')}
                            className="hidden text-xs font-bold text-slate-300 hover:text-white sm:inline-block"
                        >
                            Support (0722763760)
                        </button>
                        <button
                            onClick={onLogin}
                            className="px-3.5 py-2 text-xs font-black text-slate-300 hover:text-white"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={onRegister}
                            className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            Start Free
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">

                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-6 sm:p-12 border border-indigo-800/40 shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-3xl space-y-6">
                        <div className="inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-3.5 py-1 text-xs font-extrabold text-amber-300 border border-amber-400/20">
                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Designed for Kenyan Educators
                        </div>

                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08]">
                            Kenyan Educator <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-300">Teacher Studio</span>
                        </h1>

                        <p className="text-slate-300 text-sm sm:text-base font-medium leading-relaxed max-w-2xl">
                            Plan, teach, mark, and communicate from one powerful space. Generate CBC schemes of work, structured lesson notes, and automated quiz marking in minutes.
                        </p>

                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <button
                                onClick={onRegister}
                                className="px-7 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-sm hover:from-indigo-500 hover:to-purple-500 transition-all shadow-xl shadow-indigo-600/30 inline-flex items-center gap-2"
                            >
                                <span>Create Free Teacher Account</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>
                            <button
                                onClick={onLogin}
                                className="px-6 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
                            >
                                Sign In to Workspace
                            </button>
                        </div>
                    </div>
                </div>

                {/* Key Benefits Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {features.map((f, i) => (
                        <div key={i} className="rounded-2xl bg-slate-800/80 p-5 border border-slate-700/80 space-y-3">
                            <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center font-bold shadow-md`}>
                                {f.icon}
                            </div>
                            <h3 className="text-base font-black text-white">{f.title}</h3>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Teacher Tools Interactive Showcase */}
                <div className="space-y-6 pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-extrabold uppercase tracking-wider mb-1">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Teaching Tools Suite
                            </div>
                            <h2 className="text-2xl font-black text-white">
                                Everything You Need for Classroom Success
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">
                                Select any tool to test or launch your teaching workflow.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {teacherTools.map(tool => (
                            <div
                                key={tool.id}
                                onClick={() => onExploreTool ? onExploreTool(tool.id) : onRegister()}
                                className="group cursor-pointer rounded-2xl bg-slate-800/80 hover:bg-slate-800 p-5 border border-slate-700/80 hover:border-indigo-500/80 transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black uppercase tracking-wider text-indigo-300">
                                            {tool.badge}
                                        </span>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-900/80 flex items-center justify-center mb-3 border border-slate-700">
                                        {tool.icon}
                                    </div>
                                    <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors leading-snug">
                                        {tool.title}
                                    </h3>
                                    <p className="text-xs text-slate-400 font-medium mt-2 leading-relaxed">
                                        {tool.desc}
                                    </p>
                                </div>

                                <div className="mt-5 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs font-black text-indigo-400 group-hover:text-indigo-300">
                                    <span>{tool.actionText}</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Direct WhatsApp School Support Banner */}
                <div className="rounded-3xl bg-gradient-to-r from-emerald-900/50 via-slate-900 to-indigo-950 p-6 sm:p-8 border border-emerald-700/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0">
                            <MessageCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-white">Need School Setup or Teacher Bulk Accounts?</h3>
                            <p className="text-xs text-slate-300 mt-1">
                                Chat directly with our education team on WhatsApp <span className="text-emerald-400 font-bold">0722763760</span> for school onboarding or bulk teacher packages.
                            </p>
                        </div>
                    </div>

                    <a
                        href="https://wa.me/254722763760?text=Hi%20Somo%20Smart%20Support%2C%20I%20am%20a%20teacher%20and%20need%20assistance%20with%20school%20onboarding."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-emerald-950/40 inline-flex items-center gap-2"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat Support (0722763760)</span>
                    </a>
                </div>

            </main>
        </div>
    );
};

export default TeacherLanding;
