import React, { useState } from 'react';
import { BookOpen, Upload, Loader2, CheckCircle, Database, Star, FileText } from 'lucide-react';
import { extractTextFromPDF, setContext, getContext, clearContext } from '../../../services/contextService';

export const CurriculumView: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [activeCtx, setActiveCtx] = useState<{ name: string, len: number } | null>(() => {
        const c = getContext();
        return c ? { name: c.name, len: c.content.length } : null;
    });

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        try {
            const text = await extractTextFromPDF(file);
            setContext(file.name, text);
            setActiveCtx({ name: file.name, len: text.length });
            setFile(null);
            alert("Textbook uploaded and processed! AI will now use this context.");
        } catch (e: any) {
            console.error(e);
            alert("Failed to read PDF. Make sure it is text-selectable. Error: " + e.message);
        } finally {
            setUploading(false);
        }
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
                    <p className="text-slate-500">Upload textbooks or syllabus to ground AI answers.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Upload Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" /> Upload Textbook (PDF)
                    </h3>

                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative group">
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="pointer-events-none group-hover:scale-105 transition-transform">
                            <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-600 font-medium">{file ? file.name : "Click to Select PDF"}</p>
                            <p className="text-slate-400 text-xs mt-1">Supports standard text-based PDFs</p>
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={!file || uploading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {uploading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                            {uploading ? "Processing..." : "Set Active Context"}
                        </button>
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
                                <p className="text-slate-400 text-xs uppercase tracking-wider font-bold">Current Source</p>
                                <p className="text-xl font-bold truncate leading-tight mt-1">{activeCtx.name}</p>
                                <div className="flex gap-4 mt-3">
                                    <p className="text-slate-300 text-sm flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md"><FileText className="w-3 h-3" /> {(activeCtx.len / 1000).toFixed(1)}k chars</p>
                                    <p className="text-emerald-400 text-sm flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20"><CheckCircle className="w-3 h-3" /> Active</p>
                                </div>
                            </div>

                            <div className="bg-blue-500/20 p-4 rounded-xl border border-blue-500/30">
                                <p className="text-xs text-blue-200 leading-relaxed">
                                    <Star className="w-3 h-3 inline mr-1 fill-blue-200" />
                                    AI will now prioritize this content when answering Student questions. This ensures answers are compliant with the uploaded material.
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
