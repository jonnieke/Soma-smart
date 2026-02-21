import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, FileText, Trash2, CheckCircle, Search, Filter, BookOpen, AlertTriangle, Edit2, X, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button, Card } from '../../components/Shared';


interface Document {
    id: number;
    title: string;
    grade: string;
    subject: string;
    type: 'SYLLABUS' | 'PAST_PAPER' | 'NOTES' | 'LESSON_PLAN' | 'ASSIGNMENT' | 'REPORT_BOOK' | 'ASSESSMENT_REPORT' | 'SCHEME_OF_WORK' | 'DEVELOPMENT_MODULE' | 'TRAINING_NOTE';
    created_at: string;
    file_path: string;
    file_url: string;
}

export const AdminKnowledgeBase: React.FC = () => {
    const navigate = useNavigate();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterGrade, setFilterGrade] = useState('All');
    const [filterSubject, setFilterSubject] = useState('All');
    const [showFilters, setShowFilters] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState('');

    // Upload State
    const [file, setFile] = useState<File | null>(null);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [newDocGrade, setNewDocGrade] = useState('Grade 4');
    const [newDocSubject, setNewDocSubject] = useState('');
    const [newDocType, setNewDocType] = useState<Document['type']>('SYLLABUS');
    const [uploadKey, setUploadKey] = useState(0); // To reset file input

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching docs:', error);
        else setDocuments(data || []);
        setLoading(false);
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !newDocTitle) return;

        try {
            setUploading(true);

            // 1. Upload file to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${newDocGrade}/${newDocSubject}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('syllabus-docs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('syllabus-docs')
                .getPublicUrl(filePath);

            // 3. Insert into Database
            const { error: dbError } = await supabase
                .from('knowledge_base')
                .insert([{
                    title: newDocTitle,
                    grade: newDocGrade,
                    subject: newDocSubject,
                    type: newDocType,
                    file_url: publicUrl,
                    file_path: filePath
                }]);

            if (dbError) throw dbError;

            // 4. Trigger Ingestion (Edge Function)
            // We pass the new record so the backend can index it
            const { data: newRecord } = await supabase
                .from('knowledge_base')
                .select('*')
                .eq('file_path', filePath)
                .single();

            if (newRecord) {
                fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ingest-document`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                    },
                    body: JSON.stringify({ record: newRecord })
                }).catch(err => console.error("Ingestion trigger failed:", err));
            }

            // 5. Reset Form & Refresh
            setFile(null);
            setNewDocTitle('');
            setUploadKey(prev => prev + 1);
            fetchDocuments();
            alert('Document Uploaded Successfully!');

        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: number, filePath: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            // Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('syllabus-docs')
                .remove([filePath]);

            if (storageError) console.error('Storage delete error:', storageError);

            // Delete from DB
            const { error: dbError } = await supabase
                .from('knowledge_base')
                .delete()
                .eq('id', id);

            if (dbError) throw dbError;

            setDocuments(documents.filter(doc => doc.id !== id));
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Failed to delete document');
        }
    };

    const handleUpdateTitle = async (id: number) => {
        if (!editTitle.trim()) {
            setEditingId(null);
            return;
        }
        try {
            const { error } = await supabase.from('knowledge_base').update({ title: editTitle }).eq('id', id);
            if (error) throw error;
            setDocuments(documents.map(d => d.id === id ? { ...d, title: editTitle } : d));
            setEditingId(null);
        } catch (error) {
            console.error('Update failed:', error);
            alert('Failed to update title');
        }
    };

    const filteredDocs = documents.filter(doc =>
        (doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || doc.subject.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (filterGrade === 'All' || doc.grade === filterGrade) &&
        (filterSubject === 'All' || doc.subject === filterSubject)
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                            <BookOpen className="w-8 h-8 text-blue-600" />
                            CBE Knowledge Base
                        </h1>
                        <p className="text-slate-500 mt-1">Manage official syllabus, past papers, notes, and teaching resources.</p>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/admin')}>Back to Dashboard</Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* UPLOAD FORM */}
                    <div className="lg:col-span-1">
                        <Card className="p-6 sticky top-8">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Upload className="w-5 h-5 text-indigo-600" /> Upload Material
                            </h2>
                            <form onSubmit={handleFileUpload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="e.g. Grade 4 Math Syllabus Term 1"
                                        value={newDocTitle}
                                        onChange={e => setNewDocTitle(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Grade</label>
                                        <select
                                            className="w-full p-2 border rounded-lg"
                                            value={newDocGrade}
                                            onChange={e => setNewDocGrade(e.target.value)}
                                        >
                                            <option value="All">All Grades</option>
                                            <optgroup label="Primary">
                                                {['PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'].map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Junior Secondary">
                                                {['Grade 7', 'Grade 8', 'Grade 9'].map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="Senior Secondary">
                                                {['Form 1', 'Form 2', 'Form 3', 'Form 4'].map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                        <input
                                            type="text"
                                            required
                                            list="subject-suggestions"
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Subject or 'None'"
                                            value={newDocSubject}
                                            onChange={e => setNewDocSubject(e.target.value)}
                                        />
                                        <datalist id="subject-suggestions">
                                            <option value="All" />
                                            <option value="None" />
                                            <option value="Mathematics" />
                                            <option value="English" />
                                            <option value="Kiswahili" />
                                            <option value="Science" />
                                            <option value="Social Studies" />
                                            <option value="CRE" />
                                            <option value="IRE" />
                                            <option value="HRE" />
                                            <option value="Agriculture" />
                                            <option value="Home Science" />
                                            <option value="Computer Science" />
                                        </datalist>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={newDocType}
                                        onChange={e => setNewDocType(e.target.value as any)}
                                    >
                                        <optgroup label="Learning Materials">
                                            <option value="NOTES">Learning Notes</option>
                                            <option value="SYLLABUS">Official Syllabus</option>
                                            <option value="PAST_PAPER">Past Paper</option>
                                        </optgroup>
                                        <optgroup label="Teaching Resources">
                                            <option value="ASSESSMENT_REPORT">Assessment Report</option>
                                            <option value="ASSIGNMENT">Assignments</option>
                                            <option value="DEVELOPMENT_MODULE">Development Modules</option>
                                            <option value="LESSON_PLAN">Lesson Plans</option>
                                            <option value="REPORT_BOOK">Report Books</option>
                                            <option value="SCHEME_OF_WORK">Schemes of Work</option>
                                            <option value="TRAINING_NOTE">Training Notes</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">File (PDF/Word)</label>
                                    <input
                                        key={uploadKey}
                                        type="file"
                                        required
                                        accept=".pdf,.doc,.docx"
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        onChange={e => setFile(e.target.files?.[0] || null)}
                                    />
                                </div>

                                <Button fullWidth disabled={uploading}>
                                    {uploading ? 'Uploading & Indexing...' : 'Upload Document'}
                                </Button>
                                <p className="text-xs text-slate-400 text-center">
                                    Files are automatically processed for AI retrieval.
                                </p>
                            </form>
                        </Card>
                    </div>

                    {/* DOCUMENT LIST */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* SEARCH BAR & FILTERS */}
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Search documents..."
                                        className="w-full pl-10 p-3 rounded-xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`p-3 rounded-xl shadow-sm border transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                                >
                                    <Filter className="w-5 h-5" />
                                </button>
                            </div>

                            {/* FILTER DROPDOWN UI */}
                            {showFilters && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-wrap gap-4"
                                >
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Grade</label>
                                        <select
                                            value={filterGrade}
                                            onChange={e => setFilterGrade(e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="All">All Grades</option>
                                            <option value="PP1">PP1</option>
                                            <option value="PP2">PP2</option>
                                            <option value="Grade 1">Grade 1</option>
                                            <option value="Grade 2">Grade 2</option>
                                            <option value="Grade 3">Grade 3</option>
                                            <option value="Grade 4">Grade 4</option>
                                            <option value="Grade 5">Grade 5</option>
                                            <option value="Grade 6">Grade 6</option>
                                            <option value="Grade 7">Grade 7</option>
                                            <option value="Grade 8">Grade 8</option>
                                            <option value="Grade 9">Grade 9</option>
                                            <option value="Form 1">Form 1</option>
                                            <option value="Form 2">Form 2</option>
                                            <option value="Form 3">Form 3</option>
                                            <option value="Form 4">Form 4</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Subject</label>
                                        <select
                                            value={filterSubject}
                                            onChange={e => setFilterSubject(e.target.value)}
                                            className="w-full p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="All">All Subjects</option>
                                            <option value="Mathematics">Mathematics</option>
                                            <option value="English">English</option>
                                            <option value="Kiswahili">Kiswahili</option>
                                            <option value="Science">Science</option>
                                            <option value="Social Studies">Social Studies</option>
                                            <option value="CRE">CRE</option>
                                            <option value="IRE">IRE</option>
                                            <option value="HRE">HRE</option>
                                            <option value="Agriculture">Agriculture</option>
                                            <option value="Home Science">Home Science</option>
                                            <option value="Computer Science">Computer Science</option>
                                        </select>
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            onClick={() => { setFilterGrade('All'); setFilterSubject('All'); setSearchTerm(''); }}
                                            className="p-2 text-sm text-slate-500 hover:text-red-500 font-medium transition-colors"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        {/* LIST */}
                        {loading ? (
                            <div className="text-center py-20 text-slate-400">Loading documents...</div>
                        ) : filteredDocs.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
                                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                                <p className="text-slate-500">No documents found.</p>
                                <p className="text-sm text-slate-400">Upload your first syllabus or past paper!</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {filteredDocs.map(doc => (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:border-blue-200 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${['SYLLABUS', 'LESSON_PLAN', 'SCHEME_OF_WORK'].includes(doc.type) ? 'bg-purple-50 text-purple-600' :
                                                ['PAST_PAPER', 'ASSIGNMENT', 'ASSESSMENT_REPORT'].includes(doc.type) ? 'bg-orange-50 text-orange-600' :
                                                    'bg-blue-50 text-blue-600'
                                                }`}>
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div>
                                                {editingId === doc.id ? (
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <input
                                                            type="text"
                                                            className="border border-blue-300 rounded px-2 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            value={editTitle}
                                                            onChange={e => setEditTitle(e.target.value)}
                                                            autoFocus
                                                            onKeyDown={e => {
                                                                if (e.key === 'Enter') handleUpdateTitle(doc.id);
                                                                if (e.key === 'Escape') setEditingId(null);
                                                            }}
                                                        />
                                                        <button onClick={() => handleUpdateTitle(doc.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Check className="w-4 h-4" /></button>
                                                        <button onClick={() => setEditingId(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded"><X className="w-4 h-4" /></button>
                                                    </div>
                                                ) : (
                                                    <h3 className="font-bold text-slate-800">{doc.title}</h3>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">{doc.grade}</span>
                                                    <span>•</span>
                                                    <span>{doc.subject}</span>
                                                    <span>•</span>
                                                    <span>{doc.type.replace('_', ' ')}</span>
                                                    <span>•</span>
                                                    <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {editingId !== doc.id && (
                                                <button
                                                    onClick={() => { setEditingId(doc.id); setEditTitle(doc.title); }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit Title"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                </button>
                                            )}
                                            <a
                                                href={doc.file_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="View"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                            </a>
                                            <button
                                                onClick={() => handleDelete(doc.id, doc.file_path)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};
