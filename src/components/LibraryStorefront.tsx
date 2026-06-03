import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface LibraryStorefrontProps {
    onGetAccess: () => void;
}

interface LibraryItem {
    id: number;
    title: string;
    grade: string;
    subject: string;
    type: 'SYLLABUS' | 'NOTES' | 'PAST_PAPER';
    file_url: string;
}

const typeConfig = {
    SYLLABUS:   { label: 'Syllabus',    badge: 'Free', icon: '📖', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-100 dark:border-purple-800/50' },
    NOTES:      { label: 'Notes',       badge: 'Free', icon: '📝', bg: 'bg-blue-50 dark:bg-blue-900/20',    border: 'border-blue-100 dark:border-blue-800/50' },
    PAST_PAPER: { label: 'Past Paper',  badge: 'Free', icon: '📄', bg: 'bg-amber-50 dark:bg-amber-900/20',  border: 'border-amber-100 dark:border-amber-800/50' },
} as const;

const TABS = [
    { id: 'ALL',        label: '📚 All',         active: 'bg-indigo-600 text-white border-indigo-600' },
    { id: 'SYLLABUS',   label: '📖 Syllabus',    active: 'bg-purple-600 text-white border-purple-600' },
    { id: 'NOTES',      label: '📝 Notes',       active: 'bg-blue-600 text-white border-blue-600' },
    { id: 'PAST_PAPER', label: '📄 Past Papers', active: 'bg-amber-500 text-white border-amber-500' },
] as const;

export const LibraryStorefront: React.FC<LibraryStorefrontProps> = ({ onGetAccess }) => {
    const [items, setItems] = useState<LibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'ALL' | 'SYLLABUS' | 'NOTES' | 'PAST_PAPER'>('ALL');
    const [activeSubject, setActiveSubject] = useState('ALL');

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await supabase
                    .from('knowledge_base')
                    .select('id, title, grade, subject, type, file_url')
                    .in('type', ['SYLLABUS', 'NOTES', 'PAST_PAPER'])
                    .order('created_at', { ascending: false })
                    .limit(50);
                setItems((data as LibraryItem[]) || []);
            } catch (e) {
                console.error('Library storefront fetch failed:', e);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const subjects = ['ALL', ...Array.from(new Set(items.map(i => i.subject).filter(Boolean))).filter(s => s.toUpperCase() !== 'ALL')];

    const filtered = items
        .filter(i => (activeTab === 'ALL' || i.type === activeTab) && (activeSubject === 'ALL' || i.subject === activeSubject))
        .slice(0, 9);

    return (
        <section className="py-16 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 transition-colors">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
                        📚 Content Library
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">
                        Official Soma Study Materials, <span className="text-indigo-600 dark:text-indigo-400">All Free.</span>
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
                        Browse verified syllabuses, expert notes, and KCSE/KPSEA past papers — free for every Kenyan learner.
                    </p>
                </div>

                {/* Type Tabs */}
                <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id); setActiveSubject('ALL'); }}
                            className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${
                                activeTab === tab.id
                                    ? tab.active
                                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-indigo-200'
                            }`}
                        >
                            {tab.label}
                            <span className="ml-1.5 text-[10px] opacity-70">
                                ({items.filter(i => tab.id === 'ALL' ? true : i.type === tab.id).length})
                            </span>
                        </button>
                    ))}
                </div>

                {/* Subject Pills */}
                {subjects.length > 2 && (
                    <div className="flex items-center gap-2 pb-4 mb-6 flex-wrap justify-center">
                        {subjects.map(sub => (
                            <button
                                key={sub}
                                onClick={() => setActiveSubject(sub)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                                    activeSubject === sub
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent'
                                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                                }`}
                            >
                                {sub === 'ALL' ? 'All Subjects' : sub}
                            </button>
                        ))}
                    </div>
                )}

                {/* Materials Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="h-44 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-slate-400">
                        <p className="text-5xl mb-4">📭</p>
                        <p className="font-bold text-lg">No materials in this category yet.</p>
                        <p className="text-sm mt-1">Check back soon — we add new content regularly.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((item, idx) => {
                            const cfg = typeConfig[item.type] || typeConfig.NOTES;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                                    className={`flex flex-col justify-between p-5 rounded-2xl border-2 ${cfg.bg} ${cfg.border} hover:shadow-lg hover:-translate-y-0.5 transition-all group`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-2xl">{cfg.icon}</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                                                {cfg.badge}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            {item.grade && (
                                                <span className="text-[9px] font-black uppercase tracking-wider bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-white dark:border-slate-700">
                                                    {item.grade}
                                                </span>
                                            )}
                                            {item.subject && (
                                                <span className="text-[9px] font-black uppercase tracking-wider bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full border border-white dark:border-slate-700">
                                                    {item.subject}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={onGetAccess}
                                        className="mt-4 w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black hover:bg-indigo-600 dark:hover:bg-indigo-50 transition-all active:scale-95 flex items-center justify-center gap-1"
                                    >
                                        Access Free <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* Browse All CTA */}
                <div className="mt-12 text-center">
                    <button
                        onClick={onGetAccess}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30 hover:-translate-y-0.5 transition-all"
                    >
                        Browse Full Library <ChevronRight className="w-5 h-5" />
                    </button>
                    <p className="text-xs text-slate-400 dark:text-slate-600 mt-3 font-medium">
                        {items.length > 0 ? `${items.length}+` : 'Hundreds of'} materials available · Always free · No account required to browse
                    </p>
                </div>

            </div>
        </section>
    );
};
