import React, { useState, useEffect } from 'react';
import { BookOpen, Loader2, CheckCircle, Database, Star, FileText } from 'lucide-react';
import { extractTextFromURL, setContext, getContext, clearContext } from '../../../services/contextService';
import { supabase } from '../../../lib/supabase';

export const CurriculumView: React.FC = () => {
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);

    const [activeCtx, setActiveCtx] = useState<{ name: string, grade?: string, subject?: string } | null>(() => {
        const c = getContext();
        return c ? { name: c.name, grade: c.grade, subject: c.subject } : null;
    });

    useEffect(() => {
        const fetchDocs = async () => {
            const { data, error } = await supabase
                .from('knowledge_base')
                .select('id, title, file_url, subject, grade, type')
                .order('created_at', { ascending: false });
            if (error) console.error("Error fetching docs", error);
            else if (data) setDocuments(data);
            setLoadingDocs(false);
        };
        fetchDocs();
    }, []);

    const handleSetContext = async () => {
        if (!selectedDocId) return;
        const doc = documents.find(d => d.id === selectedDocId);
        if (!doc) return;

        setContext(doc.title, doc.grade, doc.subject);
        setActiveCtx({ name: doc.title, grade: doc.grade, subject: doc.subject });
        setSelectedDocId(null);
        alert(`AI Context set to ${doc.grade} - ${doc.subject}! It will now intelligently search all related notes and syllabuses.`);
    };

    const handleClear = () => {
        clearContext();
        setActiveCtx(null);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Curriculum Context</h2>
                    <p className="text-slate-500">Configure textbooks or syllabus to ground AI answers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Select Document Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" /> Ground AI with Knowledge Base
                    </h3>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 leading-relaxed">Choose an existing syllabus or textbook from your Knowledge Base to force the AI to only answer using this material.</p>

                        {loadingDocs ? (
                            <div className="p-8 text-center text-slate-400 border border-slate-200 border-dashed rounded-xl bg-slate-50">
                                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                                <span className="text-sm font-medium">Loading documents...</span>
                            </div>
                        ) : (
                            <select
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 bg-slate-50 font-medium cursor-pointer"
                                value={selectedDocId || ''}
                                onChange={e => setSelectedDocId(Number(e.target.value))}
                                disabled={uploading}
                            >
                                <option value="" disabled>-- Select a Document --</option>
                                {documents.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                        {doc.title} ({doc.grade} - {doc.subject})
                                    </option>
                                ))}
                            </select>
                        )}

                        <div className="mt-4 flex justify-end pt-2">
                            <button
                                onClick={handleSetContext}
                                disabled={!selectedDocId || uploading}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95 shadow-sm hover:shadow shadow-indigo-200"
                            >
                                {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                {uploading ? "Extracting & Processing..." : "Set As AI Context"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Active Context Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                        <Database className="w-5 h-5 text-emerald-400" /> Active Context
                    </h3>

                    {activeCtx ? (
                        <div className="space-y-4 relative z-10">
                            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                                <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Curriculum Focus</p>
                                <p className="text-xl font-bold truncate leading-tight mt-1">{activeCtx.name}</p>
                                <div className="flex gap-4 mt-3">
                                    <p className="text-slate-300 text-sm flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md">
                                        <BookOpen className="w-3 h-3" /> {activeCtx.grade || 'All'} - {activeCtx.subject || 'All'}
                                    </p>
                                    <p className="text-emerald-400 text-sm flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Active</p>
                                </div>
                            </div>

                            <div className="bg-blue-500/20 p-4 rounded-xl border border-blue-500/30">
                                <p className="text-xs text-blue-200 leading-relaxed">
                                    <Star className="w-3 h-3 inline mr-1 fill-blue-200" />
                                    AI is now operating in <b>Multi-Document RAG Mode</b>. It will actively sweep through ALL documents in your Knowledge Base that match <b>{activeCtx.grade} {activeCtx.subject}</b> to formulate the most accurate answers.
                                </p>
                            </div>

                            <button
                                onClick={handleClear}
                                className="w-full py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-sm font-bold transition-colors border border-red-500/20"
                            >
                                Clear Context
                            </button>
                        </div>
                    ) : (
                        <div className="h-40 flex flex-col items-center justify-center text-slate-500 border-2 border-white/10 rounded-xl border-dashed bg-white/5 relative z-10">
                            <Database className="w-8 h-8 opacity-20 mb-2" />
                            <p>No active context.</p>
                            <p className="text-xs opacity-50">AI is using general knowledge.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
