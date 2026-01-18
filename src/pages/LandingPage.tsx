import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap, Users, Baby, ChevronRight, MessageSquare,
    ScanLine, CheckCircle, Smartphone, Headphones, Menu, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';
import { useApp } from '../context/AppContext';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { setRole } = useApp();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleRoleSelect = (selectedRole: UserRole) => {
        setRole(selectedRole);
        // Navigation logic handled by router based on role, or we force it here
        if (selectedRole === UserRole.LEARNER) navigate('/learner');
        else if (selectedRole === UserRole.TEACHER) navigate('/teacher');
        else if (selectedRole === UserRole.PARENT) navigate('/parent');
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
            {/* --- HEADER --- */}
            <motion.header
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <div className="relative">
                                <MessageSquare className="w-8 h-8 text-orange-500 fill-orange-500" />
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white"></div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-2xl font-extrabold text-blue-900 leading-none tracking-tight">Soma Smart</span>
                                <span className="text-[10px] text-gray-500 font-medium tracking-wide">Learning That Makes Sense</span>
                            </div>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <button onClick={() => handleRoleSelect(UserRole.LEARNER)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <Baby className="w-5 h-5" /> Students
                            </button>
                            <button onClick={() => handleRoleSelect(UserRole.TEACHER)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <GraduationCap className="w-5 h-5" /> Teachers
                            </button>
                            <button onClick={() => handleRoleSelect(UserRole.PARENT)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <Users className="w-5 h-5" /> Parents
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden">
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-600">
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Nav Dropdown */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden bg-white border-t border-gray-100 overflow-hidden shadow-lg"
                        >
                            <div className="p-4 space-y-4">
                                <button onClick={() => handleRoleSelect(UserRole.LEARNER)} className="flex w-full items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium">
                                    <Baby className="w-5 h-5 text-blue-600" /> Students
                                </button>
                                <button onClick={() => handleRoleSelect(UserRole.TEACHER)} className="flex w-full items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium">
                                    <GraduationCap className="w-5 h-5 text-blue-600" /> Teachers
                                </button>
                                <button onClick={() => handleRoleSelect(UserRole.PARENT)} className="flex w-full items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium">
                                    <Users className="w-5 h-5 text-blue-600" /> Parents
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-blue-900 tracking-tight mb-6">
                            From Textbooks to <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Understanding.</span>
                        </h1>
                        <p className="max-w-3xl mx-auto text-lg md:text-xl text-gray-600 mb-10 leading-relaxed">
                            AI-powered learning to help students understand instantly, teachers create smarter materials, and parents track <span className="font-bold text-gray-800">real progress.</span>
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <button
                                onClick={() => document.getElementById('roles-section')?.scrollIntoView({ behavior: 'smooth' })}
                                className="px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl transition-all hover:-translate-y-1 block"
                            >
                                Get Started Free &gt;
                            </button>
                            <button
                                onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                className="px-8 py-4 bg-white text-gray-700 border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 hover:border-gray-300 transition-all block"
                            >
                                For Schools & Teachers &gt;
                            </button>
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-gray-600">
                            <div className="flex items-center gap-2">
                                <ScanLine className="w-5 h-5 text-blue-500" /> Scan Textbooks & Notes
                            </div>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-orange-500" /> Get Simple Explanations
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" /> Practice with Quizzes
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                    <div className="absolute top-20 left-10 w-96 h-96 bg-blue-100 rounded-full blur-[100px] opacity-50 mix-blend-multiply animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-100 rounded-full blur-[100px] opacity-50 mix-blend-multiply animate-pulse" style={{ animationDelay: "1s" }}></div>
                </div>
            </section>

            {/* --- ROLES SECTION --- */}
            <section id="roles-section" className="py-20 bg-gray-50 relative overflow-hidden">
                {/* Decorative curve */}
                <div className="absolute top-0 left-0 w-full overflow-hidden leading-none rotate-180">
                    <svg className="relative block w-full h-12" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
                        <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-white"></path>
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-gray-900">Which one are you?</h2>
                        <p className="text-gray-500 mt-2">Tailored experiences for every step of the learning journey.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">

                        {/* Learner Card */}
                        <motion.div
                            whileHover={{ y: -10, transition: { duration: 0.3 } }}
                            onClick={() => handleRoleSelect(UserRole.LEARNER)}
                            className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden cursor-pointer border border-gray-100 group"
                        >
                            <div className="relative h-56 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800"
                                    alt="Student"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute bottom-4 left-6 z-20 text-white">
                                    <h3 className="text-2xl font-bold">For Learners</h3>
                                    <p className="opacity-90 font-medium text-sm">Understand. Practice. Excel.</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-orange-100 p-2 rounded-lg shrink-0"><ScanLine className="w-5 h-5 text-orange-600" /></div>
                                    <div><p className="font-bold text-gray-800">Scan Activity</p><p className="text-sm text-gray-500">Snap homework for instant help.</p></div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-blue-100 p-2 rounded-lg shrink-0"><MessageSquare className="w-5 h-5 text-blue-600" /></div>
                                    <div><p className="font-bold text-gray-800">AI Tutor</p><p className="text-sm text-gray-500">Get simple, clear explanations.</p></div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Teacher Card */}
                        <motion.div
                            whileHover={{ y: -10, transition: { duration: 0.3 } }}
                            onClick={() => handleRoleSelect(UserRole.TEACHER)}
                            className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden cursor-pointer border border-gray-100 group"
                        >
                            <div className="relative h-56 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?auto=format&fit=crop&q=80&w=800"
                                    alt="Teacher"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute bottom-4 left-6 z-20 text-white">
                                    <h3 className="text-2xl font-bold">For Teachers</h3>
                                    <p className="opacity-90 font-medium text-sm">Automate Lesson Planning.</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-sky-100 p-2 rounded-lg shrink-0"><Smartphone className="w-5 h-5 text-sky-600" /></div>
                                    <div><p className="font-bold text-gray-800">Digitize Notes</p><p className="text-sm text-gray-500">Convert handwritten notes to text.</p></div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-indigo-100 p-2 rounded-lg shrink-0"><GraduationCap className="w-5 h-5 text-indigo-600" /></div>
                                    <div><p className="font-bold text-gray-800">Lesson Gen</p><p className="text-sm text-gray-500">Create structured plans instantly.</p></div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Parent Card */}
                        <motion.div
                            whileHover={{ y: -10, transition: { duration: 0.3 } }}
                            onClick={() => handleRoleSelect(UserRole.PARENT)}
                            className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden cursor-pointer border border-gray-100 group"
                        >
                            <div className="relative h-56 overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80&w=800"
                                    alt="Parent"
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute bottom-4 left-6 z-20 text-white">
                                    <h3 className="text-2xl font-bold">For Parents</h3>
                                    <p className="opacity-90 font-medium text-sm">Monitor & Support.</p>
                                </div>
                            </div>
                            <div className="p-8 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-yellow-100 p-2 rounded-lg shrink-0"><ScanLine className="w-5 h-5 text-yellow-600" /></div>
                                    <div><p className="font-bold text-gray-800">Track Progress</p><p className="text-sm text-gray-500">See what they are learning daily.</p></div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-green-100 p-2 rounded-lg shrink-0"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                                    <div><p className="font-bold text-gray-800">Quiz Results</p><p className="text-sm text-gray-500">Verify their understanding.</p></div>
                                </div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-blue-900">How Soma Smart Works</h2>
                        <div className="h-1 w-20 bg-blue-600 mx-auto mt-4 rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 -z-10"></div>

                        {[
                            { icon: Smartphone, color: "text-gray-600", title: "Scan or Upload", desc: "Take a photo of your textbook, notes or homework." },
                            { icon: MessageSquare, color: "text-orange-500", title: "Get Explanations", desc: "AI breaks it down into simple language you understand." },
                            { icon: CheckCircle, color: "text-green-500", title: "Practice Quizzes", desc: "Test your knowledge immediately with auto-generated quizzes." },
                            { icon: Headphones, color: "text-indigo-500", title: "Listen & Revise", desc: "Listen to explanations on the go for better retention." }
                        ].map((step, i) => (
                            <div key={i} className="flex flex-col items-center text-center group">
                                <div className="w-24 h-24 bg-white rounded-full border-4 border-blue-50 shadow-sm flex items-center justify-center mb-6 relative group-hover:scale-110 transition-transform duration-300">
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">{i + 1}</div>
                                    <step.icon className={`w-10 h-10 ${step.color}`} />
                                </div>
                                <h3 className="font-bold text-lg mb-2 text-gray-800">{step.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
                            </div>
                        ))}

                    </div>
                </div>
            </section>

            {/* --- FOOTER CTA --- */}
            <section className="bg-slate-900 py-24 text-center relative overflow-hidden">
                {/* Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-orange-400 to-green-500"></div>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to Make Learning Make Sense?</h2>
                    <p className="text-slate-300 mb-10 text-lg">Join students, teachers, and parents using Soma Smart today.</p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => handleRoleSelect(UserRole.LEARNER)}
                            className="px-8 py-4 bg-green-600 text-white rounded-full font-bold text-lg shadow-xl shadow-green-900/20 hover:bg-green-500 hover:scale-105 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            Start Learning Smarter <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => handleRoleSelect(UserRole.TEACHER)}
                            className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all w-full sm:w-auto flex items-center justify-center gap-2"
                        >
                            Book a School Demo <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </section>

            {/* --- BOTTOM FOOTER --- */}
            <footer className="bg-white py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Soma Smart. All rights reserved.</p>
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
                        <a href="#" className="hover:text-blue-600 transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};
