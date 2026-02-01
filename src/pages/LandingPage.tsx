import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    GraduationCap, Users, Baby, ChevronRight, MessageSquare,
    ScanLine, CheckCircle, Menu, X, CheckSquare, Play, BookOpen, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';
import { useApp } from '../context/AppContext';

// Import Assets
import learnerImg from '../assets/images/learner.png';
import teacherImg from '../assets/images/teacher.png';
import parentImg from '../assets/images/parent.png';
import logoImg from '../assets/images/logo.png';
import heroBannerImg from '../assets/images/hero-banner.png';
import stepScanImg from '../assets/images/step_scan.png';
import stepExplainImg from '../assets/images/step_explain.png';
import stepQuizImg from '../assets/images/step_quiz.png';
import stepAudioImg from '../assets/images/step_audio.png';
import { RegistrationModal } from '../components/RegistrationModal';
import { LegalModal } from '../components/LegalModal';
import { ContactModal } from '../components/ContactModal';
import { SubscriptionModal } from '../components/SubscriptionModal';
import { LoginModal } from '../components/LoginModal';
import { TscLiveBanner } from '../components/TscLiveBanner';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { setRole, role, logout } = useApp(); // Need role for check and logout function
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [showSubscription, setShowSubscription] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [isClaimingOffer, setIsClaimingOffer] = useState(false);
    const { isRegistered } = useApp(); // Destructure isRegistered for check

    const handleRoleSelect = (selectedRole: UserRole) => {
        if (selectedRole === UserRole.LEARNER) {
            if (isRegistered) {
                setRole(UserRole.LEARNER);
                navigate('/learner');
            } else {
                setRole(UserRole.LEARNER); // Set context role
                setShowLogin(true); // Show Login Form for ID entry
            }
        }
        else if (selectedRole === UserRole.TEACHER) {
            setRole(selectedRole);
            navigate('/teacher');
        }
        else if (selectedRole === UserRole.PARENT) {
            setRole(selectedRole);
            navigate('/parent');
        }
    };

    const handleGetStarted = () => {
        setRole(UserRole.LEARNER); // Default to learner
        setShowRegistration(true);
    };

    const handleRegistrationSuccess = () => {
        setShowRegistration(false);
        if (isClaimingOffer) {
            // Navigate to the appropriate dashboard with openSubscription flag
            const target = role === UserRole.TEACHER ? '/teacher' : '/learner';
            navigate(target, { state: { openSubscription: true } });
            setIsClaimingOffer(false);
        } else {
            navigate('/learner');
        }
    };

    const handleClaimOffer = () => {
        // User requested this to route to Learner flow instead of Teacher
        setRole(UserRole.LEARNER);

        if (isRegistered) {
            navigate('/learner', { state: { openSubscription: true } });
        } else {
            setIsClaimingOffer(true);
            setShowRegistration(true);
        }
    };

    const handleModalClose = () => {
        setShowRegistration(false);
        // Do NOT navigate. Just close.
    };

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
            {/* --- HEADER --- */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <img src={logoImg} alt="Soma Smart Logo" className="w-12 h-12 object-contain" />
                            <div className="hidden sm:block">
                                <h1 className="text-2xl font-bold text-blue-900 leading-none tracking-tight">Soma Smart</h1>
                                <p className="text-[10px] text-blue-600 font-medium tracking-wide uppercase">Learning That Makes Sense</p>
                            </div>
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <button onClick={() => handleRoleSelect(UserRole.LEARNER)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <Baby className="w-5 h-5 text-blue-500" /> Students
                            </button>
                            <button onClick={() => handleRoleSelect(UserRole.TEACHER)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <GraduationCap className="w-5 h-5 text-gray-500" /> Teachers
                            </button>
                            <button onClick={() => navigate('/revision')} className="flex items-center gap-2 text-gray-600 hover:text-orange-600 font-medium transition-colors">
                                <BookOpen className="w-5 h-5 text-orange-500" /> Revision
                            </button>
                            <button onClick={() => handleRoleSelect(UserRole.PARENT)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <Users className="w-5 h-5 text-gray-500" /> Parents
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

                {/* Mobile Menu Drawer */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden border-t border-slate-100 overflow-hidden bg-white"
                        >
                            <nav className="flex flex-col p-4 space-y-4">
                                <button onClick={() => { handleRoleSelect(UserRole.LEARNER); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 font-bold">
                                    <Baby className="w-5 h-5" /> Students
                                </button>
                                <button onClick={() => { handleRoleSelect(UserRole.TEACHER); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <GraduationCap className="w-5 h-5" /> Teachers
                                </button>
                                <button onClick={() => { navigate('/revision'); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <BookOpen className="w-5 h-5" /> Revision
                                </button>
                                <button onClick={() => { handleRoleSelect(UserRole.PARENT); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <Users className="w-5 h-5" /> Parents
                                </button>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-10 pb-12 lg:pt-16 lg:pb-20 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-orange-50/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Column: Text & CTA */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-left"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-bold mb-6">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                </span>
                                Join 10,000+ Students & Teachers
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-blue-900 tracking-tight mb-6 leading-[1.1]">
                                From Textbooks to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Understanding</span>—Instantly.
                            </h1>
                            <p className="text-lg md:text-xl text-slate-600 mb-10 leading-relaxed max-w-xl">
                                AI-powered learning that helps students understand lessons, teachers create smarter materials, and parents track real progress—all in one place.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
                                <button
                                    onClick={isRegistered ? logout : handleGetStarted}
                                    className={`px-8 py-4 ${isRegistered ? 'bg-slate-700 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2`}
                                >
                                    {isRegistered ? (
                                        <>
                                            Logout <LogOut className="w-5 h-5" />
                                        </>
                                    ) : (
                                        <>
                                            Get Started Free <ChevronRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                    className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all shadow-sm w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    For Teachers <ChevronRight className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                            <img src={`https://i.pravatar.cc/100?img=${i + 14}`} alt="User" />
                                        </div>
                                    ))}
                                </div>
                                <div className="text-sm font-medium text-slate-500">
                                    <span className="text-blue-600 font-bold">4.9/5</span> from 2,000+ reviews
                                </div>
                            </div>
                        </motion.div>

                        {/* Right Column: Hero Banner */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl shadow-blue-200/50 border border-white/50 backdrop-blur-sm">
                                <img src={heroBannerImg} alt="Soma Smart Learning" className="w-full h-auto" />
                            </div>

                            {/* Floating Elements */}
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl z-20 hidden md:block border border-slate-100"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-green-100 p-2 rounded-lg">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lesson Mastery</p>
                                        <p className="text-sm font-bold text-slate-800">92% Avg. Improvement</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl z-20 hidden md:block border border-slate-100"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-orange-100 p-2 rounded-lg">
                                        <BookOpen className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Study Sessions</p>
                                        <p className="text-sm font-bold text-slate-800">1.2M+ Minutes Active</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Background Blobs */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-400/10 blur-[100px] -z-10 rounded-full"></div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200/20 blur-[80px] -z-10 rounded-full"></div>
                        </motion.div>
                    </div>

                    <div className="mt-20 flex flex-wrap justify-center gap-x-12 gap-y-6 text-sm font-bold text-slate-400 border-t border-slate-100 pt-10">
                        <div className="flex items-center gap-2 hover:text-blue-600 transition-colors cursor-default">
                            <ScanLine className="w-5 h-5" /> SCAN TEXTBOOKS
                        </div>
                        <div className="flex items-center gap-2 hover:text-orange-600 transition-colors cursor-default">
                            <MessageSquare className="w-5 h-5" /> SIMPLE EXPLANATIONS
                        </div>
                        <div className="flex items-center gap-2 hover:text-green-600 transition-colors cursor-default">
                            <CheckCircle className="w-5 h-5" /> SMART QUIZZES
                        </div>
                        <div className="flex items-center gap-2 hover:text-indigo-600 transition-colors cursor-default">
                            <Play className="w-5 h-5" /> DARASA MODE
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PROMOTIONAL CTA --- */}
            <div className="w-full">
                <TscLiveBanner />
            </div>

            {/* --- ROLES SECTION --- */}
            <section id="roles-section" className="py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-blue-900 mb-4">Tailored for the Whole Classroom</h2>
                        <p className="text-slate-500 text-lg max-w-2xl mx-auto">Whether you're studying for exams, preparing lessons, or supporting your child's journey, we have tools for you.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Learner Card */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            onClick={() => handleRoleSelect(UserRole.LEARNER)}
                            className="bg-white rounded-2xl shadow-xl shadow-slate-100 overflow-hidden cursor-pointer border border-slate-100 group flex flex-col transition-all duration-300 hover:shadow-orange-100"
                        >
                            <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 text-center text-white">
                                <Baby className="w-10 h-10 mx-auto mb-3 opacity-90" />
                                <h3 className="text-2xl font-bold">For Learners</h3>
                                <p className="text-white/80 font-medium italic text-sm">Understand. Practice. Excel.</p>
                            </div>
                            <div className="h-64 overflow-hidden bg-gray-50 relative">
                                <img src={learnerImg} alt="Student" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60"></div>
                            </div>
                            <div className="p-8 space-y-4 bg-white flex-1">
                                {[
                                    { icon: ScanLine, text: "Scan & Learn Instantly", color: "text-orange-500" },
                                    { icon: MessageSquare, text: "Simple AI Explanations", color: "text-orange-500" },
                                    { icon: CheckSquare, text: "Unlimited Smart Quizzes", color: "text-orange-500" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-slate-700">
                                        <div className={`p-1.5 rounded-lg bg-orange-50 ${item.color}`}>
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{item.text}</span>
                                    </div>
                                ))}
                                <button className="w-full mt-4 py-3 rounded-xl bg-orange-50 text-orange-600 font-bold group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    Start Learning
                                </button>
                            </div>
                        </motion.div>

                        {/* Teacher Card */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            onClick={() => handleRoleSelect(UserRole.TEACHER)}
                            className="bg-white rounded-2xl shadow-xl shadow-slate-100 overflow-hidden cursor-pointer border border-slate-100 group flex flex-col transition-all duration-300 hover:shadow-blue-100"
                        >
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-center text-white">
                                <GraduationCap className="w-10 h-10 mx-auto mb-3 opacity-90" />
                                <h3 className="text-2xl font-bold">For Teachers</h3>
                                <p className="text-white/80 font-medium italic text-sm">Teach Better. Save Time.</p>
                            </div>
                            <div className="h-64 overflow-hidden bg-gray-50 relative">
                                <img src={teacherImg} alt="Teacher" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60"></div>
                            </div>
                            <div className="p-8 space-y-4 bg-white flex-1">
                                {[
                                    { icon: BookOpen, text: "Create Detailed Lessons", color: "text-blue-500" },
                                    { icon: Play, text: "Darasa Mode Recording", color: "text-blue-500" },
                                    { icon: CheckSquare, text: "Auto-Generate Quizzes", color: "text-blue-500" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-slate-700">
                                        <div className={`p-1.5 rounded-lg bg-blue-50 ${item.color}`}>
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{item.text}</span>
                                    </div>
                                ))}
                                <button className="w-full mt-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    Explore Tools
                                </button>
                            </div>
                        </motion.div>

                        {/* Parent Card */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            onClick={() => handleRoleSelect(UserRole.PARENT)}
                            className="bg-white rounded-2xl shadow-xl shadow-slate-100 overflow-hidden cursor-pointer border border-slate-100 group flex flex-col transition-all duration-300 hover:shadow-green-100"
                        >
                            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-center text-white">
                                <Users className="w-10 h-10 mx-auto mb-3 opacity-90" />
                                <h3 className="text-2xl font-bold">For Parents</h3>
                                <p className="text-white/80 font-medium italic text-sm">Clear Learning. Real Progress.</p>
                            </div>
                            <div className="h-64 overflow-hidden bg-gray-50 relative">
                                <img src={parentImg} alt="Parent" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60"></div>
                            </div>
                            <div className="p-8 space-y-4 bg-white flex-1">
                                {[
                                    { icon: CheckCircle, text: "Live Progress Tracking", color: "text-emerald-500" },
                                    { icon: MessageSquare, text: "Daily Learning Insights", color: "text-emerald-500" },
                                    { icon: GraduationCap, text: "Support Child Excellence", color: "text-emerald-500" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-slate-700">
                                        <div className={`p-1.5 rounded-lg bg-emerald-50 ${item.color}`}>
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{item.text}</span>
                                    </div>
                                ))}
                                <button className="w-full mt-4 py-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                    Track Progress
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold text-blue-900 mb-6">Learning Made Simple</h2>
                        <p className="text-slate-600 text-lg max-w-2xl mx-auto">Get from a confused student to a subject master in 4 easy steps.</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[28%] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-200 via-orange-200 to-green-200 -z-0"></div>

                        {[
                            { img: stepScanImg, title: "Scan or Upload", desc: "Snap a photo of your textbook, notes or homework.", color: "bg-blue-600" },
                            { img: stepExplainImg, title: "Get Explanations", desc: "Our AI breaks it down into simple terms you understand.", color: "bg-orange-500" },
                            { img: stepQuizImg, title: "Smart Quizzes", desc: "Test your knowledge with auto-generated practice questions.", color: "bg-green-600" },
                            { img: stepAudioImg, title: "Listen & Revise", desc: "Listen to simplified lessons on the go to remember more.", color: "bg-indigo-600" }
                        ].map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center text-center group relative z-10"
                            >
                                <div className="relative mb-8">
                                    <div className={`w-12 h-12 ${step.color} text-white rounded-2xl flex items-center justify-center font-bold text-xl absolute -top-3 -right-3 z-20 shadow-lg border-4 border-white transform group-hover:rotate-12 transition-transform`}>
                                        {i + 1}
                                    </div>
                                    <div className="w-44 h-44 rounded-3xl bg-white flex items-center justify-center shadow-xl p-6 group-hover:scale-105 transition-all duration-300 border border-slate-100">
                                        <img src={step.img} alt={step.title} className="w-full h-full object-contain" />
                                    </div>
                                </div>

                                <h3 className="font-bold text-xl mb-3 text-slate-800">{step.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed px-4">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- FOOTER CTA --- */}
            <section className="bg-blue-900 py-32 text-center relative overflow-hidden">
                {/* Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-800/50 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-800/30 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">Ready to Master Any Subject?</h2>
                        <p className="text-blue-100/80 mb-12 text-xl max-w-2xl mx-auto">Join the thousands of students already learning smarter with Soma Smart.</p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => handleRoleSelect(UserRole.LEARNER)}
                                className="px-10 py-5 bg-green-500 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-green-900/40 hover:bg-green-400 hover:-translate-y-1 transition-all w-full sm:w-auto flex items-center justify-center gap-3"
                            >
                                Get Started Now <ChevronRight className="w-6 h-6" />
                            </button>
                            <button
                                onClick={() => navigate('/teacher/darasa')}
                                className="px-10 py-5 bg-white/10 text-white backdrop-blur-md border border-white/20 rounded-2xl font-bold text-xl hover:bg-white/20 transition-all w-full sm:w-auto flex items-center justify-center gap-3"
                            >
                                Try Darasa Mode
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- BOTTOM FOOTER --- */}
            <footer className="bg-white py-8 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-8 text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Soma Smart</p>
                    <div className="w-px h-4 bg-slate-300 hidden md:block"></div>
                    <button onClick={() => setShowPrivacy(true)} className="hover:text-blue-600 transition-colors">Privacy</button>
                    <div className="w-px h-4 bg-slate-300 hidden md:block"></div>
                    <button onClick={() => setShowTerms(true)} className="hover:text-blue-600 transition-colors">Terms</button>
                    <div className="w-px h-4 bg-slate-300 hidden md:block"></div>
                    <button onClick={() => setShowContact(true)} className="hover:text-blue-600 transition-colors">Contact</button>
                    <div className="w-px h-4 bg-slate-300 hidden md:block"></div>
                    <button onClick={() => navigate('/admin')} className="text-slate-400 hover:text-slate-600 transition-colors text-xs flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Admin
                    </button>
                </div>
            </footer>
            {/* --- MODALS --- */}
            <RegistrationModal
                isOpen={showRegistration}
                onClose={handleModalClose}
                onSuccess={handleRegistrationSuccess}
                onSwitchToLogin={() => {
                    setShowRegistration(false);
                    setShowLogin(true);
                }}
            />

            <ContactModal
                isOpen={showContact}
                onClose={() => setShowContact(false)}
            />

            <SubscriptionModal
                isOpen={showSubscription}
                onClose={() => setShowSubscription(false)}
            />

            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
                initialTab="STUDENT"
                onSwitchToRegister={() => {
                    setShowLogin(false);
                    setShowRegistration(true);
                }}
            />

            <LegalModal
                isOpen={showPrivacy}
                onClose={() => setShowPrivacy(false)}
                title="Privacy Policy"
                content={
                    <div className="space-y-6 text-sm text-slate-600">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-800">
                            <strong>Note:</strong> This is a simplified educational platform. We treat all user data with the highest standard of care.
                        </div>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Information We Collect</h3>
                            <ul className="list-disc pl-5 space-y-1">
                                <li><strong>User Account Data:</strong> Name, Grade, and Student ID (generated locally).</li>
                                <li><strong>Usage Data:</strong> Topics scanned, questions asked, and quizzes taken.</li>
                                <li><strong>Device Information:</strong> Basic browser type to ensure app compatibility.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">2. How We Use Your Data</h3>
                            <p>All data is used strictly to provide the educational service:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>To generate AI explanations relevant to your grade level.</li>
                                <li>To track learning progress for Parents and Teachers.</li>
                                <li>To improve the accuracy of our educational content.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">3. Data Safety & AI</h3>
                            <p>We use Google&apos;s Gemini AI to process text and images. </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>We do <strong>not</strong> use your personal data to train public AI models.</li>
                                <li>Your data is processed ephemerally for the purpose of the immediate query.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">4. Children&apos;s Privacy</h3>
                            <p>Soma Smart is designed for students. We do not require email addresses or phone numbers from students under 13. Parent supervision is encouraged.</p>
                        </section>
                    </div>
                }
            />

            <LegalModal
                isOpen={showTerms}
                onClose={() => setShowTerms(false)}
                title="Terms of Service"
                content={
                    <div className="space-y-6 text-sm text-slate-600">
                        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100 text-orange-800">
                            <strong>Important:</strong> Soma Smart is an educational aid, not a substitute for professional schooling.
                        </div>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Acceptance of Terms</h3>
                            <p>By accessing Soma Smart, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">2. Educational Disclaimer</h3>
                            <p>The content provided by Soma Smart is generated by Artificial Intelligence. While we strive for accuracy:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>Information should be verified with official textbooks.</li>
                                <li>We are not liable for any inaccuracies in exam preparation materials.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">3. User Conduct</h3>
                            <p>You agree to use this platform responsibly:</p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>Do not upload inappropriate, harmful, or copyright-infringing content.</li>
                                <li>Do not attempt to reverse-engineer or &quot;jailbreak&quot; the AI assistant.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">4. Subscription & Access</h3>
                            <p>Soma Smart offers a limited free tier. Continued access to advanced features (Voice Notes, Unlimited Scanning) may require a premium subscription in the future.</p>
                        </section>
                    </div>
                }
            />
        </div>
    );
};
