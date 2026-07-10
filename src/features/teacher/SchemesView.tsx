import React from 'react';
import { motion } from 'framer-motion';
import {
    Zap,
    Download,
    Share2,
    ChevronRight,
    FileText,
    Calendar,
    Sparkles,
    ArrowLeft,
    Printer,
    FileSpreadsheet
} from 'lucide-react';
import { Button } from '../../components/Shared';
import { generateSchemeOfWork } from '../../services/geminiService';
import { trackAnalyticsEvent } from '../../services/analyticsEventService';
import { loadTeacherWorkflowDraft, saveTeacherWorkflowDraft } from '../../services/teacherWorkflowService';

interface SchemesViewProps {
    onBack: () => void;
    subject: string;
    grade: string;
    initialTerm?: string;
    initialYear?: string;
    teacherId?: string;
}

export const SchemesView: React.FC<SchemesViewProps> = ({ onBack, subject, grade, initialTerm, initialYear, teacherId }) => {
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [generatedScheme, setGeneratedScheme] = React.useState<any | null>(null);

    const [year, setYear] = React.useState(initialYear || '2026');
    const [term, setTerm] = React.useState(initialTerm || 'Term 1');
    const [error, setError] = React.useState<string | null>(null);
    const draftLoadedRef = React.useRef(false);

    React.useEffect(() => {
        let cancelled = false;
        draftLoadedRef.current = false;

        const loadDraft = async () => {
            if (!teacherId) {
                draftLoadedRef.current = true;
                return;
            }

            const draft = await loadTeacherWorkflowDraft(teacherId, 'SCHEME');
            if (!cancelled && draft?.payload) {
                const payload = draft.payload as Record<string, unknown>;
                if (typeof payload.term === 'string') setTerm(payload.term);
                if (typeof payload.year === 'string') setYear(payload.year);
                if (payload.generatedScheme && typeof payload.generatedScheme === 'object') {
                    setGeneratedScheme(payload.generatedScheme);
                }
            }

            if (!cancelled) {
                draftLoadedRef.current = true;
            }
        };

        void loadDraft();
        return () => {
            cancelled = true;
        };
    }, [teacherId]);

    React.useEffect(() => {
        if (!teacherId || !draftLoadedRef.current) return;
        const timer = window.setTimeout(() => {
            void saveTeacherWorkflowDraft(
                teacherId,
                'SCHEME',
                { grade, subject, term, year, generatedScheme },
                { className: grade, subject },
            );
        }, 250);

        return () => window.clearTimeout(timer);
    }, [generatedScheme, grade, subject, teacherId, term, year]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const result = await generateSchemeOfWork(subject, grade, term, year);
            setGeneratedScheme(result);
            void trackAnalyticsEvent({
                eventType: 'TEACHER_WORKFLOW',
                eventName: 'scheme_generated',
                role: 'TEACHER',
                metadata: { grade, subject, term, year, weeks: Array.isArray(result?.weeks) ? result.weeks.length : undefined },
            });
            if (teacherId) {
                await saveTeacherWorkflowDraft(
                    teacherId,
                    'SCHEME',
                    { grade, subject, term, year, generatedScheme: result },
                    { className: grade, subject },
                );
            }
        } catch (err) {
            console.error(err);
            setError("Failed to generate scheme of work. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const exportToCSV = () => {
        if (!generatedScheme) return;
        const headers = [
            "Week Number",
            "Lesson Number",
            "Strand / Topic",
            "Sub-strand / Sub-topic",
            "Specific Learning Outcomes",
            "Key Inquiry Questions",
            "Core Competences & Values",
            "Learning Experiences",
            "Learning Resources",
            "Assessment Methods"
        ];

        const rows = generatedScheme.weeks.map((w: any, idx: number) => [
            w.week?.toString() || '',
            (w.lesson || idx + 1).toString(),
            w.strand || '',
            w.subStrand || '',
            w.specificLearningOutcomes || w.outcomes || '',
            w.keyInquiryQuestions || '',
            w.coreCompetences || '',
            w.learningExperiences || '',
            w.learningResources || w.resources || '',
            w.assessmentMethods || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row: string[]) => 
                row.map(val => `"${val.replace(/"/g, '""')}"`).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${generatedScheme.title.replace(/\s+/g, '_')}_Scheme_of_Work.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        if (!generatedScheme) return;
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const htmlContent = `
            <html>
            <head>
                <title>${generatedScheme.title}</title>
                <style>
                    @page {
                        size: landscape;
                        margin: 15mm;
                    }
                    body {
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        color: #1e293b;
                        margin: 0;
                        padding: 20px;
                        font-size: 11px;
                        line-height: 1.5;
                    }
                    .header {
                        margin-bottom: 25px;
                        border-bottom: 3px solid #4f46e5;
                        padding-bottom: 15px;
                    }
                    .school-title {
                        font-size: 22px;
                        font-weight: 900;
                        color: #1e1b4b;
                        text-transform: uppercase;
                        margin: 0 0 5px 0;
                        letter-spacing: 0.05em;
                    }
                    .doc-title {
                        font-size: 14px;
                        font-weight: 700;
                        color: #4f46e5;
                        margin: 0 0 15px 0;
                    }
                    .meta-grid {
                        display: flex;
                        gap: 30px;
                        background: #f8fafc;
                        padding: 12px 20px;
                        border-radius: 12px;
                        border: 1px solid #e2e8f0;
                    }
                    .meta-item span {
                        color: #64748b;
                        font-weight: 600;
                        display: block;
                        font-size: 9px;
                        text-transform: uppercase;
                        margin-bottom: 2px;
                    }
                    .meta-item {
                        font-size: 12px;
                        font-weight: 800;
                        color: #0f172a;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 15px;
                    }
                    th, td {
                        border: 1px solid #cbd5e1;
                        padding: 10px;
                        text-align: left;
                        vertical-align: top;
                    }
                    th {
                        background-color: #f1f5f9;
                        color: #1e293b;
                        font-weight: 800;
                        text-transform: uppercase;
                        font-size: 9px;
                        letter-spacing: 0.05em;
                    }
                    .week-col { width: 4%; text-align: center; font-weight: bold; }
                    .lsn-col { width: 4%; text-align: center; }
                    .strand-col { width: 14%; font-weight: bold; }
                    .slo-col { width: 18%; }
                    .kiq-col { width: 10%; font-style: italic; }
                    .cc-col { width: 12%; }
                    .le-col { width: 18%; }
                    .res-col { width: 10%; }
                    .assess-col { width: 10%; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1 class="school-title">SOMO SMART ACADEMY</h1>
                    <h2 class="doc-title">OFFICIAL KICD CBC COMPLIANT SCHEME OF WORK</h2>
                    <div class="meta-grid">
                        <div class="meta-item"><span>Subject</span>${subject}</div>
                        <div class="meta-item"><span>Grade / Class</span>${grade}</div>
                        <div class="meta-item"><span>Term</span>${term}</div>
                        <div class="meta-item"><span>Year</span>${year}</div>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th class="week-col">Wk</th>
                            <th class="lsn-col">Lsn</th>
                            <th class="strand-col">Strand / Sub-strand</th>
                            <th class="slo-col">Specific Learning Outcomes</th>
                            <th class="kiq-col">Key Inquiry Questions</th>
                            <th class="cc-col">Core Competences & Values</th>
                            <th class="le-col">Learning Experiences</th>
                            <th class="res-col">Learning Resources</th>
                            <th class="assess-col">Assessment Methods</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${generatedScheme.weeks.map((w: any, idx: number) => `
                            <tr>
                                <td class="week-col" style="background: #f8fafc; font-weight: 900; color: #4f46e5;">${w.week}</td>
                                <td class="lsn-col" style="font-weight: 700;">${w.lesson || idx + 1}</td>
                                <td class="strand-col">
                                    <div style="color: #0f172a;">${w.strand}</div>
                                    <div style="font-weight: 500; font-size: 9px; color: #64748b; margin-top: 3px;">${w.subStrand}</div>
                                </td>
                                <td class="slo-col" style="font-size: 10px; color: #334155;">${w.specificLearningOutcomes || w.outcomes}</td>
                                <td class="kiq-col" style="font-size: 10px; color: #475569;">${w.keyInquiryQuestions || '-'}</td>
                                <td class="cc-col" style="font-size: 10px; color: #334155;">${w.coreCompetences || '-'}</td>
                                <td class="le-col" style="font-size: 10px; color: #334155;">${w.learningExperiences || '-'}</td>
                                <td class="res-col" style="font-size: 10px; font-weight: 600; color: #4f46e5;">${w.learningResources || w.resources}</td>
                                <td class="assess-col" style="font-size: 10px; color: #334155;">${w.assessmentMethods || '-'}</td>
                            </tr>
                        `).join('\n')}
                    </tbody>
                </table>
                <script>
                    window.onload = function() {
                        window.print();
                    };
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handleShare = () => {
        if (!generatedScheme) return;
        const text = `Habari! I just generated a new KICD CBC compliant Scheme of Work for ${subject} (${grade}) - ${term}, ${year} using Somo Smart! 🚀 Check it out here: https://somaai.co.ke/teacher`;
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="space-y-8">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Lesson Maker
            </button>

            {!generatedScheme ? (
                <div className="bg-white rounded-[2.5rem] p-12 border-2 border-indigo-50 shadow-sm text-center">
                    <div className="w-20 h-20 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100">
                        <Zap className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Smart Schemes of Work Generator</h2>
                    <p className="text-slate-500 font-medium max-w-lg mx-auto mb-10 text-lg">
                        We will generate a full, KICD-compliant scheme of work for **{subject}** ({grade}) based on the latest syllabus.
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-600 font-bold text-slate-700 bg-slate-50"
                        >
                            <option>2026</option>
                            <option>2025</option>
                        </select>
                        <select
                            value={term}
                            onChange={(e) => setTerm(e.target.value)}
                            className="px-6 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-indigo-600 font-bold text-slate-700 bg-slate-50"
                        >
                            <option>Term 1</option>
                            <option>Term 2</option>
                            <option>Term 3</option>
                        </select>
                    </div>

                    {error && (
                        <div className="mt-4 text-rose-500 text-sm font-bold">{error}</div>
                    )}

                    <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="mt-12 px-12 py-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-indigo-200"
                    >
                        {isGenerating ? "Analyzing Syllabus..." : "Generate Full Scheme"}
                    </Button>
                </div>
            ) : (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                >
                    {/* Left: Scheme Preview */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="font-black text-xl text-slate-900">{generatedScheme.title}</h3>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{generatedScheme.term}</p>
                                </div>
                                <div className="flex flex-wrap gap-2 items-center">
                                    <Button 
                                        onClick={exportToCSV}
                                        variant="outline" 
                                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 bg-emerald-50/10 rounded-xl transition-all"
                                        title="Download CSV Spreadsheet"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span>Export CSV</span>
                                    </Button>
                                    <Button 
                                        onClick={handlePrint}
                                        variant="outline" 
                                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 bg-indigo-50/10 rounded-xl transition-all"
                                        title="Print Scheme or Save to PDF"
                                    >
                                        <Printer className="w-4 h-4" />
                                        <span>Print PDF</span>
                                    </Button>
                                    <Button 
                                        onClick={handleShare}
                                        variant="outline" 
                                        className="flex items-center gap-2 px-4 py-2.5 text-xs font-black text-slate-600 hover:text-slate-800 hover:bg-slate-50 rounded-xl border-slate-200 transition-all"
                                        title="Share to WhatsApp"
                                    >
                                        <Share2 className="w-4 h-4" />
                                        <span>Share WhatsApp</span>
                                    </Button>
                                </div>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left text-sm min-w-[1200px]">
                                    <thead className="bg-slate-100">
                                        <tr className="border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider text-[10px]">
                                            <th className="p-4 w-16">Wk</th>
                                            <th className="p-4 w-16">Lsn</th>
                                            <th className="p-4 w-48">Strand / Sub-strand</th>
                                            <th className="p-4 w-64">Specific Learning Outcomes</th>
                                            <th className="p-4 w-48">Key Inquiry Questions</th>
                                            <th className="p-4 w-48">Core Competences & Values</th>
                                            <th className="p-4 w-64">Learning Experiences</th>
                                            <th className="p-4 w-48">Learning Resources</th>
                                            <th className="p-4 w-48">Assessment Methods</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {generatedScheme.weeks.map((w: any, idx: number) => (
                                            <tr key={`${w.week}-${w.lesson || idx}`} className="hover:bg-slate-50/80 transition-colors align-top">
                                                <td className="p-4 font-black text-indigo-600 bg-indigo-50/30 text-center">{w.week}</td>
                                                <td className="p-4 font-bold text-slate-500 text-center">{w.lesson || '-'}</td>
                                                <td className="p-4">
                                                    <p className="font-black text-slate-800">{w.strand}</p>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">{w.subStrand}</p>
                                                </td>
                                                <td className="p-4 text-slate-600 leading-relaxed text-xs">
                                                    {w.specificLearningOutcomes || w.outcomes}
                                                </td>
                                                <td className="p-4 text-slate-600 italic text-xs">
                                                    {w.keyInquiryQuestions || '-'}
                                                </td>
                                                <td className="p-4 text-slate-600 text-xs">
                                                    {w.coreCompetences || '-'}
                                                </td>
                                                <td className="p-4 text-slate-600 leading-relaxed text-xs">
                                                    {w.learningExperiences || '-'}
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                                                        {w.learningResources || w.resources}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-600 text-xs font-medium">
                                                    {w.assessmentMethods || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex items-center justify-between shadow-xl shadow-blue-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-lg">Auto-Generate Daily Lesson Plans?</h4>
                                    <p className="text-white/80 text-sm font-medium">We can pre-build plans for all {generatedScheme.weeks.length * 5} sessions in this term.</p>
                                </div>
                            </div>
                            <Button className="bg-white text-blue-600 border-none font-black text-xs uppercase px-8">Confirm Bundle</Button>
                        </div>
                    </div>

                    {/* Right: Insights/Actions */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] p-8 border-2 border-slate-100 shadow-sm">
                            <h4 className="font-black text-slate-900 mb-6 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                Smart Time Allocation
                            </h4>
                            <div className="space-y-4">
                                {[
                                    { label: "Public Holidays", val: "3 Days", color: "text-amber-500" },
                                    { label: "Mid-Term Break", val: "1 Week", color: "text-blue-500" },
                                    { label: "Revision Cushion", val: "2 Weeks", color: "text-emerald-500" }
                                ].map(stat => (
                                    <div key={stat.label} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                        <span className="text-xs font-bold text-slate-500">{stat.label}</span>
                                        <span className={`text-sm font-black ${stat.color}`}>{stat.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Institutional Sync</p>
                            <h4 className="text-xl font-black mb-4 leading-tight">Sync this scheme with School OS?</h4>
                            <p className="text-slate-400 text-sm mb-8 leading-relaxed">This will allow the Principal and HOD to track your syllabus completion heatmap in real-time.</p>
                            <Button fullWidth className="bg-blue-500 text-white font-black text-xs uppercase py-4">Push to Master Dashboard</Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};
