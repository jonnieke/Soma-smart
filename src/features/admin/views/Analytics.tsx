import React from 'react';
import { BarChart3, Globe, MousePointer2, Clock, ExternalLink, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const AnalyticsView: React.FC = () => {
    const gaId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    const isConfigured = gaId && gaId !== 'G-CHECK_GA_DASHBOARD';

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Traffic & Engagement</h2>
                    <p className="text-slate-500">Google Analytics Integration Status</p>
                </div>
                <a
                    href="https://analytics.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200"
                >
                    Open GA4 Dashboard <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            {/* Status Card */}
            <div className={`p-6 rounded-2xl border ${isConfigured ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'}`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${isConfigured ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {isConfigured ? <BarChart3 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className={`font-bold ${isConfigured ? 'text-emerald-900' : 'text-amber-900'}`}>
                            {isConfigured ? 'Analytics Active' : 'Configuration Required'}
                        </h3>
                        <p className={`text-sm ${isConfigured ? 'text-emerald-700' : 'text-amber-700'} mb-4`}>
                            {isConfigured
                                ? `Currently tracking data using Measurement ID: ${gaId}`
                                : 'Google Analytics is not yet configured. Please update the VITE_GA_MEASUREMENT_ID in your .env file.'
                            }
                        </p>
                    </div>
                </div>
            </div>

            {/* Metric Placeholders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnalyticsCard
                    title="Active Users"
                    value="Real-time"
                    description="View in Google Analytics"
                    icon={<Globe className="w-5 h-5 text-blue-600" />}
                    bg="bg-blue-50"
                />
                <AnalyticsCard
                    title="Page Views"
                    value="Tracking"
                    description="Events being captured"
                    icon={<MousePointer2 className="w-5 h-5 text-purple-600" />}
                    bg="bg-purple-50"
                />
                <AnalyticsCard
                    title="Session Duration"
                    value="Optimized"
                    description="User engagement tracking"
                    icon={<Clock className="w-5 h-5 text-indigo-600" />}
                    bg="bg-indigo-50"
                />
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center">
                <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Advanced Analytics</h3>
                    <p className="text-slate-500 mb-6">
                        For deep insights into user behavior, demographics, and conversion rates, please use the official Google Analytics 4 console.
                    </p>
                    <div className="flex flex-col gap-3">
                        <p className="text-xs font-mono text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
                            Tracking: Page Views, Route Changes, Auth Events
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnalyticsCard = ({ title, value, description, icon, bg }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${bg}`}>{icon}</div>
            <h4 className="font-bold text-slate-800">{title}</h4>
        </div>
        <div className="text-2xl font-black text-slate-900 mb-1">{value}</div>
        <p className="text-xs text-slate-400 font-medium">{description}</p>
    </div>
);
