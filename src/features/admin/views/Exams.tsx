import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, Plus, Trash2, Loader2, Search, FileText, CheckCircle, AlertCircle, Upload, FileUp, Sparkles, ExternalLink, BadgeInfo } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Shared';
import { ingestPastPaper } from '../../../services/geminiService';
import { ExamAnalysis } from '../../../types';

interface Exam {
    id: string;
    title: string;
    subject: string;
    className: string;
    created_at: string;
    fileUrl?: string | null;
    filePath?: string | null;
    source: 'knowledge_base' | 'legacy_activity';
}

export const ExamsView: React.FC = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Form State
    const [showAdd, setShowAdd] = useState(false);
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("Mathematics");
    const [grade, setGrade] = useState("KCSE");
    const [content, setContent] = useState("");
    const [saving, setSaving] = useState(false);

    // AI Ingestion State
    const [uploading, setUploading] = useState(false);
    const [analyzedData, setAnalyzedData] = useState<ExamAnalysis | null>(null);
    const [file, setFile] = useState<File | null>(null);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const [
                { data: knowledgePapers, error: kbError },
                { data: legacyPapers, error: legacyError }
            ] = await Promise.all([
                supabase
                    .from('knowledge_base')
                    .select('id, title, subject, grade, file_url, file_path, created_at, type')
                    .eq('type', 'PAST_PAPER')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('activities')
                    .select('id, topic, subject, class_name, created_at, details, student_id, type')
                    .eq('student_id', 'ADMIN')
                    .eq('type', 'QUIZ')
                    .order('created_at', { ascending: false })
            ]);

            if (kbError) console.warn('Knowledge base paper fetch failed:', kbError);
            if (legacyError) console.warn('Legacy paper fetch failed:', legacyError);

            const mappedKnowledge = (knowledgePapers || []).map((d: any) => ({
                id: `kb-${d.id}`,
                title: d.title,
                subject: d.subject || 'General',
                className: d.grade || 'Any',
                created_at: d.created_at,
                fileUrl: d.file_url,
                filePath: d.file_path,
                source: 'knowledge_base' as const
            }));

            const mappedLegacy = (legacyPapers || []).map((d: any) => ({
                id: `legacy-${d.id}`,
                title: d.topic,
                subject: d.subject || d.details?.subject || 'General',
                className: d.class_name || d.details?.className || 'Any',
                created_at: d.created_at,
                source: 'legacy_activity' as const
            }));

            const unique = new Map<string, Exam>();
            [...mappedKnowledge, ...mappedLegacy].forEach((paper) => {
                const key = `${paper.title}__${paper.subject}__${paper.className}`.toLowerCase();
                if (!unique.has(key) || new Date(unique.get(key)!.created_at) < new Date(paper.created_at)) {
                    unique.set(key, paper);
                }
            });

            setExams(Array.from(unique.values()).sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)));
        } catch (e) {
            console.error("Failed to fetch exams:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleIngestPaper = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const result = await ingestPastPaper(file);
            setAnalyzedData(result);
            setTitle(file.name.replace(/\.[^/.]+$/, ""));
            setSubject(result.subject || "Mathematics");
            setGrade(result.grade || "KCSE");
            setContent(JSON.stringify(result.questions));
        } catch (e) {
            console.error("Ingestion failed:", e);
            alert("Somo couldn't read this paper. Please ensure it's a clear PDF or Image.");
        } finally {
            setUploading(false);
        }
    };

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalContent = analyzedData ? JSON.stringify(analyzedData.questions, null, 2) : content;
        if (!title || !finalContent || !file) return;

        setSaving(true);
        try {
            const fileExt = file.name.split('.').pop() || 'txt';
            const safeTitle = title.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'past_paper';
            const filePath = `${grade}/${subject}/${Date.now()}_${safeTitle}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('syllabus-docs')
                .upload(filePath, file, { upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('syllabus-docs')
                .getPublicUrl(filePath);

            const { error } = await supabase.from('knowledge_base').insert({
                title,
                grade,
                subject,
                type: 'PAST_PAPER',
                file_url: publicUrl,
                file_path: filePath
            });

            if (error) throw error;

            setShowAdd(false);
            setTitle("");
            setContent("");
            setAnalyzedData(null);
            setFile(null);
            fetchExams();
        } catch (e) {
            console.error("Create failed:", e);
            alert("Failed to create paper.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this exam?")) return;

        try {
            const target = exams.find(exam => exam.id === id);
            if (!target) return;

            if (target.source === 'legacy_activity') {
                const legacyId = id.replace('legacy-', '');
                const { error } = await supabase.from('activities').delete().eq('id', legacyId);
                if (error) throw error;
            } else {
                const kbId = id.replace('kb-', '');
                if (target.filePath) {
                    await supabase.storage.from('syllabus-docs').remove([target.filePath]).catch(() => null);
                }
                const { error } = await supabase.from('knowledge_base').delete().eq('id', kbId);
                if (error) throw error;
            }

            setExams(prev => prev.filter(e => e.id !== id));
        } catch (e) {
            console.error("Delete failed:", e);
        }
    };

    const filtered = exams.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Past Papers Library</h2>
                    <p className="text-slate-500 text-sm">Upload and manage official past papers for the platform.</p>
                </div>
                <Button
                    onClick={() => setShowAdd(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Add Past Paper
                </Button>
            </div>

            {/* Search & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search papers by title or subject..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Total Papers</span>
                    <span className="text-2xl font-black text-indigo-600">{exams.length}</span>
                </div>
            </div>

            {/* Exams Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                        <p className="text-slate-400">Loading paper library...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No papers found.</p>
                        <p className="text-slate-400 text-sm">Try adding a new past paper above.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-600">Paper Title</th>
                                <th className="px-6 py-4 font-bold text-slate-600">Subject</th>
                                <th className="px-6 py-4 font-bold text-slate-600">Level/Grade</th>
                                <th className="px-6 py-4 font-bold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((exam) => (
                                <tr key={exam.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                                                <ClipboardCheck className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{exam.title}</p>
                                                <p className="text-xs text-slate-400">Uploaded on {new Date(exam.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                                            {exam.subject}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                            {exam.className}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 justify-end">
                                            {exam.fileUrl && (
                                                <a
                                                    href={exam.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                    title="Open Paper"
                                                >
                                                    <ExternalLink className="w-5 h-5" />
                                                </a>
                                            )}
                                            <button
                                                onClick={() => handleDelete(exam.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Paper"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Exam Modal */}
            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                                    <Plus className="w-6 h-6 text-indigo-600" /> Add Past Paper
                                </h3>
                                <p className="text-slate-500 mb-6">Upload a PDF or Image of a past paper. Somo will extract the content for you.</p>

                                <div className="space-y-6">
                                    {/* File Upload Section */}
                                    {!analyzedData ? (
                                        <div className="border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:border-indigo-400 transition-colors bg-slate-50/50">
                                            <input
                                                type="file"
                                                id="paper-upload"
                                                className="hidden"
                                                accept=".pdf,image/*"
                                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                            />
                                            <label htmlFor="paper-upload" className="cursor-pointer block">
                                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <Upload className="w-8 h-8 text-indigo-500" />
                                                </div>
                                                <p className="font-bold text-slate-800 text-lg mb-1">
                                                    {file ? file.name : "Choose Paper File"}
                                                </p>
                                                    <p className="text-slate-500 text-sm mb-6">PDF or Images (JPG, PNG) supported</p>
                                                    {file && (
                                                        <p className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                                            <BadgeInfo className="w-4 h-4" />
                                                            New papers will be stored in Knowledge Base, not activities.
                                                        </p>
                                                    )}
                                                </label>

                                            {file && (
                                                <Button
                                                    onClick={handleIngestPaper}
                                                    isLoading={uploading}
                                                    className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 flex items-center gap-2 mx-auto"
                                                >
                                                    <Sparkles className="w-5 h-5" /> Analyze with Somo
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                            <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                    <span className="text-green-800 font-bold">Paper Analyzed Successfully</span>
                                                </div>
                                                <button
                                                    onClick={() => { setAnalyzedData(null); setFile(null); }}
                                                    className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase"
                                                >
                                                    Reset
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Paper Title</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                                        value={title}
                                                        onChange={(e) => setTitle(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-slate-700 mb-1">Subject</label>
                                                    <select
                                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                                        value={subject}
                                                        onChange={(e) => setSubject(e.target.value)}
                                                    >
                                                        <option>Mathematics</option>
                                                        <option>English</option>
                                                        <option>Kiswahili</option>
                                                        <option>Biology</option>
                                                        <option>Chemistry</option>
                                                        <option>Physics</option>
                                                        <option>CRE</option>
                                                        <option>Indigenous Language</option>
                                                        <option>French</option>
                                                        <option>German</option>
                                                        <option>Arabic</option>
                                                        <option>Integrated Science</option>
                                                        <option>Music</option>
                                                        <option>Business Studies</option>
                                                        <option>Physical Education (PE)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                                                <div className="px-4 py-2 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center">
                                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Extracted Questions</span>
                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                        {analyzedData.questions.length} Items
                                                    </span>
                                                </div>
                                                <div className="max-h-48 overflow-y-auto p-2 space-y-2">
                                                    {analyzedData.questions.map((q, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-xl border border-slate-100 text-sm">
                                                            <div className="flex justify-between mb-1">
                                                                <span className="font-bold text-slate-700">Q{q.number}</span>
                                                                <span className="text-xs text-indigo-500 font-medium">{q.topic}</span>
                                                            </div>
                                                            <p className="text-slate-500 line-clamp-1">{q.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}

                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            disabled={saving || uploading}
                                            type="button"
                                            onClick={() => setShowAdd(false)}
                                            className="px-6 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <Button
                                            onClick={handleCreateExam}
                                            disabled={!analyzedData}
                                            isLoading={saving}
                                            className="px-8 bg-indigo-600"
                                        >
                                            Publish Paper Library
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
