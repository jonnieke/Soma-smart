import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    GraduationCap, Users, Baby, ChevronRight, MessageSquare,
    ScanLine, CheckCircle, Menu, X, CheckSquare, Play, BookOpen, LogOut,
    CreditCard, AlertCircle, FileText, Clock, Award, ArrowRight, School,
    Sparkles, Zap, Building2, TrendingUp, Quote, Globe, ShieldCheck, BarChart, Star,
    Facebook, Twitter, Instagram, Linkedin, MapPin, Store, Mic, Send, Flame, Target, MessageCircle, Brain, CheckCheck, Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import { UserRole } from '../types';
import { useApp } from '../context/AppContext';

// Import Assets
import learnerImg from '../assets/images/learner.png';
import heroCbeImg from '../assets/images/hero_learner_cbe.png';
import teacherImg from '../assets/images/teacher.png';
import parentImg from '../assets/images/parent.png';
import logoImg from '../assets/images/main_logo.png';
import heroBannerImg from '../assets/images/soma_smart_hero_graphic_with_teacher.png';
import heroLearnerImg from '../assets/images/hero_learner_emotional.png';
import heroTeacherImg from '../assets/images/hero_teacher_emotional.png';
import heroScienceLabImg from '../assets/images/hero_science_lab.png';
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
    const [pendingRouteState, setPendingRouteState] = useState<Record<string, unknown> | null>(null);
    const [questionInput, setQuestionInput] = useState('');
    const [showMockAnswer, setShowMockAnswer] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedAnswer, setGeneratedAnswer] = useState<string | null>(null);

    const trackFunnelEvent = (eventName: string, params: Record<string, unknown> = {}) => {
        try {
            if (import.meta.env.VITE_GA_MEASUREMENT_ID !== 'G-CHECK_GA_DASHBOARD') {
                ReactGA.event(eventName, params);
            }
        } catch (_) {
            // Non-blocking analytics
        }
    };

    const handleGenerateAnswer = async () => {
        if (!questionInput.trim()) return;
        setShowMockAnswer(true);
        setIsGenerating(true);
        setGeneratedAnswer(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    model: 'gemini-2.5-flash',
                    contents: [{ role: 'user', parts: [{ text: `Answer this academic question in 1 or 2 concise, factual sentences for a student. Do not use markdown headers or formatting. State the answer playfully but smartly. Question: ${questionInput}` }] }]
                })
            });
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I analyzed this but could not generate a summary.';
            setGeneratedAnswer(text);
            trackFunnelEvent('learner_answer_generated', {
                source: 'landing_hero',
                question_length: questionInput.trim().length
            });
        } catch (err) {
            setGeneratedAnswer('An error occurred while generating the answer. Please check your connection.');
        } finally {
            setIsGenerating(false);
        }
    };

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

    // Auto-Redirect logged-in users to their respective dashboards
    React.useEffect(() => {
        // Only redirect if they navigate directly to '/' without any specific state intents like selectedPlan
        // AND if they haven't already been auto-redirected in this session. This allows them to manually click "Home" to see the landing page.
        const hasAutoRedirected = sessionStorage.getItem('hasAutoRedirected');
        if (!location.state && isRegistered && role !== UserRole.NONE && !hasAutoRedirected) {
            sessionStorage.setItem('hasAutoRedirected', 'true');
            const target = role === UserRole.TEACHER ? '/teacher' : (role === UserRole.SCHOOL ? '/school' : (role === UserRole.PARENT ? '/parent' : '/learner'));
            navigate(target, { replace: true });
        }
    }, [isRegistered, role, location.state, navigate]);

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

    const handleLibraryAccess = () => {
        trackFunnelEvent('library_access_clicked', {
            current_role: role,
            source: 'landing'
        });

        if (role === UserRole.TEACHER) {
            setRole(UserRole.TEACHER);
            navigate('/teacher', { state: { initialTab: 'LIBRARY' } });
            return;
        }

        if (!isRegistered && role === UserRole.NONE) {
            startGuestSession();
        }

        setRole(UserRole.LEARNER);
        navigate('/learner', { state: { targetTab: 'RESOURCES' } });
    };

    const handleGetStarted = () => {
        setRole(UserRole.LEARNER); // Default to learner
        setShowRegistration(true);
    };

    const handleRegistrationSuccess = () => {
        setShowRegistration(false);
        if (pendingRoute) {
            navigate(pendingRoute, pendingRouteState ? { state: pendingRouteState } : undefined);
            setPendingRoute(null);
            setPendingRouteState(null);
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
                            <div className="flex-1 min-w-0 flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm font-medium break-words">
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
                <html lang="en" />
                <title>Somo Smart | Kenya's #1 Smart Exam & Revision Assistant (KCSE, KPSEA, JSS)</title>
                <meta name="description" content="Master your exams with Somo Smart. Kenya's premier Smart platform for KCSE, KPSEA, and Junior School revision. Get instant explanations, auto-marked past papers, and personalized study notes." />
                <meta name="keywords" content="Somo Smart, KCSE revision 2024, KPSEA past papers, JSS revision notes, Smart tutor Kenya, Kenyan curriculum Smart tool, SomoSmart app, KILEA revision, CBE study assistant" />

                {/* AIO/SEO specific meta tags */}
                <meta name="smart-search-index" content="index" />
                <meta name="smart-knowledge-base" content="official" />
                <meta name="educational-framework" content="CBE, 8-4-4, KCSE, KPSEA, KJSEA" />
                <meta name="target-audience" content="Learners, Teachers, Parents, School Administrators" />
                <meta name="core-features" content="Smart Exam Assistant, Instant Explanations, Auto-Grading, Topical Quizzes, CBE Notes" />

                {/* Search Engine Optimization */}
                <meta name="robots" content="index, follow" />
                <meta name="author" content="Somo Smart" />
                <meta property="og:title" content="Somo Smart | Your Smart Exam Assistant - Improve Grades NOW!" />
                <meta property="og:description" content="Transform your revision with our Smart Assistant. Access verified KCSE, KPSEA, and JSS materials with instant smart feedback." />
                <meta property="og:image" content="https://somaai.co.ke/og-image.jpg" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://somaai.co.ke/" />

                {/* Twitter Meta */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Somo Smart | Kenya's Best Smart Study App" />
                <meta name="twitter:description" content="Improve your grades with our Smart Assistant. All Kenyan exams supported: KCSE, KPSEA, JSS." />

                <link rel="canonical" href="https://somaai.co.ke/" />

                {/* Structured Data / AIO */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        "name": "Somo Smart",
                        "url": "https://somaai.co.ke",
                        "logo": "https://somaai.co.ke/main_logo.png",
                        "description": "Kenya's #1 Smart Exam & Revision Assistant for KCSE, KPSEA, and JSS.",
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
                        <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8">
                            <button onClick={handleLibraryAccess} className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors text-sm flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/> Library</button>
                            <button onClick={() => navigate('/pricing')} className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors text-sm">Pricing</button>
                            <button onClick={() => navigate('/blog')} className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors text-sm flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/> Journal</button>
                            <button onClick={toggleLanguage} className="text-slate-400 hover:text-slate-600 transition-colors" title="Switch language">
                                <Globe className="w-4 h-4" />
                            </button>
                            <ThemeToggle />
                            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-700 pl-8">
                                <button onClick={() => setShowLogin(true)} className="text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors text-sm">Sign In</button>
                                <button
                                    onClick={() => setShowRegistration(true)}
                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm"
                                >
                                    Get Started
                                </button>
                            </div>
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
                            className="md:hidden border-t border-slate-100 overflow-hidden bg-white dark:bg-slate-900 relative z-[60]"
                        >
                            <nav aria-label="Mobile Menu" className="flex flex-col p-4 space-y-3">
                                <button onClick={() => { handleRoleSelect(UserRole.LEARNER); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                                    <GraduationCap className="w-5 h-5 text-indigo-500" /> Learner
                                </button>
                                <button onClick={() => { handleRoleSelect(UserRole.TEACHER); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                                    <BookOpen className="w-5 h-5 text-emerald-500" /> Educator
                                </button>
                                <button onClick={() => { handleRoleSelect(UserRole.PARENT); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                                    <Users className="w-5 h-5 text-purple-500" /> Parent
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                                <button onClick={() => { handleLibraryAccess(); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <BookOpen className="w-5 h-5 text-emerald-500" /> Library
                                </button>
                                <button onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <CreditCard className="w-5 h-5 text-slate-400" /> Pricing
                                </button>
                                <button onClick={() => { navigate('/blog'); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <BookOpen className="w-5 h-5 text-slate-400" /> Journal
                                </button>
                                <button onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <Users className="w-5 h-5 text-slate-400" /> Sign In
                                </button>
                                <button onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-400 font-medium text-sm">
                                    <Globe className="w-4 h-4" /> {language === 'EN' ? 'Français' : 'English'}
                                </button>
                                <div className="p-3 border-t border-slate-100 dark:border-slate-800 mt-2">
                                    <ThemeToggle className="w-full justify-center" />
                                </div>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>
            {/* --- HERO SECTION --- */}
            <section className="relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Top two-column: Copy + Image */}
                    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 pt-20 pb-12 lg:pt-28 lg:pb-16">

                        {/* LEFT: Urgent copy + Solve It chat */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                            className="flex-1 max-w-2xl"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
                                <Star className="w-3 h-3 fill-current" /> For KCSE, CBC &amp; KPSEA Students
                            </div>

                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-5">
                                That question you've been<br />stuck on since 8pm?
                                <span className="block text-indigo-600 dark:text-indigo-400 mt-2">Let's solve it now.</span>
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-8 max-w-lg">
                                Instant step-by-step answers, audio explanations &amp; revision tools — every KCSE, KPSEA and CBC subject. No waiting. No judgment.
                            </p>

                            {/* Solve It chat window */}
                            <div className="relative mb-5">
                                <div className="flex items-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-2.5 focus-within:border-indigo-400 dark:focus-within:border-indigo-600 transition-all">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0 mr-3">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <input
                                        type="text"
                                        value={questionInput}
                                        onChange={(e) => { setQuestionInput(e.target.value); if (showMockAnswer) setShowMockAnswer(false); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateAnswer(); }}
                                        placeholder="Type your question... e.g. Solve 3x + 7 = 22"
                                        className="flex-1 min-w-0 bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 text-base font-medium pr-2"
                                    />
                                    <button
                                        onClick={handleGenerateAnswer}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap flex items-center gap-2 shrink-0"
                                    >
                                        Solve It <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>

                                <AnimatePresence>
                                    {showMockAnswer && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                            className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-2xl border border-indigo-100 dark:border-slate-700 z-50"
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Somo Smart Answer</div>
                                                    {isGenerating ? (
                                                        <div className="space-y-2">
                                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-full animate-pulse" />
                                                            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4 animate-pulse" />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-slate-800 dark:text-slate-200 font-medium text-sm leading-relaxed">{generatedAnswer}</p>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                                    KCSE/CBC Context
                                                                </span>
                                                                <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                                    AI Assisted
                                                                </span>
                                                                <span className="px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-100">
                                                                    Verify With Class Material
                                                                </span>
                                                            </div>
                                                        </>
                                                    )}
                                                    {!isGenerating && (
                                                        <div className="mt-3">
                                                            <button
                                                                onClick={() => {
                                                                    trackFunnelEvent('learner_answer_cta_clicked', {
                                                                        source: 'landing_hero',
                                                                        cta: 'practice_5_questions'
                                                                    });
                                                                    const learnerRouteState = { pendingHeroQuestion: questionInput, autoStartPractice: true };

                                                                    if (isRegistered || role !== UserRole.NONE) {
                                                                        setRole(UserRole.LEARNER);
                                                                        navigate('/learner', { state: learnerRouteState });
                                                                        return;
                                                                    }

                                                                    setRole(UserRole.LEARNER);
                                                                    setRegistrationRole('STUDENT');
                                                                    setPendingRoute('/learner');
                                                                    setPendingRouteState(learnerRouteState);
                                                                    setShowRegistration(true);
                                                                }}
                                                                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1 shadow-md shadow-indigo-200"
                                                            >
                                                                Practice 5 Questions <ArrowRight className="w-3 h-3" />
                                                            </button>

                                                            <button
                                                                onClick={() => {
                                                                    trackFunnelEvent('learner_answer_cta_clicked', {
                                                                        source: 'landing_hero',
                                                                        cta: 'full_step_by_step'
                                                                    });
                                                                    if (isRegistered || role !== UserRole.NONE) {
                                                                        setRole(UserRole.LEARNER);
                                                                        navigate('/learner', { state: { pendingHeroQuestion: questionInput } });
                                                                        return;
                                                                    }

                                                                    setRole(UserRole.LEARNER);
                                                                    setRegistrationRole('STUDENT');
                                                                    setPendingRoute('/learner');
                                                                    setPendingRouteState({ pendingHeroQuestion: questionInput });
                                                                    setShowRegistration(true);
                                                                }}
                                                                className="mt-2 text-[11px] font-bold text-slate-500 hover:text-indigo-700 transition-colors flex items-center gap-1"
                                                            >
                                                                Need full step-by-step notes? Open detailed view <ArrowRight className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Quick-prompt chips */}
                            <div className={`flex flex-wrap gap-2 mb-8 transition-all duration-200 ${showMockAnswer ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                {['Photosynthesis explained simply', 'How do I find the gradient?', "Kenya's major rivers"].map((q, i) => (
                                    <button key={i} onClick={() => { setQuestionInput(q); setShowMockAnswer(false); }}
                                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 hover:border-indigo-200 transition-all">
                                        {q}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-500 dark:text-slate-400">
                                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Try for Free — then KES 20/day</div>
                                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> All subjects &amp; levels</div>
                                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Works offline</div>
                            </div>
                        </motion.div>

                        {/* RIGHT: Science lab hero image */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
                            className="flex-1 w-full lg:max-w-[520px] relative"
                        >
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
                                <img
                                    src={heroScienceLabImg}
                                    alt="Kenyan students studying in a science laboratory"
                                    fetchPriority="high"
                                    loading="eager"
                                    decoding="async"
                                    className="w-full h-auto object-cover"
                                    style={{ maxHeight: '480px' }}
                                />
                                {/* Subtle overlay gradient at bottom */}
                                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/60 to-transparent" />
                                {/* Solution-based proof pill on image */}
                                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-slate-100 dark:border-slate-700 rounded-full px-5 py-2.5 shadow-xl flex items-center gap-3 whitespace-nowrap">
                                    <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center shrink-0">
                                        <Sparkles className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Step-by-step answers for every KCSE &amp; KPSEA subject</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom: Unified Portal Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="pb-16"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Choose your profile</span>
                            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                            {/* Learner */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group flex items-center gap-5">
                                <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-600 transition-colors">
                                    <GraduationCap className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white">Learner</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step-by-step answers & quizzes</div>
                                </div>
                                <button onClick={() => handleRoleSelect(UserRole.LEARNER)} className="shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 text-slate-600 dark:text-slate-300 transition-colors">
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Educator */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-all group flex items-center gap-5">
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
                                    <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white">Educator</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Lesson plans & auto-grading</div>
                                </div>
                                <button onClick={() => handleRoleSelect(UserRole.TEACHER)} className="shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-500 text-slate-600 dark:text-slate-300 transition-colors">
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Parent */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all group flex items-center gap-5">
                                <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/40 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-purple-600 transition-colors">
                                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white">Parent</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track progress & manage plans</div>
                                </div>
                                <button onClick={() => handleRoleSelect(UserRole.PARENT)} className="shrink-0 p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-500 text-slate-600 dark:text-slate-300 transition-colors">
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- PRESTIGE TICKER --- */}

            <div className="border-y border-slate-200/50 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 py-6 sm:py-8 overflow-hidden relative backdrop-blur-sm">
                <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-r from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-40 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent z-10 pointer-events-none" />
                <div className="flex w-full overflow-hidden">
                    <motion.div
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ ease: "linear", duration: 30, repeat: Infinity }}
                        className="flex items-center justify-around flex-nowrap shrink-0 gap-8 sm:gap-20 px-4 min-w-[200%]"
                    >
                        {[
                            "KNEC Rubric Aligned", "CBC Support", "8-4-4 Ready", "JSS Integrated",
                            "Automated Marking", "Personalized Quizzes", "Interactive Tutors", "Secure Platform",
                            "KNEC Rubric Aligned*", "CBC Support*", "8-4-4 Ready*", "JSS Integrated*",
                            "Automated Marking*", "Personalized Quizzes*", "Interactive Tutors*", "Secure Platform*"
                        ].map((school, i) => (
                            <div key={i} className="flex items-center gap-3 opacity-40 dark:opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default shrink-0">
                                <School className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700 dark:text-slate-300" />
                                <span className="text-lg sm:text-2xl font-black tracking-widest uppercase text-slate-700 dark:text-slate-300 whitespace-nowrap">{school.replace('*', '')}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
                <div className="text-center mt-6">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Built to Kenyan Curriculum Standards</span>
                </div>
            </div>
            {/* --- EXAM ASSISTANT CTA --- */}
            <section className="py-12 relative overflow-hidden bg-white dark:bg-slate-950 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-[2rem] p-10 md:p-14 shadow-xl overflow-hidden relative group border border-slate-800 dark:border-slate-700">
                        {/* Subtle background glow */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs mb-6 uppercase tracking-wider border border-blue-500/30">
                                    <Star className="w-4 h-4 text-blue-400 fill-current" />
                                    For Candidates
                                </div>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">
                                    Meet your powerful new Exam Assistant.
                                </h2>
                                <p className="text-slate-300 text-lg md:text-xl font-medium max-w-2xl leading-relaxed">
                                    Crush your KCSE & KPSEA exams with instant access to verified past papers, complete with auto-generated, step-by-step solutions mapping to KNEC rubrics.
                                </p>
                            </div>

                            <div className="flex-shrink-0">
                                <button
                                    onClick={() => navigate('/revision')}
                                    className="bg-white text-slate-900 hover:bg-slate-50 font-bold text-lg px-8 py-5 rounded-xl shadow-lg hover:-translate-y-1 transition-all flex items-center gap-3"
                                >
                                    Try it now <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CBE/KCSE CURRICULUM ALIGNMENT --- */}

            {/* --- HOW IT WORKS: 4 EASY STEPS --- */}
            <section id="how-it-works" className="py-16 bg-slate-50 dark:bg-slate-900 transition-colors border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs mb-6 uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-sm">
                            <Sparkles className="w-4 h-4" /> Zero Friction
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Learning Made <span className="text-blue-600 dark:text-blue-400">Simple</span></h2>
                        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto">Get from a confused student to a subject master in 4 incredibly easy steps.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                                <ScanLine className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">Snap a Photo</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Take a photo of any exam paper, homework problem, or textbook page.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6">
                                <MessageSquare className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">AI Analyzes</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Our KNEC-aligned Assistant breaks down the problem step-by-step instantly.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                                <CheckSquare className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">Practice Quizzes</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Test your understanding with automatically generated follow-up questions.</p>
                        </div>

                        {/* Step 4 */}
                        <div className="flex flex-col items-center text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center mb-6">
                                <Award className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">Master & Pass</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Retain knowledge permanently and dramatically boost your KCSE mean grade.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CORE FEATURES BENTO BOX --- */}
            <section className="py-16 bg-white dark:bg-slate-950 transition-colors border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs mb-6 uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-sm">
                            <Zap className="w-4 h-4" /> Powered by Super Teacher OS
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Everything you need to <span className="text-blue-600 dark:text-blue-400">excel</span>. As a Teacher.</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 font-medium">A fully integrated suite of tools designed specifically for the Kenyan curriculum.</p>

                        <div className="flex justify-center mb-16">
                            <button
                                onClick={() => {
                                    setLoginTab('TEACHER');
                                    handleRoleSelect(UserRole.TEACHER);
                                }}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm hover:-translate-y-1 transition-all flex items-center gap-3"
                            >
                                Enter Educator Portal <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Large Feature: Darasa Mode (Span 2 cols) */}
                        <div className="md:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 md:p-10 shadow-sm flex flex-col justify-center">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Darasa Mode</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-xl">Transform any classroom into a smart learning environment. Real-time audio transcription and automatic summarization of key syllabus concepts while you teach.</p>
                        </div>

                        {/* 2. Vertical Feature: Marking Manager */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm flex flex-col">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                                <CheckSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Smart Marking</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-6">Upload handwritten assignments. Our advanced Smart Marking automatically grades essays and math problems against KNEC rubrics.</p>
                        </div>

                        {/* 3. Horizontal Feature 1: Revision Hub */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm flex flex-col justify-between">
                            <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center mb-6">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Powerful Examination Assistant</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Generate CBE-aligned lesson plans, access verified KCSE and KPSEA past papers, and get auto-generated step-by-step solutions instantly.</p>
                        </div>

                        {/* 4. Horizontal Feature 2: Analytics Span 2 */}
                        <div className="md:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm flex items-center justify-between gap-6">
                            <div className="flex-1 max-w-lg">
                                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl flex items-center justify-center mb-6">
                                    <BarChart className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Predictive Analytics</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium">Identify exactly which syllabus topics your learners are struggling with before exams. Detailed progress reports map performance back to core KCSE and KPSEA competencies.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- INSTITUTIONAL INTELLIGENCE BENTO BOX --- */}
            <section className="py-16 bg-slate-50 dark:bg-slate-900 transition-colors border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs mb-6 uppercase tracking-wider border border-slate-300 dark:border-slate-700 shadow-sm">
                            <Building2 className="w-4 h-4" /> For School Administrators
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Institutional <span className="text-blue-600 dark:text-blue-400">Intelligence</span></h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 font-medium">Stop guessing your results. Get real-time syllabus tracking, automated grading, and predictive analytics for your entire school.</p>

                        <div className="flex justify-center mb-16">
                            <button
                                onClick={() => {
                                    setLoginTab('SCHOOL');
                                    handleRoleSelect(UserRole.SCHOOL);
                                }}
                                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl shadow-sm hover:-translate-y-1 transition-all flex items-center gap-3"
                            >
                                Launch School Admin <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Large Feature: Predictive Mean Score (Span 2 cols) */}
                        <div className="md:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 md:p-10 shadow-sm flex flex-col justify-center">
                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Predictive Mean Score</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-xl">Aggregating live data from Smart Marking and student quizzes to project your school's KCSE/KPSEA Mean Score in real-time.</p>
                        </div>

                        {/* 2. Vertical Feature: Global Syllabus Tracking */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm flex flex-col">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Global Syllabus Tracking</h3>
                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">Guarantee complete KNEC & KICD compliance digitally. See instantly if Form 4 Chemistry is lagging behind schedule without chasing teachers.</p>
                        </div>

                        {/* 3. Horizontal Feature: Automated Exam Production */}
                        <div className="md:col-span-3 bg-blue-50 dark:bg-slate-800 border border-blue-100 dark:border-slate-700 rounded-2xl p-8 lg:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex-1 max-w-2xl text-center md:text-left">
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-white dark:bg-slate-700 rounded-xl shadow-sm mb-6 text-indigo-600 dark:text-indigo-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Automated Exam Production</h3>
                                <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">Stop spending thousands on external examiners. Generate bespoke, KNEC-standard exams localized exactly to your school's current syllabus coverage in one click.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* --- SCHOOL CALENDAR --- */}
            <SchoolCalendar />

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-20"></div>

            {/* --- TESTIMONIALS --- */}
            <section className="py-16 bg-white dark:bg-slate-950 transition-colors border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs mb-6 uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-sm">
                            <Star className="w-4 h-4" /> Rated 4.9/5 by 10,000+ Users
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Voices of <span className="text-blue-600 dark:text-blue-400">Success</span></h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">See how Somo Smart is transforming the educational landscape for Kenyan students, teachers, and parents.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Learner Testimonial */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative group">
                            <div className="absolute top-8 right-8 text-blue-200 dark:text-blue-900/50">
                                <Quote className="w-10 h-10" />
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg relative z-10">
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
                                "Somo Smart explained Chemistry concepts that I struggled with for months. I moved from a C+ to an A- in my latest mocks. The Smart breakdown is just like having a personal tutor."
                            </p>
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400">
                                <GraduationCap className="w-4 h-4" /> Form 4 Candidate
                            </div>
                        </div>

                        {/* Teacher Testimonial */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative group">
                            <div className="absolute top-8 right-8 text-emerald-200 dark:text-emerald-900/50">
                                <Quote className="w-10 h-10" />
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-lg relative z-10">
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
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <School className="w-4 h-4" /> Mathematics HOD
                            </div>
                        </div>

                        {/* Parent Testimonial */}
                        <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 relative group">
                            <div className="absolute top-8 right-8 text-orange-200 dark:text-orange-900/50">
                                <Quote className="w-10 h-10" />
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-lg relative z-10">
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
                            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400">
                                <Users className="w-4 h-4" /> Parent of JSS Student
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PUBLIC LIBRARY ACCESS CARD --- */}
            <section id="library" className="py-16 bg-slate-50 dark:bg-slate-950 border-y border-slate-200 dark:border-slate-900 transition-colors">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 overflow-hidden"
                    >
                        <div className="grid md:grid-cols-[1.25fr_0.75fr] gap-0">
                            <div className="p-6 sm:p-8 lg:p-10">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-widest mb-5">
                                    <BookOpen className="w-4 h-4" /> Content Library
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-950 dark:text-white tracking-tight mb-4">
                                    Official Study Materials, All Free.
                                </h2>
                                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mb-8">
                                    Browse verified syllabuses, expert notes, and KCSE/KPSEA past papers free for every Kenyan learner.
                                </p>
                                <div className="flex flex-wrap gap-3 mb-8">
                                    {['Verified syllabuses', 'Expert notes', 'KCSE/KPSEA past papers'].map((item) => (
                                        <span key={item} className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200">
                                            <CheckCircle className="w-4 h-4 text-emerald-500" /> {item}
                                        </span>
                                    ))}
                                </div>
                                <button
                                    onClick={handleLibraryAccess}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 dark:bg-white px-6 py-3 text-white dark:text-slate-950 font-black shadow-lg shadow-slate-300/60 dark:shadow-black/30 hover:-translate-y-0.5 transition-all"
                                >
                                    Open Library <ArrowRight className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-6 sm:p-8 lg:p-10 flex flex-col justify-center border-t md:border-t-0 md:border-l border-emerald-100 dark:border-emerald-900/50">
                                <div className="space-y-5">
                                    {[
                                        { icon: ShieldCheck, title: 'Official guides', body: 'Syllabuses stay as guides, separated from learner study notes.' },
                                        { icon: FileText, title: 'Learning resources', body: 'Notes and past papers open inside the app library where filters work properly.' },
                                        { icon: Award, title: 'For both users', body: 'Learners browse resources; teachers reach their library workspace.' }
                                    ].map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={item.title} className="flex gap-4">
                                                <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-sm shrink-0">
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-black text-slate-900 dark:text-white">{item.title}</h3>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.body}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
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

            {/* --- JOURNAL PREVIEW --- */}
            <section className="py-24 bg-white dark:bg-slate-950 transition-colors border-t border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest mb-4">
                                <BookOpen className="w-3.5 h-3.5" /> Latest from the Journal
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Insights for Smarter Learning</h2>
                        </div>
                        <button 
                            onClick={() => navigate('/blog')}
                            className="group flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                            Visit the Somo Journal <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Article 1 */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            onClick={() => navigate('/blog/how-to-prepare-for-kcse-mathematics')}
                            className="group cursor-pointer bg-slate-50 dark:bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-all duration-300"
                        >
                            <div className="h-48 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1632559646295-c1e14afb8e5c?w=800&q=80" alt="Mathematics Guide" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-6">
                                <div className="text-xs font-bold text-slate-400 mb-2">EDUCATION • MAY 2024</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-blue-600 transition-colors">How to Prepare for KCSE Mathematics: A Comprehensive Guide</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 font-medium">Discover proven strategies and techniques to master KCSE Mathematics. From understanding core concepts to practicing past papers efficiently...</p>
                            </div>
                        </motion.div>

                        {/* Article 2 */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="group bg-slate-50 dark:bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-all duration-300"
                        >
                            <div className="h-48 overflow-hidden flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/20">
                                <Sparkles className="w-12 h-12 text-indigo-400" />
                            </div>
                            <div className="p-6">
                                <div className="text-xs font-bold text-slate-400 mb-2">ANNOUNCEMENT • APRIL 2024</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors">Introducing the AI Personal Tutor: A New Era of Learning</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 font-medium">We are excited to unveil our new AI-powered personal tutor, designed to provide instant explanations and personalized feedback to every student.</p>
                            </div>
                        </motion.div>

                        {/* Article 3 */}
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="group bg-slate-50 dark:bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 hover:shadow-2xl transition-all duration-300"
                        >
                            <div className="h-48 overflow-hidden">
                                <img src="https://images.unsplash.com/photo-1546410531-bea518040081?auto=format&fit=crop&q=80" alt="CBC Curriculum" loading="lazy" decoding="async" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <div className="p-6">
                                <div className="text-xs font-bold text-slate-400 mb-2">CURRICULUM • MARCH 2024</div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors">Navigating the CBC: What Parents Need to Know</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 font-medium">Understanding the Competency-Based Curriculum can be a challenge. We break down the key pillars and how you can support your child's success.</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* --- BOTTOM FOOTER --- */}
            <footer className="bg-white dark:bg-slate-950 py-12 border-t border-slate-100 dark:border-slate-800 transition-colors overflow-hidden">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
                        {/* Column 1: Brand & Local SEO */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-2 cursor-pointer mb-4" onClick={() => window.scrollTo(0, 0)}>
                                <img src={logoImg} alt="Somo Smart Logo" className="h-12 w-auto object-contain grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all dark:invert dark:opacity-60 dark:hover:invert-0 dark:hover:opacity-100" />
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-full sm:max-w-sm leading-relaxed">
                                Kenya's leading Smart learning platform. Empowering students, teachers, and parents with strictly aligned CBC and KCSE educational tools.
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
                                <li><button onClick={() => navigate('/blog')} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Somo Journal</button></li>
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
                onSuccess={(tab) => {
                    if (pendingRoute) {
                        navigate(pendingRoute);
                        setPendingRoute(null);
                    } else {
                        const target = tab === 'TEACHER' ? '/teacher' : (tab === 'SCHOOL' ? '/school' : '/learner');
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
                                <li>To generate Smart explanations relevant to your grade level.</li>
                                <li>To track learning progress for Parents and Teachers.</li>
                                <li>To improve the accuracy of our educational content.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">3. Data Safety & AI</h3>
                            <p>We use Google&apos;s Gemini Models to process text and images. </p>
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
                            <p>The content provided by Somo Smart is generated by our Smart Engine. While we strive for accuracy:</p>
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
                                <li>Do not attempt to reverse-engineer or &quot;jailbreak&quot; the Smart Assistant.</li>
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
            <div className="md:hidden fixed bottom-6 left-4 right-4 p-2.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl z-50 rounded-2xl flex items-center justify-around pointer-events-auto">
                <div className="flex flex-col pl-2">
                    <span className="text-white text-xs font-black tracking-tight leading-none mb-1">Ready to pass?</span>
                    <span className="text-blue-300 text-[9px] font-bold uppercase tracking-widest">Solutions for KCSE & CBC</span>
                </div>
                <button
                    onClick={() => handleRoleSelect(UserRole.LEARNER)}
                    className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-5 rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                    Start Free <ChevronRight className="w-4 h-4 text-blue-200" />
                </button>
            </div>

            {/* --- WHATSAPP FLOATING BUTTON (icon-only) --- */}
            <a
                href="https://wa.me/254722763760"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-24 left-4 md:bottom-8 md:left-8 z-[60] flex items-center justify-center bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:bg-[#20bd5a] hover:scale-110 active:scale-95 transition-all border-4 border-white/50 backdrop-blur-sm"
                title="Chat with us on WhatsApp"
                aria-label="Chat with us on WhatsApp"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 drop-shadow-md">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
                </svg>
            </a>
        </div>
    );
};
