import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Tag, Download, Star, TrendingUp, Filter, Plus, FileText, CheckCircle } from 'lucide-react';
import { TeacherProfile, MaterialListing } from '../../types';

interface MarketplaceManagerProps {
    teacherProfile: TeacherProfile | null;
    earnings: number;
    listings?: MaterialListing[];
    onPublishNew: () => void;
}

export const MarketplaceManager: React.FC<MarketplaceManagerProps> = ({ teacherProfile, earnings, listings = [], onPublishNew }) => {
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'NOTES' | 'REVISION_PAPER' | 'MARKING_SCHEME' | 'RECORDED_LESSON'>('ALL');

    const totalDownloads = listings.reduce((acc, l) => acc + l.downloadCount, 0);

    return (
        <div className="space-y-8">
            {/* Header & Stats */}
            <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                    <div className="inline-flex items-center gap-2 bg-emerald-50 border-2 border-emerald-100 px-3 py-1 rounded-full text-emerald-700 text-xs font-black tracking-widest uppercase mb-4">
                        <Store className="w-3.5 h-3.5" />
                        Creator Storefront
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-slate-800">My Marketplace</h2>
                    <p className="text-slate-500 font-medium max-w-lg">Manage your published study guides, exams, and Darasa notes. Earn directly when learners purchase your premium resources.</p>
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-3xl flex-1 md:flex-none md:min-w-[160px] flex flex-col items-center">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Sales</span>
                        <span className="text-3xl font-black text-emerald-600">KES {earnings.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-50 border-2 border-slate-200 p-6 rounded-3xl flex-1 md:flex-none md:min-w-[160px] flex flex-col items-center">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Downloads</span>
                        <span className="text-3xl font-black text-slate-800 flex items-center gap-2"><Download className="w-6 h-6 text-slate-400" /> {totalDownloads}</span>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    {(['ALL', 'NOTES', 'REVISION_PAPER', 'RECORDED_LESSON'] as const).map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${activeFilter === filter ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}
                        >
                            {filter.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <button
                    onClick={onPublishNew}
                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-105"
                >
                    <Plus className="w-4 h-4" /> Publish New Resource
                </button>
            </div>

            {/* Published Listings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                    onClick={onPublishNew}
                    className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors group min-h-[300px]"
                >
                    <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                        <Plus className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-slate-700 group-hover:text-emerald-900">Upload to Store</h3>
                    <p className="text-sm text-slate-500 mt-2">Publish a generated Note or Quiz to start earning.</p>
                </div>

                {listings.filter(l => activeFilter === 'ALL' || l.category === activeFilter).map(listing => (
                    <motion.div
                        key={listing.id}
                        whileHover={{ y: -5 }}
                        className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                    >
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${listing.category === 'NOTES' ? 'bg-blue-50 text-blue-600' :
                                        listing.category === 'REVISION_PAPER' ? 'bg-teal-50 text-teal-600' :
                                            'bg-emerald-50 text-emerald-600'
                                    }`}>
                                    {listing.category.replace('_', ' ')}
                                </div>
                                <div className="flex items-center gap-1 font-bold text-sm text-slate-700">
                                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> {listing.rating}
                                </div>
                            </div>
                            <h3 className="font-black text-lg text-slate-800 mb-2 leading-tight group-hover:text-emerald-600 transition-colors">{listing.title}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2 mb-4">{listing.description}</p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{listing.grade}</span>
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{listing.subject}</span>
                            </div>
                        </div>

                        <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                <p className="font-black text-slate-900">KES {listing.price}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Sales</p>
                                <p className="font-bold text-emerald-600 flex items-center justify-end gap-1">
                                    <TrendingUp className="w-3 h-3" /> {listing.downloadCount}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
