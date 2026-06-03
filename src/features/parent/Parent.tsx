import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ReactGA from 'react-ga4';
import { Header, Card, Button } from '../../components/Shared';
import { ViewState, LearnerActivity } from '../../types';
import { calculateTotalXP, calculateLevel } from '../../services/gamificationService';
import { LogoutModal } from '../../components/LogoutModal';
import { Book, CheckCircle, Clock, Lock, User, TrendingUp, Award, AlertCircle, ChevronRight, Activity, Calendar, Star, Zap, Home, X, LogOut, CreditCard, Sparkles, Brain } from 'lucide-react';
import { loadMasteryFromCloud } from '../../services/learnerMemoryService';
import { MasteryDashboard } from '../../components/MasteryDashboard';
import { supabase } from '../../lib/supabase';

const PARENT_REMEMBER_LOGIN_KEY = 'soma_parent_remembered_login';

interface ParentProps {
    onNavigate: (view: ViewState) => void;
    activityLog: LearnerActivity[];
    validStudentCode: string;
    studentId?: string | null;
    login: (code: string, phone: string) => Promise<{ success: boolean; message?: string }>;
}

export const ParentDashboard: React.FC<ParentProps> = ({ onNavigate, activityLog, validStudentCode, studentId, login }) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [inputPhone, setInputPhone] = useState('');
    const [rememberLogin, setRememberLogin] = useState(true);
    const [hasRememberedLogin, setHasRememberedLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [proofShareStatus, setProofShareStatus] = useState<'idle' | 'copied' | 'shared'>('idle');
    const [parentActivityLog, setParentActivityLog] = useState<LearnerActivity[] | null>(null);
    const [activityLoading, setActivityLoading] = useState(false);
    const [activityError, setActivityError] = useState('');
    
    // Cloud Memory State
    const [cloudMemoryRow, setCloudMemoryRow] = useState<any>(null);

    const trackFunnelEvent = (eventName: string, params: Record<string, unknown> = {}) => {
        try {
            if (import.meta.env.VITE_GA_MEASUREMENT_ID !== 'G-CHECK_GA_DASHBOARD') {
                ReactGA.event(eventName, params);
            }
        } catch (_) {
            // Non-blocking analytics
        }
    };

    React.useEffect(() => {
        try {
            const saved = localStorage.getItem(PARENT_REMEMBER_LOGIN_KEY);
            if (!saved) return;

            const parsed = JSON.parse(saved) as { code?: string; phone?: string };
            if (parsed.code || parsed.phone) {
                setInputCode(parsed.code || '');
                setInputPhone(parsed.phone || '');
                setRememberLogin(true);
                setHasRememberedLogin(true);
            }
        } catch (_) {
            localStorage.removeItem(PARENT_REMEMBER_LOGIN_KEY);
        }
    }, []);

    // Fetch live mastery from cloud when authenticated
    React.useEffect(() => {
        if (isAuthenticated && studentId) {
            loadMasteryFromCloud(studentId).then(({ cloudRow }) => {
                if (cloudRow) setCloudMemoryRow(cloudRow);
            }).catch(() => {});
        }
    }, [isAuthenticated, studentId]);

    React.useEffect(() => {
        if (!isAuthenticated || !studentId) return;

        const loadParentActivities = async () => {
            setActivityLoading(true);
            setActivityError('');

            try {
                let data: any[] | null = null;
                let error: any = null;

                const rpcResult = await supabase.rpc('get_recent_activities', {
                    p_student_id: studentId,
                    p_limit: 100
                });

                data = (rpcResult as any).data ?? null;
                error = (rpcResult as any).error ?? null;

                if (error && (String(error?.code || '') === '42883' || String(error?.message || '').toLowerCase().includes('function'))) {
                    const fallback = await supabase
                        .from('activities')
                        .select('id, type, topic, score, details, created_at')
                        .eq('student_id', studentId)
                        .order('created_at', { ascending: false })
                        .limit(100);

                    data = (fallback as any).data ?? null;
                    error = (fallback as any).error ?? null;
                }

                if (error) throw error;

                const mapped: LearnerActivity[] = (data || [])
                    .filter((item: any) => item?.topic && !/^\d{13}$/.test(String(item.topic)))
                    .map((item: any) => ({
                        id: item.id,
                        type: item.type,
                        topic: item.topic,
                        score: item.score ?? undefined,
                        date: item.created_at ? new Date(item.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
                        details: typeof item.details === 'string'
                            ? item.details
                            : (item.details ? JSON.stringify(item.details) : '')
                    }));

                setParentActivityLog(mapped);
            } catch (err: any) {
                console.error('Parent activity fetch failed:', err);
                setActivityError('We could not load this learner activity yet. Ask the learner to open their dashboard once, then refresh this page.');
                setParentActivityLog([]);
            } finally {
                setActivityLoading(false);
            }
        };

        loadParentActivities();
    }, [isAuthenticated, studentId]);

    const visibleActivityLog = parentActivityLog ?? activityLog;

    const handleLogin = async () => {
        if (!inputCode || !inputPhone) {
            setError('Please enter both Student ID and Parent Phone Number.');
            return;
        }

        setLoading(true);
        setError('');
        const result = await login(inputCode, inputPhone);
        setLoading(false);

        if (result.success) {
            try {
                if (rememberLogin) {
                    localStorage.setItem(PARENT_REMEMBER_LOGIN_KEY, JSON.stringify({
                        code: inputCode.trim().toUpperCase(),
                        phone: inputPhone.trim()
                    }));
                    setHasRememberedLogin(true);
                } else {
                    localStorage.removeItem(PARENT_REMEMBER_LOGIN_KEY);
                    setHasRememberedLogin(false);
                }
            } catch (_) {
                // Local remember-login is a convenience only.
            }
            setIsAuthenticated(true);
        } else {
            setError(result.message || 'Invalid credentials. Please check your Student ID and Phone Number.');
        }
    };

    // --- ANALYTICS ENGINE ---
    const stats = useMemo(() => {
        const quizzes = visibleActivityLog.filter(a => a.type === 'QUIZ' && a.score !== undefined);
        const topics = visibleActivityLog.filter(a => a.type === 'EXPLANATION');

        const totalQuizzes = quizzes.length;
        const avgScore = totalQuizzes > 0
            ? Math.round(quizzes.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalQuizzes)
            : 0;

        const masteryLevel = avgScore >= 80 ? 'Master' : avgScore >= 50 ? 'Developing' : 'Beginner';

        // Mock Subject Detection (In a real app, topics would have tags)
        const subjects: Record<string, number> = { 'Math': 0, 'Science': 0, 'History': 0, 'English': 0 };
        topics.forEach(t => {
            const lower = t.topic.toLowerCase();
            if (lower.match(/math|fraction|algebra|number|geometry/)) subjects['Math']++;
            else if (lower.match(/science|biology|physics|chemistry|plant|animal|space/)) subjects['Science']++;
            else if (lower.match(/history|war|ancient|king|queen|year/)) subjects['History']++;
            else subjects['English']++;
        });

        // Prepare Graph Data (Last 7 Quizzes)
        const graphData = quizzes.slice(0, 7).reverse().map((q, i) => ({
            label: `Q${i + 1}`,
            value: q.score || 0
        }));

        // Gamification Stats
        const totalXP = calculateTotalXP(visibleActivityLog);
        const levelInfo = calculateLevel(totalXP);

        // Weak areas (topics where score < 60)
        const weakAreas = quizzes.filter(q => (q.score || 0) < 60).map(q => q.topic);
        const uniqueWeakAreas = [...new Set(weakAreas)];

        // Smart Usage
        const aiUses = visibleActivityLog.filter(a => a.type === 'STUDY' || a.type === 'QUIZ').length;

        return {
            totalQuizzes,
            avgScore,
            masteryLevel,
            totalTopics: topics.length,
            subjects,
            graphData,
            level: levelInfo.level,
            xp: levelInfo.totalXP,
            nextLevelProgress: levelInfo.progressPercent,
            weakAreas: uniqueWeakAreas,
            aiUses
        };
    }, [visibleActivityLog]);

    const topSubjects = Object.entries(stats.subjects)
        .filter(([, count]) => (count as number) > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 2)
        .map(([subject]) => subject);

    const sevenDayPlan = stats.weakAreas.length > 0
        ? [
            `Day 1-2: Review ${stats.weakAreas[0]} for 20 minutes daily.`,
            `Day 3-4: Attempt 2 guided quizzes in ${topSubjects[0] || 'core subjects'}.`,
            'Day 5-6: Revisit errors and explain answers out loud.',
            'Day 7: Take one mixed practice quiz and compare score progress.'
        ]
        : [
            `Day 1-2: Extend learning in ${topSubjects[0] || 'core subjects'} with challenge questions.`,
            `Day 3-4: Practice timed quizzes to improve exam confidence.`,
            'Day 5-6: Revise one completed topic and summarize key concepts.',
            'Day 7: Take one full mixed quiz to maintain momentum.'
        ];

    const weeklyNarrative = stats.avgScore >= 80
        ? `This week, your child stayed strong in ${topSubjects[0] || 'core subjects'} and maintained high consistency across quizzes.`
        : stats.avgScore >= 50
            ? `This week, your child made steady progress, with the biggest growth in ${topSubjects[0] || 'key topics'}.`
            : `This week, your child showed effort and needs focused support in ${stats.weakAreas[0] || 'core basics'} to build momentum.`;

    const parentDailyActions = [
        '5 min: Ask what topic they studied today.',
        '5 min: Let them explain one solved question aloud.',
        '5 min: Review one mistake and one improvement target.'
    ];

    const weeklyTrend = useMemo(() => {
        const quizzes = visibleActivityLog.filter(a => a.type === 'QUIZ' && a.score !== undefined);
        const sorted = [...quizzes].sort((a, b) => {
            const ta = a.date ? new Date(a.date).getTime() : 0;
            const tb = b.date ? new Date(b.date).getTime() : 0;
            if (!Number.isNaN(ta) && !Number.isNaN(tb) && ta !== tb) return ta - tb;
            return 0;
        });

        const recent = sorted.slice(-7);
        const previous = sorted.slice(-14, -7);

        const avg = (items: LearnerActivity[]) => {
            if (!items.length) return 0;
            return Math.round(items.reduce((acc, curr) => acc + (curr.score || 0), 0) / items.length);
        };

        const recentAvg = avg(recent);
        const previousAvg = avg(previous);
        const scoreDelta = recentAvg - previousAvg;
        const quizDelta = recent.length - previous.length;

        let status: 'IMPROVING' | 'STEADY' | 'NEEDS_SUPPORT' = 'STEADY';
        if (recent.length < 2) {
            status = 'STEADY';
        } else if (scoreDelta >= 5) {
            status = 'IMPROVING';
        } else if (scoreDelta <= -5) {
            status = 'NEEDS_SUPPORT';
        }

        const label =
            status === 'IMPROVING'
                ? 'Momentum is improving week over week.'
                : status === 'NEEDS_SUPPORT'
                    ? 'Progress dipped this week. Add focused revision support.'
                    : 'Progress is steady. Keep daily consistency.';

        return {
            recentAvg,
            previousAvg,
            scoreDelta,
            quizDelta,
            status,
            label
        };
    }, [visibleActivityLog]);

    const proofStats = useMemo(() => {
        const parseDetails = (activity: LearnerActivity): Record<string, any> => {
            if (!activity.details) return {};
            try {
                return JSON.parse(activity.details);
            } catch (_) {
                return {};
            }
        };

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentActivities = visibleActivityLog.filter(activity => {
            if (!activity.date) return true;
            const parsed = new Date(activity.date);
            return Number.isNaN(parsed.getTime()) || parsed >= sevenDaysAgo;
        });

        const quizReviews = recentActivities
            .filter(activity => activity.type === 'QUIZ')
            .map(parseDetails)
            .filter(details => details.review?.missedQuestions?.length);

        const repairedQuestions = quizReviews.reduce((total, details) => {
            return total + (details.review?.missedQuestions?.length || 0);
        }, 0);

        const activeRecallBreaks = recentActivities.filter(activity => {
            const details = parseDetails(activity);
            return details.mode === 'active_recall_break';
        }).length;

        const studyMissions = recentActivities.filter(activity => {
            const details = parseDetails(activity);
            return details.mode === 'library_study_mission';
        }).length;

        const studySessions = recentActivities.filter(activity => (
            activity.type === 'EXPLANATION' || activity.type === 'STUDY'
        )).length;

        const nextAction = stats.weakAreas.length > 0
            ? `Ask your child to redo ${stats.weakAreas[0]} and explain one correction aloud.`
            : studyMissions === 0
                ? 'Ask your child to complete one full library study mission: read, clarify, then test.'
            : activeRecallBreaks > 0
                ? 'Keep the daily recall habit and add one timed quiz this week.'
                : 'Ask your child to complete one recall break after the next explanation.';

        return {
            studySessions,
            studyMissions,
            quizzes: recentActivities.filter(activity => activity.type === 'QUIZ').length,
            activeRecallBreaks,
            repairedQuestions,
            nextAction
        };
    }, [visibleActivityLog, stats.weakAreas]);

    const shareWeeklyProof = async () => {
        const summary = [
            'Soma Smart weekly learning proof',
            `Student ID: ${validStudentCode}`,
            `Average score: ${stats.avgScore}%`,
            `Study missions completed: ${proofStats.studyMissions}`,
            `Quizzes completed: ${proofStats.quizzes}`,
            `Recall breaks: ${proofStats.activeRecallBreaks}`,
            `Mistakes repaired: ${proofStats.repairedQuestions}`,
            `Next action: ${proofStats.nextAction}`,
            'https://somaai.co.ke'
        ].join('\n');

        try {
            if (navigator.share) {
                await navigator.share({
                    title: 'Soma Smart weekly learning proof',
                    text: summary
                });
                setProofShareStatus('shared');
            } else if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(summary);
                setProofShareStatus('copied');
            }
            trackFunnelEvent('parent_weekly_proof_shared', {
                method: navigator.share ? 'native_share' : 'clipboard',
                avg_score: stats.avgScore,
                study_missions: proofStats.studyMissions,
                quizzes: proofStats.quizzes
            });
        } catch (_) {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(summary);
                setProofShareStatus('copied');
            }
        }
    };


    // --- LOGIN VIEW ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none"></div>

                <Header title="Parent Access" onHome={() => onNavigate(ViewState.DASHBOARD)} />
                <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-xl bg-white/10 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/20 p-8 md:p-12 text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                        <button
                            onClick={() => onNavigate(ViewState.DASHBOARD)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-red-500 transition-colors z-20"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="bg-indigo-500/20 border border-indigo-400/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Lock className="w-10 h-10 text-indigo-300" />
                        </div>

                        <h2 className="text-3xl font-black text-white tracking-tight mb-2">See if screen time became learning.</h2>
                        <p className="text-indigo-100/80 mb-6 px-4 font-medium leading-relaxed">
                            Link your child&apos;s Student ID to see study actions, quiz scores, weak areas, and the next thing to practise.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 text-left">
                            {[
                                { icon: CheckCircle, title: 'Study Proof', body: 'Topics studied, quizzes taken, and recall breaks completed.' },
                                { icon: TrendingUp, title: 'Score Trend', body: 'Average score, recent quiz movement, and weak areas.' },
                                { icon: AlertCircle, title: 'Next Action', body: 'A simple parent move for tonight or this week.' }
                            ].map((item) => (
                                <div key={item.title} className="rounded-2xl bg-white/10 border border-white/15 p-3">
                                    <item.icon className="w-5 h-5 text-indigo-200 mb-2" />
                                    <p className="text-xs font-black text-white">{item.title}</p>
                                    <p className="text-[10px] font-semibold text-indigo-100/75 leading-snug mt-1">{item.body}</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SOMA-XXXX"
                                    className="w-full pl-14 pr-4 py-4.5 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-xl font-bold tracking-widest text-white uppercase focus:border-indigo-500 focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-500"
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                                />
                            </div>

                            <div className="relative group">
                                <Activity className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-400 transition-colors" />
                                <input
                                    type="tel"
                                    placeholder="Parent Phone Number"
                                    className="w-full pl-14 pr-4 py-4.5 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-lg font-bold text-white focus:border-indigo-500 focus:bg-slate-800 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all placeholder:text-slate-500"
                                    value={inputPhone}
                                    onChange={(e) => setInputPhone(e.target.value)}
                                />
                            </div>

                            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberLogin}
                                    onChange={(e) => setRememberLogin(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                                />
                                <span>
                                    <span className="block text-sm font-black text-white">Remember this parent login</span>
                                    <span className="block text-xs font-semibold text-indigo-100/70 mt-1">
                                        {hasRememberedLogin
                                            ? 'Saved on this device for faster access next time.'
                                            : 'Save the Student ID and parent phone on this device only.'}
                                    </span>
                                    {hasRememberedLogin && (
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.preventDefault();
                                                localStorage.removeItem(PARENT_REMEMBER_LOGIN_KEY);
                                                setInputCode('');
                                                setInputPhone('');
                                                setRememberLogin(false);
                                                setHasRememberedLogin(false);
                                            }}
                                            className="mt-2 text-xs font-black text-indigo-200 underline decoration-indigo-300/50 underline-offset-4 hover:text-white"
                                        >
                                            Forget saved login
                                        </button>
                                    )}
                                </span>
                            </label>

                            {error && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-red-300 text-sm font-medium bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </motion.div>
                            )}

                            <Button fullWidth onClick={handleLogin} disabled={loading} className="py-4.5 text-lg shadow-xl shadow-indigo-500/20 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 border-none text-white font-black">
                                {loading ? 'Authenticating...' : 'View Progress'}
                            </Button>
                        </div>

                        {validStudentCode ? (
                            <div className="mt-8 pt-6 border-t border-dashed border-white/20">
                                <p className="text-xs text-indigo-300 uppercase font-black tracking-widest mb-3">Login Help</p>
                                <p className="text-[11px] font-medium text-slate-400 max-w-xs mx-auto">
                                    Use the Student ID (SOMA-XXXX) and the Phone Number associated with the account during registration.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-8">
                                <div className="rounded-2xl bg-slate-800/60 border border-slate-700 p-4 text-left">
                                    <p className="text-xs font-black text-white mb-1">No Student ID yet?</p>
                                    <p className="text-[11px] font-semibold text-slate-300 leading-relaxed mb-3">
                                        Create a learner profile first. The child gets a SOMA code, then you can return here and monitor progress.
                                    </p>
                                    <button
                                        onClick={() => navigate('/learner')}
                                        className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white py-2.5 text-xs font-black uppercase tracking-wider transition-colors"
                                    >
                                        Create Learner Profile
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        );
    }

    // --- DASHBOARD VIEW ---
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20 font-sans max-w-5xl mx-auto shadow-2xl border-x border-slate-100 dark:border-slate-800 relative transition-colors">

            {/* --- CUSTOM HEADER --- */}
            <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-white/20 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white leading-tight tracking-tight">Student Overview</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">ID: {validStudentCode}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors group" title="Back to Home">
                        <Home className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" />
                    </button>
                    <button onClick={() => {
                        trackFunnelEvent('pricing_opened', { source: 'parent_dashboard_header', role: 'PARENT' });
                        navigate('/pricing');
                    }} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-800/50 group" title="Pricing Plans">
                        <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </button>
                    <button onClick={() => setShowLogoutModal(true)} className="p-2 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xl transition-colors border border-red-100 dark:border-red-800/50 group" title="Logout">
                        <LogOut className="w-6 h-6 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
                    </button>
                </div>
            </header>

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => {
                    setIsAuthenticated(false);
                    onNavigate(ViewState.DASHBOARD);
                }}
                title="Leaving So Soon, Parent? 👋"
                message="Your child's learning journey is always active! Staying logged in lets you see their most recent XP gains and exercise results instantly. Are you sure you want to log out?"
            />

            <main className="p-6 space-y-8">

                {/* 1. HERO GREETING */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl shadow-indigo-600/20 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/30 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-4 border border-white/20 shadow-inner">
                                <Activity className="w-3 h-3 text-emerald-300" /> Live Updates
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
                                {stats.avgScore >= 80 ? "Flying High! 🦅" : stats.avgScore >= 50 ? "Making Progress! 🌱" : "Ready to Grow! 🚀"}
                            </h2>
                            <p className="text-indigo-100 font-medium max-w-md text-lg leading-relaxed">
                                {stats.avgScore >= 80
                                    ? "Your child is demonstrating outstanding mastery across their recent assessments."
                                    : "Consistent practice is paying off! Keep the momentum going."}
                            </p>
                        </div>
                        <div className="flex gap-4 w-full md:w-auto">
                            <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 flex-1 md:flex-none text-center min-w-[110px] shadow-lg">
                                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Avg Score</p>
                                <p className="text-4xl font-black text-white">{stats.avgScore}%</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/20 flex-1 md:flex-none text-center min-w-[110px] shadow-lg">
                                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Level
                                </p>
                                <p className="text-4xl font-black text-white">{stats.level}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {(activityLoading || activityError) && (
                    <div className={`rounded-2xl border p-4 ${
                        activityError
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200'
                            : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-200'
                    }`}>
                        <p className="text-xs font-black uppercase tracking-[0.16em]">
                            {activityError ? 'Activity Sync Notice' : 'Loading Learner Activity'}
                        </p>
                        <p className="text-sm font-semibold mt-1">
                            {activityError || `Fetching study history for ${validStudentCode || 'this learner'}...`}
                        </p>
                    </div>
                )}

                {/* 1.25 PROOF OF LEARNING */}
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2rem] p-6 md:p-7 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/60 dark:border-slate-800">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-5">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300 mb-1">Proof Of Learning</p>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">Did they actually learn this week?</h3>
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">A quick parent view of effort, testing, memory work, and corrections.</p>
                        </div>
                        <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300">Next Parent Move</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1 max-w-sm">{proofStats.nextAction}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                            { label: 'Study Missions', value: proofStats.studyMissions, tone: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-100 dark:border-blue-900' },
                            { label: 'Quizzes', value: proofStats.quizzes, tone: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900' },
                            { label: 'Recall Breaks', value: proofStats.activeRecallBreaks, tone: 'bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-300 border-violet-100 dark:border-violet-900' },
                            { label: 'Mistakes Repaired', value: proofStats.repairedQuestions, tone: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-100 dark:border-rose-900' }
                        ].map((item) => (
                            <div key={item.label} className={`rounded-2xl border p-4 ${item.tone}`}>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80">{item.label}</p>
                                <p className="text-3xl font-black mt-1">{item.value}</p>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Total learning touches this week: {proofStats.studySessions}. Study missions only count when the learner reads, clarifies, and tests.
                    </p>
                    <button
                        onClick={shareWeeklyProof}
                        className="mt-4 w-full md:w-auto rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 px-5 py-3 text-xs font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
                    >
                        {proofShareStatus === 'shared'
                            ? 'Weekly Proof Shared'
                            : proofShareStatus === 'copied'
                                ? 'Weekly Proof Copied'
                                : 'Share Weekly Proof'}
                    </button>
                </div>

                {/* 1.5 PARENT PROOF LAYER */}
                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-800">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Current Strengths</h3>
                        <div className="space-y-2">
                            {(topSubjects.length > 0 ? topSubjects : ['Consistency']).map((s, i) => (
                                <div key={i} className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-800/40">
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-1 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-800">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Areas To Improve</h3>
                        <div className="space-y-2">
                            {(stats.weakAreas.length > 0 ? stats.weakAreas.slice(0, 3) : ['No major weak topics right now']).map((area, i) => (
                                <div key={i} className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-black uppercase tracking-wider border border-amber-100 dark:border-amber-800/40">
                                    {area}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-6 text-white shadow-2xl shadow-indigo-500/20">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">Weekly Summary</p>
                        <p className="text-sm font-semibold text-indigo-100 leading-relaxed mb-4">{weeklyNarrative}</p>

                        <div className="bg-white/10 border border-white/20 rounded-xl p-3 mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Week-over-Week Trend</p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div className="rounded-lg bg-white/10 px-2 py-1.5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Score Delta</p>
                                    <p className="text-sm font-black text-white">{weeklyTrend.scoreDelta >= 0 ? '+' : ''}{weeklyTrend.scoreDelta}%</p>
                                </div>
                                <div className="rounded-lg bg-white/10 px-2 py-1.5">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Quiz Volume</p>
                                    <p className="text-sm font-black text-white">{weeklyTrend.quizDelta >= 0 ? '+' : ''}{weeklyTrend.quizDelta}</p>
                                </div>
                            </div>
                            <p className="text-xs font-semibold text-indigo-100">{weeklyTrend.label}</p>
                        </div>

                        <div className="bg-white/10 border border-white/20 rounded-xl p-3 mb-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">15 Minutes Per Day</p>
                            <div className="space-y-1.5">
                                {parentDailyActions.map((action, i) => (
                                    <p key={i} className="text-xs font-semibold text-indigo-100">{action}</p>
                                ))}
                            </div>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-2">Next 7 Days</p>
                        <h3 className="text-lg font-black mb-3">Parent Action Plan</h3>
                        <div className="space-y-2 mb-4">
                            {sevenDayPlan.map((step, i) => (
                                <p key={i} className="text-xs font-semibold text-indigo-100 leading-relaxed">{step}</p>
                            ))}
                        </div>
                        <button
                            onClick={() => {
                                trackFunnelEvent('pricing_opened', { source: 'parent_proof_layer', role: 'PARENT' });
                                navigate('/pricing');
                            }}
                            className="w-full py-2.5 bg-white text-indigo-700 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-indigo-50 transition-colors"
                        >
                            Unlock Full Weekly Guidance
                        </button>
                    </div>
                </div>


                {/* 2. STATS GRID */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        icon={<Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                        label="Smart Assists"
                        value={stats.aiUses}
                        color="bg-blue-50 dark:bg-blue-900/30 border-blue-100 dark:border-blue-800/50"
                    />
                    <StatsCard
                        icon={<CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
                        label="Quizzes Taken"
                        value={stats.totalQuizzes}
                        color="bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50"
                    />
                    <StatsCard
                        icon={<Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
                        label="Mastery Level"
                        value={stats.masteryLevel}
                        color="bg-amber-50 dark:bg-amber-900/30 border-amber-100 dark:border-amber-800/50"
                        isText
                    />
                    <StatsCard
                        icon={<Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
                        label="Streak"
                        value="3 Days"
                        color="bg-purple-50 dark:bg-purple-900/30 border-purple-100 dark:border-purple-800/50"
                        isText
                    />
                </div>


                {/* 3. PERFORMANCE & SUBJECTS ROW */}
                <div className="grid lg:grid-cols-3 gap-6">

                    {/* Performance Graph */}
                    <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-800 transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <TrendingUp className="w-6 h-6 text-indigo-500" /> Performance Trend
                            </h3>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full shadow-sm">Last 7 Quizzes</span>
                        </div>

                        {/* Custom SVG Line Chart */}
                        <div className="h-48 w-full flex items-end justify-between px-2 gap-2 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                                <div className="w-full h-px bg-slate-400"></div>
                                <div className="w-full h-px bg-slate-400"></div>
                                <div className="w-full h-px bg-slate-400"></div>
                            </div>

                            {stats.graphData.length > 0 ? (
                                stats.graphData.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 w-full group relative">

                                        {/* Tooltip */}
                                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded mb-2">
                                            {d.value}%
                                        </div>

                                        {/* Bar (Using bar here as it's cleaner for simple parent view than complex SVG line path) */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${d.value}%` }}
                                            transition={{ duration: 1, type: 'spring' }}
                                            className={`w-full max-w-[40px] rounded-t-xl opacity-90 hover:opacity-100 transition-all ${d.value >= 80 ? 'bg-gradient-to-t from-green-400 to-green-500' :
                                                d.value >= 50 ? 'bg-gradient-to-t from-blue-400 to-blue-500' :
                                                    'bg-gradient-to-t from-amber-400 to-amber-500'
                                                }`}
                                        ></motion.div>
                                        <span className="text-xs font-bold text-slate-400">{d.label}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 italic">
                                    No data available yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subject Breakdown */}
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-800 transition-colors">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                            <Book className="w-6 h-6 text-purple-500" /> Interests
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(stats.subjects).map(([subject, count], i) => {
                                const total = Math.max(1, stats.totalTopics);
                                const pct = ((count as number) / total) * 100;
                                if (pct === 0 && i > 1) return null; // Hide empty if not core

                                return (
                                    <div key={subject}>
                                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                            <span>{subject}</span>
                                            <span>{Math.round(pct)}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                className={`h-full rounded-full ${subject === 'Math' ? 'bg-indigo-500' :
                                                    subject === 'Science' ? 'bg-green-500' :
                                                        'bg-blue-400'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* 3.5 SMART INSIGHTS & COGNITIVE MASTERY */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Live Cognitive Graph */}
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-800 transition-colors">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Brain className="w-6 h-6 text-emerald-500" /> Cognitive Mastery Graph
                        </h3>
                        {cloudMemoryRow ? (
                            <div className="h-64 sm:h-80 w-full relative -mt-4">
                                <MasteryDashboard 
                                    masteryGraph={cloudMemoryRow.mastery_graph || {}} 
                                    weakTopics={[]} // Optional: or pass specific ones
                                />
                            </div>
                        ) : (
                            <div className="h-64 flex items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-[2rem]">
                                <div>
                                    <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 font-bold text-sm">Waiting for cloud sync...</p>
                                    <p className="text-xs text-slate-400 mt-1">Somo Smart is building the mastery graph.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Insights & Weak Areas */}
                    <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-800 flex flex-col justify-between relative overflow-hidden group transition-colors">
                        <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                            <Sparkles className="w-64 h-64 text-indigo-500 -mr-12 -mb-12" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Sparkles className="w-6 h-6 text-indigo-500" /> Somo Smart Insights
                            </h3>
                            {stats.weakAreas.length > 0 ? (
                                <div className="space-y-4">
                                    <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                                        Your child is doing well overall, but seems to be struggling slightly with these topics:
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {stats.weakAreas.slice(0, 3).map((area, idx) => (
                                            <span key={idx} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[11px] uppercase tracking-widest font-black px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-800/50 shadow-sm">
                                                {area}
                                            </span>
                                        ))}
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-4">
                                        We have automatically added targeted remedial exercises to their dashboard.
                                    </p>
                                </div>
                            ) : (
                                <p className="text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                                    Excellent progress! Your child is showing consistent mastery across all tested subjects this week. Our Smart Engine is tracking their pace to provide more advanced challenges automatically.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. ACTIVITY FEED */}
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-indigo-500" /> Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {visibleActivityLog.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-[2rem] border border-slate-100">
                                <p className="text-slate-400">No activity recorded yet for {validStudentCode || 'this learner'}.</p>
                            </div>
                        ) : (
                            visibleActivityLog.slice(0, 10).map((item, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={item.id}
                                    className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-5 rounded-[2rem] border border-white/50 dark:border-slate-800 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex items-center gap-5"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${item.type === 'QUIZ'
                                        ? (item.score || 0) >= 80 ? 'bg-green-100 text-green-600' : (item.score || 0) >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                        : 'bg-indigo-50 text-indigo-600'
                                        }`}>
                                        {item.type === 'QUIZ' ? (item.score || 0) + '%' : <Book className="w-6 h-6" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-[15px] font-bold text-slate-900 dark:text-white truncate">{item.topic}</h4>
                                        <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                                            {item.type === 'QUIZ' ? 'Assessment' : 'Lesson Study'} • {item.date}
                                        </p>
                                    </div>

                                    {item.type === 'QUIZ' && (
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${(item.score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                                            (item.score || 0) >= 50 ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {(item.score || 0) >= 80 ? 'Mastered' : 'Practice'}
                                        </span>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const StatsCard = ({ icon, label, value, color, isText = false }: any) => (
    <motion.div whileHover={{ y: -5 }} className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/50 dark:border-slate-800 flex flex-col items-start gap-4 transition-colors">
        <div className={`p-4 rounded-2xl border ${color} shadow-sm`}>
            {icon}
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={`font-black text-slate-900 dark:text-white mt-1 ${isText ? 'text-xl' : 'text-3xl'}`}>{value}</p>
        </div>
    </motion.div>
);
