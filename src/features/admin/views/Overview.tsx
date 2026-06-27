import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    ArrowUpRight,
    BookOpen,
    Brain,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    FileText,
    GraduationCap,
    RefreshCw,
    School,
    Sparkles,
    TrendingUp,
    Users,
    Users2,
    Wallet,
    Clock3,
    Zap
} from 'lucide-react';
import { fetchAllUsers, fetchDashboardStats, fetchFinanceSummary, fetchTodayPilotStats, DashboardStats, SchoolCognitiveHealth, fetchSchoolWideMastery, FinanceSummary, AdminUser, TodayPilotStats } from '../../../services/adminService';

type OverviewCardProps = {
    label: string;
    value: string;
    hint: string;
    icon: React.ReactNode;
    tone: 'indigo' | 'emerald' | 'sky' | 'amber' | 'rose' | 'violet';
};

const toneClasses: Record<OverviewCardProps['tone'], { bg: string; icon: string; border: string }> = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', border: 'border-emerald-100' },
    sky: { bg: 'bg-sky-50', icon: 'text-sky-600', border: 'border-sky-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', border: 'border-amber-100' },
    rose: { bg: 'bg-rose-50', icon: 'text-rose-600', border: 'border-rose-100' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-600', border: 'border-violet-100' }
};

const OverviewCard: React.FC<OverviewCardProps> = ({ label, value, hint, icon, tone }) => {
    const classes = toneClasses[tone];
    return (
        <div className={`rounded-2xl border ${classes.border} bg-white p-5 shadow-sm`}>
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className={`p-3 rounded-xl ${classes.bg} ${classes.icon}`}>{icon}</div>
                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{hint}</span>
            </div>
            <div className="text-2xl font-black text-slate-900 leading-none mb-1">{value}</div>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
        </div>
    );
};

