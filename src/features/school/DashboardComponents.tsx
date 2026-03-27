import React from 'react';
import { motion } from 'framer-motion';
import {
    ChevronRight,
    LogOut,
    ArrowUpRight
} from 'lucide-react';
import { SchoolTeacher } from '../../types';

export const NavItem = ({ icon, label, active = false, onClick, isDark = false }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, isDark?: boolean }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all w-full font-bold relative group ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
            }`}
    >
        <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`transition-colors ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}
        >
            {icon}
        </motion.div>
        <span className="relative z-10">{label}</span>
        {active && (
            <motion.div
                layoutId="nav-pill"
                className="absolute inset-0 bg-blue-600 rounded-2xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
        )}
    </button>
);

export const StatCard = ({ icon, label, value, trend, color }: { icon: React.ReactNode, label: string, value: string, trend: string, color: string }) => (
    <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-2xl hover:shadow-blue-500/10 transition-all group relative overflow-hidden"
    >
        <div className="flex items-center justify-between mb-8 relative z-10">
            <div className={`w-14 h-14 ${color} rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-${color.split('-')[1]}-500/50 transform group-hover:rotate-12 transition-transform duration-500`}>
                {icon}
            </div>
            <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 block mb-1">{label}</span>
                <div className="flex items-center gap-1.5 justify-end">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Live</span>
                </div>
            </div>
        </div>
        <div className="relative z-10">
            <h4 className="text-5xl font-black text-slate-900 mb-2 tracking-tight flex items-baseline gap-1">
                {value}
                <span className="text-xs font-bold text-slate-400 tracking-normal opacity-0 group-hover:opacity-100 transition-opacity">Total</span>
            </h4>
            <div className="flex items-center gap-2">
                <p className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100/50 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    {trend}
                </p>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">vs last month</span>
            </div>
        </div>
        <div className={`absolute -right-8 -top-8 w-32 h-32 ${color} opacity-[0.05] rounded-full blur-3xl group-hover:opacity-[0.1] transition-opacity`} />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
);

export const TeacherRow = ({ name, subject, impact, lessons, onRemove }: SchoolTeacher & { onRemove?: () => void }) => (
    <motion.div
        layout
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="p-8 flex items-center justify-between hover:bg-white hover:shadow-[0_10px_40px_rgba(0,0,0,0.04)] hover:scale-[1.01] transition-all border-b border-slate-50 last:border-0 group cursor-pointer relative overflow-hidden"
    >
        <div className="flex items-center gap-6 relative z-10">
            <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl shadow-blue-200 group-hover:rotate-6 transition-transform">
                    {name.charAt(0)}
                </div>
                <div className="absolute -right-1 -bottom-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />
            </div>
            <div>
                <p className="font-black text-slate-900 text-xl leading-tight group-hover:text-blue-600 transition-colors">{name}</p>
                <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">{subject || 'Faculty Member'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Verified Provider</span>
                </div>
            </div>
        </div>
        <div className="text-right flex items-center gap-12 relative z-10">
            <div className="hidden lg:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Teaching Impact</p>
                <div className="flex items-center gap-2 justify-end">
                    <p className="text-blue-600 font-black text-xl">{impact || '92%'}</p>
                    <div className="w-8 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-[92%]" />
                    </div>
                </div>
            </div>
            <div className="hidden md:block">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Session Count</p>
                <p className="font-black text-slate-900 text-xl">{lessons || 24}</p>
            </div>
            <div className="flex items-center gap-4">
                <motion.button
                    whileHover={{ x: 5 }}
                    className="p-4 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                >
                    <ChevronRight className="w-7 h-7" />
                </motion.button>
                {onRemove && (
                    <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-4 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                        <LogOut className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>
        <div className="absolute left-0 top-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
);

export const UsageBar = ({ label, current, max, color }: { label: string, current: number, max: number, color: string }) => (
    <div className="relative group">
        <div className="flex justify-between items-end text-[10px] font-black uppercase tracking-[0.2em] mb-3">
            <span className="text-slate-400 group-hover:text-slate-600 transition-colors">{label}</span>
            <span className="text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100/50">
                {current} <span className="text-slate-300 mx-1">/</span> {max}
            </span>
        </div>
        <div className="h-4 bg-slate-100/50 rounded-full overflow-hidden border border-slate-200/50 p-[3px] relative">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((current / max) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full ${color} rounded-full shadow-lg relative overflow-hidden`}
            >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </motion.div>
        </div>
        <div className="mt-2 flex justify-end">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                {Math.round((current / max) * 100)}% Capacity Utilized
            </span>
        </div>
    </div>
);
