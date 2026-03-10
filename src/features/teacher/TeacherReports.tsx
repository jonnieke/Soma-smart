import React from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Download, Users, Brain, Target, Calendar, FileText, CheckCircle2, Activity, Clock } from 'lucide-react';

export const TeacherReports: React.FC = () => {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-24">

            {/* Header Section */}
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 rounded-[3rem] p-8 md:p-12 text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black mb-2 tracking-tight">Analytics & Reports</h2>
                        <p className="opacity-90 font-medium max-w-md">Track class performance, generate termly report cards, and identify learning trends using Super Teacher OS.</p>
                    </div>
                    <button className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Download className="w-5 h-5" /> Export PDF Report
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mb-1">Class Average</p>
                        <p className="text-3xl font-black flex items-center gap-2">68% <TrendingUp className="w-5 h-5 text-emerald-400" /></p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mb-1">Pass Rate</p>
                        <p className="text-3xl font-black flex items-center gap-2">82% <TrendingUp className="w-5 h-5 text-emerald-400" /></p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mb-1">Syllabus Covered</p>
                        <p className="text-3xl font-black text-amber-300">45%</p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20">
                        <p className="text-[10px] uppercase tracking-widest font-black opacity-70 mb-1">At Risk</p>
                        <p className="text-3xl font-black text-rose-300">4</p>
                    </div>
                </div>
            </div>

            {/* Performance By Subject/Topic */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h3 className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-indigo-500" /> Topic Performance Mastery
                    </h3>

                    <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-100 shadow-sm space-y-6">
                        {[
                            { topic: "Algebraic Expressions", mastery: 85, color: "bg-emerald-500", trend: "+5%" },
                            { topic: "Geometry (Angles)", mastery: 72, color: "bg-emerald-400", trend: "+2%" },
                            { topic: "Linear Equations", mastery: 55, color: "bg-amber-500", trend: "-4%" },
                            { topic: "Probability", mastery: 38, color: "bg-rose-500", trend: "-12%" }
                        ].map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="font-bold text-sm text-slate-700">{item.topic}</span>
                                    <div className="text-right">
                                        <span className="font-black text-slate-900">{item.mastery}%</span>
                                        <span className={`text-[10px] font-bold ml-2 ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {item.trend}
                                        </span>
                                    </div>
                                </div>
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.mastery}%` }}
                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                        className={`h-full rounded-full ${item.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Insights & Alerts */}
                <div className="space-y-6">
                    <h3 className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                        <Brain className="w-5 h-5 text-indigo-500" /> AI Insights
                    </h3>

                    <div className="bg-gradient-to-b from-indigo-50 to-white rounded-[2rem] p-6 border-2 border-indigo-100 shadow-sm">
                        <div className="space-y-4">
                            <div className="flex gap-4 items-start p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
                                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                                    <TrendingDown className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-sm">Critical Drop: Probability</h4>
                                    <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                                        Class average dropped by 12% in the latest continuous assessment. Recommend scheduling a targeted remedial class.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start p-4 bg-white rounded-2xl border border-indigo-50 shadow-sm">
                                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                    <Target className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-sm">Milestone Reached</h4>
                                    <p className="text-xs font-medium text-slate-500 mt-1 leading-relaxed">
                                        85% of students have now mastered Algebraic Expressions ahead of the KNEC syllabus schedule.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Generated Reports List */}
            <div className="space-y-6">
                <h3 className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-500" /> Report Cards Archive
                </h3>

                <div className="grid md:grid-cols-3 gap-6">
                    {[
                        { title: "Mid-Term 1 Report", date: "Feb 15, 2024", type: "Official", icon: <CheckCircle2 className="w-6 h-6 text-emerald-500" /> },
                        { title: "End of Term 3 (Last Year)", date: "Nov 20, 2023", type: "Archive", icon: <Calendar className="w-6 h-6 text-slate-400" /> },
                        { title: "March Continuous Assessment", date: "Mar 01, 2024", type: "Internal", icon: <BarChart3 className="w-6 h-6 text-blue-500" /> },
                    ].map((report, idx) => (
                        <div key={idx} className="bg-white p-6 rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-indigo-200 transition-colors cursor-pointer group flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                {report.icon}
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{report.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{report.date}</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{report.type}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Student Engagement Tracking */}
            <div className="space-y-6">
                <h3 className="font-black text-xl text-slate-900 tracking-tight flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" /> Student Engagement & Activity
                </h3>

                <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-100 shadow-sm">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-slate-500">
                                <Users className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Active Today</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900">32<span className="text-sm font-medium text-slate-400">/40</span></p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-slate-500">
                                <FileText className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Homework Done</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900">85%</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-slate-500">
                                <Brain className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">AI Tutor Uses</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900">142 <span className="text-xs text-emerald-500 font-bold">+12%</span></p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2 text-slate-500">
                                <Clock className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-wider">Avg. Study Time</span>
                            </div>
                            <p className="text-2xl font-black text-slate-900">45<span className="text-sm font-medium text-slate-400">m</span></p>
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
};
