import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    GraduationCap, Users, Baby, ChevronRight, MessageSquare,
    ScanLine, CheckCircle, Menu, X, CheckSquare, Play, BookOpen, LogOut,
    CreditCard, AlertCircle, FileText, Clock, Award, ArrowRight, School,
    Sparkles, Zap, Building2, TrendingUp, Quote, Globe, ShieldCheck, BarChart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';
import { useApp } from '../context/AppContext';

// Import Assets
import learnerImg from '../assets/images/learner.png';
import teacherImg from '../assets/images/teacher.png';
import parentImg from '../assets/images/parent.png';
import logoImg from '../assets/images/logo.png';
import heroBannerImg from '../assets/images/soma_smart_hero_graphic_with_teacher.png';
import stepScanImg from '../assets/images/step_scan.png';
import stepExplainImg from '../assets/images/step_explain.png';
import stepQuizImg from '../assets/images/step_quiz.png';
import stepAudioImg from '../assets/images/step_audio.png';
import teacherWeaponImg from '../assets/images/teacher-weapon.png';
import { RegistrationModal } from '../components/RegistrationModal';
import { LegalModal } from '../components/LegalModal';
import { ContactModal } from '../components/ContactModal';
import { LoginModal } from '../components/LoginModal';
import { LogoutModal } from '../components/LogoutModal';
import { translations } from '../data/translations';
import { SchoolCalendar } from '../components/SchoolCalendar';

