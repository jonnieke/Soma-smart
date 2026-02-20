
import React from 'react';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, CheckCircle, Smartphone, Award, ChartBar, BookOpen, Clock, ChevronRight, Star, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TeacherLandingProps {
    onLogin: () => void;
    onRegister: () => void;
}

export const TeacherLanding: React.FC<TeacherLandingProps> = ({ onLogin, onRegister }) => {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Clock className="w-6 h-6 text-white" />,
            title: "Save 20+ Hours/Week",
            desc: "AI-generated lesson plans and automated marking reclaim your free time.",
            bg: "bg-blue-500"
        },
        {
            icon: <ChartBar className="w-6 h-6 text-white" />,
            title: "Real-Time Insights",
            desc: "Track student performance instantly. Identify gaps before they become problems.",
            bg: "bg-emerald-500"
        },
        {
            icon: <Smartphone className="w-6 h-6 text-white" />,
            title: "Mobile First",
            desc: "Your entire classroom in your pocket. Works perfectly on any smartphone.",
            bg: "bg-purple-500"
        },
        {
            icon: <BookOpen className="w-6 h-6 text-white" />,
            title: "CBC Ready Content",
            desc: "Thousands of pre-approved resources aligned with the latest curriculum.",
            bg: "bg-orange-500"
        }
    ];

    return (
        <div className="min-h-screen bg-white font-sans selection:bg-orange-200 selection:text-orange-900">
            {/* --- HERO SECTION --- */}
            <div className="relative bg-blue-600 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800"></div>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-3xl -ml-20 -mb-20"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20 lg:pb-32">
                    {/* Header */}
                    <nav className="flex items-center justify-between mb-16 lg:mb-24">
                        <div
                            className="flex items-center gap-3 cursor-pointer group"
                            onClick={() => navigate('/')}
                        >
                            <div className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center text-blue-700 font-black text-xl group-hover:scale-105 transition-transform">S</div>
                            <h1 className="text-xl font-bold text-white tracking-tight group-hover:text-blue-100 transition-colors">Soma Smart <span className="opacity-80 font-normal">Teacher</span></h1>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            className="text-white/80 hover:text-white font-medium text-sm transition-colors flex items-center gap-2"
                        >
                            Back to Home <ChevronRight className="w-4 h-4" />
                        </button>
                    </nav>

                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left Column: Text */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-center lg:text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/30 border border-blue-400/30 backdrop-blur-sm text-blue-50 text-sm font-bold mb-8">
                                <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
                                The #1 App for Kenyan Teachers
                            </div>

                            <h1 className="text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight">
                                Teaching Made <br className="hidden lg:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 animate-gradient-x">Simple & Smart.</span>
                            </h1>

                            <p className="text-xl text-blue-100 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                                Join 10,000+ teachers upgrading their classroom with AI-powered lesson plans, automated marking, and instant learner reports.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                <button
                                    onClick={onRegister}
                                    className="px-8 py-4 bg-white text-blue-700 font-black text-lg rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-blue-50 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
                                >
                                    <UserPlus className="w-5 h-5" />
                                    Start Free Account
                                </button>
                                <button
                                    onClick={onLogin}
                                    className="px-8 py-4 bg-blue-500/20 text-white font-bold text-lg rounded-2xl border border-white/20 hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
                                >
                                    <LogIn className="w-5 h-5" />
                                    Teacher Login
                                </button>
                            </div>

                            <p className="mt-8 text-blue-200/80 text-sm font-medium flex items-center justify-center lg:justify-start gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" /> No credit card required. Free forever plan available.
                            </p>
                        </motion.div>

                        {/* Right Column: Phone Mockup */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative hidden lg:block"
                        >
                            <div className="relative z-10 w-[340px] mx-auto rotate-[-6deg] hover:rotate-0 transition-transform duration-700 ease-out">
                                {/* Phone Frame */}
                                <div className="bg-slate-900 rounded-[3rem] p-3 shadow-2xl border-4 border-slate-800 ring-1 ring-white/20">
                                    <div className="bg-slate-950 rounded-[2.5rem] overflow-hidden relative h-[680px]">
                                        {/* Status Bar */}
                                        <div className="h-8 bg-slate-950 flex justify-between items-center px-6 text-white text-[10px] font-bold">
                                            <span>9:41</span>
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 bg-white/20 rounded-sm"></div>
                                                <div className="w-3 h-3 bg-white/20 rounded-sm"></div>
                                                <div className="w-4 h-3 bg-white/80 rounded-sm"></div>
                                            </div>
                                        </div>

                                        {/* Dynamic Island */}
                                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-20 flex justify-center items-center">
                                            <div className="w-16 h-4 bg-slate-900/50 rounded-full"></div>
                                        </div>

                                        {/* App Content */}
                                        <div className="bg-blue-600 h-full text-white overflow-hidden flex flex-col pt-8">
                                            <div className="px-6 pb-6 pt-4">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div>
                                                        <p className="text-blue-200 text-xs font-medium uppercase tracking-wider mb-1">Welcome back</p>
                                                        <h3 className="text-2xl font-bold">Tr. Michael 👋</h3>
                                                    </div>
                                                    <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md">
                                                        <img src="https://i.pravatar.cc/100?img=11" alt="Profile" className="w-8 h-8 rounded-full" />
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 mb-6">
                                                    <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                                        <p className="text-xs text-blue-200 mb-1">Next Class</p>
                                                        <p className="font-bold text-lg">Grade 4 Math</p>
                                                        <p className="text-xs text-blue-200 mt-1">10:00 AM</p>
                                                    </div>
                                                    <div className="flex-1 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
                                                        <p className="text-xs text-blue-200 mb-1">Pending</p>
                                                        <p className="font-bold text-lg">3 Tasks</p>
                                                        <p className="text-xs text-blue-200 mt-1">Marking</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 flex-1 rounded-t-[2.5rem] p-6 space-y-4">
                                                <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4">Quick Actions</p>

                                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group cursor-pointer hover:border-orange-200 transition-colors">
                                                    <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform"><BookOpen className="w-6 h-6" /></div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">Lesson Plans</p>
                                                        <p className="text-xs text-slate-500 font-medium">Generate instantly with AI</p>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group cursor-pointer hover:border-emerald-200 transition-colors">
                                                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform"><CheckCircle className="w-6 h-6" /></div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">Auto-Marking</p>
                                                        <p className="text-xs text-slate-500 font-medium">Scan papers to grade</p>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 group cursor-pointer hover:border-purple-200 transition-colors">
                                                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><ChartBar className="w-6 h-6" /></div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">Reports</p>
                                                        <p className="text-xs text-slate-500 font-medium">Share progress with parents</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Bottom Nav */}
                                            <div className="bg-white h-20 border-t border-slate-100 flex justify-around items-center px-4 pb-4">
                                                <div className="p-2 text-blue-600"><div className="w-6 h-6 bg-blue-600 rounded-lg"></div></div>
                                                <div className="p-2 text-slate-300"><div className="w-6 h-6 bg-slate-200 rounded-lg"></div></div>
                                                <div className="p-2 text-slate-300"><div className="w-6 h-6 bg-slate-200 rounded-lg"></div></div>
                                                <div className="p-2 text-slate-300"><div className="w-6 h-6 bg-slate-200 rounded-lg"></div></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Notification */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1, duration: 0.5 }}
                                className="absolute top-32 -right-12 bg-white p-4 pr-6 rounded-2xl shadow-2xl flex items-center gap-4 z-20 animate-bounce-slow"
                            >
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-black text-lg">A+</div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">Class Performance</p>
                                    <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                                        <ArrowRight className="w-3 h-3 -rotate-45" /> +18% Improved
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* Wave Separator */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
                    <svg className="relative block w-full h-[80px] md:h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
                    </svg>
                </div>
            </div>

            {/* --- FEATURES SECTION --- */}
            <div className="bg-white py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">Why Teachers Love Soma Smart</h2>
                        <div className="w-24 h-1.5 bg-blue-600 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="group p-8 rounded-[2rem] border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-blue-100 hover:border-blue-100 transition-all duration-300"
                            >
                                <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-100 group-hover:scale-110 transition-transform duration-300`}>
                                    {f.icon}
                                </div>
                                <h3 className="font-bold text-xl text-slate-900 mb-3">{f.title}</h3>
                                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
