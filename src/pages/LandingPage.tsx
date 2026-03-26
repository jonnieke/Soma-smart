import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    GraduationCap, Users, Baby, ChevronRight, MessageSquare,
    ScanLine, CheckCircle, Menu, X, CheckSquare, Play, BookOpen, LogOut,
    CreditCard, AlertCircle, FileText, Clock, Award, ArrowRight, School,
    Sparkles, Zap, Building2, TrendingUp, Quote, Globe, ShieldCheck, BarChart, Star,
    Facebook, Twitter, Instagram, Linkedin, MapPin, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../types';
import { useApp } from '../context/AppContext';

// Import Assets
import learnerImg from '../assets/images/learner.png';
import teacherImg from '../assets/images/teacher.png';
import parentImg from '../assets/images/parent.png';
import logoImg from '../assets/images/main_logo.png';
import heroBannerImg from '../assets/images/soma_smart_hero_graphic_with_teacher.png';
import stepScanImg from '../assets/images/step_scan.png';
import stepExplainImg from '../assets/images/step_explain.png';
import stepQuizImg from '../assets/images/step_quiz.png';
import stepAudioImg from '../assets/images/step_audio.png';
import teacherWeaponImg from '../assets/images/teacher-weapon.png';
import mascotImg from '../assets/images/mascot.png';
import { RegistrationModal } from '../components/RegistrationModal';
import { LegalModal } from '../components/LegalModal';
import { ContactModal } from '../components/ContactModal';
import { LoginModal } from '../components/LoginModal';
import { LogoutModal } from '../components/LogoutModal';
import { translations } from '../data/translations';
import { SchoolCalendar } from '../components/SchoolCalendar';
import { ThemeToggle } from '../components/ThemeToggle';