export const Overview: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [cognitiveHealth, setCognitiveHealth] = useState<SchoolCognitiveHealth | null>(null);
    const [finance, setFinance] = useState<FinanceSummary | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [pilotStats, setPilotStats] = useState<TodayPilotStats | null>(null);
    const [pilotRefreshing, setPilotRefreshing] = useState(false);

    useEffect(() => {
        Promise.all([
            fetchDashboardStats(),
            fetchSchoolWideMastery(),
            fetchFinanceSummary(),
            fetchAllUsers(),
            fetchTodayPilotStats(),
        ]).then(([dashboardStats, schoolHealth, financeSummary, allUsers, todayStats]) => {
            setStats(dashboardStats);
            setCognitiveHealth(schoolHealth);
            setFinance(financeSummary);
            setUsers(allUsers);
            setPilotStats(todayStats);
        });
    }, []);

    const refreshPilot = async () => {
        setPilotRefreshing(true);
        const todayStats = await fetchTodayPilotStats();
        setPilotStats(todayStats);
        setPilotRefreshing(false);
    };

    const latestUsers = useMemo(() => users.slice(0, 6), [users]);
    const roleCounts = useMemo(() => ({
        learners: users.filter(u => u.role === 'LEARNER').length,
        teachers: users.filter(u => u.role === 'TEACHER').length,
        parents: users.filter(u => u.role === 'PARENT').length,
        revision: users.filter(u => u.role === 'REVISION').length,
        school: users.filter(u => u.role === 'SCHOOL').length,
    }), [users]);

    if (!stats || !cognitiveHealth || !finance) {
        return <div className="p-12 text-center text-slate-400 font-medium">Loading command center...</div>;
    }

    const maxTrend = Math.max(...stats.activityTrend, 1);
    const activeUsers = stats.activeToday + stats.newUsers7d;
    const revenue = finance.totalRevenueKes || stats.totalRevenue;
    const margin = finance.grossMarginKes;
    const marginPct = finance.grossMarginPct;

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-8 text-white shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.16),transparent_30%)]" />
                <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div className="max-w-3xl">
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300 mb-4">
                            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
                            Somo Command Center
                        </div>
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3">One view for users, content, revenue, and platform health.</h2>
                        <p className="text-slate-300/90 max-w-2xl leading-relaxed">
                            This is the operational layer for Somo Smart: who is onboarded, what learners are using, where the content lives,
                            and whether the platform is keeping its margin while helping students and teachers.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 min-w-[280px]">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-black mb-1">Revenue</p>
                            <p className="text-2xl font-black">KES {revenue.toLocaleString()}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-black mb-1">Margin</p>
                            <p className="text-2xl font-black">{marginPct.toFixed(1)}%</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-black mb-1">Active today</p>
                            <p className="text-2xl font-black">{stats.activeToday}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400 font-black mb-1">Users 7d</p>
                            <p className="text-2xl font-black">{stats.newUsers7d}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <OverviewCard label="Learners on platform" value={stats.totalStudents.toLocaleString()} hint="Learners" icon={<Users className="h-5 w-5" />} tone="sky" />
                <OverviewCard label="Teachers onboarded" value={stats.totalTeachers.toLocaleString()} hint="Teachers" icon={<School className="h-5 w-5" />} tone="violet" />
                <OverviewCard label="Parents active" value={stats.totalParents.toLocaleString()} hint="Parents" icon={<Users2 className="h-5 w-5" />} tone="amber" />
                <OverviewCard label="Verified / paid users" value={stats.verifiedUsers.toLocaleString()} hint="Pro" icon={<CheckCircle2 className="h-5 w-5" />} tone="emerald" />
                <OverviewCard label="Knowledge base documents" value={stats.totalKnowledgeDocs.toLocaleString()} hint="Content" icon={<BookOpen className="h-5 w-5" />} tone="indigo" />
                <OverviewCard label="Teacher materials" value={stats.totalTeacherMaterials.toLocaleString()} hint="Market" icon={<FileText className="h-5 w-5" />} tone="rose" />
                <OverviewCard label="Past papers / notes / syllabuses" value={`${stats.totalPastPapers} / ${stats.totalNotes} / ${stats.totalSyllabuses}`} hint="Library mix" icon={<ClipboardCheck className="h-5 w-5" />} tone="amber" />
                <OverviewCard label="Estimated AI spend" value={`KES ${finance.aiCostKes.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} hint="Cost" icon={<Brain className="h-5 w-5" />} tone="violet" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-start justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Activity trend</h3>
                                <p className="text-sm text-slate-500">Last 14 days of activity across learners, teachers, and payments.</p>
                            </div>
                            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                                {activeUsers} fast-moving users
                            </div>
                        </div>
                        <div className="flex items-end gap-2 h-64 px-1">
                            {stats.activityTrend.map((value, index) => {
                                const heightPct = (value / maxTrend) * 100;
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${Math.max(heightPct, 4)}%` }}
                                            transition={{ delay: index * 0.03, duration: 0.4 }}
                                            className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-sky-400"
                                        />
                                        <span className="text-[10px] font-black text-slate-400">{index % 2 === 0 ? index + 1 : ''}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Content inventory</h3>
                                    <p className="text-sm text-slate-500">What is in the library and teaching workspace.</p>
                                </div>
                                <BookOpen className="h-5 w-5 text-indigo-500" />
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Notes', value: stats.totalNotes, color: 'bg-indigo-500' },
                                    { label: 'Past papers', value: stats.totalPastPapers, color: 'bg-emerald-500' },
                                    { label: 'Syllabuses', value: stats.totalSyllabuses, color: 'bg-amber-500' },
                                    { label: 'Teacher materials', value: stats.totalTeacherMaterials, color: 'bg-rose-500' },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center gap-3">
                                        <div className="w-24 text-sm font-bold text-slate-700">{item.label}</div>
                                        <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                                            <div
                                                className={`${item.color} h-full rounded-full`}
                                                style={{ width: `${Math.min(100, Math.max(12, (item.value / Math.max(stats.totalKnowledgeDocs, 1)) * 100))}%` }}
                                            />
                                        </div>
                                        <div className="w-10 text-right text-sm font-black text-slate-900">{item.value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">Top subjects</h3>
                                    <p className="text-sm text-slate-500">Most active subjects across the library and school materials.</p>
                                </div>
                                <ClipboardCheck className="h-5 w-5 text-sky-500" />
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
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">User mix</h3>
                                <p className="text-sm text-slate-500">Current platform distribution.</p>
                            </div>
                            <Users2 className="h-5 w-5 text-violet-500" />
                        </div>
                        <div className="space-y-3">
                            {[
                                { label: 'Learners', value: roleCounts.learners, tone: 'bg-sky-500' },
                                { label: 'Teachers', value: roleCounts.teachers, tone: 'bg-violet-500' },
                                { label: 'Parents', value: roleCounts.parents, tone: 'bg-amber-500' },
                                { label: 'Revision', value: roleCounts.revision, tone: 'bg-emerald-500' },
                                { label: 'Schools', value: roleCounts.school, tone: 'bg-rose-500' },
                            ].map((item) => (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-600">{item.label}</span>
                                        <span className="font-black text-slate-900">{item.value}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className={`${item.tone} h-full rounded-full`}
                                            style={{ width: `${Math.max(8, (item.value / Math.max(stats.totalUsers, 1)) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Recent users</h3>
                                <p className="text-sm text-slate-500">Latest joins and account activity.</p>
                            </div>
                            <Clock3 className="h-5 w-5 text-amber-500" />
                        </div>
                        <div className="space-y-4">
                            {latestUsers.length > 0 ? latestUsers.map((user) => (
                                <div key={user.id} className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="font-bold text-slate-800 truncate">{user.full_name || 'Unnamed user'}</p>
                                        <p className="text-xs text-slate-500">{user.role} {user.grade ? `• ${user.grade}` : ''} {user.school ? `• ${user.school}` : ''}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.18em]">{user.is_pro ? 'Pro' : 'Free'}</p>
                                        <p className="text-xs text-slate-500">{new Date(user.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-sm text-slate-400">No recent users found.</p>
                            )}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <Wallet className="h-5 w-5 text-emerald-300" />
                            <h3 className="text-lg font-black">Business health</h3>
                        </div>
                        <div className="space-y-3 text-sm text-slate-300">
                            <p><span className="font-black text-white">AI spend:</span> KES {finance.aiCostKes.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                            <p><span className="font-black text-white">Gross margin:</span> KES {margin.toLocaleString(undefined, { maximumFractionDigits: 0 })} ({marginPct.toFixed(1)}%)</p>
                            <p><span className="font-black text-white">AI calls:</span> {finance.aiCalls}</p>
                            <p><span className="font-black text-white">Average AI cost/call:</span> KES {finance.avgAiCostPerCallKes.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            <ArrowUpRight className="h-4 w-4" />
                            Keep AI costs below 25-35% of revenue
                        </div>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">Live feed</h3>
                        <p className="text-sm text-slate-500">Latest platform events from learning, teaching, and payments.</p>
                    </div>
                    <Activity className="h-5 w-5 text-slate-400" />
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

            {/* School Pilot Monitor */}
            <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 to-slate-900 p-6 text-white">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-indigo-300" />
                        </div>
                        <div>
                            <h3 className="font-black text-lg">Today&apos;s Pilot — {new Date().toLocaleDateString('en-KE', { weekday: 'short', month: 'short', day: 'numeric' })}</h3>
                            <p className="text-slate-400 text-xs font-medium">Live usage since midnight — refresh to update</p>
                        </div>
                    </div>
                    <button
                        onClick={refreshPilot}
                        disabled={pilotRefreshing}
                        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${pilotRefreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    {[
                        { label: 'Active users', value: pilotStats?.activeUsersToday ?? '—', color: 'text-sky-300' },
                        { label: 'New signups', value: pilotStats?.newSignupsToday ?? '—', color: 'text-emerald-300' },
                        { label: 'AI calls', value: pilotStats?.aiCallsToday ?? '—', color: 'text-indigo-300' },
                        { label: 'Payments', value: pilotStats?.paymentsToday ?? '—', color: 'text-amber-300' },
                    ].map(item => (
                        <div key={item.label} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                            <p className={`text-3xl font-black ${item.color}`}>{item.value}</p>
                        </div>
                    ))}
                </div>

                {pilotStats && pilotStats.recentAiEvents.length > 0 && (
                    <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Recent AI calls today</p>
                        </div>
                        <div className="divide-y divide-white/5">
                            {pilotStats.recentAiEvents.map((event, i) => (
                                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                                    <span className="text-xs font-bold text-slate-300">{event.feature.replace(/_/g, ' ')}</span>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-slate-500 font-medium">{event.time}</span>
                                        <span className="text-xs font-black text-amber-400">KES {event.costKes.toFixed(3)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {pilotStats && pilotStats.recentAiEvents.length === 0 && (
                    <p className="text-sm text-slate-500 font-medium text-center py-4">No AI calls yet today — data updates as students use the platform.</p>
                )}
            </div>

            <div className="bg-gradient-to-r from-indigo-50 via-white to-emerald-50 border border-slate-200 rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900">School cognitive health</h3>
                        <p className="text-sm text-slate-600 max-w-2xl">
                            The platform is now pulling school-wide mastery signals so administrators can see weak topics before they become a results problem.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Avg mastery</p>
                            <p className="text-2xl font-black text-slate-900">{cognitiveHealth.averageScore}%</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Mastered topics</p>
                            <p className="text-2xl font-black text-slate-900">{cognitiveHealth.totalMasteredTopics}</p>
                        </div>
                        <div className="rounded-2xl bg-white px-4 py-3 border border-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Active learners</p>
                            <p className="text-2xl font-black text-slate-900">{cognitiveHealth.activeLearners}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {cognitiveHealth.topStrugglingTopics.length > 0 ? cognitiveHealth.topStrugglingTopics.map((item) => (
                        <div key={item.topic} className="rounded-2xl border border-amber-100 bg-white p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500 mb-1">Needs attention</p>
                            <p className="font-bold text-slate-800">{item.topic}</p>
                            <p className="text-sm text-slate-500 mt-1">{item.count} learners struggling here</p>
                        </div>
                    )) : (
                        <div className="md:col-span-3 rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-slate-400">
                            No struggling topics detected yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
