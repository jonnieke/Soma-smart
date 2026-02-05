import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, Plus, Trash2, Loader2, Search, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/Shared';

interface Exam {
    id: string;
    title: string;
    subject: string;
    className: string;
    created_at: string;
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

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('activities')
                .select('*')
                .eq('student_id', 'ADMIN')
                .eq('type', 'QUIZ')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mapped = (data || []).map((d: any) => ({
                id: d.id,
                title: d.topic,
                subject: d.subject || d.details?.subject || 'General',
                className: d.class_name || d.details?.className || 'Any',
                created_at: d.created_at
            }));
            setExams(mapped);
        } catch (e) {
            console.error("Failed to fetch exams:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !content) return;

        setSaving(true);
        try {
            // Parse content to ensure valid JSON
            let parsedContent;
            try {
                parsedContent = JSON.parse(content);
            } catch {
                alert("Invalid JSON format for Exam Content. Please check your structure.");
                setSaving(false);
                return;
            }

            const { error } = await supabase.from('activities').insert({
                student_id: 'ADMIN',
                type: 'QUIZ',
                topic: title,
                subject: subject,
                class_name: grade,
                details: {
                    className: grade,
                    subject: subject,
                    content: parsedContent
                }
            });

            if (error) throw error;

            setShowAdd(false);
            setTitle("");
            setContent("");
            fetchExams();
        } catch (e) {
            console.error("Create failed:", e);
            alert("Failed to create exam.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this exam?")) return;

        try {
            const { error } = await supabase.from('activities').delete().eq('id', id);
            if (error) throw error;
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
                    <h2 className="text-2xl font-bold text-slate-800">Exam Management</h2>
                    <p className="text-slate-500 text-sm">Upload and manage official test papers for the platform.</p>
                </div>
                <Button
                    onClick={() => setShowAdd(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> Add Official Exam
                </Button>
            </div>

            {/* Search & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search exams by title or subject..."
                        className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="bg-white px-6 py-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Total Exams</span>
                    <span className="text-2xl font-black text-indigo-600">{exams.length}</span>
                </div>
            </div>

            {/* Exams Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                        <p className="text-slate-400">Loading exam library...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">No exams found.</p>
                        <p className="text-slate-400 text-sm">Try adding a new official exam above.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4 font-bold text-slate-600">Exam Title</th>
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
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(exam.id)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Exam"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
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
                                    <Plus className="w-6 h-6 text-indigo-600" /> Add Official Exam
                                </h3>
                                <p className="text-slate-500 mb-6">Create a new test paper that will appear across all student dashboards.</p>

                                <form onSubmit={handleCreateExam} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-1">Exam Title</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="e.g. KCSE Math Mock 2024"
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
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Level / Grade</label>
                                        <select
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                        >
                                            <option value="KCSE">KCSE (Form 4)</option>
                                            <option value="KPSEA">KPSEA (Grade 6)</option>
                                            <option value="KEPSEA">KEPSEA (Grade 9)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Exam Content (JSON Array of Questions)</label>
                                        <textarea
                                            required
                                            rows={8}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                                            placeholder='[
  { "id": "1", "text": "What is 2+2?", "type": "MCQ", "options": ["3", "4", "5"], "answer": "4" }
]'
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                        ></textarea>
                                        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Ensure the content follows the standard Soma Quiz JSON format.
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                        <button
                                            disabled={saving}
                                            type="button"
                                            onClick={() => setShowAdd(false)}
                                            className="px-6 py-2 rounded-xl text-slate-500 font-bold hover:bg-slate-50"
                                        >
                                            Cancel
                                        </button>
                                        <Button
                                            type="submit"
                                            isLoading={saving}
                                            className="px-8 bg-indigo-600"
                                        >
                                            Publish Exam
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
