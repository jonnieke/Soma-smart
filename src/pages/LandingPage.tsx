import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
    CheckCircle, X, BookOpen, ArrowRight, Share2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import { UserRole } from '../types';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { saveStudyNote, getNotebookOwnerKey } from '../services/notebookService';
import { GA_MEASUREMENT_ID } from '../config/analytics';

// Import Assets
import logoImg from '../assets/images/main_logo.png';
import { RegistrationModal } from '../components/RegistrationModal';
import { LegalModal } from '../components/LegalModal';
import { ContactModal } from '../components/ContactModal';
import { LoginModal } from '../components/LoginModal';
import { LogoutModal } from '../components/LogoutModal';
import { translations } from '../data/translations';
import { ThemeToggle } from '../components/ThemeToggle';
import { LandingHome } from '../components/LandingHome';
import { examService } from '../services/examService';
import { examPaperBankService } from '../services/examPaperBankService';
import { learnerPoolService } from '../services/learnerPoolService';
import { trackAnalyticsEvent } from '../services/analyticsEventService';

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
    const [showDetailedView, setShowDetailedView] = useState(false);
    const [detailedAnswer, setDetailedAnswer] = useState<string | null>(null);
    const [detailedError, setDetailedError] = useState<string | null>(null);
    const [pendingHeroFile, setPendingHeroFile] = useState<File | null>(null);
    const [isGeneratingDetailed, setIsGeneratingDetailed] = useState(false);
    const [heroLimitReached, setHeroLimitReached] = useState(false);
    const [detailedLimitReached, setDetailedLimitReached] = useState(false);
    const [detailedUsesLeft, setDetailedUsesLeft] = useState<number>(() => {
        try {
            const count = parseInt(localStorage.getItem('soma_hero_detailed_uses') || '0', 10);
            return Math.max(0, 5 - count);
        } catch {
            return 5;
        }
    });
    const [latestPapers, setLatestPapers] = useState<Array<{ id: string | number; title: string; subject: string; grade: string; exam_body?: string | null; duration_minutes?: number | null; total_marks?: number | null; source?: string | null; exam_type?: string | null; created_at?: string | null; published_at?: string | null; homepage_featured?: boolean | null; file_url?: string | null; file_path?: string | null }>>([]);

    const trackFunnelEvent = (eventName: string, params: Record<string, unknown> = {}) => {
        try {
            if (GA_MEASUREMENT_ID !== 'G-CHECK_GA_DASHBOARD') {
                ReactGA.event(eventName, params);
            }
            void trackAnalyticsEvent({
                eventType: 'FUNNEL',
                eventName,
                path: `${window.location.pathname}${window.location.search}`,
                metadata: params,
            });
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
        } catch { /* ignore */ }
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
                try { const body = await response.json(); code = body?.code ?? code; } catch { /* ignore */ }
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

    const isSomaOriginalExam = (exam: { title?: string; source?: string | null }) => {
        const source = String(exam.source || '').toUpperCase();
        const title = String(exam.title || '').toLowerCase();
        return source.includes('STRUCTURED_IMPORT') || /somaai\s+original|original mock|originals/.test(title);
    };

    React.useEffect(() => {
        let active = true;
        const sortLatest = (items: Array<Record<string, any>>) => items
            .sort((a, b) => {
                const aFeatured = Boolean(a.homepage_featured);
                const bFeatured = Boolean(b.homepage_featured);
                if (aFeatured !== bFeatured) return bFeatured ? 1 : -1;
                const aTime = Date.parse(String(a.published_at || a.created_at || 0)) || 0;
                const bTime = Date.parse(String(b.published_at || b.created_at || 0)) || 0;
                return bTime - aTime;
            })
            .slice(0, 6);

        const fetchHomepagePapers = async () => {
            try {
                const exams = await examPaperBankService.listPapers();
                const latest = sortLatest(Array.isArray(exams) ? exams.map(item => ({ ...item })) : []);
                if (!active) return;
                if (latest.length > 0) {
                    setLatestPapers(latest as any);
                    return;
                }
            } catch (error) {
                console.warn('Homepage RPC paper fetch failed, using direct query fallback.', error);
            }

            try {
                const [{ data: tableData, error: tableError }, rpcData] = await Promise.all([
                    supabase
                        .from('knowledge_base')
                        .select('id, title, subject, grade, exam_body, duration_minutes, total_marks, source, exam_type, created_at, review_status, type, file_url, file_path, homepage_featured, marking_scheme_url, marking_scheme_path')
                        .eq('type', 'PAST_PAPER')
                        .eq('review_status', 'PUBLISHED')
                        .order('created_at', { ascending: false }),
                    examService.listPublishedExams(),
                ]);
                if (tableError) throw tableError;
                if (!active) return;

                const normalize = (paper: Record<string, any>) => ({
                    ...paper,
                    file_url: paper.file_url || paper.fileUrl || null,
                    file_path: paper.file_path || paper.filePath || null,
                    marking_scheme_url: paper.marking_scheme_url || paper.markingSchemeUrl || null,
                    marking_scheme_path: paper.marking_scheme_path || paper.markingSchemePath || null,
                    homepage_featured: Boolean(paper.homepage_featured ?? paper.homepageFeatured),
                });

                const merged = new Map<string, Record<string, any>>();
                for (const paper of Array.isArray(rpcData) ? rpcData : []) {
                    merged.set(String((paper as any).id), normalize(paper as Record<string, any>));
                }
                for (const paper of Array.isArray(tableData) ? tableData : []) {
                    const id = String((paper as any).id);
                    merged.set(id, {
                        ...(merged.get(id) || {}),
                        ...normalize(paper as Record<string, any>),
                    });
                }

                const latest = sortLatest(Array.from(merged.values()));
                setLatestPapers(latest as any);
            } catch (error) {
                console.warn('Homepage paper fallback fetch failed.', error);
                if (active) setLatestPapers([]);
            }
        };

        void fetchHomepagePapers();
        return () => { active = false; };
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
                `Answer this academic question in exactly 1 precise sentence. No markdown, no formatting. Use correct curriculum terminology relevant to the Kenyan KCSE/CBC syllabus. State only the essential result or definition � no extra detail. Question: ${questionInput}`
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

    const handleRegistrationSuccess = () => {
        setShowRegistration(false);
        if (pendingRoute) {
            navigate(pendingRoute, pendingRouteState ? { state: pendingRouteState } : undefined);
            setPendingRoute(null);
            setPendingRouteState(null);
            return;
        }

        let pendingStoredQuestion: string | null = null;
        try { pendingStoredQuestion = sessionStorage.getItem('soma_pending_hero_question'); } catch { /* ignore */ }
        const fallbackQuestion = questionInput.trim() || pendingStoredQuestion;

        if (isClaimingOffer) {
            const target = role === UserRole.TEACHER ? '/teacher' : (role === UserRole.SCHOOL ? '/school' : '/learner');
            const state: Record<string, unknown> = { openSubscription: true };
            if (target === '/learner' && fallbackQuestion) {
                state.pendingHeroQuestion = fallbackQuestion;
            }
            navigate(target, { state });
            setIsClaimingOffer(false);
        } else {
            const target = role === UserRole.TEACHER ? '/teacher' : (role === UserRole.SCHOOL ? '/school' : '/learner');
            navigate(target, target === '/learner' && fallbackQuestion ? { state: { pendingHeroQuestion: fallbackQuestion } } : undefined);
        }
    };

    const handleOpenAuthForQuestion = (mode: 'login' | 'register', qOverride?: string) => {
        const questionToCarry = (qOverride || questionInput).trim() || (() => {
            try { return sessionStorage.getItem('soma_pending_hero_question') || ''; } catch { return ''; }
        })();

        if (questionToCarry) {
            try {
                sessionStorage.setItem('soma_pending_hero_question', questionToCarry);
            } catch { /* ignore */ }
            setPendingRoute('/learner');
            setPendingRouteState({ pendingHeroQuestion: questionToCarry });
        }
        setRole(UserRole.LEARNER);
        setShowDetailedView(false);

        if (mode === 'register') {
            setRegistrationRole('STUDENT');
            setShowRegistration(true);
        } else {
            setLoginTab('STUDENT');
            setShowLogin(true);
        }
    };

    const handleOpenDetailedView = async (questionOverride?: string, fileOverride?: File) => {
        const activeQuestion = (questionOverride || questionInput).trim();
        const previousQuestion = questionInput.trim();
        if (!activeQuestion && !fileOverride) return;
        setQuestionInput(activeQuestion);
        if (activeQuestion) {
            try {
                sessionStorage.setItem('soma_pending_hero_question', activeQuestion);
            } catch { /* ignore */ }
            setPendingRoute('/learner');
            setPendingRouteState({ pendingHeroQuestion: activeQuestion });
        }
        setPendingHeroFile(fileOverride || null);
        trackFunnelEvent('detailed_view_clicked', {
            source: 'landing_hero',
            is_registered: isRegistered,
            has_file: Boolean(fileOverride),
        });
        setDetailedLimitReached(false);

        // Registered users go straight to the learner workspace. Guests stay in the homepage demo preview.
        if (isRegistered && !fileOverride) {
            setRole(UserRole.LEARNER);
            navigate('/learner', { state: { pendingHeroQuestion: activeQuestion } });
            return;
        }

        // Unregistered visitors: show the teaser modal with login gate, without dashboard looping.
        const hasActivePhonePass = Boolean(isPro || examPaperBankService.readPhoneSession()?.passActive);
        let count = 0;
        if (!isRegistered && !hasActivePhonePass) {
            try { count = parseInt(localStorage.getItem('soma_hero_detailed_uses') || '0', 10); } catch { /* ignore */ }
        }
        setShowDetailedView(true);
        if (isGeneratingDetailed) return;
        if (detailedAnswer && previousQuestion === activeQuestion && !fileOverride) return;
        if (!isRegistered && !hasActivePhonePass && count >= 5) {
            setDetailedLimitReached(true);
            return;
        }
        if (!isRegistered && !hasActivePhonePass) {
            try {
                localStorage.setItem('soma_hero_detailed_uses', String(count + 1));
                setDetailedUsesLeft(Math.max(0, 5 - (count + 1)));
            } catch { /* ignore */ }
        }
        setDetailedAnswer(null);
        setDetailedError(null);
        setIsGeneratingDetailed(true);
        try {
            let text = '';
            if (fileOverride) {
                const isImage = fileOverride.type.startsWith('image/');
                const isPdf = fileOverride.type === 'application/pdf' || /\.pdf$/i.test(fileOverride.name);
                if (!isImage && !isPdf) throw new Error('UNSUPPORTED_ATTACHMENT');
                const base64Data = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const res = reader.result as string;
                        resolve(res.split(',')[1] || res);
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(fileOverride);
                });
                const payload = {
                    feature: 'ai_generation',
                    contents: [{
                        role: 'user',
                        parts: [
                            { text: `Read the attached ${isPdf ? 'PDF' : 'image'} homework question and provide a learner-friendly answer with clear working and key exam points. If the attachment is unclear, say exactly what is unreadable rather than guessing. Question: ${activeQuestion || 'Explain the attached homework question'}` },
                            { inlineData: { data: base64Data, mimeType: isPdf ? 'application/pdf' : fileOverride.type } }
                        ]
                    }]
                };
                const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-proxy`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                        ...(studentCode ? { 'x-student-code': studentCode } : {})
                    },
                    body: JSON.stringify(payload)
                });
                if (resp.status === 429) {
                    let code = 'RATE_LIMIT';
                    try { code = (await resp.json())?.code ?? code; } catch { /* keep the transient limit */ }
                    throw new Error(code);
                }
                if (!resp.ok) throw new Error(`ANSWER_REQUEST_FAILED_${resp.status}`);
                const data = await resp.json();
                text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            } else {
                const pooled = await learnerPoolService.findPooledExplanation({
                    subject: 'General',
                    grade: 'All Grades',
                    prompt: activeQuestion,
                });
                if (pooled) {
                    text = pooled;
                } else {
                    text = await callGeminiProxy(
                        `Provide a learner-friendly direct answer in short bullet points for the following question, aligned to the Kenyan CBC/KPSEA/KCSE curriculum. Lead with the direct answer first. Then add only the key points a learner needs to revise. Avoid long tutoring text and avoid paragraph blocks. Use these sections only if helpful: Direct answer, Key points, Example, Exam tip. Keep every bullet clear, short, and learner-ready. Do not use markdown bold. Question: ${activeQuestion}`
                    );
                }
            }
            const cleaned = (text || '')
                .replace(/\*\*(.*?)\*\*/g, '$1')
                .replace(/^[*-]\s/gm, '• ')
                .replace(/^#{1,6}\s*/gm, '')
                .replace(/\*(.*?)\*/g, '$1')
                .replace(/\*/g, '');
            if (!cleaned.trim()) throw new Error('EMPTY_ANSWER');
            setDetailedAnswer(cleaned);
            setPendingHeroFile(null);

            void learnerPoolService.savePooledExplanation(
                {
                    subject: 'General',
                    grade: 'All Grades',
                    topic: activeQuestion.slice(0, 80) || 'Homework Solution',
                    prompt: activeQuestion || 'Homework Solution',
                },
                cleaned
            );

            // Auto-save to offline notebook so the student never loses it
            try {
                const ownerKey = getNotebookOwnerKey(studentCode, null);
                saveStudyNote(ownerKey, {
                    title: activeQuestion || (fileOverride ? fileOverride.name : 'Homework Solution'),
                    content: cleaned,
                    source: 'ai_answer',
                    subject: 'General'
                });
            } catch {
                // Ignore local save issues
            }

            trackFunnelEvent('detailed_view_opened', { source: 'landing_hero', uses_left: Math.max(0, 5 - (count + 1)) });
        } catch (err: any) {
            const code = err?.message ?? '';
            const limitReached = code === 'GUEST_LIMIT_REACHED' || code === 'PLAN_LIMIT_REACHED' || code === 'FEATURE_LIMIT_REACHED';
            if (!isRegistered && !limitReached) {
                try {
                    localStorage.setItem('soma_hero_detailed_uses', String(count));
                    setDetailedUsesLeft(Math.max(0, 5 - count));
                } catch { /* ignore */ }
            }
            setDetailedError(code === 'UNSUPPORTED_ATTACHMENT'
                ? 'Please attach a photo or PDF. Word documents are not supported yet.'
                : 'Akili could not generate a reliable answer just now. Your question is still here; please try again.');

            if (limitReached) {
                setDetailedLimitReached(true);
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
                    console.info('[Soma AI] Slow network detected, enabling Low-Data Mode automatically.');
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
        if (!location.state && !pendingRoute && !showLogin && !showRegistration && isRegistered && role !== UserRole.NONE && !hasAutoRedirected) {
            sessionStorage.setItem('hasAutoRedirected', 'true');
            const target = role === UserRole.TEACHER ? '/teacher' : (role === UserRole.SCHOOL ? '/school' : (role === UserRole.PARENT ? '/parent' : '/learner'));
            navigate(target, { replace: true });
        }
    }, [isRegistered, role, location.state, navigate, pendingRoute, showLogin, showRegistration]);

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
            if (isRegistered && (role === UserRole.TEACHER || Boolean(teacherProfile?.id))) {
                navigate('/teacher', { state: { openWorkspace: true } });
                return;
            }
            setPendingRoute('/teacher');
            setPendingRouteState({ openWorkspace: true });
            setLoginTab('TEACHER');
            setShowLogin(true);
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

    const handleStartPaperFromHome = (paperId: string | number) => {
        if (!isRegistered && role === UserRole.NONE) {
            startGuestSession();
        }
        setRole(UserRole.LEARNER);
        const id = String(paperId);
        try {
            sessionStorage.setItem('soma_pending_exam_id', id);
        } catch (_) {
            // Ignore storage issues and still navigate.
        }
        navigate(`/exam-papers/${encodeURIComponent(id)}/read`);
    };

    const handlePreviewMarkingSchemeFromHome = (paperId: string | number) => {
        if (!isRegistered && role === UserRole.NONE) {
            startGuestSession();
        }
        setRole(UserRole.LEARNER);
        const id = String(paperId);
        try {
            sessionStorage.setItem('soma_pending_exam_id', id);
        } catch (_) {
            // Ignore storage issues and still navigate.
        }
        navigate(`/exam-papers/${encodeURIComponent(id)}/read?source=scheme`);
    };

    const handlePreviewPaperFromHome = (paperId: string | number) => {
        if (!isRegistered && role === UserRole.NONE) {
            startGuestSession();
        }
        setRole(UserRole.LEARNER);
        const id = String(paperId);
        try {
            sessionStorage.setItem('soma_pending_exam_id', id);
        } catch (_) {
            // Ignore storage issues and still navigate.
        }
        navigate(`/exam-papers/${encodeURIComponent(id)}/read`);
    };

    const handleGetStarted = () => {
        setRole(UserRole.LEARNER); // Default to learner
        setShowRegistration(true);
    };

    const handleLearnerQuickStart = (targetTab?: string, targetIntent?: string, pendingHeroQuestion?: string) => {
        if (!isRegistered && role === UserRole.NONE) {
            startGuestSession();
        }

        setRole(UserRole.LEARNER);
        const nextState: Record<string, unknown> = {};
        if (targetTab) nextState.targetTab = targetTab;
        if (targetIntent) nextState.targetIntent = targetIntent;
        if (pendingHeroQuestion) nextState.pendingHeroQuestion = pendingHeroQuestion;
        navigate('/learner', Object.keys(nextState).length ? { state: nextState } : undefined);
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
                <title>Soma AI | KCSE, KPSEA and CBC Study Support for Kenya</title>
                <meta name="description" content="Soma AI helps Kenyan learners, teachers and parents with direct answers, exam prep, official notes, past papers, audio learning and progress tracking." />
                <meta name="keywords" content="Soma AI, KCSE revision, KPSEA past papers, CBC notes, Kenyan learner app, teacher lesson notes, parent progress tracking" />

                {/* AIO/SEO specific meta tags */}
                <meta name="smart-search-index" content="index" />
                <meta name="smart-knowledge-base" content="official" />
                <meta name="educational-framework" content="CBE, 8-4-4, KCSE, KPSEA, KJSEA" />
                <meta name="target-audience" content="Learners, Teachers, Parents, School Administrators" />
                <meta name="core-features" content="Smart Exam Assistant, Instant Explanations, Auto-Grading, Topical Quizzes, CBE Notes" />

                {/* Search Engine Optimization */}
                <meta name="robots" content="index, follow, max-image-preview:large" />
                <meta name="author" content="Soma AI" />
                <meta property="og:site_name" content="Soma AI" />
                <meta property="og:title" content="Soma AI | KCSE, KPSEA and CBC Study Support for Kenya" />
                <meta property="og:description" content="Direct answers, exam prep, official notes, past papers, audio learning and progress tracking for Kenyan learners, parents and teachers." />
                <meta property="og:image" content="https://www.somaai.co.ke/hero_option_a.png" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://www.somaai.co.ke/" />

                {/* Twitter Meta */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:site" content="@somasmart" />
                <meta name="twitter:title" content="Soma AI | KCSE, KPSEA and CBC Study Support for Kenya" />
                <meta name="twitter:description" content="Direct answers, exam prep, official notes, past papers, audio learning and progress tracking." />

                <link rel="canonical" href="https://www.somaai.co.ke/" />

                {/* Structured Data / AIO */}
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "EducationalOrganization",
                        "name": "Soma AI",
                        "url": "https://www.somaai.co.ke",
                        "logo": "https://www.somaai.co.ke/favicon.png",
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
                        "name": "Soma AI",
                        "operatingSystem": "Web",
                        "applicationCategory": "EducationApplication",
                        "offers": {
                            "@type": "Offer",
                            "price": "20",
                            "priceCurrency": "KES"
                        },
                        "description": "Direct answers, exam prep, official notes, past papers, audio learning and progress tracking."
                    })}
                </script>
                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "FAQPage",
                        "mainEntity": [
                            {
                                "@type": "Question",
                                "name": "What does Soma AI do?",
                                "acceptedAnswer": {
                                    "@type": "Answer",
                                    "text": "It helps Kenyan learners, teachers and parents with direct answers, exam prep, official notes, past papers, audio learning and progress tracking."
                                }
                            },
                            {
                                "@type": "Question",
                                "name": "Can teachers use Soma AI?",
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

            <LandingHome
                isRegistered={isRegistered}
                userName={studentProfile?.name || teacherProfile?.name}
                onStartLearning={() => handleRoleSelect(UserRole.LEARNER)}
                onAskQuestion={(question, file) => { void handleOpenDetailedView(question, file); }}
                onLearnerShortcut={handleLearnerQuickStart}
                onTeacher={() => handleRoleSelect(UserRole.TEACHER)}
                onParent={() => handleRoleSelect(UserRole.PARENT)}
                onLibrary={handleLibraryAccess}
                onExamPapers={(paperId) => navigate(paperId ? `/exam-papers?paper=${encodeURIComponent(String(paperId))}` : '/exam-papers')}
                onSomaGuide={() => navigate('/guide')}
                onRevision={() => navigate('/revision')}
                onContact={() => navigate('/contact')}
                onPrivacy={() => setShowPrivacy(true)}
                onTerms={() => setShowTerms(true)}
                onStartPaper={handleStartPaperFromHome}
                onPreviewPaper={handlePreviewPaperFromHome}
                onPreviewMarkingScheme={handlePreviewMarkingSchemeFromHome}
                onPricing={() => navigate('/pricing')}
                latestPapers={latestPapers}
                onSignIn={() => {
                    const q = questionInput.trim() || (() => {
                        try { return sessionStorage.getItem('soma_pending_hero_question') || ''; } catch { return ''; }
                    })();
                    if (q) {
                        setPendingRoute('/learner');
                        setPendingRouteState({ pendingHeroQuestion: q });
                    }
                    setLoginTab('STUDENT');
                    setShowLogin(true);
                }}
                onDashboard={() => navigate(role === UserRole.TEACHER ? '/teacher' : role === UserRole.SCHOOL ? '/school' : role === UserRole.PARENT ? '/parent' : '/learner')}
                onTrack={trackFunnelEvent}
            />



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
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">Direct answer guide</p>
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
                            {detailedLimitReached ? (
                                /* Full gate — guest preview limit OR registered user daily limit reached */
                                <div className="flex flex-col items-center justify-center gap-5 p-8 text-center flex-1">
                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
                                        <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                    {isRegistered ? (
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Learning limit reached</p>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">You&apos;ve used today&apos;s free daily study limits</h3>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                                                Choose a small learner plan to keep going with direct answers, revision notes, exam prep, and audio lessons.
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">5 free previews used</p>
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Create a free account to keep learning</h3>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs mx-auto">
                                                Unlock full point-form answer guides, practice drills, and progress tracking — free to start.
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                                        {isRegistered ? (
                                            <button onClick={() => { setShowDetailedView(false); navigate('/pricing'); }} className="flex-1 min-h-[46px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-colors">See Learner Plans</button>
                                        ) : (
                                            <>
                                                <button onClick={() => handleOpenAuthForQuestion('register')} className="flex-1 min-h-[46px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm transition-colors">Register Free</button>
                                                <button onClick={() => handleOpenAuthForQuestion('login')} className="flex-1 min-h-[46px] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-xl font-black text-sm transition-colors">Continue Learning</button>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={() => { setShowDetailedView(false); navigate('/exam-papers'); }}
                                            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-black text-emerald-800 hover:bg-emerald-100 transition-colors"
                                        >
                                            Or Unlock 24h Pass + Past Paper (KES 20) →
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowDetailedView(false); navigate('/free-pool'); }}
                                            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                                        >
                                            Explore Free Revision Pool →
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* Partial view with blur gate (or full unlocked view when 24h Pass / Registered) */
                                <div className="relative flex-1 min-h-0">
                                    {/* Scrollable content */}
                                    <div className="overflow-y-auto h-full p-5 pb-36">
                                        {isGeneratingDetailed ? (
                                            <div className="space-y-3 py-2">
                                                {[100, 90, 100, 75, 100, 88, 60].map((w, i) => (
                                                    <div key={i} className={`h-3 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse`} style={{ width: `${w}%` }} />
                                                ))}
                                            </div>
                                        ) : detailedError ? (
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950" role="status">
                                                <p className="font-bold">{detailedError}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => { void handleOpenDetailedView(questionInput, pendingHeroFile || undefined); }}
                                                    className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-4 font-black text-white hover:bg-indigo-700"
                                                >
                                                    Try again
                                                </button>
                                            </div>
                                        ) : detailedAnswer ? (
                                            <div className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                                                <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-3.5 text-indigo-950 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-100">
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">CBC &amp; KCSE Direct Answer</p>
                                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                                                                <CheckCircle className="h-3 w-3 text-emerald-600" /> Saved Offline
                                                            </span>
                                                        </div>
                                                        <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-300">Point-form notes saved to your notebook for revision.</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const text = `*Soma AI Homework Solution*\n\n*Question:* ${questionInput}\n\n*Solution:*\n${detailedAnswer || ''}\n\n_Studying with Soma AI (CBC & KCSE Study Companion)_`;
                                                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
                                                            trackFunnelEvent('homework_shared_whatsapp', { question: questionInput, source: 'detailed_view_modal' });
                                                        }}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-black text-emerald-800 hover:bg-emerald-50 shadow-sm transition"
                                                        title="Share solution to WhatsApp"
                                                    >
                                                        <Share2 className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp Solution
                                                    </button>
                                                </div>
                                                <div className="whitespace-pre-wrap font-medium rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-4">{detailedAnswer}</div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Preview locked</p>
                                                    <h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Open the full direct answer</h3>
                                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                        {isRegistered
                                                            ? 'Your free daily study limit has been reached. Pick a small plan to continue with direct answers, revision notes, and audio lessons.'
                                                            : 'Create a free account or sign in to unlock the complete direct answer and revision support.'}
                                                    </p>
                                                </div>
                                                <div className="space-y-3 rounded-2xl border border-dashed border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                                                    <div className="h-3 w-5/6 rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
                                                    <div className="h-3 w-4/6 rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
                                                    <div className="h-3 w-2/3 rounded-full bg-slate-200/80 dark:bg-slate-800/80" />
                                                    <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 p-3 text-xs font-medium text-indigo-800 dark:border-indigo-900/40 dark:bg-indigo-950/30 dark:text-indigo-200">
                                                        The full direct answer will appear here after login.
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Gradient fade + blur overlay on bottom half (only when not registered and no 24h pass) */}
                                    {!isRegistered && !isPro && !examPaperBankService.readPhoneSession()?.passActive && (
                                        <>
                                            <div className="absolute bottom-[112px] left-0 right-0 h-28 bg-gradient-to-b from-transparent to-white dark:to-slate-950 pointer-events-none" />
                                            <div className="absolute bottom-[112px] left-0 right-0 h-6 backdrop-blur-sm pointer-events-none" />
                                        </>
                                    )}

                                    {/* Bottom action bar: Full Classroom continuation when unlocked, or Login/Pass gate for guests */}
                                    {isRegistered || isPro || examPaperBankService.readPhoneSession()?.passActive ? (
                                        <div className="absolute bottom-0 left-0 right-0 border-t border-emerald-100 dark:border-slate-800 bg-emerald-50/95 dark:bg-slate-950 p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                                                        ✅ Full Answer Unlocked · Ready to practise this topic?
                                                    </p>
                                                    <p className="text-[11px] text-emerald-700 dark:text-slate-400">
                                                        Continue in the Learner Classroom for audio reading, follow-up questions &amp; a practice quiz.
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowDetailedView(false);
                                                            setRole(UserRole.LEARNER);
                                                            navigate('/learner', { state: { pendingHeroQuestion: questionInput } });
                                                        }}
                                                        className="min-h-[38px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 font-black text-xs transition-colors"
                                                    >
                                                        Open in Classroom →
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowDetailedView(false);
                                                            navigate('/free-pool');
                                                        }}
                                                        className="min-h-[38px] border border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100 rounded-xl px-3.5 font-black text-xs transition-colors"
                                                    >
                                                        Free Pool →
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center shrink-0">
                                                    <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-300" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">Sign in to see the full answer</p>
                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                                        {detailedUsesLeft > 0
                                                            ? `${detailedUsesLeft} free preview${detailedUsesLeft !== 1 ? 's' : ''} remaining — no payment needed`
                                                            : 'Free account or KES 20 24h Pass unlocks full point-form answer guides'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <button onClick={() => handleOpenAuthForQuestion('register')} className="flex-1 min-h-[40px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-colors">Register Free</button>
                                                <button onClick={() => handleOpenAuthForQuestion('login')} className="flex-1 min-h-[40px] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-xl font-black text-xs transition-colors">Continue Learning</button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowDetailedView(false);
                                                        navigate('/exam-papers');
                                                    }}
                                                    className="min-h-[40px] border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl px-3 font-black text-xs transition-colors"
                                                >
                                                    KES 20 24h Pass →
                                                </button>
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
                        navigate(pendingRoute, pendingRouteState ? { state: pendingRouteState } : undefined);
                        if (pendingRouteState?.source === 'homepage_teacher_composer') {
                            trackFunnelEvent('teacher_composer_auth_completed', {
                                method: 'login',
                                destination: pendingRoute,
                            });
                        }
                        setPendingRoute(null);
                        setPendingRouteState(null);
                    } else {
                        let pendingStoredQuestion: string | null = null;
                        try { pendingStoredQuestion = sessionStorage.getItem('soma_pending_hero_question'); } catch { /* ignore */ }
                        const fallbackQuestion = questionInput.trim() || pendingStoredQuestion;

                        const target = tab === 'TEACHER' ? '/teacher' : (tab === 'SCHOOL' ? '/school' : '/learner');
                        navigate(target, target === '/learner' && fallbackQuestion ? { state: { pendingHeroQuestion: fallbackQuestion } } : undefined);
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
                                <li>To generate Smart answers relevant to your grade level.</li>
                                <li>To track learning progress for Parents and Teachers.</li>
                                <li>To improve the accuracy of our educational content.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">3. Data Safety & AI</h3>
                            <p>We use Google&apos;s Gemini Models to process text and images. </p>
                            <ul className="list-disc pl-5 space-y-1 mt-2">
                                <li>We do <strong>not</strong> use your personal data to train public learning models.</li>
                                <li>Your data is processed ephemerally for the purpose of the immediate query.</li>
                            </ul>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">4. Children&apos;s Privacy</h3>
                            <p>Soma AI is designed for students. We do not require email addresses or phone numbers from students under 13. Parent supervision is encouraged.</p>
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
                            <strong>Important:</strong> Soma AI is an educational aid, not a substitute for professional schooling.
                        </div>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">1. Acceptance of Terms</h3>
                            <p>By accessing Soma AI, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.</p>
                        </section>

                        <section>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">2. Educational Disclaimer</h3>
                            <p>The content provided by Soma AI is generated by our Smart Engine. While we strive for accuracy:</p>
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
                            <p>Soma AI offers a limited free tier. Continued access to advanced features (Voice Notes, Unlimited Scanning) may require a premium subscription in the future.</p>
                        </section>
                    </div>
                }
            />

            {/* --- WHATSAPP FLOATING BUTTON (icon-only) --- */}
            <a
                href="https://wa.me/254722763760"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden"
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

