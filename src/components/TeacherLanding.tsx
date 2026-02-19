import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, CheckCircle, Smartphone, Award, ChartBar, BookOpen, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TeacherLandingProps {
    onLogin: () => void;
    onRegister: () => void;
}

export const TeacherLanding: React.FC<TeacherLandingProps> = ({ onLogin, onRegister }) => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Clock className="w-6 h-6 text-blue-600" />,
            title: "Save 20+ Hours Weekly",
            desc: "Automate lesson planning, marking, and report generation."
        },
        {
            icon: <ChartBar className="w-6 h-6 text-green-600" />,
            title: "Track Performance",
            desc: "Real-time analytics on student progress and class attendance."
        },
        {
            icon: <Smartphone className="w-6 h-6 text-purple-600" />,
            title: "Mobile First Design",
            desc: "Manage your entire classroom from your phone, anywhere."
        },
        {
            icon: <BookOpen className="w-6 h-6 text-orange-600" />,
            title: "CBC Aligned Content",
            desc: "Access thousands of pre-approved lesson plans and schemes of work."
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden font-sans">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-96 bg-blue-600 rounded-b-[4rem] md:rounded-b-[8rem] z-0 shadow-xl overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-50"></div>
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent to-blue-900/20"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-20">
                {/* Header */}
                <nav className="flex items-center justify-between mb-12 md:mb-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-700 font-bold text-xl">S</div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Soma Smart <span className="text-blue-200 font-medium text-lg">Teacher</span></h1>
                    </div>
                    <button
                        onClick={() => navigate('/')}
                        className="text-white/80 hover:text-white font-medium text-sm transition-colors"
                    >
                        Back to Home
                    </button>
                </nav>

                <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                    {/* Hero Content */}
                    <div className="text-center md:text-left">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-500/30 text-blue-50 backdrop-blur-sm border border-blue-400/30 text-sm font-bold mb-6">
                                🚀 The #1 App for Kenyan Teachers
                            </span>
                            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                                Teaching Made <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">Simple & Smart.</span>
                            </h1>
                            <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-lg mx-auto md:mx-0 leading-relaxed">
                                Join 10,000+ teachers upgrading their classroom with AI-powered lesson plans, automated marking, and instant reports.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                                <button
                                    onClick={onRegister}
                                    className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl shadow-lg shadow-blue-900/20 hover:bg-blue-50 hover:scale-105 transition-all flex items-center justify-center gap-3"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Start Free Account
                                </button>
                                <button
                                    onClick={onLogin}
                                    className="px-8 py-4 bg-blue-700/50 text-white font-bold rounded-xl border border-blue-400/30 hover:bg-blue-700 hover:border-blue-400 transition-all flex items-center justify-center gap-3 backdrop-blur-md"
                                >
                                    <LogIn className="w-5 h-5" />
                                    Teacher Login
                                </button>
                            </div>

                            <p className="mt-6 text-blue-200 text-sm flex items-center justify-center md:justify-start gap-2">
                                <CheckCircle className="w-4 h-4 text-green-400" /> No credit card required. Free forever plan available.
                            </p>
                        </motion.div>
                    </div>

                    {/* Hero Image / Preview */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="relative hidden md:block"
                    >
                        {/* Abstract Phone Mockup */}
                        <div className="relative z-10 bg-white rounded-[2.5rem] p-4 shadow-2xl border-8 border-slate-900 w-[320px] mx-auto rotate-[-6deg] hover:rotate-0 transition-transform duration-500">
                            <div className="h-8 w-32 bg-slate-900 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-20"></div>
                            <div className="bg-slate-50 rounded-[2rem] overflow-hidden h-[640px] relative border border-slate-200">
                                {/* Screen Content Mockup */}
                                <div className="bg-blue-600 h-40 p-6 pt-12 text-white">
                                    <h3 className="font-bold text-lg">Good Morning, Tr. Michael! 👋</h3>
                                    <div className="mt-4 flex gap-4">
                                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-lg flex-1">
                                            <p className="text-xs opacity-80">Next Class</p>
                                            <p className="font-bold">Grade 4 Math</p>
                                        </div>
                                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-lg flex-1">
                                            <p className="text-xs opacity-80">Pending</p>
                                            <p className="font-bold">3 Assignments</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div className="h-24 bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600"><BookOpen className="w-6 h-6" /></div>
                                        <div>
                                            <p className="font-bold text-slate-800">Lesson Plans</p>
                                            <p className="text-xs text-slate-500">Generate instantly with AI</p>
                                        </div>
                                    </div>
                                    <div className="h-24 bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600"><CheckCircle className="w-6 h-6" /></div>
                                        <div>
                                            <p className="font-bold text-slate-800">Auto-Marking</p>
                                            <p className="text-xs text-slate-500">Scan papers to grade</p>
                                        </div>
                                    </div>
                                    <div className="h-24 bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600"><ChartBar className="w-6 h-6" /></div>
                                        <div>
                                            <p className="font-bold text-slate-800">Reports</p>
                                            <p className="text-xs text-slate-500">Share with parents</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute top-20 -right-10 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce z-20">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">A+</div>
                            <div>
                                <p className="font-bold text-slate-800">Class Performance</p>
                                <p className="text-xs text-green-600 font-bold">+18% Improved</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Features Grid */}
                <div className="mt-24 grid md:grid-cols-4 gap-6">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group"
                        >
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">{f.icon}</div>
                            <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};
