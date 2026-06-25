import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowUpRight,
    BarChart3,
    Brain,
    Clock3,
    CreditCard,
    Globe,
    ListChecks,
    MousePointer2,
    PieChart,
    ReceiptText,
    Sparkles,
    TrendingDown,
    TrendingUp,
    Users2,
    GraduationCap,
    BookOpenCheck,
    ClipboardList,
    X
} from 'lucide-react';
import { fetchDashboardStats, fetchFinanceSummary, DashboardStats, FinanceSummary } from '../../../services/adminService';
import { useLocation, useNavigate } from 'react-router-dom';

const StatBlock = ({ title, value, description, icon, tone }: any) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
            <div className={`rounded-xl p-3 ${tone.bg} ${tone.text}`}>{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{description}</span>
        </div>
        <div className="text-2xl font-black text-slate-900 leading-none mb-1">{value}</div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
    </div>
);

type TeacherWorkflowEvent = DashboardStats['recentTeacherWorkflowEvents'][number];

export const AnalyticsView: React.FC = () => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    const navigate = useNavigate();
    const location = useLocation();
    const isConfigured = gaId && gaId !== 'G-CHECK_GA_DASHBOARD';

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [finance, setFinance] = useState<FinanceSummary | null>(null);
    const [teacherWorkflowFilter, setTeacherWorkflowFilter] = useState<'ALL' | 'NOTES' | 'SCHEMES' | 'HOMEWORK' | 'STEPS' | 'RESETS'>('ALL');
    const [teacherWorkflowDateRange, setTeacherWorkflowDateRange] = useState<'TODAY' | 'YESTERDAY_2D' | 'WEEK' | 'ALL'>('WEEK');
    const [teacherWorkflowQuery, setTeacherWorkflowQuery] = useState('');
    const [selectedTeacherWorkflowEventId, setSelectedTeacherWorkflowEventId] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([fetchDashboardStats(), fetchFinanceSummary()]).then(([dashboardStats, financeSummary]) => {
            setStats(dashboardStats);
            setFinance(financeSummary);
        });
    }, []);

    const adoptionRate = useMemo(() => {
        if (!stats) return 0;
        const base = Math.max(stats.totalUsers, 1);
        return Math.round(((stats.verifiedUsers + stats.activeToday) / base) * 100);
    }, [stats]);

    const eventMix = useMemo(() => {
        if (!stats) return [];
        return [
            { label: 'Learner activity', value: stats.recentActivity.filter((item) => item.type === 'student').length, tone: 'bg-sky-500' },
            { label: 'Teacher activity', value: stats.recentActivity.filter((item) => item.type === 'teacher').length, tone: 'bg-violet-500' },
            { label: 'Revenue events', value: stats.recentActivity.filter((item) => item.type === 'money').length, tone: 'bg-emerald-500' },
            { label: 'System / support', value: stats.recentActivity.filter((item) => item.type === 'system').length, tone: 'bg-slate-500' },
        ].filter((item) => item.value > 0);
    }, [stats]);

    const teacherWorkflowEventsByRange = useMemo(() => {
        if (!stats) return [];

        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        return stats.recentTeacherWorkflowEvents.filter((event) => {
            const createdAt = new Date(event.createdAt);
            if (teacherWorkflowDateRange === 'TODAY') return createdAt >= startOfToday;
            if (teacherWorkflowDateRange === 'YESTERDAY_2D') return createdAt >= startOfYesterday;
            if (teacherWorkflowDateRange === 'WEEK') return createdAt >= sevenDaysAgo;
            return true;
        });
    }, [stats, teacherWorkflowDateRange]);

    const filteredTeacherWorkflowEvents = useMemo(() => {
        const matcher: Record<typeof teacherWorkflowFilter, (eventName: string) => boolean> = {
            ALL: () => true,
            NOTES: (eventName) => eventName === 'note_generated',
            SCHEMES: (eventName) => eventName === 'scheme_generated',
            HOMEWORK: (eventName) => eventName === 'homework_generated',
            STEPS: (eventName) => eventName === 'teacher_workflow_step_completed',
            RESETS: (eventName) => eventName === 'teacher_workflow_reset',
        };

        return teacherWorkflowEventsByRange.filter((event) => matcher[teacherWorkflowFilter](event.eventName));
    }, [teacherWorkflowEventsByRange, teacherWorkflowFilter]);

    const searchedTeacherWorkflowEvents = useMemo(() => {
        const query = teacherWorkflowQuery.trim().toLowerCase();
        if (!query) return filteredTeacherWorkflowEvents;

        return filteredTeacherWorkflowEvents.filter((event) => {
            const haystack = [event.actorName, event.context, event.path, event.eventName]
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        });
    }, [filteredTeacherWorkflowEvents, teacherWorkflowQuery]);

    const groupedTeacherWorkflowEvents = useMemo(() => {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);

        const groups: Array<{ label: 'Today' | 'Yesterday' | 'Earlier'; items: typeof searchedTeacherWorkflowEvents }> = [
            { label: 'Today', items: [] },
            { label: 'Yesterday', items: [] },
            { label: 'Earlier', items: [] },
        ];

        searchedTeacherWorkflowEvents.forEach((event) => {
            const createdAt = new Date(event.createdAt);
            if (createdAt >= startOfToday) {
                groups[0].items.push(event);
            } else if (createdAt >= startOfYesterday) {
                groups[1].items.push(event);
            } else {
                groups[2].items.push(event);
            }
        });

        return groups.filter((group) => group.items.length > 0);
    }, [searchedTeacherWorkflowEvents]);

    const teacherWorkflowLeaders = useMemo(() => {
        if (!stats) return [];

        const leaderMap = new Map<string, {
            actorName: string;
            total: number;
            noteCount: number;
            schemeCount: number;
            homeworkCount: number;
            stepCount: number;
            resetCount: number;
            lastSeen: string;
            lastContext: string;
        }>();

        teacherWorkflowEventsByRange.forEach((event) => {
            const current = leaderMap.get(event.actorName) || {
                actorName: event.actorName,
                total: 0,
                noteCount: 0,
                schemeCount: 0,
                homeworkCount: 0,
                stepCount: 0,
                resetCount: 0,
                lastSeen: event.time,
                lastContext: event.context,
            };

            current.total += 1;
            if (event.eventName === 'note_generated') current.noteCount += 1;
            if (event.eventName === 'scheme_generated') current.schemeCount += 1;
            if (event.eventName === 'homework_generated') current.homeworkCount += 1;
            if (event.eventName === 'teacher_workflow_step_completed') current.stepCount += 1;
            if (event.eventName === 'teacher_workflow_reset') current.resetCount += 1;
            current.lastSeen = event.time;
            current.lastContext = event.context;

            leaderMap.set(event.actorName, current);
        });

        return Array.from(leaderMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 5);
    }, [stats, teacherWorkflowEventsByRange]);

    const selectedTeacherWorkflowEvent = useMemo<TeacherWorkflowEvent | null>(() => {
        if (!stats || !selectedTeacherWorkflowEventId) return null;
        return teacherWorkflowEventsByRange.find((event) => event.id === selectedTeacherWorkflowEventId) || stats.recentTeacherWorkflowEvents.find((event) => event.id === selectedTeacherWorkflowEventId) || null;
    }, [stats, teacherWorkflowEventsByRange, selectedTeacherWorkflowEventId]);

    const selectedTeacherWorkflowSummary = useMemo(() => {
        if (!stats || !selectedTeacherWorkflowEvent) return null;

        const actorEvents = teacherWorkflowEventsByRange.filter((event) => event.actorName === selectedTeacherWorkflowEvent.actorName);
        return {
            total: actorEvents.length,
            notes: actorEvents.filter((event) => event.eventName === 'note_generated').length,
            schemes: actorEvents.filter((event) => event.eventName === 'scheme_generated').length,
            homework: actorEvents.filter((event) => event.eventName === 'homework_generated').length,
            steps: actorEvents.filter((event) => event.eventName === 'teacher_workflow_step_completed').length,
            resets: actorEvents.filter((event) => event.eventName === 'teacher_workflow_reset').length,
            recent: actorEvents.filter((event) => event.id !== selectedTeacherWorkflowEvent.id).slice(0, 4),
        };
    }, [stats, teacherWorkflowEventsByRange, selectedTeacherWorkflowEvent]);
    const teacherWorkflowAlerts = useMemo(() => {
        if (teacherWorkflowEventsByRange.length === 0) return [] as Array<{ tone: string; title: string; body: string }>;

        const teacherActivity = new Map<string, { resets: number; total: number; steps: number }>();

        teacherWorkflowEventsByRange.forEach((event) => {
            const current = teacherActivity.get(event.actorName) || { resets: 0, total: 0, steps: 0 };
            current.total += 1;
            if (event.eventName === 'teacher_workflow_reset') current.resets += 1;
            if (event.eventName === 'teacher_workflow_step_completed') current.steps += 1;
            teacherActivity.set(event.actorName, current);
        });

        const alerts: Array<{ tone: string; title: string; body: string }> = [];
        const topResetTeacher = Array.from(teacherActivity.entries()).sort((a, b) => b[1].resets - a[1].resets)[0];

        if (topResetTeacher && topResetTeacher[1].resets >= 2) {
            alerts.push({
                tone: 'bg-amber-50 border-amber-100 text-amber-900',
                title: 'Reset watch',
                body: `${topResetTeacher[0]} has reset the workflow ${topResetTeacher[1].resets} times in this window. Check whether the creation flow is slowing them down.`
            });
        }

        const lowCompletionTeachers = Array.from(teacherActivity.entries())
            .filter(([, value]) => value.total >= 3 && value.steps <= 1)
            .map(([teacher]) => teacher);

        if (lowCompletionTeachers.length > 0) {
            alerts.push({
                tone: 'bg-rose-50 border-rose-100 text-rose-900',
                title: 'Low completion signal',
                body: `${lowCompletionTeachers.slice(0, 2).join(', ')} started work in this window but completed very few workflow steps. They may be dropping off before posting or marking.`
            });
        }

        const schemeCount = teacherWorkflowEventsByRange.filter((event) => event.eventName === 'scheme_generated').length;
        const homeworkCount = teacherWorkflowEventsByRange.filter((event) => event.eventName === 'homework_generated').length;

        if (schemeCount > 0 && homeworkCount === 0) {
            alerts.push({
                tone: 'bg-sky-50 border-sky-100 text-sky-900',
                title: 'Planning ahead of delivery',
                body: 'Schemes are being generated in this window, but no homework has followed yet. Good planning signal, but not yet closing the teaching loop.'
            });
        }

        return alerts.slice(0, 3);
    }, [teacherWorkflowEventsByRange]);
    const teacherWorkflowSummary = useMemo(() => {
        const summary = {
            total: teacherWorkflowEventsByRange.length,
            notes: 0,
            schemes: 0,
            homework: 0,
            steps: 0,
            resets: 0,
        };

        teacherWorkflowEventsByRange.forEach((event) => {
            if (event.eventName === 'note_generated') summary.notes += 1;
            if (event.eventName === 'scheme_generated') summary.schemes += 1;
            if (event.eventName === 'homework_generated') summary.homework += 1;
            if (event.eventName === 'teacher_workflow_step_completed') summary.steps += 1;
            if (event.eventName === 'teacher_workflow_reset') summary.resets += 1;
        });

        return summary;
    }, [teacherWorkflowEventsByRange]);

    const teacherWorkflowWindowLabel = useMemo(() => {
        if (teacherWorkflowDateRange === 'TODAY') return 'Today';
        if (teacherWorkflowDateRange === 'YESTERDAY_2D') return 'Last 2 days';
        if (teacherWorkflowDateRange === 'WEEK') return 'Last 7 days';
        return 'All loaded events';
    }, [teacherWorkflowDateRange]);


    if (!stats || !finance) {
        return <div className="p-12 text-center text-slate-400">Loading analytics...</div>;
    }

    const maxTrend = Math.max(...stats.activityTrend, 1);

    const openTeacherUser = (actorName: string) => {
        const params = new URLSearchParams(location.search);
        params.set('tab', 'USERS');
        params.set('role', 'TEACHER');
        if (actorName && actorName !== 'System') {
            params.set('q', actorName.replace(/\\s*\\([^)]*\\)\\s*/g, '').trim());
        } else {
            params.delete('q');
        }
        navigate({ pathname: location.pathname, search: params.toString() });
    };

    const openWorkflowRoute = (path: string) => {
        const target = path && path.startsWith('/') ? path : '/teacher';
        window.open(target, '_blank', 'noopener,noreferrer');
    };

    const getWorkflowEventLabel = (eventName: string) => {
        switch (eventName) {
            case 'note_generated':
                return 'Note created';
            case 'scheme_generated':
                return 'Scheme generated';
            case 'homework_generated':
                return 'Homework created';
            case 'teacher_workflow_step_completed':
                return 'Workflow step completed';
            case 'teacher_workflow_reset':
                return 'Workflow reset';
            default:
                return eventName.replace(/_/g, ' ');
        }
    };

    const getWorkflowEventTone = (eventName: string) => {
        switch (eventName) {
            case 'note_generated':
                return 'bg-sky-50 text-sky-700 border-sky-100';
            case 'scheme_generated':
                return 'bg-violet-50 text-violet-700 border-violet-100';
            case 'homework_generated':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'teacher_workflow_step_completed':
                return 'bg-rose-50 text-rose-700 border-rose-100';
            case 'teacher_workflow_reset':
                return 'bg-slate-100 text-slate-700 border-slate-200';
            default:
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        }
    };
    const conversionSignals = [
        { label: 'Registered users', value: stats.totalUsers },
        { label: 'New users 7d', value: stats.newUsers7d },
        { label: 'Active today', value: stats.activeToday },
        { label: 'Pro / verified', value: stats.verifiedUsers },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black uppercase tracking-[0.18em] mb-3">
                        <Sparkles className="h-3.5 w-3.5" />
                        Advanced Analytics
                    </div>
                    <h2 className="text-3xl font-black text-slate-900">Platform analytics, not a blank shell.</h2>
                    <p className="text-slate-500 mt-1 max-w-2xl">
                        This tab shows what Somo Smart is actually doing: who joined, who is active, what content is being used,
                        where learning activity is concentrated, and whether growth is staying profitable.
                    </p>
                </div>
                <a
                    href="https://analytics.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-100 w-fit"
                >
                    Open GA4 <ArrowUpRight className="w-4 h-4" />
                </a>
            </div>

            <div className={`rounded-2xl border p-5 ${isConfigured ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-3 ${isConfigured ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {isConfigured ? <BarChart3 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className={`font-black ${isConfigured ? 'text-emerald-900' : 'text-amber-900'}`}>
                            {isConfigured ? 'GA4 connected' : 'GA4 optional, local analytics already active'}
                        </h3>
                        <p className={`text-sm ${isConfigured ? 'text-emerald-700' : 'text-amber-700'} max-w-2xl`}>
                            {isConfigured
                                ? `Tracking measurement ID ${gaId}.`
                                : 'Add VITE_GA_MEASUREMENT_ID if you want external website analytics. The dashboard below already uses Somo Smart data directly.'
                            }
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatBlock title="Engagement signal" value={`${adoptionRate}%`} description="User adoption" icon={<TrendingUp className="w-5 h-5" />} tone={{ bg: 'bg-sky-50', text: 'text-sky-600' }} />
                <StatBlock title="Retention pace" value={`${stats.activeToday}`} description="Learners active" icon={<Clock3 className="w-5 h-5" />} tone={{ bg: 'bg-violet-50', text: 'text-violet-600' }} />
                <StatBlock title="Traffic / interest" value={`${stats.newUsers7d}`} description="New users 7d" icon={<Globe className="w-5 h-5" />} tone={{ bg: 'bg-amber-50', text: 'text-amber-600' }} />
                <StatBlock title="Revenue health" value={`KES ${finance.totalRevenueKes.toLocaleString()}`} description="30-day revenue" icon={<Brain className="w-5 h-5" />} tone={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatBlock title="Page views captured" value={`${stats.pageViews7d}`} description="Last 7 days" icon={<BarChart3 className="w-5 h-5" />} tone={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }} />
                <StatBlock title="Route changes captured" value={`${stats.routeChanges7d}`} description="Last 7 days" icon={<MousePointer2 className="w-5 h-5" />} tone={{ bg: 'bg-sky-50', text: 'text-sky-600' }} />
                <StatBlock title="Auth events captured" value={`${stats.authEvents7d}`} description="Last 7 days" icon={<Sparkles className="w-5 h-5" />} tone={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }} />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Teacher workflow</h3>
                        <p className="text-sm text-slate-500">What teachers are actually creating inside the product for the selected time window.</p>
                        <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 border border-slate-200">{teacherWorkflowWindowLabel}</span>
                    </div>
                    <GraduationCap className="h-5 w-5 text-emerald-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 mb-4">
                    <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600 mb-1">Total actions</p>
                        <p className="text-2xl font-black text-emerald-950">{teacherWorkflowSummary.total}</p>
                    </div>
                    <div className="rounded-2xl bg-sky-50 p-4 border border-sky-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-600 mb-1">Notes</p>
                        <p className="text-2xl font-black text-sky-950">{teacherWorkflowSummary.notes}</p>
                    </div>
                    <div className="rounded-2xl bg-violet-50 p-4 border border-violet-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 mb-1">Schemes</p>
                        <p className="text-2xl font-black text-violet-950">{teacherWorkflowSummary.schemes}</p>
                    </div>
                    <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 mb-1">Homework</p>
                        <p className="text-2xl font-black text-amber-950">{teacherWorkflowSummary.homework}</p>
                    </div>
                    <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600 mb-1">Steps completed</p>
                        <p className="text-2xl font-black text-rose-950">{teacherWorkflowSummary.steps}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1">Resets</p>
                        <p className="text-2xl font-black text-slate-900">{teacherWorkflowSummary.resets}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-4">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpenCheck className="h-4 w-4 text-emerald-600" />
                                <p className="font-black text-slate-900">Teacher creation signals</p>
                            </div>
                            <div className="space-y-2 text-sm text-slate-600">
                                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-slate-100">
                                    <span>Lesson notes / repairs</span>
                                    <span className="font-black text-slate-900">{teacherWorkflowSummary.notes}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-slate-100">
                                    <span>Scheme planning</span>
                                    <span className="font-black text-slate-900">{teacherWorkflowSummary.schemes}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-xl bg-white px-3 py-2 border border-slate-100">
                                    <span>Homework generation</span>
                                    <span className="font-black text-slate-900">{teacherWorkflowSummary.homework}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <p className="font-black text-slate-900">Teacher activity leaders</p>
                                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 border border-slate-200">
                                    Top 5
                                </span>
                            </div>
                            <div className="space-y-2">
                                {teacherWorkflowLeaders.length > 0 ? teacherWorkflowLeaders.map((leader, index) => (
                                    <button
                                        key={leader.actorName}
                                        type="button"
                                        onClick={() => openTeacherUser(leader.actorName)}
                                        className="w-full rounded-xl bg-white px-3 py-3 border border-slate-100 text-left hover:border-slate-200 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="rounded-full bg-slate-900 text-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em]">
                                                        #{index + 1}
                                                    </span>
                                                    <p className="font-bold text-slate-800 truncate">{leader.actorName}</p>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate mt-1">{leader.lastContext}</p>
                                                <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-slate-500">
                                                    <span>{leader.total} actions</span>
                                                    <span>{leader.noteCount} notes</span>
                                                    <span>{leader.schemeCount} schemes</span>
                                                    <span>{leader.homeworkCount} homework</span>
                                                </div>
                                            </div>
                                            <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700 border border-emerald-100">
                                                {leader.lastSeen}
                                            </span>
                                        </div>
                                    </button>
                                )) : (
                                    <p className="text-sm text-slate-400">No teacher leaderboard data yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <ClipboardList className="h-4 w-4 text-indigo-600" />
                            <p className="font-black text-slate-900">Recent teacher workflow feed</p>
                        </div>
                        <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
                            <span>Latest teacher workflow actions in the selected time window</span>
                            <span className="rounded-full bg-white px-2.5 py-1 font-black text-slate-600 border border-slate-200">
                                {searchedTeacherWorkflowEvents.length}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {[
                                { key: 'TODAY', label: 'Today' },
                                { key: 'YESTERDAY_2D', label: '2 days' },
                                { key: 'WEEK', label: '7 days' },
                                { key: 'ALL', label: 'All loaded' },
                            ].map((range) => {
                                const active = teacherWorkflowDateRange === range.key;
                                return (
                                    <button
                                        key={range.key}
                                        type="button"
                                        onClick={() => setTeacherWorkflowDateRange(range.key as typeof teacherWorkflowDateRange)}
                                        className={active ? "rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] border transition-colors bg-indigo-600 text-white border-indigo-600" : "rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] border transition-colors bg-white text-slate-600 border-slate-200 hover:border-slate-300"}
                                    >
                                        {range.label}
                                    </button>
                                );
                            })}
                        </div>
                        {teacherWorkflowAlerts.length > 0 && (
                            <div className="space-y-2 mb-3">
                                {teacherWorkflowAlerts.map((alert) => (
                                    <div key={alert.title} className={`rounded-2xl border px-4 py-3 ${alert.tone}`}>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-1">{alert.title}</p>
                                        <p className="text-sm leading-relaxed">{alert.body}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="mb-3">
                            <input
                                type="search"
                                value={teacherWorkflowQuery}
                                onChange={(event) => setTeacherWorkflowQuery(event.target.value)}
                                placeholder="Search teacher, class, subject, topic, or path"
                                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {[
                                { key: 'ALL', label: 'All' },
                                { key: 'NOTES', label: 'Notes' },
                                { key: 'SCHEMES', label: 'Schemes' },
                                { key: 'HOMEWORK', label: 'Homework' },
                                { key: 'STEPS', label: 'Steps' },
                                { key: 'RESETS', label: 'Resets' },
                            ].map((filter) => {
                                const active = teacherWorkflowFilter === filter.key;
                                return (
                                    <button
                                        key={filter.key}
                                        type="button"
                                        onClick={() => setTeacherWorkflowFilter(filter.key as typeof teacherWorkflowFilter)}
                                        className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] border transition-colors ${active
                                            ? 'bg-slate-900 text-white border-slate-900'
                                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
                                    >
                                        {filter.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-1">
                            {groupedTeacherWorkflowEvents.length > 0 ? groupedTeacherWorkflowEvents.map((group) => (
                                <div key={group.label}>
                                    <div className="sticky top-0 z-10 mb-2 bg-slate-50/95 backdrop-blur-sm py-1">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{group.label}</p>
                                    </div>
                                    <div className="space-y-2">
                                        {group.items.map((event) => (
                                            <div
                                                key={event.id}
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setSelectedTeacherWorkflowEventId(event.id)}
                                                onKeyDown={(keyboardEvent) => {
                                                    if (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ') {
                                                        keyboardEvent.preventDefault();
                                                        setSelectedTeacherWorkflowEventId(event.id);
                                                    }
                                                }}
                                                className="w-full rounded-xl bg-white px-3 py-3 border border-slate-100 flex items-start justify-between gap-3 text-left hover:border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                                            >
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-slate-800 capitalize truncate">{getWorkflowEventLabel(event.eventName)}</p>
                                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] border ${getWorkflowEventTone(event.eventName)}`}>
                                                            {event.actorName}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 truncate mt-1">{event.context}</p>
                                                    <p className="text-[11px] text-slate-400 truncate mt-1">{event.path}</p>
                                                </div>
                                                <div className="shrink-0 flex flex-col items-end gap-2">
                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                                                        {event.time}
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={(clickEvent) => {
                                                                clickEvent.stopPropagation();
                                                                openTeacherUser(event.actorName);
                                                            }}
                                                            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 hover:border-slate-300 hover:text-slate-900"
                                                        >
                                                            Teacher
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(clickEvent) => {
                                                                clickEvent.stopPropagation();
                                                                openWorkflowRoute(event.path);
                                                            }}
                                                            className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-indigo-700 hover:border-indigo-300 hover:bg-indigo-100"
                                                        >
                                                            Open Route
                                                        </button>
                                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                                                            Inspect
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-400">No teacher workflow events match this filter or search yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>


            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Top pages</h3>
                            <p className="text-sm text-slate-500">Where people spend time inside the product.</p>
                        </div>
                        <BarChart3 className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="space-y-3">
                        {stats.topPages.length > 0 ? stats.topPages.map((item) => (
                            <div key={item.path}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-600 truncate pr-3">{item.path}</span>
                                    <span className="font-black text-slate-900">{item.count}</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-indigo-500"
                                        style={{ width: `${Math.max(8, (item.count / Math.max(stats.pageViews7d, 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400">No page data yet.</p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Auth events</h3>
                            <p className="text-sm text-slate-500">Sign in, sign out, and recovery flow activity.</p>
                        </div>
                        <Sparkles className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="space-y-3">
                        {stats.authBreakdown.length > 0 ? stats.authBreakdown.map((item) => (
                            <div key={item.eventName} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <span className="font-bold text-slate-700 capitalize">{item.eventName.replace(/_/g, ' ')}</span>
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 border border-slate-200">{item.count}</span>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400">No auth events yet.</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-5">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Activity trend</h3>
                            <p className="text-sm text-slate-500">Last 14 days of platform activity.</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="flex items-end gap-2 h-64">
                        {stats.activityTrend.map((value, index) => {
                            const heightPct = (value / maxTrend) * 100;
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${Math.max(heightPct, 5)}%` }}
                                        transition={{ delay: index * 0.02, duration: 0.4 }}
                                        className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-sky-400"
                                    />
                                    <span className="text-[10px] font-black text-slate-400">{index % 2 === 0 ? index + 1 : ''}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Conversion funnel</h3>
                            <p className="text-sm text-slate-500">A quick read on platform motion.</p>
                        </div>
                        <MousePointer2 className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="space-y-4">
                        {conversionSignals.map((item) => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-600">{item.label}</span>
                                    <span className="font-black text-slate-900">{item.value}</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-indigo-500"
                                        style={{ width: `${Math.max(10, (item.value / Math.max(stats.totalUsers, 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Top subjects</h3>
                            <p className="text-sm text-slate-500">Where the library and teacher resources are concentrated.</p>
                        </div>
                        <Users2 className="h-5 w-5 text-sky-500" />
                    </div>
                    <div className="space-y-3">
                        {stats.topSubjects.length > 0 ? stats.topSubjects.map((item) => (
                            <div key={item.subject} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                                <span className="font-bold text-slate-700 truncate pr-3">{item.subject}</span>
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600 border border-slate-200">{item.count}</span>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400">No subject data yet.</p>
                        )}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Business signals</h3>
                            <p className="text-sm text-slate-500">Keep the growth engine honest.</p>
                        </div>
                        <CreditCard className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">AI spend</p>
                            <p className="text-2xl font-black text-slate-900">KES {finance.aiCostKes.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">Gross margin</p>
                            <p className="text-2xl font-black text-slate-900">{finance.grossMarginPct.toFixed(1)}%</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">AI calls</p>
                            <p className="text-2xl font-black text-slate-900">{finance.aiCalls}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-1">Avg cost/call</p>
                            <p className="text-2xl font-black text-slate-900">KES {finance.avgAiCostPerCallKes.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900">
                        <div className="flex items-center gap-2 font-black mb-1">
                            <TrendingDown className="h-4 w-4" /> Watch margin creep
                        </div>
                        If AI spend starts climbing faster than revenue, tighten free limits or move heavier workflows to paid packs.
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Event mix</h3>
                            <p className="text-sm text-slate-500">What kind of activity is happening right now.</p>
                        </div>
                        <PieChart className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="space-y-3">
                        {eventMix.length > 0 ? eventMix.map((item) => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-medium text-slate-600">{item.label}</span>
                                    <span className="font-black text-slate-900">{item.value}</span>
                                </div>
                                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                    <div
                                        className={`${item.tone} h-full rounded-full`}
                                        style={{ width: `${Math.max(8, (item.value / Math.max(stats.recentActivity.length, 1)) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-slate-400">No event mix yet.</p>
                        )}
                    </div>
                </div>

                <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Usage cost leaders</h3>
                            <p className="text-sm text-slate-500">Which features are eating the most compute.</p>
                        </div>
                        <ReceiptText className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {finance.topFeatures.length > 0 ? finance.topFeatures.map((feature) => (
                            <div key={feature.feature} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-black text-slate-900 capitalize">{feature.feature.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-slate-500 mt-1">
                                            {feature.calls} calls - {feature.inputTokens.toLocaleString()} in / {feature.outputTokens.toLocaleString()} out
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700 border border-slate-200">
                                        KES {feature.estimatedCostKes.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                                    </span>
                                </div>
                            </div>
                        )) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-400 md:col-span-2">
                                No usage cost data yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Latest platform events</h3>
                        <p className="text-sm text-slate-500">A readable stream of what learners and teachers are actually doing.</p>
                    </div>
                    <ListChecks className="h-5 w-5 text-slate-400" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {stats.recentActivity.length > 0 ? stats.recentActivity.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${
                                    item.type === 'money' ? 'bg-emerald-500' :
                                    item.type === 'teacher' ? 'bg-violet-500' :
                                    item.type === 'parent' ? 'bg-amber-500' :
                                    item.type === 'system' ? 'bg-slate-500' : 'bg-sky-500'
                                }`} />
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.type}</span>
                            </div>
                            <p className="font-bold text-slate-800 text-sm leading-relaxed">{item.title}</p>
                            <p className="text-xs text-slate-500 mt-2">{item.time}</p>
                        </div>
                    )) : (
                        <div className="col-span-full rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                            No recent platform activity yet.
                        </div>
                    )}
                </div>
            </div>
            {selectedTeacherWorkflowEvent && selectedTeacherWorkflowSummary && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-3 sm:items-center sm:p-6" onClick={() => setSelectedTeacherWorkflowEventId(null)}>
                    <div
                        className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
                            <div>
                                <div className="flex items-center gap-2 flex-wrap mb-2">
                                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] border ${getWorkflowEventTone(selectedTeacherWorkflowEvent.eventName)}`}>
                                        {getWorkflowEventLabel(selectedTeacherWorkflowEvent.eventName)}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                                        {selectedTeacherWorkflowEvent.time}
                                    </span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900">{selectedTeacherWorkflowEvent.actorName}</h4>
                                <p className="mt-1 text-sm text-slate-500">{selectedTeacherWorkflowEvent.context}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTeacherWorkflowEventId(null)}
                                className="rounded-full border border-slate-200 bg-white p-2 text-slate-500 hover:border-slate-300 hover:text-slate-900"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-5 px-5 py-5 sm:px-6">
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1">Recent actions</p>
                                    <p className="text-2xl font-black text-slate-900">{selectedTeacherWorkflowSummary.total}</p>
                                </div>
                                <div className="rounded-2xl bg-sky-50 p-4 border border-sky-100">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-600 mb-1">Notes</p>
                                    <p className="text-2xl font-black text-sky-950">{selectedTeacherWorkflowSummary.notes}</p>
                                </div>
                                <div className="rounded-2xl bg-violet-50 p-4 border border-violet-100">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-600 mb-1">Schemes</p>
                                    <p className="text-2xl font-black text-violet-950">{selectedTeacherWorkflowSummary.schemes}</p>
                                </div>
                                <div className="rounded-2xl bg-amber-50 p-4 border border-amber-100">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-600 mb-1">Homework</p>
                                    <p className="text-2xl font-black text-amber-950">{selectedTeacherWorkflowSummary.homework}</p>
                                </div>
                                <div className="rounded-2xl bg-rose-50 p-4 border border-rose-100">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-600 mb-1">Steps</p>
                                    <p className="text-2xl font-black text-rose-950">{selectedTeacherWorkflowSummary.steps}</p>
                                </div>
                                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1">Resets</p>
                                    <p className="text-2xl font-black text-slate-900">{selectedTeacherWorkflowSummary.resets}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">Route</p>
                                    <p className="text-sm font-bold text-slate-800 break-all">{selectedTeacherWorkflowEvent.path}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-2">Captured at</p>
                                    <p className="text-sm font-bold text-slate-800">{new Date(selectedTeacherWorkflowEvent.createdAt).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                <div className="flex items-center justify-between mb-3 gap-3">
                                    <p className="font-black text-slate-900">More from this teacher</p>
                                    <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600 border border-slate-200">
                                        Last 4 actions
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {selectedTeacherWorkflowSummary.recent.length > 0 ? selectedTeacherWorkflowSummary.recent.map((event) => (
                                        <button
                                            key={event.id}
                                            type="button"
                                            onClick={() => setSelectedTeacherWorkflowEventId(event.id)}
                                            className="w-full rounded-xl border border-slate-100 bg-white px-3 py-3 text-left hover:border-slate-200 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="font-bold text-slate-800 truncate">{getWorkflowEventLabel(event.eventName)}</p>
                                                    <p className="text-xs text-slate-500 truncate mt-1">{event.context}</p>
                                                </div>
                                                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-slate-600">
                                                    {event.time}
                                                </span>
                                            </div>
                                        </button>
                                    )) : (
                                        <p className="text-sm text-slate-400">No other recent workflow actions from this teacher yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                            <button
                                type="button"
                                onClick={() => setSelectedTeacherWorkflowEventId(null)}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-slate-300"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={() => openTeacherUser(selectedTeacherWorkflowEvent.actorName)}
                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                            >
                                Open Teacher
                            </button>
                            <button
                                type="button"
                                onClick={() => openWorkflowRoute(selectedTeacherWorkflowEvent.path)}
                                className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"
                            >
                                Open Route
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
