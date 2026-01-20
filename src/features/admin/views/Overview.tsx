import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Users, Activity, CheckCircle, TrendingUp, ArrowUp } from 'lucide-react';
import { getAdminStats, AdminStats } from '../../../services/paymentService';

export const Overview: React.FC = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);

    useEffect(() => {
        getAdminStats().then(setStats);
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
                    title="Active Trials"
                    value={stats.activeTrials.toString()}
                    change="+5 today"
                    icon={<Users className="w-6 h-6 text-blue-600" />}
                    bg="bg-blue-50"
                />
                <MetricCard
                    title="Verified Users"
                    value={stats.verifiedUsers.toString()}
                    change="+18.2%"
                    icon={<CheckCircle className="w-6 h-6 text-indigo-600" />}
                    bg="bg-indigo-50"
                />
                <MetricCard
                    title="Active Pro"
                    value={stats.activePro.toString()}
                    change="+2.1%"
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
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>

                    {/* Mock Graph */}
                    <div className="h-64 flex items-end justify-between gap-2 px-2">
                        {[40, 65, 45, 80, 55, 90, 75, 40, 65, 45, 80, 55, 95, 85].map((h, i) => (
                            <motion.div
                                key={i}
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                transition={{ delay: i * 0.05 }}
                                className="w-full bg-indigo-500/10 hover:bg-indigo-500 rounded-t-sm relative group cursor-pointer transition-colors"
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {h * 12}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Feed */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Live Feed</h3>
                    <div className="space-y-6">
                        <FeedItem title="New Student Registered" time="2 min ago" type="student" />
                        <FeedItem title="Teacher Verified (ID: 8829)" time="15 min ago" type="teacher" />
                        <FeedItem title="Payment Received (KES 500)" time="1 hour ago" type="money" />
                        <FeedItem title="New Parent Account" time="2 hours ago" type="parent" />
                        <FeedItem title="Quiz Generated (Grade 4)" time="3 hours ago" type="system" />
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
