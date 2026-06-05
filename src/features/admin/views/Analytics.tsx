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
    Users2
} from 'lucide-react';
import { fetchDashboardStats, fetchFinanceSummary, DashboardStats, FinanceSummary } from '../../../services/adminService';

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

export const AnalyticsView: React.FC = () => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    const isConfigured = gaId && gaId !== 'G-CHECK_GA_DASHBOARD';

    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [finance, setFinance] = useState<FinanceSummary | null>(null);

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

    if (!stats || !finance) {
        return <div className="p-12 text-center text-slate-400">Loading analytics...</div>;
    }

    const maxTrend = Math.max(...stats.activityTrend, 1);
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
                                            {feature.calls} calls · {feature.inputTokens.toLocaleString()} in / {feature.outputTokens.toLocaleString()} out
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
        </div>
    );
};
