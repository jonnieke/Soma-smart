import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, Activity, CheckCircle, TrendingUp, ArrowUp } from 'lucide-react';
import { getAdminStats, AdminStats } from '../../../services/paymentService'; // Keep for legacy check or remove if unused, but we switch to adminService
import { fetchDashboardStats, DashboardStats } from '../../../services/adminService';

export const Overview: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);

    useEffect(() => {
        fetchDashboardStats().then(setStats);
    }, []);

    if (!stats) return <div className="p-12 text-center text-slate-400">Loading metrics...</div>;

    return (
        <div className="space-y-8">
            {/* 1. Top Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                    title="Total Revenue"
                    value={`KES ${stats.totalRevenue.toLocaleString()}`}
                    change="+12.5%"
                    icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
                    bg="bg-emerald-50"
                />
                <MetricCard
                    title="Total Students"
                    value={stats.totalStudents.toLocaleString()}
                    change="Active"
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                    bg="bg-blue-50"
                />
                <MetricCard
                    title="Verified Users"
                    value={stats.verifiedUsers.toLocaleString()}
                    change={`${Math.round((stats.verifiedUsers / (stats.totalStudents + stats.totalTeachers + stats.totalParents || 1)) * 100)}%`}
                    icon={<CheckCircle className="w-6 h-6 text-indigo-600" />}
                    bg="bg-indigo-50"
                />
                <MetricCard
                    title="Active Pro"
                    value={stats.activePro.toLocaleString()}
                    change="Growing"
                    icon={<Activity className="w-6 h-6 text-purple-600" />}
                    bg="bg-purple-50"
                />
            </div>

            {/* 2. Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Activity Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">User Activity Trends</h3>
                            <p className="text-sm text-slate-400">Daily active students & teachers</p>
                        </div>
                        <select className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-sm text-slate-600 outline-none">
                            <option>Last 14 Days</option>
                        </select>
                    </div>

                    {/* Real Graph */}
                    <div className="h-64 flex items-end justify-between gap-2 px-2">
                        {stats.activityTrend.map((h, i) => {
                            // Normalize height for display (max 100%)
                            const max = Math.max(...stats.activityTrend, 1);
                            const heightPct = (h / max) * 100;

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${heightPct}%` }}
                                    transition={{ delay: i * 0.05 }}
                                    className="w-full bg-indigo-500/10 hover:bg-indigo-500 rounded-t-sm relative group cursor-pointer transition-colors"
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {h} Activities
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>

                {/* Feed */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Live Feed</h3>
                    <div className="space-y-6">
                        {stats.recentActivity.length === 0 ? (
                            <p className="text-slate-400 text-sm">No recent activity.</p>
                        ) : (
                            stats.recentActivity.map((item) => (
                                <FeedItem key={item.id} title={item.title} time={item.time} type={item.type} />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ title, value, change, icon, bg }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-xl ${bg}`}>{icon}</div>
            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <TrendingUp className="w-3 h-3 mr-1" /> {change}
            </span>
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-1">{value}</h3>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
    </div>
);

const FeedItem = ({ title, time, type }: any) => {
    const colors: any = {
        student: 'bg-orange-100 text-orange-600',
        teacher: 'bg-blue-100 text-blue-600',
        money: 'bg-green-100 text-green-600',
        parent: 'bg-yellow-100 text-yellow-600',
        system: 'bg-slate-100 text-slate-600'
    };

    return (
        <div className="flex items-start gap-3">
            <div className={`w-2 h-2 mt-2 rounded-full ${colors[type].split(' ')[1].replace('text', 'bg')}`}></div>
            <div>
                <p className="text-sm font-bold text-slate-700">{title}</p>
                <p className="text-xs text-slate-400">{time}</p>
            </div>
        </div>
    );
};
