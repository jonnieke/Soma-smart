import React from 'react';
import { FileText, ArrowRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface TickerPaperItem {
    id: string | number;
    title: string;
    subject: string;
    grade: string;
    exam_body?: string | null;
    duration_minutes?: number | null;
    total_marks?: number | null;
    source?: string | null;
    created_at?: string | null;
    published_at?: string | null;
    homepage_featured?: boolean | null;
}

interface ExamPaperTickerBeltProps {
    papers?: TickerPaperItem[];
    onPaperClick?: (paperId: string | number) => void;
}

export const ExamPaperTickerBelt: React.FC<ExamPaperTickerBeltProps> = ({
    papers,
    onPaperClick,
}) => {
    const navigate = useNavigate();

    // Prepare sorted list: starting with latest published exam paper
    const sortedPapers = React.useMemo(() => {
        const sourceList = Array.isArray(papers) ? papers : [];
        const copy = [...sourceList];
        copy.sort((a, b) => {
            const aFeatured = Boolean(a.homepage_featured);
            const bFeatured = Boolean(b.homepage_featured);
            if (aFeatured !== bFeatured) return aFeatured ? -1 : 1;
            const aTime = Date.parse(String(a.published_at || a.created_at || 0)) || 0;
            const bTime = Date.parse(String(b.published_at || b.created_at || 0)) || 0;
            return bTime - aTime;
        });
        return copy;
    }, [papers]);

    const handleSelect = (paper: TickerPaperItem) => {
        if (onPaperClick) {
            onPaperClick(paper.id);
        } else {
            navigate(`/exam-papers/${encodeURIComponent(String(paper.id))}/read`);
        }
    };

    // Duplicate list for infinite loop animation
    const tickerItems = sortedPapers.length ? [...sortedPapers, ...sortedPapers] : [];

    return (
        <div className="relative w-full border-y border-indigo-900/60 bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white shadow-lg overflow-hidden select-none">
            <div className="mx-auto max-w-[1440px] flex items-center h-12">
                {/* Fixed Ticker Header Badge */}
                <div className="z-20 flex items-center gap-2 shrink-0 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-3.5 py-1.5 h-full font-black text-xs uppercase tracking-wider text-white shadow-md border-r border-indigo-500/40">
                    <FileText className="w-4 h-4 text-amber-300" />
                    <span className="whitespace-nowrap font-black">Paper updates</span>
                </div>

                {/* Ticker Scroll Belt Container */}
                <div className="relative flex-1 overflow-hidden h-full flex items-center">
                    {/* Gradient Fade Edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-purple-950 to-transparent z-10 pointer-events-none" />

                    {tickerItems.length ? <div className="animate-ticker flex items-center gap-3 pl-4">
                        {tickerItems.map((paper, idx) => {
                            const badgeText = paper.exam_body || paper.grade || 'EXAM';
                            return (
                                <button
                                    key={`${paper.id}-${idx}`}
                                    onClick={() => handleSelect(paper)}
                                    className="group flex items-center gap-2.5 rounded-full bg-white/10 hover:bg-indigo-600/90 border border-white/15 hover:border-indigo-400 px-3.5 py-1 text-xs font-semibold text-slate-100 hover:text-white transition-all transform hover:scale-[1.02] shrink-0"
                                >
                                    {/* Paper Badge */}
                                    <span className="inline-flex items-center rounded-full bg-amber-400/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-300 border border-amber-400/30 group-hover:bg-white group-hover:text-indigo-900 group-hover:border-white">
                                        {idx % sortedPapers.length === 0 ? 'LATEST' : badgeText}
                                    </span>

                                    {/* Paper Title */}
                                    <span className="font-bold truncate max-w-[220px] sm:max-w-[320px] text-slate-100 group-hover:text-white">
                                        {paper.title}
                                    </span>

                                    {/* Specs Pill */}
                                    {paper.duration_minutes && (
                                        <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-medium text-slate-300 group-hover:text-indigo-100">
                                            <Clock className="w-3 h-3 text-indigo-300 group-hover:text-white" />
                                            {paper.duration_minutes}m
                                        </span>
                                    )}

                                    {/* Action Arrow */}
                                    <span className="flex items-center text-[10px] font-black text-indigo-300 group-hover:text-white transition-transform group-hover:translate-x-0.5">
                                        <span>Attempt</span>
                                        <ArrowRight className="w-3 h-3 ml-0.5" />
                                    </span>
                                </button>
                            );
                        })}
                    </div> : <span className="px-4 text-xs font-semibold text-slate-200">New papers will appear here when they are published.</span>}
                </div>

                {/* Right Bank Direct Shortcut */}
                <button
                    onClick={() => navigate('/exam-papers')}
                    className="hidden lg:flex items-center gap-1.5 shrink-0 bg-slate-900/90 hover:bg-slate-800 border-l border-indigo-900/60 px-4 h-full text-xs font-extrabold text-indigo-300 hover:text-white transition-colors"
                >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>View Paper Bank{sortedPapers.length ? ` (${sortedPapers.length})` : ''}</span>
                </button>
            </div>
        </div>
    );
};

export default ExamPaperTickerBelt;
