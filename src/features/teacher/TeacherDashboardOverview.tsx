import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, TrendingUp, FileText, Lightbulb, ChevronRight, Plus, Bell, DollarSign, Clock, CheckCircle2, Library, Brain, Layers, Mic } from 'lucide-react';
import { TeacherProfile, TutoringRequest, TeacherActivity, TeacherWallet } from '../../types';

interface TeacherDashboardOverviewProps {
    teacherProfile: TeacherProfile | null;
    selectedSubject: string;
    selectedClass: string;
    activeTutoringRequests: TutoringRequest[];
    teacherHistory: TeacherActivity[];
    teacherWallet: TeacherWallet | null;
    onNavigate: (tab: 'MAGIC_CLASSROOM' | 'MARKING' | 'LIBRARY' | 'CREATION_HUB' | 'DARASA_MODE') => void;
    onRequestClick: (request: TutoringRequest) => void;
    onHistoryItemClick: (item: TeacherActivity) => void;
}

export const TeacherDashboardOverview: React.FC<TeacherDashboardOverviewProps> = ({
    teacherProfile,
    selectedSubject,
    selectedClass,
    activeTutoringRequests,
    teacherHistory,
    teacherWallet,
    onNavigate,
    onRequestClick,
    onHistoryItemClick
}) => {

    const pendingRequests = activeTutoringRequests.filter(r => r.status === 'PENDING');
    const todayEarnings = teacherWallet?.transactions
        .filter(t => new Date(t.date).toLocaleDateString() === new Date().toLocaleDateString())
        .reduce((acc, t) => acc + (t.type === 'EARNING' ? t.amount : 0), 0) || 0;

    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* AI Priority Strip (Hero Section) */}
                <div className="lg:col-span-2 bg-gradient-to-r from-indigo-900 to-indigo-800 rounded-[2.5rem] p-8 shadow-xl border border-indigo-700/50 flex flex-col md:flex-row justify-between items-center relative overflow-hidden gap-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl -ml-12 -mb-12"></div>

                    {/* LEFT: Today's Teaching Focus */}
                    <div className="relative z-10 flex-1 w-full text-white">
                        <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-300" />
                            Good Morning, {teacherProfile?.name?.split(' ')[0] || 'Teacher'}
                        </h2>

                        <div className="space-y-4 font-bold text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                </div>
                                <p className="text-indigo-50">
                                    <span className="text-white font-black text-base">8 students</span> at risk in {selectedSubject}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                </div>
                                <p className="text-indigo-50">
                                    <span className="text-white font-black text-base">{selectedClass} improving</span> <span className="text-emerald-400">+6%</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                    <Lightbulb className="w-4 h-4 text-purple-400" />
                                </div>
                                <p className="text-indigo-50">
                                    Suggested remedial: <span className="text-white font-black text-base">Decimals</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Primary CTA Panel */}
                    <div className="relative z-10 w-full md:w-auto flex flex-col gap-4 min-w-[240px]">
                        <button
                            onClick={() => onNavigate('CREATION_HUB')}
                            className="w-full bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-lg shadow-2xl shadow-indigo-900/50 hover:scale-105 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group border-2 border-white"
                        >
                            🚀 Launch Creation Hub
                            <ChevronRight className="w-5 h-5 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                        </button>
                        <button
                            onClick={() => onNavigate('DARASA_MODE')}
                            className="w-full bg-indigo-800/50 text-indigo-100 border border-indigo-500/30 px-8 py-3.5 rounded-2xl font-bold hover:bg-indigo-700/50 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <Mic className="w-5 h-5" />
                            Launch Darasa Mode
                        </button>
                    </div>
                </div>

                {/* Pending Requests Card */}
                <div
                    onClick={() => {
                        if (pendingRequests.length > 0) {
                            onRequestClick(pendingRequests[0]);
                        }
                    }}
                    className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                            <div className="relative">
                                <Bell className="w-7 h-7" />
                                {pendingRequests.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Action Required
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{pendingRequests.length}</h3>
                        <p className="text-slate-500 font-medium text-sm">Pending Student Tutoring Requests</p>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="flex gap-4 col-span-1 lg:col-span-3">
                    <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earnings Today</p>
                            <p className="text-2xl font-black text-slate-900">KES {todayEarnings}</p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Library</p>
                            <p className="text-2xl font-black text-slate-900">{teacherHistory.length} <span className="text-xs text-slate-400 font-bold">Items</span></p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
                            <p className="text-2xl font-black text-slate-900">{pendingRequests.length} <span className="text-xs text-slate-400 font-bold">Requests</span></p>
                        </div>
                        <button
                            onClick={() => {
                                if (pendingRequests.length > 0) onRequestClick(pendingRequests[0]);
                            }}
                            className="ml-auto p-2 hover:bg-slate-50 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-300" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Middle Row: AI Insights & Class Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* AI Insights */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                    <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-10 transition-opacity pointer-events-none">
                        <Brain className="w-64 h-64 text-indigo-600 -mr-12 -mb-12" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <Brain className="w-6 h-6 text-indigo-500" />
                        Soma AI Insights
                    </h3>
                    <div className="space-y-5 relative z-10">
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                            <TrendingUp className="w-5 h-5 text-emerald-500 mt-0.5" />
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                <span className="text-emerald-600 font-black">60%</span> of {selectedClass} struggling with {selectedSubject}.
                            </p>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                <span className="text-red-600 font-black">12 students</span> did not complete {selectedSubject} homework assignments this week.
                            </p>
                        </div>
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-indigo-100 bg-indigo-50/50">
                            <Layers className="w-5 h-5 text-indigo-500 mt-0.5" />
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">
                                Suggested revision topic based on recent performance: <span className="text-indigo-600 font-black">Decimals</span>.
                            </p>
                        </div>
                    </div>
                    <button onClick={() => onNavigate('CREATION_HUB')} className="mt-6 w-full bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" /> Auto-Generate Revision Materials
                    </button>
                </div>

                {/* Class Performance Tracker */}
                <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col justify-between">
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900">Performance Snapshot</h3>
                            <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">
                                Full Report
                            </button>
                        </div>
                        <p className="text-sm font-black text-slate-500 uppercase tracking-wider mb-4">{selectedClass} {selectedSubject}</p>

                        <div className="bg-slate-50 rounded-2xl p-6 mb-6">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average Score</p>
                                    <p className="text-4xl font-black text-slate-900 mt-1">62%</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-black text-emerald-600 flex items-center justify-end gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                                        <TrendingUp className="w-3 h-3" /> +8%
                                    </p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Improvement</p>
                                </div>
                            </div>
                            <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[62%] rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    <button onClick={() => onNavigate('MARKING')} className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
                        View Detailed Analytics
                    </button>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Generated Library Preview */}
                <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Library className="w-5 h-5 text-indigo-500" /> Recent Creations
                        </h3>
                        <button onClick={() => onNavigate('LIBRARY')} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {teacherHistory.length === 0 ? (
                            <div className="col-span-full p-8 text-center text-slate-400 text-sm font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                No materials generated yet. Head to the Creation Hub!
                            </div>
                        ) : (
                            teacherHistory.slice(0, 4).map((item, i) => (
                                <div key={i} className="flex flex-col p-5 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all cursor-pointer group" onClick={() => onHistoryItemClick(item)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-xl shadow-sm flex items-center justify-center ${item.type === 'NOTE' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                                            {item.type === 'NOTE' ? <FileText className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                                        </div>
                                        <span className="text-xs font-black text-slate-400 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">{item.date}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-auto pt-4">{item.subject}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
