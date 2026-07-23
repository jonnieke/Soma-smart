import React from 'react';
import { Flame, FileText, ArrowRight, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
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

const FALLBACK_LATEST_PAPERS: TickerPaperItem[] = [
    {
        id: 'kcse-math-2026-p1',
        title: '2026 KCSE Mathematics Paper 1 National Mock',
        subject: 'Mathematics',
        grade: 'Form 4',
        exam_body: 'KCSE',
        duration_minutes: 120,
        total_marks: 100,
        source: 'SomaAI Original',
        homepage_featured: true,
    },
    {
        id: 'kpsea-science-g6',
        title: 'KPSEA Grade 6 Science & Technology National Assessment',
        subject: 'Integrated Science',
        grade: 'Grade 6',
        exam_body: 'KPSEA',
        duration_minutes: 90,
        total_marks: 50,
        source: 'KNEC Model',
    },
    {
        id: 'kjsea-grade9-science',
        title: 'CBC Grade 9 KJSEA Integrated Science Model Exam',
        subject: 'Integrated Science',
        grade: 'Grade 9',
        exam_body: 'KJSEA',
        duration_minutes: 90,
        total_marks: 80,
        source: 'CBC JSS',
    },
    {
        id: 'kcse-chem-p3-2026',
        title: 'KCSE Chemistry Paper 3 Practical & Marking Scheme',
        subject: 'Chemistry',
        grade: 'Form 4',
        exam_body: 'KCSE',
        duration_minutes: 135,
        total_marks: 40,
        source: 'SomaAI Original',
    },
    {
        id: 'kpsea-kiswahili-g6',
        title: 'KPSEA Grade 6 Kiswahili Inshaa na Lugha Paper',
        subject: 'Kiswahili',
        grade: 'Grade 6',
        exam_body: 'KPSEA',
        duration_minutes: 75,
        total_marks: 50,
    },
    {
        id: 'kcse-physics-p2',
        title: 'SomaAI Original KCSE Physics Paper 2 Trial',
        subject: 'Physics',
        grade: 'Form 4',
        exam_body: 'KCSE',
        duration_minutes: 120,
        total_marks: 80,
    },
    {
        id: 'cbc-agriculture-g8',
        title: 'CBC Grade 8 Agriculture & Nutrition Assessment',
        subject: 'Agriculture',
        grade: 'Grade 8',
        exam_body: 'CBC',
        duration_minutes: 90,
        total_marks: 60,
    },
    {
        id: 'kcse-english-p2',
        title: 'KCSE English Paper 2 Comprehension & Literary Essays',
        subject: 'English',
        grade: 'Form 4',
        exam_body: 'KCSE',
        duration_minutes: 150,
        total_marks: 80,
    },
];

export const ExamPaperTickerBelt: React.FC<ExamPaperTickerBeltProps> = ({
    papers,
    onPaperClick,
}) => {
    const navigate = useNavigate();

    // Prepare sorted list: starting with latest published exam paper
    const sortedPapers = React.useMemo(() => {
        const sourceList = Array.isArray(papers) && papers.length > 0 ? papers : FALLBACK_LATEST_PAPERS;
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
            navigate(`/exam-papers?paper=${encodeURIComponent(String(paper.id))}`);
        }
    };

    // Duplicate list for infinite loop animation
    const tickerItems = [...sortedPapers, ...sortedPapers];

    return (
        <div className="relative w-full border-y border-indigo-900/60 bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 text-white shadow-lg overflow-hidden select-none">
            <div className="mx-auto max-w-[1440px] flex items-center h-12">
                {/* Fixed Ticker Header Badge */}
                <div className="z-20 flex items-center gap-2 shrink-0 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 px-3.5 py-1.5 h-full font-black text-xs uppercase tracking-wider text-white shadow-md border-r border-indigo-500/40">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
                    </span>
                    <Flame className="w-4 h-4 text-amber-300 fill-amber-300 hidden sm:inline-block" />
                    <span className="whitespace-nowrap font-black">Latest Papers</span>
                </div>

                {/* Ticker Scroll Belt Container */}
                <div className="relative flex-1 overflow-hidden h-full flex items-center">
                    {/* Gradient Fade Edges */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-purple-950 to-transparent z-10 pointer-events-none" />

                    <div className="animate-ticker flex items-center gap-3 pl-4">
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
                    </div>
                </div>

                {/* Right Bank Direct Shortcut */}
                <button
                    onClick={() => navigate('/exam-papers')}
                    className="hidden lg:flex items-center gap-1.5 shrink-0 bg-slate-900/90 hover:bg-slate-800 border-l border-indigo-900/60 px-4 h-full text-xs font-extrabold text-indigo-300 hover:text-white transition-colors"
                >
                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                    <span>View All ({sortedPapers.length}+)</span>
                </button>
            </div>
        </div>
    );
};

export default ExamPaperTickerBelt;
