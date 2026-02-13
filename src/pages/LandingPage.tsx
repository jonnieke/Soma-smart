import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    GraduationCap, Users, Baby, ChevronRight, MessageSquare,
    ScanLine, CheckCircle, Menu, X, CheckSquare, Play, BookOpen, LogOut,
    CreditCard, AlertCircle, FileText, Clock, Award, ArrowRight, School,
    Sparkles, Zap, Building2, TrendingUp, Quote, Globe
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
import teacherWeaponImg from '../assets/images/teacher-weapon.png';
import { RegistrationModal } from '../components/RegistrationModal';
import { LegalModal } from '../components/LegalModal';
import { ContactModal } from '../components/ContactModal';
import { LoginModal } from '../components/LoginModal';
import { LogoutModal } from '../components/LogoutModal';
import { translations } from '../data/translations';

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
    const [registrationRole, setRegistrationRole] = useState<'STUDENT' | 'SCHOOL'>('STUDENT');
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

            {/* --- HEADER --- */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        {/* Logo */}
                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo(0, 0)}>
                            <img src={logoImg} alt="Somo Smart Logo - Kenya's Leading Study Assistant" className="w-24 h-24 object-contain" />
                            <div className="hidden sm:block">
                                <h1 className="text-3xl font-bold text-blue-900 leading-none tracking-tight">Somo Smart</h1>
                                <p className="text-[11px] text-blue-600 font-bold tracking-wide uppercase mt-1">Teach Faster. Learn Smarter. Improve Results.</p>
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
                            <button onClick={() => handleRoleSelect(UserRole.SCHOOL)} className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium transition-colors">
                                <School className="w-5 h-5 text-emerald-500" /> Schools
                            </button>
                            <button onClick={() => navigate('/pricing')} className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium transition-colors relative">
                                <CreditCard className="w-5 h-5 text-indigo-500" /> Pricing
                            </button>
                            <button onClick={() => handleRoleSelect(UserRole.PARENT)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <Users className="w-5 h-5 text-gray-500" /> Parents
                            </button>
                            <button onClick={toggleLanguage} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium transition-colors">
                                <Globe className="w-5 h-5 text-gray-400" />
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${language === 'EN' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>EN</span>
                                <span className="text-gray-300">/</span>
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${language === 'FR' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>FR</span>
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
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="md:hidden border-t border-slate-100 overflow-hidden bg-white"
                        >
                            <nav className="flex flex-col p-4 space-y-4">
                                <button onClick={() => { handleRoleSelect(UserRole.LEARNER); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 text-blue-700 font-bold">
                                    <Baby className="w-5 h-5" /> Students
                                </button>
                                <button onClick={() => { handleRoleSelect(UserRole.TEACHER); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <GraduationCap className="w-5 h-5" /> Teachers
                                </button>
                                <button onClick={() => { handleRoleSelect(UserRole.SCHOOL); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <School className="w-5 h-5 text-emerald-500" /> Schools
                                </button>
                                <button onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <div className="flex items-center gap-3">
                                        <CreditCard className="w-5 h-5 text-indigo-500" /> Pricing
                                    </div>
                                </button>
                                <button onClick={() => { handleRoleSelect(UserRole.PARENT); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <Users className="w-5 h-5" /> Parents
                                </button>
                                <button onClick={() => { toggleLanguage(); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium">
                                    <Globe className="w-5 h-5" /> Language: <span className="font-bold text-blue-600">{language === 'EN' ? 'English' : 'Français'}</span>
                                </button>
                            </nav>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.header>

            {/* --- HERO SECTION --- */}
            <section className="relative overflow-hidden bg-white py-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Column: Text & CTA */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            className="text-left"
                        >
                            <div
                                onClick={toggleLanguage}
                                className={`cursor-pointer mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${language === 'FR' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-indigo-50 border-indigo-100 text-indigo-700 hover:bg-indigo-100'}`}
                            >
                                <Globe className={`w-4 h-4 ${language === 'FR' ? 'text-white' : 'text-indigo-600'}`} />
                                <span className="font-bold">{t.language.frenchBadge}</span>
                                <span className="text-sm">{t.language.invitePrefix} {language === 'FR' ? 'Mode Activé ✅' : t.language.frenchClick} 🇫🇷</span>
                            </div>

                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-blue-900 tracking-tight mb-6 leading-[1.2] lg:leading-[1.1]">
                                {t.hero.headline} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t.hero.gradient}</span>
                            </h1>
                            <p className="text-base md:text-lg text-slate-600 mb-10 leading-relaxed max-w-xl">
                                {t.hero.subheadline}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
                                <button
                                    onClick={() => handleRoleSelect(UserRole.LEARNER)}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-xl font-bold text-lg shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2 group"
                                >
                                    {t.hero.ctaStudents} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                    className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 rounded-xl font-bold text-lg shadow-xl shadow-emerald-100 transition-all hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2 group border border-emerald-400/20"
                                >
                                    {t.hero.ctaTeachers} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => handleRoleSelect(UserRole.SCHOOL)}
                                    className="px-8 py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold text-lg shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 w-full sm:w-auto flex items-center justify-center gap-2 group border border-slate-700"
                                >
                                    {t.hero.ctaSchools} <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="relative"
                        >
                            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl shadow-blue-200/50 border border-white/50 backdrop-blur-sm aspect-[4/3] md:aspect-video bg-slate-100">
                                <img
                                    src={heroBannerImg}
                                    alt="Somo Smart Learning - Your Study Assistant for Kenyan Students"
                                    className="w-full h-full object-cover"
                                    fetchPriority="high"
                                    width="800"
                                    height="600"
                                />
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

                    {/* --- STRATEGIC DOMINANCE SECTION --- */}
                    <div className="mt-0 relative z-10">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-black text-blue-900 mb-4 tracking-tighter">
                                {t.efficiency.title} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t.efficiency.gradient}</span>
                            </h2>
                            <p className="text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
                                {t.efficiency.subtitle}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                {
                                    title: t.efficiency.darasa.title,
                                    desc: t.efficiency.darasa.desc,
                                    icon: Play,
                                    color: "bg-indigo-50 text-indigo-600",
                                    route: "/teacher/darasa",
                                    cta: "Record Now"
                                },
                                {
                                    title: t.efficiency.notes.title,
                                    desc: t.efficiency.notes.desc,
                                    icon: FileText,
                                    color: "bg-blue-50 text-blue-600",
                                    route: "/teacher/notes",
                                    cta: "Generate"
                                },
                                {
                                    title: t.efficiency.exam.title,
                                    desc: t.efficiency.exam.desc,
                                    icon: Award,
                                    color: "bg-emerald-50 text-emerald-600",
                                    route: "/revision",
                                    cta: "Setup Exam"
                                },
                                {
                                    title: t.efficiency.marking.title,
                                    desc: t.efficiency.marking.desc,
                                    icon: ScanLine,
                                    color: "bg-purple-50 text-purple-600",
                                    route: "/teacher/marking",
                                    cta: "Start Marking"
                                },
                                {
                                    title: t.efficiency.homework.title,
                                    desc: t.efficiency.homework.desc,
                                    icon: Clock,
                                    color: "bg-orange-50 text-orange-600",
                                    route: "/learner",
                                    cta: "Get Started"
                                }
                            ].map((card, idx) => (
                                <motion.div
                                    key={idx}
                                    whileHover={{ y: -8 }}
                                    className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-blue-100 transition-all flex flex-col justify-between group cursor-pointer"
                                    onClick={() => handleCardClick(card as any)}
                                >
                                    <div>
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <card.icon className="w-6 h-6" />
                                        </div>
                                        <h3 className="font-extrabold text-slate-800 mb-2 tracking-tight text-lg">{card.title}</h3>
                                        <p className="text-sm text-slate-500 font-medium leading-relaxed mb-4">
                                            {card.desc}
                                        </p>
                                    </div>
                                    <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 group-hover:gap-3 transition-all">
                                        {card.cta} <ArrowRight className="w-3 h-3" />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>

            {/* --- TEACHER'S POWER SUITE --- */}
            <section className="py-20 bg-white relative overflow-hidden mt-[-85px]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            className="space-y-8"
                        >
                            <div>
                                <span className="px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-widest rounded-full mb-4 inline-block">
                                    {t.powerSuite.badge}
                                </span>
                                <h2 className="text-3xl md:text-5xl font-black text-blue-900 leading-tight">
                                    {t.powerSuite.title} <span className="text-blue-600">{t.powerSuite.gradient}</span>
                                </h2>
                            </div>

                            <p className="text-lg text-slate-600 leading-relaxed">
                                {t.powerSuite.desc}
                            </p>

                            <div className="space-y-6">
                                {[
                                    {
                                        title: t.powerSuite.printables.title,
                                        desc: t.powerSuite.printables.desc,
                                        icon: FileText,
                                        color: "text-blue-600",
                                        bg: "bg-blue-50"
                                    },
                                    {
                                        title: t.powerSuite.creator.title,
                                        desc: t.powerSuite.creator.desc,
                                        icon: TrendingUp,
                                        color: "text-emerald-600",
                                        bg: "bg-emerald-50"
                                    },
                                    {
                                        title: t.powerSuite.marking.title,
                                        desc: t.powerSuite.marking.desc,
                                        icon: ScanLine,
                                        color: "text-purple-600",
                                        bg: "bg-purple-50"
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className={`flex-shrink-0 w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
                                            <item.icon className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg">{item.title}</h4>
                                            <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            className="relative group/card w-full max-w-4xl lg:w-[70%] mx-auto mt-[45px]"
                        >
                            <div className="relative z-10 bg-white rounded-[4rem] p-[30px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 flex flex-col items-center">
                                {/* Illustration Container */}
                                <div className="relative w-full aspect-[2/3] md:aspect-[3/4] rounded-[3rem] overflow-hidden mb-8 mx-auto">
                                    <motion.img
                                        src={teacherWeaponImg}
                                        alt="The Teacher's Secret Weapon"
                                        className="w-full h-full object-cover transform transition-transform duration-700 group-hover/card:scale-105"
                                        initial={{ scale: 1.1, opacity: 0 }}
                                        whileInView={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                </div>

                                {/* Floating Action Zone */}
                                <div className="w-full px-4 text-center">
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                        className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-3 relative z-10 group/btn"
                                    >
                                        {t.powerSuite.saveTime.cta}
                                        <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center group-hover/btn:bg-white/20 transition-colors">
                                            <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                        </div>
                                    </motion.button>
                                    <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                        Get Your Evenings Back!
                                    </p>
                                </div>

                                {/* Background Accents */}
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full"></div>
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full"></div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>



            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>

            {/* --- ROLES SECTION --- */}
            <section id="roles-section" className="py-0 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-extrabold text-blue-900 mb-4 tracking-tight">{t.roles.title} {t.roles.gradient}</h2>
                        <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">{t.roles.subtitle}</p>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Learner Card */}
                        <motion.div
                            whileHover={{ y: -10 }}
                            onClick={() => handleRoleSelect(UserRole.LEARNER)}
                            className="bg-white rounded-2xl shadow-xl shadow-slate-100 overflow-hidden cursor-pointer border border-slate-100 group flex flex-col transition-all duration-300 hover:shadow-orange-100"
                        >
                            <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 text-center text-white">
                                <Baby className="w-10 h-10 mx-auto mb-3 opacity-90" />
                                <h3 className="text-2xl font-bold">{t.roles.student.title}</h3>
                                <p className="text-white/80 font-medium italic text-sm">{t.roles.student.desc}</p>
                            </div>
                            <div className="h-64 overflow-hidden bg-gray-50 relative aspect-[4/3]">
                                <img src={learnerImg} alt="Kenyan Student using Somo Smart for CBC and KCSE revision" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" width="400" height="300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60"></div>
                            </div>
                            <div className="p-8 space-y-4 bg-white flex-1">
                                {t.roles.student.points.map((text, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-slate-700">
                                        <div className="p-1.5 rounded-lg bg-orange-50 text-orange-500">
                                            {idx === 0 ? <ScanLine className="w-4 h-4" /> : idx === 1 ? <MessageSquare className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{text}</span>
                                    </div>
                                ))}
                                <button className="w-full mt-4 py-3 rounded-xl bg-orange-50 text-orange-600 font-bold group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    {t.roles.student.cta}
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
                            <div className="h-64 overflow-hidden bg-gray-50 relative aspect-[4/3]">
                                <img src={teacherImg} alt="Kenyan Teacher creating lessons with Somo Smart" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" width="400" height="300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60"></div>
                            </div>
                            <div className="p-8 space-y-4 bg-white flex-1">
                                <div>
                                    <h3 className="text-2xl font-black text-blue-900 mb-2">{t.roles.teacher.title}</h3>
                                    <p className="text-slate-500 text-sm font-medium">{t.roles.teacher.desc}</p>
                                </div>
                                {[...t.roles.teacher.points].map((text, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-slate-700">
                                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-500">
                                            {idx === 0 ? <ScanLine className="w-4 h-4" /> : idx === 1 ? <FileText className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{text}</span>
                                    </div>
                                ))}
                                <button className="w-full mt-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    {t.roles.teacher.cta}
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
                            <div className="h-64 overflow-hidden bg-gray-50 relative aspect-[4/3]">
                                <img src={parentImg} alt="Kenyan Parent tracking student progress on Somo Smart" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy" decoding="async" width="400" height="300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent opacity-60"></div>
                            </div>
                            <div className="p-8 space-y-4 bg-white flex-1">
                                {t.roles.parent.points.map((text, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-slate-700">
                                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-500">
                                            {idx === 0 ? <CheckCircle className="w-4 h-4" /> : idx === 1 ? <MessageSquare className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                                        </div>
                                        <span className="font-bold text-sm tracking-tight">{text}</span>
                                    </div>
                                ))}
                                <button
                                    onClick={() => handleRoleSelect(UserRole.PARENT)}
                                    className="w-full mt-4 py-3 rounded-xl bg-emerald-50 text-emerald-600 font-bold group-hover:bg-emerald-500 group-hover:text-white transition-all"
                                >
                                    {t.roles.parent.cta}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-100 to-transparent"></div>

            {/* --- HOW IT WORKS --- */}
            <section id="how-it-works" className="py-6 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-20">
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

            {/* --- TESTIMONIALS SECTION --- */}
            <section className="py-24 relative overflow-hidden bg-slate-50/50">
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
                        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">Ready to Master Any Subject?</h2>
                        <p className="text-blue-100/80 mb-12 text-xl max-w-2xl mx-auto">Join the thousands of students already learning smarter with Somo Smart.</p>

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
        </div >
    );
};
