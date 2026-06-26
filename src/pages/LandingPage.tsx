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
import { supabase } from '../lib/supabase';

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
import heroScienceLabAvif from '../assets/images/hero_science_lab.avif';
import heroScienceLabWebp from '../assets/images/hero_science_lab.webp';
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
import { ThemeToggle } from '../components/ThemeToggle';
import { safeImport } from '../utils/safeImport';

const SchoolCalendar = React.lazy(() =>
    safeImport(() => import('../components/SchoolCalendar').then(module => ({ default: module.SchoolCalendar })))
);

interface LandingPageProps {
    authError?: {
        code: string;
        description: string;
    } | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({ authError: initialAuthError }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setRole, role, logout, isRegistered, isPro, language, toggleLanguage, startGuestSession, teacherUsageCount, lowDataMode, toggleLowDataMode, studentCode, studentProfile, teacherProfile } = useApp();
    const showLegacySections = false;
    const [authError, setAuthError] = useState<{ code: string, description: string } | null>(initialAuthError || null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showRegistration, setShowRegistration] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [showContact, setShowContact] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showNavigationGuide, setShowNavigationGuide] = useState(false);
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
    const [showDetailedView, setShowDetailedView] = useState(false);
    const [detailedAnswer, setDetailedAnswer] = useState<string | null>(null);
    const [isGeneratingDetailed, setIsGeneratingDetailed] = useState(false);
    const [heroLimitReached, setHeroLimitReached] = useState(false);
    const [detailedLimitReached, setDetailedLimitReached] = useState(false);
    const [detailedUsesLeft, setDetailedUsesLeft] = useState<number>(() => {
        try {
            const count = parseInt(localStorage.getItem('soma_hero_detailed_uses') || '0', 10);
            return Math.max(0, 3 - count);
        } catch {
            return 3;
        }
    });
    const [showMobileStickyCta, setShowMobileStickyCta] = useState(false);

    const trackFunnelEvent = (eventName: string, params: Record<string, unknown> = {}) => {
        try {
            if (import.meta.env.VITE_GA_MEASUREMENT_ID !== 'G-CHECK_GA_DASHBOARD') {
                ReactGA.event(eventName, params);
            }
        } catch (_) {
            // Non-blocking analytics
        }
    };

    // When the user signs in, lift the guest rate-limit gate and sync auth state
    React.useEffect(() => {
        if (isRegistered) {
            setHeroLimitReached(false);
            setShowLogin(false);
            setShowRegistration(false);
        }
    }, [isRegistered]);

    React.useEffect(() => {
        if (isRegistered) return; // Registered users go to their dashboard — no guide needed
        try {
            if (localStorage.getItem('soma_seen_navigation_guide') !== 'true') {
                window.setTimeout(() => setShowNavigationGuide(true), 3500);
            }
        } catch (_) {
            window.setTimeout(() => setShowNavigationGuide(true), 3500);
        }
     
    }, []);

    const closeNavigationGuide = () => {
        try {
            localStorage.setItem('soma_seen_navigation_guide', 'true');
        } catch (_) {
            // Non-blocking local storage
        }
        setShowNavigationGuide(false);
    };

    React.useEffect(() => {
        if (!showNavigationGuide) return;
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeNavigationGuide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showNavigationGuide]);

    const callGeminiProxy = async (prompt: string): Promise<string> => {
        const payload = {
            feature: 'ai_generation',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        };
        // Use the real session JWT when logged in so the edge function applies
        // the higher registered-user limit instead of the guest IP limit (3/day).
        let authToken = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const extraHeaders: Record<string, string> = {};
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                authToken = session.access_token;
            } else if (studentCode) {
                extraHeaders['x-student-code'] = studentCode;
            }
        } catch {}
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...extraHeaders
        };
        // One retry after 2 s on transient 429 (system busy), but not on quota limits
        for (let attempt = 0; attempt < 2; attempt++) {
            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`, {
                method: 'POST', headers, body: JSON.stringify(payload)
            });
            if (response.status === 429) {
                let code = 'RATE_LIMIT';
                try { const body = await response.json(); code = body?.code ?? code; } catch {}
                // Quota limits (per-user/IP daily limit) — don't retry, surface the code
                if (code === 'GUEST_LIMIT_REACHED' || code === 'PLAN_LIMIT_REACHED' || code === 'FEATURE_LIMIT_REACHED') {
                    throw new Error(code);
                }
                // Transient busy (Gemini-side) — retry once after 2 s
                if (attempt === 0) { await new Promise(r => setTimeout(r, 2000)); continue; }
                throw new Error('RATE_LIMIT');
            }
            if (!response.ok) throw new Error('API_ERROR');
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        }
        throw new Error('RATE_LIMIT');
    };

    React.useEffect(() => {
        const handleScroll = () => {
            setShowMobileStickyCta(window.scrollY > 680);
        };
        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleGenerateAnswer = async () => {
        if (!questionInput.trim()) return;
        setShowMockAnswer(true);
        setIsGenerating(true);
        setGeneratedAnswer(null);
        setDetailedAnswer(null);
        setHeroLimitReached(false);
        setDetailedLimitReached(false);
        try {
            const text = await callGeminiProxy(
                `Answer this academic question in exactly 1 precise sentence. No markdown, no formatting. Use correct curriculum terminology relevant to the Kenyan KCSE/CBC syllabus. State only the essential result or definition — no explanation of method. Question: ${questionInput}`
            );
            setGeneratedAnswer(text || 'I analysed this but could not generate a summary.');
            trackFunnelEvent('learner_answer_generated', {
                source: 'landing_hero',
                question_length: questionInput.trim().length
            });
        } catch (err: any) {
            const code = err?.message ?? '';
            if (code === 'GUEST_LIMIT_REACHED' || code === 'PLAN_LIMIT_REACHED' || code === 'FEATURE_LIMIT_REACHED') {
                setHeroLimitReached(true);
                trackFunnelEvent('hero_limit_reached', { source: 'landing_hero', code });
            } else if (code === 'RATE_LIMIT') {
                setGeneratedAnswer('High demand right now — please try again in a few seconds.');
            } else {
                setGeneratedAnswer('Could not reach the server. Please check your connection and try again.');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleOpenDetailedView = async () => {
        if (!questionInput.trim()) return;
        trackFunnelEvent('detailed_view_clicked', { source: 'landing_hero', is_registered: isRegistered });

        // Registered users go straight to the learner workspace — they have full access
        if (isRegistered || role !== UserRole.NONE) {
            setRole(UserRole.LEARNER);
            navigate('/learner', { state: { pendingHeroQuestion: questionInput } });
            return;
        }

        // Unregistered visitors: show the teaser modal with login gate
        let count = 0;
        try { count = parseInt(localStorage.getItem('soma_hero_detailed_uses') || '0', 10); } catch {}
        setShowDetailedView(true);
        if (count >= 3) return;
        try {
            localStorage.setItem('soma_hero_detailed_uses', String(count + 1));
            setDetailedUsesLeft(Math.max(0, 3 - (count + 1)));
        } catch {}
        if (detailedAnswer || isGeneratingDetailed) return;
        setIsGeneratingDetailed(true);
        try {
            const text = await callGeminiProxy(
                `Provide a structured academic explanation for the following question, aligned to the Kenyan KCSE/CBC curriculum. Start with the final answer in one short line, then give the steps. Number each step clearly. Show working where needed. Use precise academic language. Question: ${questionInput}`
            );
            const cleaned = (text || '')
                .replace(/\*\*(.*?)\*\*/g, '$1')    // **bold** → plain (no s: don't cross lines)
                .replace(/^[*\-]\s/gm, '• ')         // line-start * / - bullets → • (before italic strip)
                .replace(/^#{1,6}\s*/gm, '')          // ## headers → plain
                .replace(/\*(.*?)\*/g, '$1')          // *italic* → plain (no s: don't cross lines)
                .replace(/\*/g, '');                  // any remaining *
            setDetailedAnswer(cleaned || 'Unable to generate explanation.');
            trackFunnelEvent('detailed_view_opened', { source: 'landing_hero', uses_left: Math.max(0, 2 - count) });
        } catch (err: any) {
            const code = err?.message ?? '';
            if (code === 'GUEST_LIMIT_REACHED' || code === 'PLAN_LIMIT_REACHED' || code === 'FEATURE_LIMIT_REACHED') {
                setDetailedLimitReached(true);
            } else if (code === 'RATE_LIMIT') {
                setDetailedAnswer('High demand right now — please close and try again in a few seconds.');
            } else if (err instanceof TypeError) {
                setDetailedAnswer('No connection. Please check your internet and try again.');
            } else {
                setDetailedAnswer('Could not load the explanation. Please try again.');
            }
        } finally {
            setIsGeneratingDetailed(false);
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
        navigate('/learner', { state: { targetTab: 'RESOURCES', targetIntent: 'official_library' } });
    };

    const handleGetStarted = () => {
        setRole(UserRole.LEARNER); // Default to learner
        setShowRegistration(true);
    };

    const handleLearnerQuickStart = (targetTab?: string, targetIntent?: string) => {
        if (!isRegistered && role === UserRole.NONE) {
            startGuestSession();
        }

        setRole(UserRole.LEARNER);
        navigate('/learner', targetTab ? { state: { targetTab, targetIntent } } : undefined);
    };

    const scrollToFeatureLauncher = () => {
        trackFunnelEvent('feature_launcher_nav_clicked', { source: 'landing_header' });
        document.getElementById('feature-launcher')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleFeatureLaunch = (feature: string, action: () => void) => {
        trackFunnelEvent('feature_launcher_opened', { feature, source: 'landing_feature_launcher' });
        action();
    };

    const navigationGuideItems = [
        {
            title: 'Learners',
            description: 'Ask Akili, open notes, revise with past papers, take drills, and listen to lessons.',
            icon: GraduationCap,
            cta: 'Open Learner',
            action: () => handleRoleSelect(UserRole.LEARNER),
            tone: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-800'
        },
        {
            title: 'Teachers',
            description: 'Create notes, lesson plans, homework, Darasa lessons, and marking feedback.',
            icon: School,
            cta: 'Open Teacher',
            action: () => handleRoleSelect(UserRole.TEACHER),
            tone: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
        },
        {
            title: 'Parents',
            description: 'Track learner effort, view progress proof, and manage paid access.',
            icon: Users,
            cta: 'Open Parent',
            action: () => handleRoleSelect(UserRole.PARENT),
            tone: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-800'
        },
        {
            title: 'Library',
            description: 'Browse official free notes, syllabus guides, and KCSE/KPSEA past papers.',
            icon: BookOpen,
            cta: 'Open Library',
            action: handleLibraryAccess,
            tone: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800'
        }
    ];

    const learnerFeatureLaunchers = [
        {
            title: 'Ask Akili',
            kicker: 'Instant Doubt Solver',
            description: 'For the "I am stuck" moment: quick explanation, step-by-step help, and follow-up practice.',
            icon: MessageCircle,
            cta: 'Ask now',
            accent: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-200 dark:border-indigo-800',
            button: 'bg-indigo-600 hover:bg-indigo-700 text-white',
            action: () => handleLearnerQuickStart('SMART_TUTOR', 'ask_akili')
        },
        {
            title: 'Exam Prep',
            kicker: 'KCSE & KPSEA Drills',
            description: 'Past-paper practice, examiner-style feedback, weak-area repair, and topic drills that do not stop at answers.',
            icon: Target,
            cta: 'Start prep',
            accent: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800',
            button: 'bg-amber-500 hover:bg-amber-600 text-white',
            action: () => handleLearnerQuickStart('SUBJECTS', 'exam_prep_papers')
        },
        {
            title: 'Listen & Learn',
            kicker: 'Audio Revision',
            description: 'Turn notes into listening lessons for commutes, chores, revision breaks, and low-reading-energy days.',
            icon: Headphones,
            cta: 'Listen',
            accent: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800',
            button: 'bg-rose-600 hover:bg-rose-700 text-white',
            action: () => handleLearnerQuickStart('TALKBACK', 'listen_and_learn')
        },
        {
            title: 'Library',
            kicker: 'Official Free Materials',
            description: 'Open notes, syllabuses as guides, and past papers with grade, subject, and source filters.',
            icon: BookOpen,
            cta: 'Open library',
            accent: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800',
            button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
            action: handleLibraryAccess
        }
    ];

    const teacherFeatureLaunchers = [
        {
            title: 'Create Notes & Lessons',
            description: 'Generate class-ready notes, lesson flow, quizzes, and recap material from one teaching goal.',
            icon: FileText,
            cta: 'Create content',
            action: () => navigate('/teacher/notes')
        },
        {
            title: 'Darasa Mode',
            description: 'Record or run a lesson, then turn it into notes, recap, questions, and learner follow-up.',
            icon: Mic,
            cta: 'Open Darasa',
            action: () => navigate('/teacher/darasa')
        },
        {
            title: 'Marking Engine',
            description: 'Mark learner work, show lost marks clearly, and send repair feedback that points to the next action.',
            icon: CheckCheck,
            cta: 'Mark work',
            action: () => navigate('/teacher/marking')
        }
    ];

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
                <title>Somo Smart | KCSE, KPSEA and CBC Study Support for Kenya</title>
                <meta name="description" content="Somo Smart helps Kenyan learners, teachers and parents with step-by-step answers, exam prep, official notes, past papers, audio learning and progress tracking." />
                <meta name="keywords" content="Somo Smart, KCSE revision, KPSEA past papers, CBC notes, Kenyan learner app, teacher lesson notes, parent progress tracking" />

                {/* AIO/SEO specific meta tags */}
                <meta name="smart-search-index" content="index" />
                <meta name="smart-knowledge-base" content="official" />
                <meta name="educational-framework" content="CBE, 8-4-4, KCSE, KPSEA, KJSEA" />
                <meta name="target-audience" content="Learners, Teachers, Parents, School Administrators" />
                <meta name="core-features" content="Smart Exam Assistant, Instant Explanations, Auto-Grading, Topical Quizzes, CBE Notes" />

                {/* Search Engine Optimization */}
                <meta name="robots" content="index, follow, max-image-preview:large" />
                <meta name="author" content="Somo Smart" />
                <meta property="og:site_name" content="Somo Smart" />
                <meta property="og:title" content="Somo Smart | KCSE, KPSEA and CBC Study Support for Kenya" />
                <meta property="og:description" content="Step-by-step answers, exam prep, official notes, past papers, audio learning and progress tracking for Kenyan learners, parents and teachers." />
                <meta property="og:image" content="https://somaai.co.ke/og-image.png" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://somaai.co.ke/" />

                {/* Twitter Meta */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@somasmart" />
                <meta name="twitter:title" content="Somo Smart | KCSE, KPSEA and CBC Study Support for Kenya" />
                <meta name="twitter:description" content="Step-by-step answers, exam prep, official notes, past papers, audio learning and progress tracking." />

                <link rel="canonical" href="https://somaai.co.ke/" />
                <link rel="preload" as="image" href={heroScienceLabWebp} type="image/webp" />

                {/* Structured Data / AIO */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "EducationalOrganization",
                        "name": "Somo Smart",
                        "url": "https://somaai.co.ke",
                        "logo": "https://somaai.co.ke/main_logo.png",
                        "description": "Study support for Kenyan learners, teachers and parents across KCSE, KPSEA and CBC.",
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
                            "price": "20",
                            "priceCurrency": "KES"
                        },
                        "description": "Step-by-step answers, exam prep, official notes, past papers, audio learning and progress tracking."
                    })}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": "Somo Smart",
                        "url": "https://somaai.co.ke",
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": "https://somaai.co.ke/?q={search_term_string}",
                            "query-input": "required name=search_term_string"
                        }
                    })}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "What does Somo Smart do?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "It helps Kenyan learners, teachers and parents with step-by-step answers, exam prep, official notes, past papers, audio learning and progress tracking."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Can teachers use Somo Smart?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Yes. Teachers can create notes, lesson flow, quizzes, Darasa recaps and marking feedback."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Does the library include notes and past papers?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "Yes. Logged-in learners can access official notes, syllabus guides and KCSE/KPSEA past papers inside the library."
                                }
                            }
                        ]
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
                            <button
                                onClick={() => setShowNavigationGuide(true)}
                                className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors text-sm flex items-center gap-1"
                            >
                                <MapPin className="w-3.5 h-3.5" /> Guide
                            </button>
                            <button
                                onClick={scrollToFeatureLauncher}
                                className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors text-sm flex items-center gap-1"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Features
                            </button>
                            <button
                                onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 font-bold transition-colors text-sm flex items-center gap-1.5"
                            >
                                <BookOpen className="w-3.5 h-3.5"/> Teacher Workspace
                            </button>
                            <button onClick={handleLibraryAccess} className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors text-sm flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/> Library</button>
                            <button onClick={() => navigate('/pricing')} className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors text-sm">Pricing</button>
                            <button onClick={() => navigate('/blog')} className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors text-sm flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/> Journal</button>
                            <button onClick={toggleLanguage} className="text-slate-400 hover:text-slate-600 transition-colors" title="Switch language">
                                <Globe className="w-4 h-4" />
                            </button>
                            <ThemeToggle />
                            <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-700 pl-8">
                                {isRegistered ? (
                                    <>
                                        <span className="text-sm font-bold text-slate-600 dark:text-slate-300 truncate max-w-[140px]">
                                            {studentProfile?.name || teacherProfile?.name || 'Welcome back'}
                                        </span>
                                        <button
                                            onClick={() => navigate(role === UserRole.TEACHER ? '/teacher' : role === UserRole.SCHOOL ? '/school' : role === UserRole.PARENT ? '/parent' : '/learner')}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-bold text-sm transition-all shadow-sm flex items-center gap-1.5"
                                        >
                                            My Dashboard <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setShowLogoutModal(true)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors" title="Sign out">
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setShowLogin(true)} className="text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors text-sm">Sign In</button>
                                        <button
                                            onClick={() => setShowRegistration(true)}
                                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-full font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm"
                                        >
                                            Get Started
                                        </button>
                                    </>
                                )}
                            </div>
                        </nav>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center gap-2">
                            <button
                                onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                className="bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold text-[11px] shadow-md"
                            >
                                Teacher
                            </button>
                            <button
                                onClick={() => handleRoleSelect(UserRole.LEARNER)}
                                className="bg-[#5b61de] text-white px-4 py-2 rounded-lg font-bold text-xs shadow-md"
                            >
                                Learner
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
                                    <BookOpen className="w-5 h-5 text-emerald-500" /> Teacher Workspace
                                </button>
                                <button onClick={() => { handleRoleSelect(UserRole.PARENT); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold">
                                    <Users className="w-5 h-5 text-purple-500" /> Parent
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2" />
                                <button onClick={() => { setShowNavigationGuide(true); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <MapPin className="w-5 h-5 text-indigo-500" /> Quick Guide
                                </button>
                                <button onClick={() => { scrollToFeatureLauncher(); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <Sparkles className="w-5 h-5 text-indigo-500" /> Features
                                </button>
                                <button onClick={() => { handleLibraryAccess(); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <BookOpen className="w-5 h-5 text-emerald-500" /> Library
                                </button>
                                <button onClick={() => { navigate('/pricing'); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <CreditCard className="w-5 h-5 text-slate-400" /> Pricing
                                </button>
                                <button onClick={() => { navigate('/blog'); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                    <BookOpen className="w-5 h-5 text-slate-400" /> Journal
                                </button>
                                {isRegistered ? (
                                    <button onClick={() => { navigate(role === UserRole.TEACHER ? '/teacher' : role === UserRole.SCHOOL ? '/school' : role === UserRole.PARENT ? '/parent' : '/learner'); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold">
                                        <ArrowRight className="w-5 h-5" /> My Dashboard
                                    </button>
                                ) : (
                                    <button onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                                        <Users className="w-5 h-5 text-slate-400" /> Sign In
                                    </button>
                                )}
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
                    <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-16 pt-12 pb-10 sm:pt-20 sm:pb-12 lg:pt-28 lg:pb-16">

                        {/* LEFT: Urgent copy + Solve It chat */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
                            className="flex-1 max-w-2xl"
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest mb-6">
                                <Star className="w-3 h-3 fill-current" /> Loved by 10,000+ Kenyan Learners &amp; Teachers
                            </div>

                            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-5">
                                AI study help for
                                <span className="block text-indigo-600 dark:text-indigo-400 mt-2">CBC, KPSEA &amp; KCSE learners.</span>
                            </h1>
                            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 font-medium leading-relaxed mb-6 sm:mb-8 max-w-lg">
                                Ask any question, get step-by-step explanations, listen to notes aloud, and show parents real weekly progress — built for Kenyan learners.
                            </p>

                            {/* Solve It chat window */}
                            <div className="relative mb-5">
                                <div className="flex flex-col sm:flex-row sm:items-center bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-2.5 focus-within:border-indigo-400 dark:focus-within:border-indigo-600 transition-all">
                                    <div className="hidden sm:flex w-10 h-10 bg-indigo-600 rounded-xl items-center justify-center shrink-0 mr-3">
                                        <Sparkles className="w-5 h-5 text-white" />
                                    </div>
                                    <input
                                        type="text"
                                        value={questionInput}
                                        onChange={(e) => { setQuestionInput(e.target.value); if (showMockAnswer) setShowMockAnswer(false); if (heroLimitReached) setHeroLimitReached(false); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateAnswer(); }}
                                        placeholder="Type your question... e.g. Solve 3x + 7 = 22"
                                        className="w-full flex-1 min-w-0 bg-transparent border-none focus:outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 text-base font-medium pr-2 py-2 sm:py-0"
                                    />
                                    <button
                                        onClick={handleGenerateAnswer}
                                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap flex items-center justify-center gap-2 shrink-0"
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
                                                    ) : heroLimitReached ? (
                                                        /* Conversion card — shown instead of error when guest daily quota is used up */
                                                        <div>
                                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-snug">You've used today's 3 free answers.</p>
                                                            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Create a free account to get 10 answers per day — no card needed.</p>
                                                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                                                <button
                                                                    onClick={() => { trackFunnelEvent('hero_limit_register_clicked', { source: 'landing_hero' }); setShowRegistration(true); }}
                                                                    className="flex-1 min-h-[38px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black transition-colors flex items-center justify-center gap-1"
                                                                >
                                                                    Register Free <ArrowRight className="w-3 h-3" />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setShowLogin(true); }}
                                                                    className="flex-1 min-h-[38px] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-black transition-colors"
                                                                >
                                                                    Sign In
                                                                </button>
                                                            </div>
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
                                                    {!isGenerating && !heroLimitReached && (
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
                                                                Start 5-Question Drill <ArrowRight className="w-3 h-3" />
                                                            </button>

                                                            <button
                                                                onClick={handleOpenDetailedView}
                                                                className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors flex items-center gap-1"
                                                            >
                                                                To earn more marks? Open step-by-step notes <ArrowRight className="w-3 h-3" />
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
                            <div className="flex flex-wrap gap-2 mt-3">
                                {['Photosynthesis explained simply', 'How do I find the gradient?', "Kenya's major rivers", 'Expand (x+2)(x-3)'].map((q, i) => (
                                    <button key={i} onClick={() => { setQuestionInput(q); setShowMockAnswer(false); }}
                                        className="px-3 py-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 hover:border-indigo-200 transition-all">
                                        {q}
                                    </button>
                                ))}
                            </div>
                            <div className="grid gap-2 text-sm text-slate-500 dark:text-slate-400 sm:grid-cols-3">
                                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Free start · KES 20/day via M-PESA</div>
                                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Official notes and past papers</div>
                                <div className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" /> Parent progress proof · teacher tools</div>
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => handleRoleSelect(UserRole.LEARNER)}
                                    className="w-full sm:w-auto min-h-[46px] rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 text-sm font-black text-white flex items-center justify-center gap-2"
                                >
                                    Try Free — No Sign-up Needed <ChevronRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                    className="w-full sm:w-auto min-h-[46px] rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-5 text-sm font-black text-emerald-800 flex items-center justify-center gap-2 dark:border-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-200"
                                >
                                    I&apos;m a Teacher <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="mt-5 sm:mt-6 hidden sm:block rounded-2xl border border-slate-200 bg-white/80 p-3 sm:p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-800/70">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-2">First time here?</p>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">Choose what you need now</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => handleLearnerQuickStart('SMART_TUTOR', 'ask_akili')}
                                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-left hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
                                    >
                                        <p className="text-xs font-black text-slate-800 dark:text-slate-100">Ask Akili</p>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Stuck now</p>
                                    </button>
                                    <button
                                        onClick={() => handleLearnerQuickStart('RESOURCES', 'official_library')}
                                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-left hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
                                    >
                                        <p className="text-xs font-black text-slate-800 dark:text-slate-100">Library</p>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Notes & papers</p>
                                    </button>
                                    <button
                                        onClick={() => handleLearnerQuickStart('SUBJECTS', 'exam_prep_papers')}
                                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-left hover:border-orange-300 dark:hover:border-orange-600 transition-colors"
                                    >
                                        <p className="text-xs font-black text-slate-800 dark:text-slate-100">Exam Prep</p>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Past paper drills</p>
                                    </button>
                                    <button
                                        onClick={() => handleLearnerQuickStart('TALKBACK', 'listen_and_learn')}
                                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2.5 text-left hover:border-pink-300 dark:hover:border-pink-600 transition-colors"
                                    >
                                        <p className="text-xs font-black text-slate-800 dark:text-slate-100">Listen &amp; Learn</p>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Audio learning</p>
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        trackFunnelEvent('navigation_guide_opened', { source: 'hero_quick_start' });
                                        setShowNavigationGuide(true);
                                    }}
                                    className="mt-3 inline-flex items-center gap-1 text-[11px] font-black text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-100"
                                >
                                    Not sure where to start? Open the 30-second guide <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <p className="mt-4 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                Teachers: save prep and marking time without replacing your classroom judgement.
                            </p>
                        </motion.div>

                        {/* RIGHT: Science lab hero image */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.25 }}
                            className="flex-1 w-full lg:max-w-[520px] relative"
                        >
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700">
                                <picture>
                                    <source srcSet={heroScienceLabAvif} type="image/avif" />
                                    <source srcSet={heroScienceLabWebp} type="image/webp" />
                                    <img
                                        src={heroScienceLabImg}
                                        alt="Kenyan students studying in a science laboratory"
                                        fetchPriority="high"
                                        loading="eager"
                                        decoding="async"
                                        width={768}
                                        height={768}
                                        className="w-full h-auto object-cover"
                                        style={{ maxHeight: '480px' }}
                                    />
                                </picture>
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
                            <div className="hidden">
                                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-3 py-2 text-center">
                                    <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">-40%</div>
                                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Prep Time</div>
                                </div>
                                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-3 py-2 text-center">
                                    <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">Faster</div>
                                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Marking Turnaround</div>
                                </div>
                                <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800 px-3 py-2 text-center">
                                    <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">Daily</div>
                                    <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Class Follow-up</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRoleSelect(UserRole.TEACHER)}
                                className="hidden"
                            >
                                Start In Teacher Workspace <ChevronRight className="w-4 h-4" />
                            </button>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
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

                            {/* Teacher */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-600 transition-all group flex items-center gap-5">
                                <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 transition-colors">
                                    <BookOpen className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-900 dark:text-white">Teacher</div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Plan, mark, assign, and follow up faster</div>
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
                        <div className="hidden">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">For Teachers</p>
                                <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">Reduce prep time, clear marking backlog, and keep class follow-up consistent.</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    <span className="rounded-full bg-white/80 dark:bg-slate-900/50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">Schemes of work</span>
                                    <span className="rounded-full bg-white/80 dark:bg-slate-900/50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">Auto-marking</span>
                                    <span className="rounded-full bg-white/80 dark:bg-slate-900/50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700">Class follow-up</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/teacher')}
                                className="w-full sm:w-auto min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 text-sm font-black text-white flex items-center justify-center gap-2"
                            >
                                Open Teacher Workspace <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* --- CONVERSION PROOF STRIP --- */}
            <section className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-5 dark:border-indigo-900 dark:bg-indigo-950/30">
                            <GraduationCap className="h-7 w-7 text-indigo-700 dark:text-indigo-300" />
                            <h2 className="mt-3 text-lg font-black text-slate-950 dark:text-white">For learners</h2>
                            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                                Get unstuck, practise the method, and build confidence before homework, CATs, KPSEA, KCSE, or end-term exams.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-purple-100 bg-purple-50/70 p-5 dark:border-purple-900 dark:bg-purple-950/30">
                            <ShieldCheck className="h-7 w-7 text-purple-700 dark:text-purple-300" />
                            <h2 className="mt-3 text-lg font-black text-slate-950 dark:text-white">For parents</h2>
                            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                                See effort, weak topics, practice history, plan use, and whether learning is actually happening after payment.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                            <BookOpen className="h-7 w-7 text-emerald-700 dark:text-emerald-300" />
                            <h2 className="mt-3 text-lg font-black text-slate-950 dark:text-white">For teachers</h2>
                            <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                                Create lessons, schemes, quizzes, Darasa recaps, and marking feedback faster. The teacher stays in control.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURE LAUNCHER --- */}
            <section id="feature-launcher" className="py-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 transition-colors scroll-mt-24">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
                        <div>
                            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
                                <Sparkles className="h-3.5 w-3.5" /> Window shop the platform
                            </div>
                            <h2 className="mt-4 text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
                                Choose the problem. Somo opens the right tool.
                            </h2>
                            <p className="mt-3 max-w-2xl text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                                From a stuck learner to a busy teacher or a parent checking progress, every path leads to a working feature, not a brochure page.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Fast learner path</p>
                            <p className="mt-1 text-sm font-bold text-slate-800 dark:text-slate-100">
                                Notes &rarr; Ask Akili &rarr; Drill &rarr; Listen &rarr; Progress proof
                            </p>
                        </div>
                    </div>

                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Learner quick starts</h3>
                        <button
                            onClick={() => handleFeatureLaunch('learner_workspace', () => handleRoleSelect(UserRole.LEARNER))}
                            className="hidden sm:inline-flex items-center gap-2 text-sm font-black text-indigo-700 hover:text-indigo-900 dark:text-indigo-300 dark:hover:text-indigo-100"
                        >
                            Open full learner workspace <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {learnerFeatureLaunchers.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <article
                                    key={feature.title}
                                    className="group flex min-h-[260px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
                                >
                                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border ${feature.accent}`}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{feature.kicker}</p>
                                    <h4 className="mt-2 text-xl font-black text-slate-950 dark:text-white">{feature.title}</h4>
                                    <p className="mt-3 flex-1 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">{feature.description}</p>
                                    <button
                                        onClick={() => handleFeatureLaunch(feature.title, feature.action)}
                                        className={`mt-5 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl px-4 text-sm font-black transition-all ${feature.button}`}
                                    >
                                        {feature.cta} <ArrowRight className="h-4 w-4" />
                                    </button>
                                </article>
                            );
                        })}
                    </div>

                    <div className="mt-10 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 dark:border-emerald-800 dark:bg-emerald-950/25">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Teacher productivity</p>
                                    <h3 className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Plan, teach, mark, and follow up faster.</h3>
                                    <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-700 dark:text-slate-300">
                                        Teachers can start from the work they need done today: create a lesson, run Darasa mode, or mark learner work with useful feedback.
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleFeatureLaunch('teacher_workspace', () => handleRoleSelect(UserRole.TEACHER))}
                                    className="min-h-[44px] rounded-xl bg-emerald-700 px-5 text-sm font-black text-white transition-colors hover:bg-emerald-800"
                                >
                                    Teacher workspace
                                </button>
                            </div>
                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                                {teacherFeatureLaunchers.map((feature) => {
                                    const Icon = feature.icon;
                                    return (
                                        <button
                                            key={feature.title}
                                            onClick={() => handleFeatureLaunch(feature.title, feature.action)}
                                            className="rounded-2xl border border-emerald-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-emerald-800 dark:bg-slate-900 dark:hover:border-emerald-500"
                                        >
                                            <Icon className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
                                            <h4 className="mt-3 text-sm font-black text-slate-950 dark:text-white">{feature.title}</h4>
                                            <p className="mt-2 min-h-[60px] text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">{feature.description}</p>
                                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                                                {feature.cta} <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="grid gap-5">
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                                <ShieldCheck className="h-7 w-7 text-slate-700 dark:text-slate-200" />
                                <h3 className="mt-3 text-xl font-black text-slate-950 dark:text-white">Parent proof</h3>
                                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                                    Parents can see effort, practice, weak areas, and whether the paid plan is being used for real study.
                                </p>
                                <button
                                    onClick={() => handleFeatureLaunch('parent_dashboard', () => navigate('/parent'))}
                                    className="mt-4 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-black text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                                >
                                    View parent dashboard <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-800 dark:bg-indigo-950/30">
                                <CreditCard className="h-7 w-7 text-indigo-700 dark:text-indigo-300" />
                                <h3 className="mt-3 text-xl font-black text-slate-950 dark:text-white">Simple plans and credits</h3>
                                <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                                    Start small, add credits when needed, and block duplicate payments when a plan is already active.
                                </p>
                                <button
                                    onClick={() => handleFeatureLaunch('pricing', () => navigate('/pricing'))}
                                    className="mt-4 inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
                                >
                                    See pricing <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
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
            {showLegacySections && (
            <>
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
                                    Practice with past papers, get examiner-style explanations, repair weak topics, and build confidence before KCSE, KPSEA, and school exams.
                                </p>
                            </div>

                            <div className="flex-shrink-0">
                                <button
                                    onClick={() => navigate('/revision')}
                                    className="bg-white text-slate-900 hover:bg-slate-50 font-bold text-lg px-8 py-5 rounded-xl shadow-lg hover:-translate-y-1 transition-all flex items-center gap-3"
                                >
                                    Start exam prep <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            </>
            )}

            {/* --- STUDENT TESTIMONIALS --- */}
            <section className="py-16 bg-white dark:bg-slate-950 transition-colors border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-xs mb-4 uppercase tracking-wider border border-amber-200 dark:border-amber-800">
                            <Star className="w-3.5 h-3.5 fill-current" /> Real Students, Real Results
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                            Kenyan students <span className="text-indigo-600 dark:text-indigo-400">saw real grade improvements</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-3 text-base font-medium">Support for the late-night stuck moment, exam pressure, and daily practice between classes.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                quote: "I used to fail Chemistry consistently. After using Somo Smart for two weeks before my mid-term, I got a B+. The step-by-step mole calculations finally made sense.",
                                name: "Kevin M.",
                                tag: "Form 3",
                                emoji: "C",
                                color: "indigo"
                            },
                            {
                                quote: "I type a question from a past paper, it breaks it down, then asks me follow-up questions. My KCSE mocks improved by 14 marks.",
                                name: "Fatuma A.",
                                tag: "Form 4",
                                emoji: "P",
                                color: "emerald"
                            },
                            {
                                quote: "I'm in Form 2 and struggle with English essays. Somo Smart helped me understand how to structure arguments. My teacher noticed the improvement without me even telling her I was using it.",
                                name: "Brian O.",
                                tag: "Form 2",
                                emoji: "E",
                                color: "purple"
                            },
                            {
                                quote: "The voice feature helps me learn and solve problems. It also helps me improve on oral conversation.",
                                name: "Gabu",
                                tag: "Grade 7 CBC",
                                emoji: "V",
                                color: "pink"
                            }
                        ].map(({ quote, name, tag, emoji, color }) => (
                            <motion.div
                                key={name}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                                className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex flex-col gap-4 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-center gap-1">
                                    {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                                </div>
                                <p className="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed flex-1">
                                    "{quote}"
                                </p>
                                <div className="flex items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                                        color === 'indigo' ? 'bg-indigo-100 dark:bg-indigo-900/40' :
                                        color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-900/40' :
                                        color === 'pink' ? 'bg-pink-100 dark:bg-pink-900/40' :
                                        'bg-purple-100 dark:bg-purple-900/40'
                                    }`}>{emoji}</div>
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{name}</p>
                                        <p className="text-[11px] text-slate-400 font-medium">{tag}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS: 4 EASY STEPS --- */}
            <section id="how-it-works" className="py-16 bg-slate-50 dark:bg-slate-900 transition-colors border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs mb-6 uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-sm">
                            <Sparkles className="w-4 h-4" /> Zero Friction
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Learning Made <span className="text-blue-600 dark:text-blue-400">Simple</span></h2>
                        <p className="text-slate-600 dark:text-slate-400 text-lg font-medium max-w-2xl mx-auto">Move from confusion to practice in four steps: ask, understand, test yourself, then track progress.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                        {/* Step 1 */}
                        <div className="flex flex-col items-center text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6">
                                <ScanLine className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">Ask or Snap</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Type any question or snap a photo of an exam paper, homework, or textbook page to get instant help.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="flex flex-col items-center text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center mb-6">
                                <MessageSquare className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">Akili Explains</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Ask Akili breaks the problem into plain steps and checks whether you understand the method.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="flex flex-col items-center text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                                <CheckSquare className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">Practice the Idea</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Turn the explanation into short drills so you learn the method, not just the answer.</p>
                        </div>

                        {/* Step 4 */}
                        <div className="flex flex-col items-center text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400 rounded-xl flex items-center justify-center mb-6">
                                <Award className="w-7 h-7" />
                            </div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-3">Show Progress</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">Keep a record of effort, weak areas, and improvement so parents and teachers see real study.</p>
                        </div>
                    </div>
                </div>
            </section>

            {showLegacySections && (
            <>
            {/* --- CORE FEATURES BENTO BOX --- */}
            <section className="py-16 bg-white dark:bg-slate-950 transition-colors border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs mb-6 uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-sm">
                            <Zap className="w-4 h-4" /> Powered by Super Teacher OS
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Teacher Workload, <span className="text-blue-600 dark:text-blue-400">Actually Reduced</span>.</h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 font-medium">Plan faster, mark consistently, publish to class stream, and track learner support from one teacher workspace.</p>

                        <div className="flex justify-center mb-16">
                            <button
                                onClick={() => {
                                    setLoginTab('TEACHER');
                                    handleRoleSelect(UserRole.TEACHER);
                                }}
                                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm hover:-translate-y-1 transition-all flex items-center gap-3"
                            >
                                Open Teacher Workspace <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Large Feature: Darasa Mode (Span 2 cols) */}
                        <div className="md:col-span-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 md:p-10 shadow-sm flex flex-col justify-center">
                            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-6">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Darasa Mode (No More Missed Notes)</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-xl">Capture live teaching automatically with real-time transcription and topic summaries, so learners stop missing key points and teachers stop repeating the same explanations.</p>
                        </div>

                        {/* 2. Vertical Feature: Marking Manager */}
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-sm flex flex-col">
                            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-6">
                                <CheckSquare className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Smart Marking (Clear Backlog Faster)</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium mb-6">Upload handwritten assignments and get rubric-aligned grading support for essays and math, so feedback goes back to learners on time.</p>
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
            <React.Suspense
                fallback={
                    <section className="py-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="h-10 w-48 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse mb-6" />
                            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="rounded-3xl border border-slate-200 dark:border-slate-800 p-6 bg-slate-50 dark:bg-slate-950 animate-pulse">
                                        <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800 mb-4" />
                                        <div className="h-5 w-2/3 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
                                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded mb-2" />
                                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                }
            >
                <SchoolCalendar />
            </React.Suspense>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent opacity-20"></div>
            </>
            )}

            {/* --- TESTIMONIALS --- */}
            <section className="py-16 bg-white dark:bg-slate-950 transition-colors border-t border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs mb-6 uppercase tracking-wider border border-blue-200 dark:border-blue-800 shadow-sm">
                            <Star className="w-4 h-4" /> Rated 4.9/5 by 10,000+ Users
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">What learners, teachers, <span className="text-blue-600 dark:text-blue-400">and parents say</span></h2>
                        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">Real results from Kenyan classrooms — better grades, less marking time, and clear progress proof for families.</p>
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
                                    Official Notes &amp; Past Papers — Free Inside the App.
                                </h2>
                                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mb-8">
                                    Browse syllabus guides, expert notes, and KCSE/KPSEA past papers inside the learner library with grade and subject filters.
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
            {showLegacySections && (
            <>
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
                                Open Teacher Workspace
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

            </>
            )}

            {showLegacySections && (
            <>
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

            </>
            )}

            {/* --- FINAL DECISION CTA --- */}
            <section className="bg-white py-14 dark:bg-slate-950">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-2xl shadow-slate-300/40 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/30 sm:p-8 lg:p-10">
                        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-300">No sign-up required to start</p>
                                <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
                                    Open the app. Solve a real problem in the next 2 minutes.
                                </h2>
                                <p className="mt-4 text-base font-medium leading-relaxed text-slate-300">
                                    A learner can solve one hard question, a teacher can prepare one lesson, and a parent can check whether study is actually happening — right now, for free.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                                <button
                                    onClick={() => handleFeatureLaunch('final_cta_learner', () => handleLearnerQuickStart('SMART_TUTOR', 'ask_akili'))}
                                    className="rounded-2xl bg-white p-4 text-left text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-indigo-50"
                                >
                                    <GraduationCap className="h-6 w-6 text-indigo-600" />
                                    <span className="mt-3 block text-sm font-black">Learner</span>
                                    <span className="mt-1 block text-xs font-bold leading-relaxed text-slate-600">Ask Akili and practice the method.</span>
                                </button>
                                <button
                                    onClick={() => handleFeatureLaunch('final_cta_teacher', () => handleRoleSelect(UserRole.TEACHER))}
                                    className="rounded-2xl bg-white p-4 text-left text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-emerald-50"
                                >
                                    <School className="h-6 w-6 text-emerald-600" />
                                    <span className="mt-3 block text-sm font-black">Teacher</span>
                                    <span className="mt-1 block text-xs font-bold leading-relaxed text-slate-600">Create, teach, mark, and follow up.</span>
                                </button>
                                <button
                                    onClick={() => handleFeatureLaunch('final_cta_parent', () => navigate('/parent'))}
                                    className="rounded-2xl bg-white p-4 text-left text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-purple-50"
                                >
                                    <Users className="h-6 w-6 text-purple-600" />
                                    <span className="mt-3 block text-sm font-black">Parent</span>
                                    <span className="mt-1 block text-xs font-bold leading-relaxed text-slate-600">See effort, weak areas, and plan use.</span>
                                </button>
                            </div>
                        </div>
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
                            <a href="https://g.page/r/Ccxl6TZuQd3zEBM/review" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group">
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
                                <li><button onClick={() => setShowNavigationGuide(true)} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">How it Works</button></li>
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
            {/* --- DETAILED VIEW MODAL --- */}
            <AnimatePresence>
                {showDetailedView && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/70 px-0 sm:px-4 py-0 sm:py-6 backdrop-blur-sm"
                        onClick={() => setShowDetailedView(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 32, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 32, scale: 0.98 }}
                            className="w-full sm:max-w-2xl overflow-hidden rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 flex flex-col"
                            style={{ maxHeight: '88vh' }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800 shrink-0">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Step-by-step notes</p>
                                    <h2 className="mt-1 text-base font-black text-slate-950 dark:text-white truncate">{questionInput}</h2>
                                </div>
                                <button
                                    onClick={() => setShowDetailedView(false)}
                                    className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white shrink-0"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Body */}
                            {((!isRegistered && detailedUsesLeft === 0 && !detailedAnswer) || detailedLimitReached) ? (
                                /* Full gate — guest preview limit OR registered user daily limit reached */
                                <div className="flex flex-col items-center justify-center gap-5 p-8 text-center flex-1">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
                                        <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                    {isRegistered ? (
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Daily limit reached</p>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">You've used today's free AI calls</h3>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                                                Upgrade to a plan for unlimited step-by-step notes, exam prep, and audio lessons.
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">3 free previews used</p>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Create a free account to keep going</h3>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                                                Unlock full step-by-step notes for any question, practice drills, and progress tracking — free to start.
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                                        {isRegistered ? (
                                            <button onClick={() => { setShowDetailedView(false); navigate('/pricing'); }} className="flex-1 min-h-[46px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-colors">See Plans</button>
                                        ) : (
                                            <>
                                                <button onClick={() => { setShowDetailedView(false); setShowRegistration(true); }} className="flex-1 min-h-[46px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-colors">Register Free</button>
                                                <button onClick={() => { setShowDetailedView(false); setShowLogin(true); }} className="flex-1 min-h-[46px] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl font-black text-sm transition-colors">Sign In</button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                /* Partial view with blur gate */
                                <div className="relative flex-1 min-h-0">
                                    {/* Scrollable content */}
                                    <div className="overflow-y-auto h-full p-5 pb-36">
                                        {isGeneratingDetailed ? (
                                            <div className="space-y-3 py-2">
                                                {[100, 90, 100, 75, 100, 88, 60].map((w, i) => (
                                                    <div key={i} className={`h-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse`} style={{ width: `${w}%` }} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
                                                {detailedAnswer}
                                            </div>
                                        )}
                                    </div>

                                    {/* Gradient fade + blur overlay on bottom half */}
                                    {!isRegistered && (
                                        <>
                                            <div className="absolute bottom-[112px] left-0 right-0 h-28 bg-gradient-to-b from-transparent to-white dark:to-slate-950 pointer-events-none" />
                                            <div className="absolute bottom-[112px] left-0 right-0 h-6 backdrop-blur-sm pointer-events-none" />
                                        </>
                                    )}

                                    {/* Login gate docked at bottom */}
                                    {!isRegistered && (
                                        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                                                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">Sign in to see the full explanation</p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {detailedUsesLeft > 0
                                                            ? `${detailedUsesLeft} free preview${detailedUsesLeft !== 1 ? 's' : ''} remaining — no payment needed`
                                                            : 'Free account unlocks unlimited step-by-step notes'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setShowDetailedView(false); setShowRegistration(true); }} className="flex-1 min-h-[40px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-colors">Register Free</button>
                                                <button onClick={() => { setShowDetailedView(false); setShowLogin(true); }} className="flex-1 min-h-[40px] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs transition-colors">Sign In</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {showNavigationGuide && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="navigation-guide-title"
                        onClick={closeNavigationGuide}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 18, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.98 }}
                            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5 dark:border-slate-800 sm:p-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Quick navigation guide</p>
                                    <h2 id="navigation-guide-title" className="mt-2 text-2xl font-black text-slate-950 dark:text-white">Find your way in 30 seconds.</h2>
                                    <p className="mt-2 max-w-2xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                                        Pick the path that matches why you came. You can always return home and open this guide again.
                                    </p>
                                </div>
                                <button
                                    onClick={closeNavigationGuide}
                                    className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                                    aria-label="Close guide"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                                {navigationGuideItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <button
                                            key={item.title}
                                            onClick={() => {
                                                trackFunnelEvent('navigation_guide_action_clicked', {
                                                    path: item.title,
                                                    source: 'navigation_guide'
                                                });
                                                closeNavigationGuide();
                                                item.action();
                                            }}
                                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-700 dark:hover:bg-slate-900/80"
                                        >
                                            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl border ${item.tone}`}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <h3 className="text-base font-black text-slate-950 dark:text-white">{item.title}</h3>
                                            <p className="mt-2 min-h-[44px] text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">{item.description}</p>
                                            <span className="mt-3 inline-flex items-center gap-1 text-xs font-black text-indigo-700 dark:text-indigo-300">
                                                {item.cta} <ArrowRight className="h-3.5 w-3.5" />
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                    Starter path: Learner &rarr; Library &rarr; Ask Akili &rarr; Exam Prep &rarr; Progress proof.
                                </p>
                                <button
                                    onClick={() => {
                                        closeNavigationGuide();
                                        scrollToFeatureLauncher();
                                    }}
                                    className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-black text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
                                >
                                    Browse all features <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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

            {/* --- MOBILE STICKY CTA (guests only) --- */}
            <AnimatePresence>
                {showMobileStickyCta && !isRegistered && (
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        className="md:hidden fixed bottom-6 left-4 right-4 p-2.5 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl z-50 rounded-2xl flex items-center gap-2 pointer-events-auto"
                    >
                        <div className="flex flex-col pl-2 min-w-0 flex-1">
                            <span className="text-white text-xs font-black tracking-tight leading-none mb-1">Join 10,000+ learners</span>
                            <span className="text-blue-300 text-[9px] font-bold uppercase tracking-widest">KCSE · CBC · Free to start</span>
                        </div>
                        <a
                            href="https://wa.me/254722763760"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 bg-white/10 hover:bg-white/15 text-white py-2.5 px-3 rounded-xl font-black text-xs active:scale-95 transition-all flex items-center gap-1 border border-white/10"
                            aria-label="Chat with us on WhatsApp"
                        >
                            Chat
                        </a>
                        <button
                            onClick={() => handleRoleSelect(UserRole.LEARNER)}
                            className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white py-2.5 px-4 rounded-xl font-bold text-sm shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-1"
                        >
                            Start Free <ChevronRight className="w-4 h-4 text-blue-200" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- WHATSAPP FLOATING BUTTON (icon-only) --- */}
            <a
                href="https://wa.me/254722763760"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex fixed bottom-8 left-8 z-[60] items-center justify-center bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:bg-[#20bd5a] hover:scale-110 active:scale-95 transition-all border-4 border-white/50 backdrop-blur-sm"
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

