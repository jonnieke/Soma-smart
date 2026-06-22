import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Store, Tag, Download, Star, TrendingUp, Filter, Plus, FileText, CheckCircle, 
    Search, Award, BookOpen, ThumbsUp, ShieldCheck, ChevronRight, X, AlertCircle,
    UserCheck, ClipboardList, PenTool
} from 'lucide-react';
import { TeacherProfile, MaterialListing } from '../../types';
import { useApp } from '../../context/AppContext';
import { pesapalService } from '../../services/pesapalService';

interface MarketplaceManagerProps {
    teacherProfile: TeacherProfile | null;
    earnings: number;
    listings?: MaterialListing[]; // Own listings (passed from parent)
    onPublishNew: () => void;
}

export const MarketplaceManager: React.FC<MarketplaceManagerProps> = ({
    teacherProfile,
    earnings,
    listings = [],
    onPublishNew
}) => {
    // --- Context values ---
    const appCtx = useApp() as any;
    const marketplaceMaterials: MaterialListing[] = appCtx.marketplaceMaterials ?? [];
    const purchasedMaterialIds: string[] = appCtx.purchasedMaterialIds ?? [];
    const userId: string | null = appCtx.userId ?? null;
    const submitPeerReview: ((...args: any[]) => Promise<any>) | undefined = appCtx.submitPeerReview;
    const updateMaterialApproval: ((...args: any[]) => Promise<any>) | undefined = appCtx.updateMaterialApproval;

    // --- Local States ---
    const [activeTab, setActiveTab] = useState<'BROWSE' | 'MY_STORE' | 'APPROVALS'>('BROWSE');
    const [browseFilter, setBrowseFilter] = useState<'ALL' | 'NOTES' | 'REVISION_PAPER' | 'MARKING_SCHEME' | 'RECORDED_LESSON'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
    const [selectedGrade, setSelectedGrade] = useState<string>('ALL');

    // Selected material for preview/modal
    const [previewMaterial, setPreviewMaterial] = useState<MaterialListing | null>(null);
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    // Peer Review Form State
    const [reviewerName, setReviewerName] = useState(teacherProfile?.name || '');
    const [reviewComment, setReviewComment] = useState('');
    const [scoreAccuracy, setScoreAccuracy] = useState(5);
    const [scoreReadability, setScoreReadability] = useState(5);
    const [scoreEngagement, setScoreEngagement] = useState(5);
    const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');

    // Filter listings for Browse and My Store
    const ownListings = marketplaceMaterials.filter(m => m.teacherId === teacherProfile?.id);
    const peerListings = marketplaceMaterials.filter(m => m.teacherId !== teacherProfile?.id);

    // Unique subjects and grades in the marketplace for filtering
    const subjects = ['ALL', ...Array.from(new Set(marketplaceMaterials.map(m => m.subject)))];
    const grades = ['ALL', ...Array.from(new Set(marketplaceMaterials.map(m => m.grade)))];

    // Filter Browse Library listings
    const filteredBrowseListings = marketplaceMaterials.filter(m => {
        const matchesCategory = browseFilter === 'ALL' || m.category === browseFilter;
        const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              m.teacherName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = selectedSubject === 'ALL' || m.subject === selectedSubject;
        const matchesGrade = selectedGrade === 'ALL' || m.grade === selectedGrade;
        return matchesCategory && matchesSearch && matchesSubject && matchesGrade;
    });

    // Filter HOD Approvals listings (Pending ones)
    const pendingApprovals = marketplaceMaterials.filter(m => m.approvalStatus === 'PENDING' || !m.approvalStatus);

    // Calculate overall stats
    const totalDownloads = ownListings.reduce((acc, l) => acc + (l.downloadCount || 0), 0);

    // --- Handlers ---
    const handlePurchase = async (id: string, price: number) => {
        if (!userId || !teacherProfile) {
            alert('Please log in to purchase materials.');
            return;
        }
        setPurchasingId(id);
        try {
            const result = await pesapalService.initiateMaterialPayment(
                userId,
                id,
                marketplaceMaterials.find((m: MaterialListing) => m.id === id)?.title || 'Material',
                price,
                {
                    email: teacherProfile.email || '',
                    firstName: (teacherProfile.name || '').split(' ')[0] || 'Teacher',
                    lastName: (teacherProfile.name || '').split(' ').slice(1).join(' ') || 'User',
                    phone: teacherProfile.phone || ''
                }
            );
            if (result?.redirect_url) {
                window.location.href = result.redirect_url;
            } else {
                alert('Could not initiate payment. Please try again.');
            }
        } catch (err: any) {
            alert(err?.message || 'Payment initiation failed. Please try again.');
        } finally {
            setPurchasingId(null);
        }
    };

    const handleDownloadMock = (title: string) => {
        alert(`Mock downloading: ${title}. Your file is downloading to local storage.`);
    };

    const handleAddReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!previewMaterial) return;

        const avgRating = parseFloat(((scoreAccuracy + scoreReadability + scoreEngagement) / 3).toFixed(1));
        const res = await submitPeerReview(
            previewMaterial.id,
            reviewerName || "Anonymous Teacher",
            avgRating,
            scoreAccuracy,
            scoreReadability,
            scoreEngagement,
            reviewComment
        );

        if (res.success) {
            setReviewSuccessMsg("Review submitted successfully! Thank you for supporting peer teachers.");
            setReviewComment('');
            setScoreAccuracy(5);
            setScoreReadability(5);
            setScoreEngagement(5);

            // Update local modal view
            const updated = marketplaceMaterials.find(m => m.id === previewMaterial.id);
            if (updated) {
                setPreviewMaterial(updated);
            }

            setTimeout(() => setReviewSuccessMsg(''), 4000);
        } else {
            alert(res.message);
        }
    };

    const handleHODApproval = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        const action = status === 'APPROVED' ? 'approve' : 'reject';
        if (window.confirm(`Do you want to ${action} this scheme/plan for school use?`)) {
            const reviewer = teacherProfile?.name || "HOD Reviewer";
            const res = await updateMaterialApproval(id, status, reviewer);
            if (res.success) {
                alert(res.message);
            } else {
                alert(res.message);
            }
        }
    };

    return (
        <div className="space-y-8 relative">
            {/* Header & Stats Banner */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden shadow-2xl text-white border border-slate-800">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-indigo-200 text-xs font-black tracking-widest uppercase mb-4 border border-white/5 shadow-inner">
                            <Store className="w-3.5 h-3.5 text-emerald-400" />
                            Collaborative Marketplace & Library
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3">Schemes & Plans Library</h2>
                        <p className="text-slate-300 font-medium max-w-xl text-lg leading-relaxed opacity-95">
                            Browse verified schemes, lesson plans, and teaching guides. Review peer materials or sign off as HOD/Principal.
                        </p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex-1 md:flex-none md:min-w-[160px] flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">My Store Sales</span>
                            <span className="text-3xl font-black text-emerald-400">KES {earnings.toLocaleString()}</span>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-3xl flex-1 md:flex-none md:min-w-[160px] flex flex-col items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">My Downloads</span>
                            <span className="text-3xl font-black text-slate-100 flex items-center gap-2">
                                <Download className="w-6 h-6 text-slate-400" /> {totalDownloads}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Tab Navigation */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
                {[
                    { id: 'BROWSE', label: 'Browse Collaborative Library', icon: BookOpen },
                    { id: 'MY_STORE', label: 'My Storefront', icon: Store },
                    { id: 'APPROVALS', label: `HOD Approvals (${pendingApprovals.length})`, icon: UserCheck }
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`pb-3.5 text-sm tracking-wide font-black uppercase flex items-center gap-2 border-b-3 transition-all ${
                                activeTab === tab.id 
                                    ? 'text-indigo-600 border-indigo-600' 
                                    : 'text-slate-400 border-transparent hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* --- TAB CONTENT: BROWSE COLLABORATIVE LIBRARY --- */}
            {activeTab === 'BROWSE' && (
                <div className="space-y-6">
                    {/* Search and Advanced Filters */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Search bar */}
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search by title, subject, or teacher name..."
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-3.5 pl-12 text-sm font-semibold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-900 transition-all"
                                />
                            </div>

                            {/* Subject Filter */}
                            <div className="w-full md:w-48">
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none appearance-none"
                                >
                                    <option value="ALL">All Subjects</option>
                                    {subjects.filter(s => s !== 'ALL').map(sub => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Grade Filter */}
                            <div className="w-full md:w-48">
                                <select
                                    value={selectedGrade}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-3.5 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none appearance-none"
                                >
                                    <option value="ALL">All Grades</option>
                                    {grades.filter(g => g !== 'ALL').map(grade => (
                                        <option key={grade} value={grade}>{grade}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Category quick selectors */}
                        <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
                            {(['ALL', 'NOTES', 'REVISION_PAPER', 'MARKING_SCHEME', 'RECORDED_LESSON'] as const).map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setBrowseFilter(filter)}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                        browseFilter === filter 
                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 dark:shadow-none' 
                                            : 'bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
                                    }`}
                                >
                                    {filter === 'ALL' ? 'All Resources' : filter.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Browse grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredBrowseListings.length === 0 ? (
                            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">
                                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h4 className="text-lg font-black text-slate-800 dark:text-slate-200">No Materials Found</h4>
                                <p className="text-sm text-slate-400 font-bold uppercase tracking-wider mt-1">Try broadening your search filters</p>
                            </div>
                        ) : (
                            filteredBrowseListings.map(listing => {
                                const isOwn = listing.teacherId === teacherProfile?.id;
                                const isPurchased = purchasedMaterialIds.includes(listing.id);
                                return (
                                    <motion.div
                                        key={listing.id}
                                        whileHover={{ y: -4 }}
                                        onClick={() => setPreviewMaterial(listing)}
                                        className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-950 transition-all flex flex-col justify-between cursor-pointer group"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                                    listing.category === 'NOTES' ? 'bg-blue-50 text-blue-600' :
                                                    listing.category === 'REVISION_PAPER' ? 'bg-teal-50 text-teal-600' :
                                                    'bg-emerald-50 text-emerald-600'
                                                }`}>
                                                    {listing.category.replace('_', ' ')}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    {listing.approvalStatus === 'APPROVED' && (
                                                        <span 
                                                            className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                                            title={`Approved by HOD: ${listing.approvedBy}`}
                                                        >
                                                            <ShieldCheck className="w-3.5 h-3.5" /> Approved
                                                        </span>
                                                    )}
                                                    {listing.rating >= 4.5 && (
                                                        <span 
                                                            className="flex items-center gap-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded"
                                                            title="KICD standards match score"
                                                        >
                                                            <Award className="w-3.5 h-3.5" /> Verified
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="font-black text-lg text-slate-800 dark:text-white mb-2 leading-tight group-hover:indigo-600 transition-colors line-clamp-2">
                                                {listing.title}
                                            </h3>
                                            <p className="text-xs text-slate-400 font-bold mb-3">
                                                By {listing.teacherName} {isOwn && "(You)"}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-5 leading-relaxed">
                                                {listing.description}
                                            </p>

                                            <div className="flex flex-wrap gap-1.5 mb-6">
                                                <span className="text-[9px] font-black text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-100/50 uppercase">{listing.grade}</span>
                                                <span className="text-[9px] font-black text-slate-500 bg-slate-50 dark:bg-slate-950 px-2 py-1 rounded border border-slate-100/50 uppercase">{listing.subject}</span>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                                <p className="font-black text-slate-900 dark:text-white">
                                                    {listing.price === 0 ? 'FREE' : `KES ${listing.price}`}
                                                </p>
                                            </div>
                                            <div>
                                                {isOwn ? (
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">My Resource</span>
                                                ) : isPurchased || listing.price === 0 ? (
                                                    <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                                        <ShieldCheck className="w-4 h-4" /> Unlocked
                                                    </span>
                                                ) : (
                                                    <span className="text-xs font-black text-slate-700 hover:text-indigo-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-0.5">
                                                        Get Now <ChevronRight className="w-4 h-4" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* --- TAB CONTENT: MY STOREFRONT --- */}
            {activeTab === 'MY_STORE' && (
                <div className="space-y-6">
                    {/* Controls & grid */}
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 className="font-black text-xl text-slate-800 dark:text-white px-2">Published Creator Storefront</h3>
                        <button
                            onClick={onPublishNew}
                            className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-transform hover:scale-105"
                        >
                            <Plus className="w-4 h-4" /> Publish New Resource
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div
                            onClick={onPublishNew}
                            className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/20 transition-colors group min-h-[300px]"
                        >
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-950 text-slate-400 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                <Plus className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-black text-slate-700 dark:text-slate-300 group-hover:text-indigo-900">Upload to Store</h3>
                            <p className="text-sm text-slate-500 mt-2">Publish a generated Scheme, Note, or Quiz to start earning.</p>
                        </div>

                        {ownListings.map(listing => (
                            <motion.div
                                key={listing.id}
                                whileHover={{ y: -4 }}
                                onClick={() => setPreviewMaterial(listing)}
                                className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between cursor-pointer group"
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                            listing.category === 'NOTES' ? 'bg-blue-50 text-blue-600' :
                                            listing.category === 'REVISION_PAPER' ? 'bg-teal-50 text-teal-600' :
                                            'bg-emerald-50 text-emerald-600'
                                        }`}>
                                            {listing.category.replace('_', ' ')}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {listing.approvalStatus === 'APPROVED' ? (
                                                <span className="flex items-center gap-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                                                    Approved
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                                                    Pending Approval
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="font-black text-lg text-slate-800 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{listing.title}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">{listing.description}</p>

                                    <div className="flex flex-wrap gap-2 mb-6">
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-md">{listing.grade}</span>
                                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-950 px-2 py-1 rounded-md">{listing.subject}</span>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Price</p>
                                        <p className="font-black text-slate-900 dark:text-white">KES {listing.price}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Downloads</p>
                                        <p className="font-bold text-emerald-600 flex items-center justify-end gap-1">
                                            <TrendingUp className="w-3.5 h-3.5" /> {listing.downloadCount || 0}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- TAB CONTENT: PRINCIPAL/HOD APPROVALS --- */}
            {activeTab === 'APPROVALS' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                            <UserCheck className="w-6 h-6 text-indigo-600" />
                            <div>
                                <h3 className="font-black text-xl text-slate-800 dark:text-white leading-none">Principal & Head of Department approvals</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1.5">Review, sign off on, and track school pedagogical materials.</p>
                            </div>
                        </div>

                        {pendingApprovals.length === 0 ? (
                            <div className="py-12 text-center">
                                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                                <h4 className="text-base font-black text-slate-800 dark:text-white">All Clear!</h4>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">There are no schemes of work or lesson plans awaiting approval.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {pendingApprovals.map(listing => (
                                    <div key={listing.id} className="py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 first:pt-0 last:pb-0">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                                    {listing.category.replace('_', ' ')}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">{listing.grade}</span>
                                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2.5 py-0.5 rounded-full">{listing.subject}</span>
                                            </div>
                                            <h4 className="font-black text-lg text-slate-800 dark:text-white leading-snug line-clamp-1">{listing.title}</h4>
                                            <p className="text-xs text-slate-400 mt-1">Submitted by: {listing.teacherName} on {new Date(listing.createdAt).toLocaleDateString()}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">{listing.description}</p>
                                        </div>

                                        <div className="flex gap-3 shrink-0">
                                            <button
                                                onClick={() => handleHODApproval(listing.id, 'APPROVED')}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all"
                                            >
                                                Sign Off & Approve
                                            </button>
                                            <button
                                                onClick={() => handleHODApproval(listing.id, 'REJECTED')}
                                                className="bg-white hover:bg-red-50 text-red-600 border-2 border-red-100 hover:border-red-200 font-bold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all"
                                            >
                                                Reject / Revise
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* --- DETAILED MATERIAL PREVIEW MODAL --- */}
            <AnimatePresence>
                {previewMaterial && (() => {
                    const isOwn = previewMaterial.teacherId === teacherProfile?.id;
                    const isPurchased = purchasedMaterialIds.includes(previewMaterial.id);
                    const canDownload = isOwn || previewMaterial.price === 0 || isPurchased;

                    // Calculate average criteria scores for display
                    const reviewsList = previewMaterial.reviews || [];
                    const avgAccuracy = reviewsList.length > 0 ? parseFloat((reviewsList.reduce((acc, r) => acc + (r.accuracy || 5), 0) / reviewsList.length).toFixed(1)) : 5;
                    const avgReadability = reviewsList.length > 0 ? parseFloat((reviewsList.reduce((acc, r) => acc + (r.readability || 5), 0) / reviewsList.length).toFixed(1)) : 5;
                    const avgEngagement = reviewsList.length > 0 ? parseFloat((reviewsList.reduce((acc, r) => acc + (r.engagement || 5), 0) / reviewsList.length).toFixed(1)) : 5;

                    return (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-6 overflow-y-auto">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-3xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                {/* Header */}
                                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 md:p-8 text-white relative shrink-0">
                                    <button
                                        onClick={() => {
                                            setPreviewMaterial(null);
                                            setReviewComment('');
                                        }}
                                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors font-bold text-white z-10"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>

                                    <div className="flex gap-2 mb-2.5">
                                        <span className="text-[9px] font-black text-indigo-300 bg-white/10 px-2.5 py-0.5 rounded border border-white/5 uppercase tracking-wider">
                                            {previewMaterial.category.replace('_', ' ')}
                                        </span>
                                        {previewMaterial.approvalStatus === 'APPROVED' && (
                                            <span className="flex items-center gap-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded border border-emerald-500/10">
                                                <ShieldCheck className="w-3.5 h-3.5" /> HOD Signed Off
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="text-xl md:text-2xl font-black leading-tight pr-6">{previewMaterial.title}</h3>
                                    <p className="text-slate-300 text-xs font-bold mt-1.5">
                                        Prepared by: {previewMaterial.teacherName} {isOwn && "(You)"}
                                    </p>
                                </div>

                                {/* Body */}
                                <div className="p-6 md:p-8 space-y-8 overflow-y-auto">
                                    {/* Description */}
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resource Description</h4>
                                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-100/50">
                                            {previewMaterial.description}
                                        </p>
                                    </div>

                                    {/* Metadata & Actions */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                        <div className="flex flex-wrap gap-2.5">
                                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100/50 px-4 py-2 rounded-xl text-xs font-bold">
                                                <span className="text-slate-400 mr-1.5 uppercase tracking-wide">Grade:</span>
                                                <span className="text-slate-800 dark:text-slate-200">{previewMaterial.grade}</span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100/50 px-4 py-2 rounded-xl text-xs font-bold">
                                                <span className="text-slate-400 mr-1.5 uppercase tracking-wide">Subject:</span>
                                                <span className="text-slate-800 dark:text-slate-200">{previewMaterial.subject}</span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100/50 px-4 py-2 rounded-xl text-xs font-bold">
                                                <span className="text-slate-400 mr-1.5 uppercase tracking-wide">Downloads:</span>
                                                <span className="text-slate-800 dark:text-slate-200">{previewMaterial.downloadCount || 0}</span>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            {canDownload ? (
                                                <button
                                                    onClick={() => handleDownloadMock(previewMaterial.title)}
                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest py-4 px-6 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2"
                                                >
                                                    <Download className="w-4.5 h-4.5" /> Download Scheme/Plan
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handlePurchase(previewMaterial.id, previewMaterial.price)}
                                                    disabled={purchasingId === previewMaterial.id}
                                                    className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-black text-xs uppercase tracking-widest py-4 px-6 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition-opacity"
                                                >
                                                    {purchasingId === previewMaterial.id ? 'Opening M-Pesa...' : `Pay KES ${previewMaterial.price} via M-Pesa`}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Criteria ratings */}
                                    <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-100/50">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Peer Criteria Scores</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {[
                                                { label: "Accuracy & CBC Match", score: avgAccuracy },
                                                { label: "Format & Readability", score: avgReadability },
                                                { label: "Engagement Activities", score: avgEngagement }
                                            ].map((crit, cIdx) => (
                                                <div key={cIdx} className="space-y-2">
                                                    <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                                                        <span>{crit.label}</span>
                                                        <span className="text-indigo-600 font-black">{crit.score} / 5</span>
                                                    </div>
                                                    <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full bg-indigo-600 rounded-full" 
                                                            style={{ width: `${(crit.score / 5) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Reviews list */}
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Teacher Peer Reviews ({reviewsList.length})</h4>
                                        {reviewsList.length === 0 ? (
                                            <p className="text-xs text-slate-400 font-bold italic pl-1">No reviews yet. Be the first teacher to leave feedback!</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {reviewsList.map((rev, rIdx) => (
                                                    <div key={rIdx} className="p-4 bg-slate-50/50 dark:bg-slate-950/40 rounded-2xl border border-slate-100/40">
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <span className="text-xs font-black text-slate-700 dark:text-slate-300">{rev.reviewerName}</span>
                                                            <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                                                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {rev.rating}
                                                            </div>
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">"{rev.comment}"</p>
                                                        <span className="text-[9px] text-slate-400 font-bold block mt-1">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Add review form */}
                                    {!isOwn && (
                                        <form onSubmit={handleAddReview} className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Submit Peer Evaluation</h4>
                                            
                                            {reviewSuccessMsg && (
                                                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                                                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                    {reviewSuccessMsg}
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                {[
                                                    { label: "Accuracy (CBC)", value: scoreAccuracy, setValue: setScoreAccuracy },
                                                    { label: "Readability", value: scoreReadability, setValue: setScoreReadability },
                                                    { label: "Engagement", value: scoreEngagement, setValue: setScoreEngagement }
                                                ].map((formCrit, fcIdx) => (
                                                    <div key={fcIdx} className="space-y-1.5">
                                                        <label className="text-[11px] font-bold text-slate-500">{formCrit.label}</label>
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={5}
                                                            value={formCrit.value}
                                                            onChange={(e) => formCrit.setValue(Math.min(5, Math.max(1, parseInt(e.target.value) || 5)))}
                                                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[11px] font-bold text-slate-500">Comments & Suggestions</label>
                                                <textarea
                                                    rows={3}
                                                    value={reviewComment}
                                                    onChange={(e) => setReviewComment(e.target.value)}
                                                    placeholder="Provide details on how you used this, and suggestions..."
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl p-4 text-xs font-medium text-slate-800 placeholder:text-slate-300 outline-none focus:bg-white transition-all resize-none"
                                                    required
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="bg-slate-950 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
                                            >
                                                Submit Review
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
};
