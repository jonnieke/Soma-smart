import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, TrendingUp, FileText, Lightbulb, ChevronRight, Bell, DollarSign, Clock, CheckCircle2, Library, Brain, Layers, Mic, LayoutDashboard } from 'lucide-react';
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
                {/* Smart Priority Strip (Hero Section) */}
                <div className="lg:col-span-2 bg-emerald-800 rounded-[2rem] p-8 shadow-md border-2 border-emerald-900 flex flex-col md:flex-row justify-between items-center relative overflow-hidden gap-8">
                    
                    {/* LEFT: Today's Teaching Focus */}
                    <div className="relative z-10 flex-1 w-full text-emerald-50">
                        <h2 className="text-2xl font-black tracking-tight mb-6 flex items-center gap-2 text-white">
                            <LayoutDashboard className="w-6 h-6 text-emerald-300" />
                            Dashboard Overview
                        </h2>

                        <div className="space-y-4 font-bold text-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                                    <AlertCircle className="w-4 h-4 text-emerald-100" />
                                </div>
                                <p className="text-emerald-100">
                                    <span className="text-white font-black text-base">8 students</span> at risk in {selectedSubject}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                                    <TrendingUp className="w-4 h-4 text-emerald-100" />
                                </div>
                                <p className="text-emerald-100">
                                    <span className="text-white font-black text-base">{selectedClass} improving</span> <span className="text-emerald-300">+6%</span>
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                                    <Lightbulb className="w-4 h-4 text-emerald-100" />
                                </div>
                                <p className="text-emerald-100">
                                    Suggested remedial: <span className="text-white font-black text-base">Decimals</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Primary CTA Panel */}
                    <div className="relative z-10 w-full md:w-auto flex flex-col gap-4 min-w-[240px]">
                        <button
                            onClick={() => onNavigate('CREATION_HUB')}
                            className="w-full bg-white text-emerald-900 px-8 py-4 rounded-2xl font-black text-lg shadow-sm hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 group border-2 border-emerald-900"
                        >
                            <Sparkles className="w-5 h-5 text-emerald-600" />
                            Creation Hub
                            <ChevronRight className="w-5 h-5 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                        </button>
                        <button
                            onClick={() => onNavigate('DARASA_MODE')}
                            className="w-full bg-emerald-900 text-emerald-100 border-2 border-emerald-700 px-8 py-3.5 rounded-2xl font-bold hover:bg-emerald-700 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                            <Mic className="w-5 h-5" />
                            Darasa Mode
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
                    className="bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-200 flex flex-col justify-between cursor-pointer hover:border-emerald-300 hover:shadow-md transition-all group"
                >
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border-2 border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                            <div className="relative">
                                <Bell className="w-7 h-7" />
                                {pendingRequests.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="bg-emerald-50 text-emerald-700 border-2 border-emerald-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                            Action Required
                        </div>
                    </div>
                    <div>
                        <h3 className="text-4xl font-black text-slate-900 mb-1">{pendingRequests.length}</h3>
                        <p className="text-slate-500 font-bold text-sm">Pending Student Requests</p>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="flex flex-col sm:flex-row gap-4 col-span-1 lg:col-span-3">
                    <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-all">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border-2 border-emerald-100">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Earnings Today</p>
                            <p className="text-2xl font-black text-slate-900">KES {todayEarnings}</p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-all">
                        <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center border-2 border-slate-200">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Library</p>
                            <p className="text-2xl font-black text-slate-900">{teacherHistory.length} <span className="text-xs text-slate-400 font-bold">Items</span></p>
                        </div>
                    </div>
                    <div className="flex-1 bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-200 flex items-center gap-4 hover:border-emerald-300 transition-all">
                        <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center border-2 border-slate-200">
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
                            className="ml-auto p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Generated Library Preview */}
                <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 shadow-sm border-2 border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                            <Library className="w-5 h-5 text-emerald-600" /> Recent Creations
                        </h3>
                        <button onClick={() => onNavigate('LIBRARY')} className="text-sm font-bold text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1">
                            View All <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {teacherHistory.length === 0 ? (
                            <div className="col-span-full p-8 text-center text-slate-500 text-sm font-bold bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300">
                                No materials generated yet. Head to the Creation Hub!
                            </div>
                        ) : (
                            teacherHistory.slice(0, 4).map((item, i) => (
                                <div key={i} className="flex flex-col p-5 bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group" onClick={() => onHistoryItemClick(item)}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border-2 ${item.type === 'NOTE' ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                                            {item.type === 'NOTE' ? <FileText className="w-6 h-6" /> : <Brain className="w-6 h-6" />}
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-md">{item.date}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-sm line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors">{item.title}</h4>
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