interface LandingPageProps {
    authError?: {
        code: string;
        description: string;
    } | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ authError: initialAuthError }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setRole, role, logout, isRegistered, isPro, language, toggleLanguage, startGuestSession, teacherUsageCount, lowDataMode, toggleLowDataMode } = useApp();
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

    // Auto-enable Low-Data Mode on slow networks (2G/slow-2G common on Kenyan mobile networks)
    React.useEffect(() => {
        try {
            const connection = (navigator as any).connection ||
                (navigator as any).mozConnection ||
                (navigator as any).webkitConnection;
            if (connection && !lowDataMode) {
                const slowTypes = ['2g', 'slow-2g'];
                if (slowTypes.includes(connection.effectiveType)) {
                    toggleLowDataMode();
                    console.info('[Somo Smart] Slow network detected, enabling Low-Data Mode automatically.');
                }
                // Also listen for changes during the session
                const onChange = () => {
                    if (slowTypes.includes(connection.effectiveType) && !lowDataMode) {
                        toggleLowDataMode();
                    }
                };
                connection.addEventListener('change', onChange);
                return () => connection.removeEventListener('change', onChange);
            }
        } catch (_) {
            // Network Information API not supported — safe to ignore
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-gray-900 dark:text-slate-100 overflow-x-hidden transition-colors duration-300">
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
                <title>Somo Smart | Kenya's #1 AI Exam & Revision Assistant (KCSE, KPSEA, JSS)</title>
                <meta name="description" content="Master your exams with Somo Smart. Kenya's premier AI platform for KCSE, KPSEA, and Junior School revision. Get instant explanations, auto-marked past papers, and personalized study notes." />
                <meta name="keywords" content="Somo Smart, KCSE revision 2024, KPSEA past papers, JSS revision notes, AI tutor Kenya, Kenyan curriculum AI, SomoSmart app, KILEA revision, CBE study assistant" />

                {/* AIO/SEO specific meta tags */}
                <meta name="ai-search-index" content="index" />
                <meta name="ai-knowledge-base" content="official" />
                <meta name="educational-framework" content="CBE, 8-4-4, KCSE, KPSEA, KJSEA" />
                <meta name="target-audience" content="Learners, Teachers, Parents, School Administrators" />
                <meta name="core-features" content="AI Smart Exam Assistant, Instant Explanations, Auto-Grading, Topical Quizzes, CBE Notes" />

                {/* Search Engine Optimization */}
                <meta name="robots" content="index, follow" />
                <meta name="author" content="Somo Smart" />
                <meta property="og:title" content="Somo Smart | Your Smart Exam Assistant - Improve Grades NOW!" />
                <meta property="og:description" content="Transform your revision with AI. Access verified KCSE, KPSEA, and JSS materials with instant smart feedback." />
                <meta property="og:image" content="https://somaai.co.ke/og-image.jpg" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://somaai.co.ke/" />

                {/* Twitter Meta */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Somo Smart | Kenya's Best AI Study App" />
                <meta name="twitter:description" content="Improve your grades with AI. All Kenyan exams supported: KCSE, KPSEA, JSS." />

                <link rel="canonical" href="https://somaai.co.ke/" />

                {/* Structured Data / AIO */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Somo Smart",
                        "url": "https://somaai.co.ke",
                        "logo": "https://somaai.co.ke/main_logo.png",
                        "description": "Kenya's #1 AI Exam & Revision Assistant for KCSE, KPSEA, and JSS.",
                        "sameAs": [
                            "https://twitter.com/somasmart",
                            "https://facebook.com/somasmart"
                        ]
                    })}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "SoftwareApplication",
                        "name": "Somo Smart",
                        "operatingSystem": "Web",
                        "applicationCategory": "EducationApplication",
                        "offers": {
                            "@type": "Offer",
                            "price": "0",
                            "priceCurrency": "KES"
                        },
                        "aggregateRating": {
                            "@type": "AggregateRating",
                            "ratingValue": "4.9",
                            "ratingCount": "1200"
                        }
                    })}
                </script>
            </Helmet>

            {/* --- HEADER --- */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm border-b dark:border-slate-800 transition-colors"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-3">
                        {/* Logo */}
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <img src={logoImg} alt="Somo Smart Logo" className="h-14 sm:h-16 w-auto object-contain" />
                        </div>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            <button onClick={() => handleRoleSelect(UserRole.LEARNER)} className="text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors text-sm">For Learners</button>
                            <button onClick={() => handleRoleSelect(UserRole.TEACHER)} className="text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-bold transition-colors text-sm">For Teachers</button>
                            <button onClick={() => navigate('/pricing')} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors text-sm">Pricing</button>
                            <button onClick={() => navigate('/blog')} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors text-sm flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/> Blog</button>
                            <button onClick={() => setShowLogin(true)} className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors text-sm">Login</button>
                            <button onClick={toggleLanguage} className="text-slate-400 hover:text-slate-600 transition-colors" title="Switch language">
                                <Globe className="w-4 h-4" />
                            </button>
                            <ThemeToggle />
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
                                <button onClick={() => { handleRoleSelect(UserRole.LEARNER); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                                    <GraduationCap className="w-5 h-5 text-blue-500" /> For Learners
                                </button>
                                <button onClick={() => { handleRoleSelect(UserRole.TEACHER); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                                    <Users className="w-5 h-5 text-emerald-500" /> For Teachers
                                </button>
                                <button onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <CreditCard className="w-5 h-5 text-indigo-500" /> Pricing
                                </button>
                                <button onClick={() => { navigate('/blog'); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <BookOpen className="w-5 h-5 text-indigo-500" /> Blog
                                </button>
                                <button onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <Users className="w-5 h-5 text-slate-400" /> Login
                                </button>
                                <button onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-400 font-medium text-sm">
                                    <Globe className="w-4 h-4" /> {language === 'EN' ? 'Français' : 'English'}
                                </button>
                                <div className="p-3">
                                    <ThemeToggle className="w-full justify-center" />
                                </div>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* --- HERO SECTION --- */}
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 pt-10 pb-16 md:pt-14 md:pb-20 transition-colors">
                {/* Soft ambient background blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] opacity-20 dark:opacity-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-20%] right-[-5%] w-[500px] h-[500px] opacity-15 dark:opacity-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur-[100px]" />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

                        {/* LEFT: Headline, copy and role selector */}
                        <div className="flex-1 text-center lg:text-left max-w-xl mx-auto lg:mx-0">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                <div
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 dark:bg-blue-900/40 border border-blue-100/50 dark:border-blue-800/50 text-blue-700 dark:text-blue-300 text-xs font-bold mb-6 uppercase tracking-widest backdrop-blur-sm shadow-sm group hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                                    onClick={() => navigate('/revision')}
                                >
                                    <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                                    Trusted by 1,200+ Kenyan learners &amp; schools
                                    <ChevronRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                                </div>

                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.05] mb-6">
                                    Smarter Learning.<br />
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Better Results.</span>
                                </h1>

                                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 leading-relaxed mb-10 font-medium">
                                    The ultimate SMART ecosystem for Kenyan education. Master concepts instantly with materials strictly aligned to{' '}
                                    <strong className="text-slate-900 dark:text-slate-200">CBE, KCSE, KPSEA &amp; KJSEA</strong> standards.
                                </p>

                                {/* Role Selector */}
                                <div className="bg-white/70 dark:bg-slate-900/70 p-2 rounded-2xl flex flex-col sm:flex-row gap-2 border border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-lg mb-8">
                                    <button onClick={() => handleRoleSelect(UserRole.LEARNER)} className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all flex justify-center items-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5">
                                        <GraduationCap className="w-5 h-5" /> I'm a Learner
                                    </button>
                                    <button onClick={() => handleRoleSelect(UserRole.TEACHER)} className="flex-1 py-3 px-4 rounded-xl bg-slate-50/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all flex justify-center items-center gap-2 border border-slate-200/50 dark:border-slate-700/50 hover:-translate-y-0.5">
                                        <Users className="w-5 h-5" /> I'm a Teacher
                                    </button>
                                    <button onClick={() => handleRoleSelect(UserRole.PARENT)} className="flex-1 py-3 px-4 rounded-xl bg-slate-50/80 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition-all flex justify-center items-center gap-2 border border-slate-200/50 dark:border-slate-700/50 hover:-translate-y-0.5">
                                        <Baby className="w-5 h-5" /> I'm a Parent
                                    </button>
                                </div>

                                <div className="flex items-center justify-center lg:justify-start gap-6 text-sm font-bold text-slate-500 dark:text-slate-400">
                                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> Start free</div>
                                    <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500" /> No card required</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* RIGHT: Hero Image with anchored floating cards */}
                        <motion.div
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="flex-1 relative w-full max-w-lg lg:max-w-none mx-auto px-8 lg:px-4"
                        >
                            <div className="relative">
                                {/* Hero teacher image - main visual */}
                                <img
                                    src={heroBannerImg}
                                    alt="Somo Smart AI teacher helping students"
                                    className="w-full h-auto object-contain drop-shadow-2xl"
                                />

                                {/* Mascot badge - bottom-left corner of image */}
                                {!lowDataMode && (
                                    <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center p-2 z-20">
                                        <img src={mascotImg} alt="Somo mascot" className="w-full h-full object-contain" />
                                    </div>
                                )}

                                {/* Floating Card: KCSE Target - top-left of image */}
                                <motion.div
                                    animate={{ y: [0, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                                    className="absolute -top-12 -left-8 bg-white/95 dark:bg-slate-900/95 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-4 backdrop-blur-md z-20"
                                >
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-200 dark:border-emerald-800/50">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">A-</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">KCSE Target</div>
                                    </div>
                                </motion.div>

                                {/* Floating Card: Auto-Graded - top-right of image */}
                                <motion.div
                                    animate={{ y: [0, 10, 0] }}
                                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
                                    className="absolute -top-12 -right-8 bg-white/95 dark:bg-slate-900/95 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl flex items-center gap-3 backdrop-blur-md z-20"
                                >
                                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-200 dark:border-indigo-800/50">
                                        <CheckCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                            Auto-Graded
                                            <span className="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md">8.5/10</span>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-500 mt-0.5">Assignment Marked</div>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>


            {/* --- CBE/KCSE CURRICULUM ALIGNMENT --- */}

            {/* --- HOW IT WORKS: 4 EASY STEPS --- */}
            <section id="how-it-works" className="py-20 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-[#1a2b5e] dark:text-blue-100 mb-4 tracking-tight">Learning Made Simple</h2>
                        <p className="text-slate-600 dark:text-slate-400 text-lg">Get from a confused student to a subject master in 4 easy steps.</p>
                    </div>

                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-[88px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-200 via-orange-200 to-emerald-200 dark:from-blue-800 dark:via-orange-800 dark:to-emerald-800 z-0"></div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
                            {/* Step 1 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center relative mb-6 group hover:-translate-y-2 transition-transform duration-300">
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-blue-600 text-white rounded-full font-bold flex items-center justify-center border-4 border-slate-50 dark:border-slate-900 z-10">1</div>
                                    {!lowDataMode ? (
                                        <img src={stepScanImg} alt="Scan or Upload" className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                        <ScanLine className="w-12 h-12 text-blue-500" />
                                    )}
                                </div>
                                <h3 className="font-extrabold text-[#1a2b5e] dark:text-white mb-2 text-lg">Scan or Upload</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Snap a photo of your textbook, notes or homework.</p>
                            </div>

                            {/* Step 2 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center relative mb-6 group hover:-translate-y-2 transition-transform duration-300">
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-orange-500 text-white rounded-full font-bold flex items-center justify-center border-4 border-slate-50 dark:border-slate-900 z-10">2</div>
                                    {!lowDataMode ? (
                                        <img src={stepExplainImg} alt="Get Explanations" className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                        <MessageSquare className="w-12 h-12 text-orange-500" />
                                    )}
                                </div>
                                <h3 className="font-extrabold text-[#1a2b5e] dark:text-white mb-2 text-lg">Get Explanations</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Somo Smart breaks it down into simple terms you understand.</p>
                            </div>

                            {/* Step 3 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center relative mb-6 group hover:-translate-y-2 transition-transform duration-300">
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-500 text-white rounded-full font-bold flex items-center justify-center border-4 border-slate-50 dark:border-slate-900 z-10">3</div>
                                    {!lowDataMode ? (
                                        <img src={stepQuizImg} alt="Smart Quizzes" className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                        <CheckSquare className="w-12 h-12 text-emerald-500" />
                                    )}
                                </div>
                                <h3 className="font-extrabold text-[#1a2b5e] dark:text-white mb-2 text-lg">Smart Quizzes</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Test your knowledge with your smart study companion's practice questions.</p>
                            </div>

                            {/* Step 4 */}
                            <div className="flex flex-col items-center text-center">
                                <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center relative mb-6 group hover:-translate-y-2 transition-transform duration-300">
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-500 text-white rounded-full font-bold flex items-center justify-center border-4 border-slate-50 dark:border-slate-900 z-10">4</div>
                                    {!lowDataMode ? (
                                        <img src={stepAudioImg} alt="Listen & Revise" className="w-20 h-20 object-contain group-hover:scale-110 transition-transform duration-300" />
                                    ) : (
                                        <Play className="w-12 h-12 text-indigo-500 translate-x-1" />
                                    )}
                                </div>
                                <h3 className="font-extrabold text-[#1a2b5e] dark:text-white mb-2 text-lg">Listen & Revise</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Listen to simplified lessons on the go to remember more.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CORE FEATURES BENTO BOX --- */}
            <section className="py-24 bg-white dark:bg-slate-950 relative overflow-hidden transition-colors border-t border-slate-100 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs mb-6 uppercase tracking-wider dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                            <Zap className="w-4 h-4" /> Powered by Super Teacher OS
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">Everything you need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-emerald-500">excel</span>. As a Teacher.</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">A fully integrated suite of tools designed specifically for the Kenyan curriculum.</p>

                        <div className="flex justify-center mb-16">
                            <button
                                onClick={() => {
                                    setLoginTab('TEACHER');
                                    handleRoleSelect(UserRole.TEACHER);
                                }}
                                className="px-10 py-5 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-blue-500/30 hover:bg-blue-700 hover:-translate-y-1 transition-all flex items-center gap-3"
                            >
                                Enter Teacher Dashboard <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[320px]">
                        {/* 1. Large Feature: Darasa Mode (Span 2 cols) */}
                        <motion.div
                            whileHover={{ y: -8, scale: 1.01 }}
                            className="md:col-span-2 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-900/40 rounded-[2rem] p-8 md:p-10 border border-indigo-100 dark:border-indigo-800/50 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl group-hover:bg-blue-400/20 transition-all duration-500"></div>
                            <div className="relative z-10 h-full flex flex-col justify-center w-full md:w-[60%] lg:w-[50%]">
                                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center mb-6 shadow-md shadow-indigo-200 dark:shadow-indigo-900/50">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Darasa Mode</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">Transform any classroom into a smart learning environment. Real-time audio transcription and automatic summarization of key syllabus concepts while you teach.</p>
                            </div>
                            {/* Mock UI Element */}
                            {!lowDataMode && (
                                <div className="absolute right-[-5%] bottom-[-5%] lg:right-4 w-[280px] lg:w-[320px] h-[260px] bg-white dark:bg-slate-900 rounded-t-3xl border border-slate-200 dark:border-slate-700 shadow-2xl p-5 hidden md:block transform group-hover:-translate-y-4 lg:group-hover:-translate-x-4 transition-transform duration-500 delay-100">
                                    <div className="flex items-center gap-3 mb-5 opacity-50">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                                    </div>
                                    <div className="space-y-4 opacity-90">
                                        <div className="flex gap-3 items-center text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-900/30 max-w-fit px-3 py-1.5 rounded-full"><Clock className="w-3.5 h-3.5" /> Transcribing Live...</div>
                                        <div className="h-2 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                        <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                        <div className="h-2 w-5/6 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                        <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                                    </div>
                                </div>
                            )}
                        </motion.div>

                        {/* 2. Vertical Feature: Marking Manager */}
                        <motion.div
                            whileHover={{ y: -8, scale: 1.01 }}
                            className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-900/40 rounded-[2rem] p-8 border border-emerald-100 dark:border-emerald-800/50 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500"
                        >
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-12 h-12 bg-emerald-600 text-white rounded-xl flex items-center justify-center mb-6 shadow-md shadow-emerald-200 dark:shadow-emerald-900/50">
                                    <CheckSquare className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Smart Marking</h3>
                                <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-6">Upload handwritten assignments. Our advanced Smart Marking automatically grades essays and math problems against KNEC rubrics.</p>

                                <div className="mt-auto bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transform group-hover:-translate-y-2 transition-transform duration-500 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-emerald-500" />
                                        <div>
                                            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">Math_P1.jpg</div>
                                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black tracking-widest uppercase mt-0.5">Score: 18/20</div>
                                        </div>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                </div>
                            </div>
                        </motion.div>

                        {/* 3. Horizontal Feature 1: Revision Hub */}
                        <motion.div
                            whileHover={{ y: -8, scale: 1.01 }}
                            className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-950/40 dark:to-rose-900/40 rounded-[2rem] p-8 border border-orange-100 dark:border-orange-800/50 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500"
                        >
                            <div className="relative z-10 h-full flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-12 h-12 bg-orange-500 text-white rounded-xl flex items-center justify-center shadow-md shadow-orange-200 dark:shadow-orange-900/50">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div className="px-3 py-1 bg-white/60 dark:bg-slate-900/60 rounded-full text-xs font-bold text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-800/50 backdrop-blur-sm shadow-sm group-hover:scale-105 transition-transform">Interactive</div>
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Powerful Examination Assistant</h3>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Generate CBE-aligned lesson plans, access verified KCSE and KPSEA past papers, and get auto-generated step-by-step solutions instantly.</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* 4. Horizontal Feature 2: Analytics Span 2 */}
                        <motion.div
                            whileHover={{ y: -8, scale: 1.01 }}
                            className="md:col-span-2 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800/50 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-500/10 transition-all duration-500"
                        >
                            <div className="relative z-10 w-full h-full flex items-center justify-between gap-6">
                                <div className="flex-1 max-w-lg">
                                    <div className="w-12 h-12 bg-slate-800 dark:bg-slate-700 text-white rounded-xl flex items-center justify-center mb-6 shadow-md shadow-slate-300 dark:shadow-slate-900/50">
                                        <BarChart className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Predictive Analytics</h3>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">Identify exactly which syllabus topics your learners are struggling with before exams. Detailed progress reports map performance back to core KCSE and KPSEA competencies.</p>
                                </div>
                                <div className="hidden md:flex self-end w-48 h-32 relative items-end justify-between p-2">
                                    <div className="w-8 bg-indigo-200 dark:bg-indigo-900 rounded-t-md h-12 group-hover:h-16 transition-all duration-700 ease-in-out"></div>
                                    <div className="w-8 bg-indigo-300 dark:bg-indigo-800 rounded-t-md h-16 group-hover:h-24 transition-all duration-700 ease-in-out delay-75"></div>
                                    <div className="w-8 bg-indigo-500 dark:bg-indigo-600 rounded-t-md h-20 group-hover:h-32 transition-all duration-700 ease-in-out delay-150"></div>
                                    <div className="w-8 bg-indigo-600 dark:bg-indigo-500 rounded-t-md h-24 group-hover:h-40 transition-all duration-700 ease-in-out delay-200"></div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- SUPER SCHOOL OS BENTO BOX --- */}
            <section className="py-24 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden transition-colors border-t border-slate-100 dark:border-slate-800/50">
                {/* Background Decor for School Section */}
                {!lowDataMode && (
                    <div className="absolute left-0 top-0 w-full h-full overflow-hidden pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 dark:bg-blue-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl"></div>
                    </div>
                )}

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 text-slate-700 font-bold text-xs mb-6 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700 shadow-sm">
                            <Building2 className="w-4 h-4" /> For School Administrators
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-[#1a2b5e] dark:text-white mb-6 tracking-tight">Meet the new <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Super School OS</span>.</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 font-medium">Stop guessing your results. Get real-time syllabus tracking, automated grading, and predictive analytics for your entire school.</p>

                        <div className="flex justify-center mb-16">
                            <button
                                onClick={() => {
                                    setLoginTab('SCHOOL');
                                    handleRoleSelect(UserRole.SCHOOL);
                                }}
                                className="px-10 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-slate-900/10 hover:bg-slate-800 hover:-translate-y-1 transition-all flex items-center gap-3 border border-slate-700"
                            >
                                Launch School Intelligence <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[340px]">
                        {/* 1. Large Feature: Predictive Mean Score (Span 2 cols) */}
                        <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 rounded-[2rem] p-8 md:p-10 border border-slate-700 shadow-2xl relative overflow-hidden group hover:shadow-blue-900/20 transition-all duration-300">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-500"></div>

                            <div className="relative z-10 h-full flex flex-col justify-center w-full md:w-[50%]">
                                <div className="w-12 h-12 bg-blue-500 text-white rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-white mb-3">Predictive Analytics</h3>
                                <p className="text-slate-300 leading-relaxed font-medium">Aggregating live data from Smart Marking and student quizzes to project your school's KCSE/KPSEA Mean Score in real-time.</p>
                            </div>

                            {/* Dramatic Mock UI Element */}
                            {!lowDataMode && (
                                <div className="absolute right-[-2%] bottom-[-5%] lg:right-6 lg:bottom-10 w-[300px] lg:w-[350px] bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-700 shadow-2xl p-6 hidden md:block transform group-hover:-translate-y-2 lg:group-hover:-translate-x-2 transition-transform duration-500">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Projected Mean</div>
                                        <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-400/10 px-2 py-1 rounded-full">
                                            <TrendingUp className="w-3 h-3" /> +0.4
                                        </div>
                                    </div>
                                    <div className="flex items-end gap-3 mb-6">
                                        <div className="text-5xl font-black text-white leading-none">9.2</div>
                                        <div className="text-2xl font-bold text-blue-400 mb-1">(B-)</div>
                                    </div>

                                    {/* Mini Bar Chart */}
                                    <div className="flex items-end justify-between h-16 gap-2">
                                        <div className="w-full bg-slate-700 rounded-t-sm h-8 relative group-hover:bg-blue-500/40 transition-colors"><div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">T1</div></div>
                                        <div className="w-full bg-slate-700 rounded-t-sm h-10 relative group-hover:bg-blue-500/60 transition-colors"><div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">T2</div></div>
                                        <div className="w-full bg-blue-500 rounded-t-sm h-14 relative shadow-[0_0_15px_rgba(59,130,246,0.5)]"><div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] text-blue-300 font-bold">NOW</div></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 2. Vertical Feature: Global Syllabus Tracking */}
                        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                                    <ShieldCheck className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-3">Global Syllabus Tracking</h3>
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium mb-6">Guarantee complete KNEC & KICD compliance digitally. See instantly if Form 4 Chemistry is lagging behind schedule without chasing teachers.</p>

                                <div className="mt-auto bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 transform group-hover:scale-[1.02] transition-transform duration-300">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Form 4 Compliance</div>
                                        <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">94%</div>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                        <div className="bg-emerald-500 h-2 rounded-full w-[94%]"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Horizontal Feature: Automated Exam Production */}
                        <div className="md:col-span-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-[2rem] p-8 lg:p-10 border border-blue-100 dark:border-blue-800/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-md transition-all">
                            <div className="flex-1 max-w-2xl text-center md:text-left">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-sm mb-6 text-indigo-600 dark:text-indigo-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Automated Exam Production</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Stop spending thousands on external examiners. Generate bespoke, KNEC-standard exams localized exactly to your school's current syllabus coverage in one click.</p>
                            </div>
                            <div className="flex-shrink-0 w-full md:w-auto relative">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full"></div>
                                <div className="relative bg-white dark:bg-slate-800 px-6 py-4 rounded-2xl border border-indigo-100 dark:border-indigo-700 shadow-xl flex items-center gap-4 group-hover:-translate-y-1 transition-transform">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">Form 3 Mid-Term</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">Math, Eng, Kisw • Generated</div>
                                    </div>
                                    <div className="ml-2 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- EXAM ASSISTANT CTA --- */}
            <section className="py-20 relative overflow-hidden bg-white dark:bg-slate-900 transition-colors">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="bg-gradient-to-br from-orange-500 to-rose-600 rounded-[2.5rem] p-10 md:p-14 shadow-2xl overflow-hidden relative group">
                        {/* Decorative background blur */}
                        <div className="absolute top-[-50%] right-[-10%] w-[150%] h-[200%] bg-gradient-to-bl from-rose-400/30 to-transparent blur-3xl pointer-events-none transform group-hover:rotate-12 transition-transform duration-1000"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-xs mb-6 uppercase tracking-wider border border-white/20 shadow-sm">
                                    <Star className="w-4 h-4 text-amber-300 fill-current" />
                                    For Candidates
                                </div>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                                    Meet your powerful new Exam Assistant.
                                </h2>
                                <p className="text-orange-100 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                                    Crush your KCSE & KPSEA exams with instant access to verified past papers, complete with auto-generated, step-by-step solutions mapping to KNEC rubrics.
                                </p>
                            </div>

                            <div className="flex-shrink-0">
                                <button
                                    onClick={() => navigate('/revision')}
                                    className="bg-white text-rose-600 hover:bg-orange-50 font-extrabold text-lg px-8 py-5 rounded-2xl shadow-xl hover:-translate-y-1 transition-all flex items-center gap-3 border border-orange-100"
                                >
                                    Try it now <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SCHOOL CALENDAR --- */}
            <SchoolCalendar />

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-20"></div>

            {/* --- TESTIMONIALS --- */}
            <section className="py-24 bg-slate-50 dark:bg-slate-950 transition-colors border-t border-slate-100 dark:border-slate-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs mb-6 uppercase tracking-wider dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                            <Star className="w-4 h-4" /> Rated 4.9/5 by 10,000+ Users
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">Voices of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Success</span></h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">See how Somo Smart is transforming the educational landscape for Kenyan students, teachers, and parents.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Learner Testimonial */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                            whileHover={{ y: -5 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative group"
                        >
                            <div className="absolute top-8 right-8 text-blue-100 dark:text-blue-900/30 group-hover:text-blue-200 dark:group-hover:text-blue-800/50 transition-colors">
                                <Quote className="w-12 h-12" />
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xl border-2 border-white dark:border-slate-800 shadow-sm relative z-10">
                                    BK
                                </div>
                                <div className="relative z-10">
                                    <h4 className="font-bold text-slate-900 dark:text-white">Brian K.</h4>
                                    <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed relative z-10 font-medium">
                                "Somo Smart explained Chemistry concepts that I struggled with for months. I moved from a C+ to an A- in my latest mocks. The AI breakdown is just like having a personal tutor."
                            </p>
                            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/50 flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                                <GraduationCap className="w-4 h-4" /> Form 4 Candidate
                            </div>
                        </motion.div>

                        {/* Teacher Testimonial */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            whileHover={{ y: -5 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative group"
                        >
                            <div className="absolute top-8 right-8 text-emerald-100 dark:text-emerald-900/30 group-hover:text-emerald-200 dark:group-hover:text-emerald-800/50 transition-colors">
                                <Quote className="w-12 h-12" />
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xl border-2 border-white dark:border-slate-800 shadow-sm relative z-10">
                                    MO
                                </div>
                                <div className="relative z-10">
                                    <h4 className="font-bold text-slate-900 dark:text-white">Mr. Ochieng</h4>
                                    <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed relative z-10 font-medium">
                                "The defining feature for me is the Smart Marking. I used to spend my entire weekend marking 80 Mathematics papers. Now, Somo does the heavy lifting according to KNEC rubrics, saving me 15+ hours weekly."
                            </p>
                            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/50 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <School className="w-4 h-4" /> Mathematics HOD
                            </div>
                        </motion.div>

                        {/* Parent Testimonial */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            whileHover={{ y: -5 }}
                            className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 relative group"
                        >
                            <div className="absolute top-8 right-8 text-orange-100 dark:text-orange-900/30 group-hover:text-orange-200 dark:group-hover:text-orange-800/50 transition-colors">
                                <Quote className="w-12 h-12" />
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl border-2 border-white dark:border-slate-800 shadow-sm relative z-10">
                                    JN
                                </div>
                                <div className="relative z-10">
                                    <h4 className="font-bold text-slate-900 dark:text-white">Jane N.</h4>
                                    <div className="flex items-center gap-1 mt-1">
                                        {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                    </div>
                                </div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 italic leading-relaxed relative z-10 font-medium">
                                "Since subscribing to Somo Smart, I can finally track exactly where my daughter is struggling. The predictive analytics told me she needed help in Algebra weeks before her midterm exams."
                            </p>
                            <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800/50 flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                                <Users className="w-4 h-4" /> Parent of JSS Student
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
            <footer className="bg-white dark:bg-slate-950 py-12 border-t border-slate-100 dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                        {/* Column 1: Brand & Local SEO */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 cursor-pointer mb-4" onClick={() => window.scrollTo(0, 0)}>
                                <img src={logoImg} alt="Somo Smart Logo" className="h-12 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all dark:invert dark:opacity-60 dark:hover:invert-0 dark:hover:opacity-100" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm leading-relaxed">
                                Kenya's leading AI-powered learning platform. Empowering students, teachers, and parents with strictly aligned CBC and KCSE educational tools.
                            </p>
                            
                            {/* Google Business Profile Action */}
                            <a href="https://g.page/somosmart/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
                                <Store className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
                                <div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Review us on Google</div>
                                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> Nairobi, Kenya</div>
                                </div>
                            </a>
                        </div>
                        
                        {/* Column 2: Quick Links */}
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4 tracking-wide uppercase text-sm">Platform</h4>
                            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                                <li><button onClick={() => navigate('/pricing')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</button></li>
                                <li><a href="#how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How it Works</a></li>
                                <li><button onClick={() => setShowLogin(true)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Login</button></li>
                                <li><button onClick={() => navigate('/admin')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> System Admin</button></li>
                            </ul>
                        </div>
                        
                        {/* Column 3: Legal & Support */}
                        <div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-4 tracking-wide uppercase text-sm">Support</h4>
                            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
                                <li><button onClick={() => setShowContact(true)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact Us</button></li>
                                <li><button onClick={() => setShowPrivacy(true)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</button></li>
                                <li><button onClick={() => setShowTerms(true)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms of Service</button></li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                        <p>&copy; {new Date().getFullYear()} Somo Smart. All rights reserved.</p>
                        
                        {/* Social Links */}
                        <div className="flex items-center gap-4">
                            <a href="https://facebook.com/somosmart" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                <Facebook className="w-4 h-4" />
                            </a>
                            <a href="https://twitter.com/somosmart" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 hover:text-sky-500 dark:hover:text-sky-400 transition-colors">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="https://instagram.com/somosmart" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-pink-100 dark:hover:bg-pink-900/50 hover:text-pink-600 dark:hover:text-pink-400 transition-colors">
                                <Instagram className="w-4 h-4" />
                            </a>
                            <a href="https://linkedin.com/company/somosmart" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-700 dark:hover:text-blue-400 transition-colors">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
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

            {/* --- WHATSAPP FLOATING BUTTON --- */}
            <a
                href="https://wa.me/254722763760"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-[60] flex items-center gap-3 bg-[#25D366] text-white p-3 md:px-5 md:py-3 rounded-full shadow-2xl hover:bg-[#20bd5a] hover:scale-105 active:scale-95 transition-all group border-4 border-white/50 backdrop-blur-sm"
                title="Chat with us on WhatsApp"
            >
                <div className="hidden md:flex flex-col items-end mr-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#dcf8c6]">You need answers?</span>
                    <span className="text-sm font-bold leading-none mt-1">Chat....</span>
                </div>
                {/* Fallback WhatsApp SVG icon */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 md:w-6 md:h-6 drop-shadow-md">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
            </a>
        </div>
    );
};
