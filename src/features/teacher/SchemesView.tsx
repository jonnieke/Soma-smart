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
    ArrowLeft
} from 'lucide-react';
import { Button } from '../../components/Shared';
import { generateSchemeOfWork } from '../../services/geminiService';

interface SchemesViewProps {
    onBack: () => void;
    subject: string;
    grade: string;
}

export const SchemesView: React.FC<SchemesViewProps> = ({ onBack, subject, grade }) => {
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [generatedScheme, setGeneratedScheme] = React.useState<any | null>(null);

    const [year, setYear] = React.useState('2026');
    const [term, setTerm] = React.useState('Term 1');

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            const result = await generateSchemeOfWork(subject, grade, term, year);
            setGeneratedScheme(result);
        } catch (err) {
            console.error(err);
            setError("Failed to generate scheme of work. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const [error, setError] = React.useState<string | null>(null);

    return (
        <div className="space-y-8">
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-500 font-bold hover:text-indigo-600 transition-colors group"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Back to Creation Hub
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
                                <div className="flex gap-2">
                                    <Button variant="outline" className="p-3"><Download className="w-5 h-5" /></Button>
                                    <Button variant="outline" className="p-3"><Share2 className="w-5 h-5" /></Button>
                                </div>
                            </div>
                            <div className="p-8 overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 italic text-slate-400 font-black uppercase tracking-wider text-[10px]">
                                            <th className="pb-4 pr-4 w-16">Week</th>
                                            <th className="pb-4 pr-4">Strand/Topic</th>
                                            <th className="pb-4">Suggested outcomes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {generatedScheme.weeks.map((w: any) => (
                                            <tr key={w.week} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-6 font-black text-indigo-600 text-lg">#{w.week}</td>
                                                <td className="py-6 pr-6">
                                                    <p className="font-black text-slate-800">{w.strand}</p>
                                                    <p className="text-xs text-slate-500 font-medium mt-1">{w.subStrand}</p>
                                                </td>
                                                <td className="py-6">
                                                    <p className="text-slate-600 leading-relaxed italic">"{w.outcomes}"</p>
                                                    <div className="flex items-center gap-2 mt-4">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resources:</span>
                                                        <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{w.resources}</span>
                                                    </div>
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