interface LandingPageProps {
    authError?: {
        code: string;
        description: string;
    } | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ authError: initialAuthError }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setRole, role, logout, isRegistered, isPro, language, toggleLanguage, startGuestSession, teacherUsageCount } = useApp();
    const [authError, setAuthError] = useState<{ code: string, description: string } | null>(initialAuthError || null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isClaimingOffer, setIsClaimingOffer] = useState(false);
    const [loginTab, setLoginTab] = useState<'STUDENT' | 'TEACHER' | 'SCHOOL'>('STUDENT');

    // Get translations
    const t = translations[language];
    const [registrationRole, setRegistrationRole] = useState<'STUDENT' | 'TEACHER' | 'SCHOOL'>('STUDENT');
    const [pendingRoute, setPendingRoute] = useState<string | null>(null);

    // Handle incoming plan selection from PricingPage
    React.useEffect(() => {
        // Check for Auth Errors in Hash
        const hash = window.location.hash;
        if (hash && hash.includes('error=')) {
            const params = new URLSearchParams(hash.substring(1));
            const error = params.get('error');
            const errorCode = params.get('error_code');
            const errorDescription = params.get('error_description');

            if (error || errorCode) {
                setAuthError({
                    code: errorCode || error || 'auth_error',
                    description: errorDescription?.replace(/\+/g, ' ') || 'An authentication error occurred.'
                });
                // Clear hash to avoid showing error on refresh
                window.history.replaceState(null, '', window.location.pathname);
            }
        }

        const state = location.state as { selectedPlan?: any; showRegistration?: boolean };
        if (state?.selectedPlan) {
            // If already pro, go straight to relative dashboard
            if (isPro) {
                const target = state.selectedPlan.segment === 'TEACHER' ? '/teacher' : (state.selectedPlan.segment === 'SCHOOL' ? '/school' : '/learner');
                navigate(target, { replace: true });
                return;
            }

            // If not registered, show registration
            if (!isRegistered) {
                setShowRegistration(true);
            } else {
                // If registered but not pro, go to dashboard with plan intent
                const target = state.selectedPlan.segment === 'TEACHER' ? '/teacher' : (state.selectedPlan.segment === 'SCHOOL' ? '/school' : '/learner');
                navigate(target, { state: { selectedPlan: state.selectedPlan }, replace: true });
            }
        }
    }, [location.state, isPro, isRegistered, navigate]);

    const handleRoleSelect = (selectedRole: UserRole) => {
        if (selectedRole === UserRole.LEARNER) {
            if (isRegistered || role !== UserRole.NONE) {
                setRole(UserRole.LEARNER);
                navigate('/learner');
            } else {
                // FRICTIONLESS: Start Guest Session immediately
                startGuestSession();
                navigate('/learner');
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
        else if (selectedRole === UserRole.SCHOOL) {
            if (role === UserRole.SCHOOL) {
                navigate('/school');
            } else {
                setRole(UserRole.SCHOOL);
                setLoginTab('SCHOOL');
                setShowLogin(true);
            }
        }
    };

    const handleGetStarted = () => {
        setRole(UserRole.LEARNER); // Default to learner
        setShowRegistration(true);
    };

    const handleRegistrationSuccess = () => {
        setShowRegistration(false);
        if (pendingRoute) {
            navigate(pendingRoute);
            setPendingRoute(null);
            return;
        }
        if (isClaimingOffer) {
            // Navigate to the appropriate dashboard with openSubscription flag
            const target = role === UserRole.TEACHER ? '/teacher' : (role === UserRole.SCHOOL ? '/school' : '/learner');
            navigate(target, { state: { openSubscription: true } });
            setIsClaimingOffer(false);
        } else {
            const target = role === UserRole.TEACHER ? '/teacher' : (role === UserRole.SCHOOL ? '/school' : '/learner');
            navigate(target);
        }
    };

    const handleCardClick = (card: { route: string; role?: UserRole, cta?: string }) => {
        if (card.cta === "Get Started" && card.route === "/learner") {
            // Frictionless Entry: Guest Mode
            if (!isRegistered && role === UserRole.NONE) {
                startGuestSession();
                navigate('/learner');
                return;
            }
        }

        if (card.route === '/learner') {
            setLoginTab('STUDENT');
            handleRoleSelect(UserRole.LEARNER);
        } else if (card.route.startsWith('/teacher')) {
            // If already logged in (any role), just go there
            if (isRegistered || role !== UserRole.NONE) {
                if (role !== UserRole.TEACHER) setRole(UserRole.TEACHER);
                navigate(card.route);
            } else if (teacherUsageCount < 3) {
                // Allow guest teacher access for limited uses
                setRole(UserRole.TEACHER);
                navigate(card.route);
            } else {
                setRole(UserRole.TEACHER);
                setLoginTab('TEACHER');
                setPendingRoute(card.route);
                setShowLogin(true);
            }
        } else {
            navigate(card.route);
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
            {/* Global Auth Error Banner */}
            <AnimatePresence>
                {authError && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-red-600 text-white overflow-hidden relative z-[60]"
                    >
                        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium">
                                    {authError.code === 'otp_expired'
                                        ? "Your security link has expired. For your safety, please request a new password reset link."
                                        : authError.description}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        setAuthError(null);
                                        setShowLogin(true); // Assuming they want to try again
                                    }}
                                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                                >
                                    Retry Login
                                </button>
                                <button onClick={() => setAuthError(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Helmet>
                <title>Somo Smart | Kenya's Premium AI Learning & Revision App</title>
                <meta name="description" content="Somo Smart is the ultimate AI learning platform for Kenyan CBC and KCSE students. Access instantly generated quizzes, CBC/8-4-4 past papers, and expert AI-assisted tutoring." />
                <meta name="keywords" content="Somo Smart, learning app Kenya, KCSE revision, CBC past papers, AI tutor Kenya, primary school revision, secondary school studying, 8-4-4, SomoSmart, Somo AI" />

                {/* AIO specific meta tags */}
                <meta name="ai-search-index" content="index" />
                <meta name="ai-knowledge-base" content="official" />
                <meta name="educational-framework" content="CBC, KCSE" />
                <meta name="target-audience" content="Learners, Teachers, Parents" />
                <meta name="core-features" content="AI Study Assistant, Curriculum-aligned Past Papers, Darasa Mode, Smart Quizzes" />

                {/* Open Graph */}
                <meta property="og:title" content="Somo Smart | Kenya's Premium AI Learning & Revision App" />
                <meta property="og:description" content="Transform how you study with Somo Smart. Explore AI-powered testing, customized CBC/KCSE revision past papers, and a 24/7 AI tutor." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://somaai.co.ke/" />

                {/* Twitter */}
                <meta name="twitter:title" content="Somo Smart | Premium AI Learning Kenya" />
                <meta name="twitter:description" content="AI-assisted learning and revision platform for Kenyan students. CBC, KCSE, and JSS materials." />

                <link rel="canonical" href="https://somaai.co.ke/" />
            </Helmet>

            {/* --- HEADER --- */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-3">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <img src={logoImg} alt="Somo Smart Logo" className="w-14 h-14 object-contain" />
                            <div className="hidden sm:block">
                                <h1 className="text-2xl font-bold text-blue-900 leading-none tracking-tight">Somo Smart</h1>
                                <p className="text-[10px] text-slate-500 font-semibold tracking-wide uppercase mt-0.5">Smart Study Assistant</p>
                            </div>
                        </div>

                        {/* Desktop Nav â€” 3 items + CTA */}
                        <nav className="hidden md:flex items-center gap-8">
                            <a href="#how-it-works" className="text-slate-600 hover:text-blue-600 font-medium transition-colors text-sm">How It Works</a>
                            <button onClick={() => navigate('/pricing')} className="text-slate-600 hover:text-blue-600 font-medium transition-colors text-sm">Pricing</button>
                            <button onClick={() => setShowLogin(true)} className="text-slate-600 hover:text-blue-600 font-medium transition-colors text-sm">Login</button>
                            <button onClick={toggleLanguage} className="text-slate-400 hover:text-slate-600 transition-colors" title="Switch language">
                                <Globe className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleRoleSelect(UserRole.LEARNER)}
                                className="bg-[#5b61de] text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-[#4a50d0] transition-all shadow-md shadow-indigo-200 hover:-translate-y-0.5"
                            >
                                Get Started Free
                            </button>
                        </nav>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-3">
                            <button
                                onClick={() => handleRoleSelect(UserRole.LEARNER)}
                                className="bg-[#5b61de] text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md"
                            >
                                Get Started
                            </button>
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
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="md:hidden border-t border-slate-100 overflow-hidden bg-white"
                        >
                            <nav className="flex flex-col p-4 space-y-3">
                                <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <BookOpen className="w-5 h-5 text-blue-500" /> How It Works
                                </a>
                                <button onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <CreditCard className="w-5 h-5 text-indigo-500" /> Pricing
                                </button>
                                <button onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <Users className="w-5 h-5 text-slate-400" /> Login
                                </button>
                                <button onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-400 font-medium text-sm">
                                    <Globe className="w-4 h-4" /> {language === 'EN' ? 'FranÃ§ais' : 'English'}
                                </button>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* --- HERO SECTION --- */}
            <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-white pt-8 pb-16 md:pt-12 md:pb-24">
                {/* Background Hero Image Overlay */}
                <div className="absolute inset-0 z-0 pointer-events-none opacity-20 flex items-center justify-center overflow-hidden">
                    <img
                        src={heroBannerImg}
                        alt=""
                        className="w-full h-full object-cover object-top md:object-center transform md:scale-110"
                    />
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    {/* Headline â€” answers WHO + WHAT in 3 seconds */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-[#1a2b5e] tracking-tight leading-[1.05] mb-6">
                            Kenya's #1 Smart{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b61de] to-[#2cb674]">Study Assistant</span>
                        </h1>
                        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-4">
                            Scan homework, get instant Smart explanations, revise with past papers all aligned to <strong>CBE & KCSE</strong>.
                        </p>
                        <p className="text-sm text-slate-400 font-medium">
                            Trusted by <strong className="text-slate-600">1,200+ learners</strong> and <strong className="text-slate-600">15+ schools</strong> across Kenya
                        </p>
                    </motion.div>

                    {/* "I am a..." Audience Selector Lanes */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-12 mb-8"
                    >
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <div className="h-[2px] bg-slate-200 w-12 md:w-24 rounded-full"></div>
                            <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-600 bg-white/80 px-6 py-2 rounded-full border border-slate-200 shadow-sm backdrop-blur-md">I am a...</p>
                            <div className="h-[2px] bg-slate-200 w-12 md:w-24 rounded-full"></div>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
                            {/* Student Lane */}
                            <motion.button
                                whileHover={{ y: -6, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleRoleSelect(UserRole.LEARNER)}
                                className="bg-gradient-to-br from-white/95 to-orange-50/50 backdrop-blur rounded-2xl p-7 border border-slate-200 border-t-4 border-t-orange-500 shadow-xl shadow-slate-300/50 hover:shadow-2xl hover:shadow-orange-500/20 hover:border-orange-400 transition-all duration-300 text-left group relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Baby className="w-32 h-32" />
                                </div>
                                <div className="w-14 h-14 bg-orange-100/80 text-orange-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                                    <Baby className="w-7 h-7" />
                                </div>
                                <h3 className="font-extrabold text-slate-900 text-xl mb-2">Student</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-grow">Scan homework, get instant AI explanations</p>
                                <div className="mt-auto relative z-10">
                                    <span className="text-xs font-bold text-white bg-orange-500 px-4 py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-orange-600 transition-colors w-full shadow-md shadow-orange-500/20">
                                        Start Free <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </motion.button>

                            {/* Teacher Lane */}
                            <motion.button
                                whileHover={{ y: -6, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                className="bg-gradient-to-br from-white/95 to-blue-50/50 backdrop-blur rounded-2xl p-7 border border-slate-200 border-t-4 border-t-blue-500 shadow-xl shadow-slate-300/50 hover:shadow-2xl hover:shadow-blue-500/20 hover:border-blue-400 transition-all duration-300 text-left group relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <GraduationCap className="w-32 h-32" />
                                </div>
                                <div className="w-14 h-14 bg-blue-100/80 text-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                                    <GraduationCap className="w-7 h-7" />
                                </div>
                                <h3 className="font-extrabold text-slate-900 text-xl mb-2">Teacher</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-grow">Auto-mark, generate notes, save hours</p>
                                <div className="mt-auto relative z-10">
                                    <span className="text-xs font-bold text-white bg-blue-600 px-4 py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-blue-700 transition-colors w-full shadow-md shadow-blue-500/20">
                                        Try Tools <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </motion.button>

                            {/* Parent Lane */}
                            <motion.button
                                whileHover={{ y: -6, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleRoleSelect(UserRole.PARENT)}
                                className="bg-gradient-to-br from-white/95 to-teal-50/50 backdrop-blur rounded-2xl p-7 border border-slate-200 border-t-4 border-t-teal-500 shadow-xl shadow-slate-300/50 hover:shadow-2xl hover:shadow-teal-500/20 hover:border-teal-400 transition-all duration-300 text-left group relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Users className="w-32 h-32" />
                                </div>
                                <div className="w-14 h-14 bg-teal-100/80 text-teal-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                                    <Users className="w-7 h-7" />
                                </div>
                                <h3 className="font-extrabold text-slate-900 text-xl mb-2">Parent</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-grow">See your child's real progress</p>
                                <div className="mt-auto relative z-10">
                                    <span className="text-xs font-bold text-white bg-teal-600 px-4 py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-teal-700 transition-colors w-full shadow-md shadow-teal-500/20">
                                        Track Progress <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </motion.button>

                            {/* School Lane */}
                            <motion.button
                                whileHover={{ y: -6, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleRoleSelect(UserRole.SCHOOL)}
                                className="bg-gradient-to-br from-white/95 to-indigo-50/50 backdrop-blur rounded-2xl p-7 border border-slate-200 border-t-4 border-t-indigo-500 shadow-xl shadow-slate-300/50 hover:shadow-2xl hover:shadow-indigo-500/20 hover:border-indigo-400 transition-all duration-300 text-left group relative overflow-hidden flex flex-col h-full"
                            >
                                <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                                    <Building2 className="w-32 h-32" />
                                </div>
                                <div className="w-14 h-14 bg-indigo-100/80 text-indigo-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm">
                                    <Building2 className="w-7 h-7" />
                                </div>
                                <h3 className="font-extrabold text-slate-900 text-xl mb-2">School</h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-grow">Campus-wide analytics & control</p>
                                <div className="mt-auto relative z-10">
                                    <span className="text-xs font-bold text-white bg-indigo-600 px-4 py-3 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 group-hover:bg-indigo-700 transition-colors w-full shadow-md shadow-indigo-500/20">
                                        Book Pilot <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Hero Image moved to background overlay */}
                </div>

                {/* Background decoration */}
                <div className="absolute top-1/4 left-0 w-72 h-72 bg-blue-100/30 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none"></div>
            </section>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>


            {/* --- CBE/KCSE CURRICULUM ALIGNMENT --- */}
            <section className="py-16 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs mb-6 uppercase tracking-wider">
                                <FileText className="w-4 h-4" /> Curriculum Aligned
                            </div>
                            <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a2b5e] mb-6 tracking-tight">
                                Built on Genuine <br className="hidden md:block" />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5b61de] to-[#2cb674]">CBE & KCSE Materials</span>
                            </h2>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                No generic AI fluff. Somo Smart uses actual teacher-created notes and past examinations to generate precise, curriculum-appropriate explanations.
                            </p>

                            <div className="space-y-4">
                                <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50 relative overflow-hidden group hover:border-blue-200 transition-colors">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-slate-900">Grade 7 English — Report Writing</h4>
                                        <span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm">Sample Query</span>
                                    </div>
                                    <p className="text-sm text-slate-600 italic mb-3">"How do I structure a factual report about a school event?"</p>
                                    <div className="bg-white p-3 rounded-xl shadow-sm text-sm border border-slate-100 flex gap-3">
                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                        <span className="text-slate-700">Somo breaks down the CBE standard: Introduction (Who, What, Where, When), Body Paragraphs (Chronological facts), and Conclusion.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-100/50 to-green-100/50 rounded-[3rem] transform rotate-3 scale-105 -z-10"></div>
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                                <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-blue-600" /> Current Knowledge Base Include:
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><CheckCircle className="w-4 h-4" /></div>
                                        <span className="font-medium text-slate-700">Grade 7-9 JSS Curriculum Notes</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600"><CheckCircle className="w-4 h-4" /></div>
                                        <span className="font-medium text-slate-700">KCSE Past Papers (2018–2023)</span>
                                    </li>
                                    <li className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600"><CheckCircle className="w-4 h-4" /></div>
                                        <span className="font-medium text-slate-700">Primary CBE Level Assessments</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- TEACHER WORKFLOW --- */}
            <section className="py-16 bg-slate-50 relative overflow-hidden border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a2b5e] mb-4 tracking-tight">Supercharge Your Teaching</h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">Somo Smart isn't just for students. It's a full workflow companion for educators.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                <FileText className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">1. AI-Assisted Grading</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Upload student essays or short-answer sheets. Somo analyzes them against your marking scheme and highlights areas for improvement within seconds.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 hover:shadow-xl transition-shadow relative">
                            <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black uppercase tracking-wider py-1 px-3 rounded-full shadow-lg">New</div>
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">2. Auto-Generate Lessons</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                Enter a topic and target grade level. Somo instantly generates CBE-aligned lesson plans, class notes, and multiple-choice quizzes for your students.
                            </p>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                                <BarChart className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">3. Track Progress</h3>
                            <p className="text-slate-600 text-sm leading-relaxed">
                                View centralized analytics for your class. Identify exactly which CBE competencies students are struggling with and intervene early.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

            <section id="how-it-works" className="py-6 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-12 md:mb-20">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-blue-900 mb-6 tracking-tight">{t.howItWorks.title}</h2>
                        <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">{t.howItWorks.subtitle}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-[28%] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-200 via-orange-200 to-green-200 -z-0"></div>

                        {t.howItWorks.steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="flex flex-col items-center text-center group relative z-10"
                            >
                                <div className="relative mb-8">
                                    <div className={`w-12 h-12 ${[stepScanImg, stepExplainImg, stepQuizImg, stepAudioImg][i] === stepScanImg ? 'bg-blue-600' : [stepScanImg, stepExplainImg, stepQuizImg, stepAudioImg][i] === stepExplainImg ? 'bg-orange-500' : [stepScanImg, stepExplainImg, stepQuizImg, stepAudioImg][i] === stepQuizImg ? 'bg-green-600' : 'bg-indigo-600'} text-white rounded-2xl flex items-center justify-center font-bold text-xl absolute -top-3 -right-3 z-20 shadow-lg border-4 border-white transform group-hover:rotate-12 transition-transform`}>
                                        {i + 1}
                                    </div>
                                    <div className="w-44 h-44 rounded-3xl bg-white flex items-center justify-center shadow-xl p-6 group-hover:scale-105 transition-all duration-300 border border-slate-100 aspect-square">
                                        <img src={[stepScanImg, stepExplainImg, stepQuizImg, stepAudioImg][i]} alt={`Somo Smart Step ${i + 1}: ${step.title}`} className="w-full h-full object-contain" loading="lazy" decoding="async" width="150" height="150" />
                                    </div>
                                </div>

                                <h3 className="font-bold text-xl mb-3 text-slate-800">{step.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed px-4">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-20"></div>

            {/* --- SCHOOL CALENDAR --- */}
            <SchoolCalendar />

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-20"></div>

            {/* --- TESTIMONIALS SECTION --- */}
            <section className="py-12 md:py-24 relative overflow-hidden bg-slate-50/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-blue-900 mb-4 tracking-tight">{t.testimonials.title}</h2>
                        <div className="w-24 h-1.5 bg-gradient-to-r from-orange-400 to-red-500 mx-auto rounded-full"></div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Teacher Testimonial */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 relative"
                        >
                            <div className="absolute top-8 right-8 text-blue-100">
                                <Quote className="w-12 h-12" />
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl border-2 border-white shadow-lg">
                                    mk
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">{t.testimonials.teacher.name}</h4>
                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Teacher</p>
                                </div>
                            </div>
                            <p className="text-slate-600 italic leading-relaxed relative z-10">
                                "{t.testimonials.teacher.quote}"
                            </p>
                            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2 text-xs font-bold text-slate-400">
                                <School className="w-4 h-4" /> ABC Primary School
                            </div>
                        </motion.div>

                        {/* School Testimonial */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 relative"
                        >
                            <div className="absolute top-8 right-8 text-emerald-100">
                                <Quote className="w-12 h-12" />
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xl border-2 border-white shadow-lg">
                                    PO
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Principal Omondi</h4>
                                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">School Admin</p>
                                </div>
                            </div>
                            <p className="text-slate-600 italic leading-relaxed relative z-10">
                                "The analytics provided by Somo have transformed how we track student performance across the entire school. It's an essential tool for modern education."
                            </p>
                            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2 text-xs font-bold text-slate-400">
                                <Building2 className="w-4 h-4" /> Nairobi High School
                            </div>
                        </motion.div>

                        {/* Parent Testimonial */}
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 relative"
                        >
                            <div className="absolute top-8 right-8 text-orange-100">
                                <Quote className="w-12 h-12" />
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xl border-2 border-white shadow-lg">
                                    MN
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900">Mrs. Njeri</h4>
                                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">Parent</p>
                                </div>
                            </div>
                            <p className="text-slate-600 italic leading-relaxed relative z-10">
                                "My child's grades have improved significantly since we started using Somo. The detailed progress tracking helps me stay involved in their education."
                            </p>
                            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center gap-2 text-xs font-bold text-slate-400">
                                <Users className="w-4 h-4" /> Parent of Grade 4 Student
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- FOOTER CTA --- */}
            <section className="bg-blue-900 py-6 text-center relative overflow-hidden">
                {/* Decor */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-800/50 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-800/30 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">Ready to Transform Your Learning Environment?</h2>
                        <p className="text-blue-100/80 mb-12 text-xl max-w-2xl mx-auto">Join thousands of learners, teachers, and schools building the future of education with Somo Smart.</p>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                            <button
                                onClick={() => handleRoleSelect(UserRole.LEARNER)}
                                className="px-8 py-4 bg-green-500 text-white rounded-2xl font-bold text-lg shadow-2xl shadow-green-900/40 hover:bg-green-400 hover:-translate-y-1 transition-all w-full md:w-auto flex items-center justify-center gap-2"
                            >
                                Try Learner Free <ChevronRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                className="px-8 py-4 bg-white/10 text-white backdrop-blur-md border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all w-full md:w-auto flex items-center justify-center gap-2"
                            >
                                Teacher Access
                            </button>
                            <button
                                onClick={() => setShowContact(true)}
                                className="px-8 py-4 bg-transparent text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all w-full md:w-auto flex items-center justify-center gap-2"
                            >
                                Book School Pilot
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- BOTTOM FOOTER --- */}
            <footer className="bg-white py-8 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-center items-center gap-8 text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Somo Smart</p>
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
                initialRole={registrationRole}
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

            <LoginModal
                isOpen={showLogin}
                onClose={() => setShowLogin(false)}
                initialTab={loginTab}
                onSuccess={() => {
                    if (pendingRoute) {
                        navigate(pendingRoute);
                        setPendingRoute(null);
                    } else {
                        const target = role === UserRole.TEACHER ? '/teacher' : (role === UserRole.SCHOOL ? '/school' : '/learner');
                        navigate(target);
                    }
                }}
                onSwitchToRegister={(role) => {
                    setShowLogin(false);
                    setRegistrationRole(role || 'STUDENT');
                    setShowRegistration(true);
                }}
            />

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => {
                    logout();
                    setShowLogoutModal(false);
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
                            <p>Somo Smart is designed for students. We do not require email addresses or phone numbers from students under 13. Parent supervision is encouraged.</p>
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
                            <strong>Important:</strong> Somo Smart is an educational aid, not a substitute for professional schooling.
                        </div>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Acceptance of Terms</h3>
                            <p>By accessing Somo Smart, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">2. Educational Disclaimer</h3>
                            <p>The content provided by Somo Smart is generated by Artificial Intelligence. While we strive for accuracy:</p>
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
                            <p>Somo Smart offers a limited free tier. Continued access to advanced features (Voice Notes, Unlimited Scanning) may require a premium subscription in the future.</p>
                        </section>
                    </div>
                }
            />

            {/* --- MOBILE STICKY CTA --- */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-2xl z-50 flex gap-3">
                <button
                    onClick={() => handleRoleSelect(UserRole.LEARNER)}
                    className="flex-1 bg-[#5b61de] text-white py-3 px-2 rounded-xl font-bold flex flex-col items-center justify-center leading-tight shadow-md"
                >
                    <span className="text-[10px] opacity-90 uppercase tracking-wider">Start Learning</span>
                    <span>For Free</span>
                </button>
                <button
                    onClick={() => handleRoleSelect(UserRole.TEACHER)}
                    className="flex-1 bg-[#2cb674] text-white py-3 px-2 rounded-xl font-bold flex flex-col items-center justify-center leading-tight shadow-md"
                >
                    <span className="text-[10px] opacity-90 uppercase tracking-wider">Teacher Access</span>
                    <span>Save Marking Time</span>
                </button>
            </div>
        </div >
    );
};
