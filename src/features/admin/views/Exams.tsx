import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    BadgeInfo, CheckCircle, ClipboardCheck, ExternalLink,
    FileCheck2, FileText, Loader2, Plus, Search, Sparkles, Trash2, Upload
} from 'lucide-react';
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
    markingSchemeUrl?: string | null;
    markingSchemePath?: string | null;
    examType?: string | null;
    examYear?: number | null;
    paperNumber?: string | null;
    reviewStatus: 'DRAFT' | 'PUBLISHED';
    questionCount: number;
}

const SUBJECTS = [
    'Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics',
    'Integrated Science', 'Science', 'Social Studies', 'History', 'Geography',
    'CRE', 'IRE', 'Agriculture', 'Business Studies', 'Computer Studies',
    'Home Science', 'Music', 'Art & Design', 'Physical Education (PE)',
    'French', 'German', 'Arabic', 'Indigenous Language'
];

const currentYear = new Date().getFullYear();

export const ExamsView: React.FC = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [paperFile, setPaperFile] = useState<File | null>(null);
    const [markingSchemeFile, setMarkingSchemeFile] = useState<File | null>(null);
    const [analyzedData, setAnalyzedData] = useState<ExamAnalysis | null>(null);

    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('Mathematics');
    const [grade, setGrade] = useState('Form 4');
    const [examType, setExamType] = useState<'KCSE' | 'KPSEA' | 'KJSEA' | 'OTHER'>('KCSE');
    const [examYear, setExamYear] = useState(String(currentYear));
    const [paperCode, setPaperCode] = useState('');
    const [paperNumber, setPaperNumber] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('');
    const [totalMarks, setTotalMarks] = useState('');
    const [publishImmediately, setPublishImmediately] = useState(true);

    useEffect(() => {
        fetchExams();
    }, []);

    const resetForm = () => {
        setPaperFile(null);
        setMarkingSchemeFile(null);
        setAnalyzedData(null);
        setTitle('');
        setSubject('Mathematics');
        setGrade('Form 4');
        setExamType('KCSE');
        setExamYear(String(currentYear));
        setPaperCode('');
        setPaperNumber('');
        setDurationMinutes('');
        setTotalMarks('');
        setPublishImmediately(true);
    };

    const closeModal = () => {
        if (uploading || saving) return;
        setShowAdd(false);
        resetForm();
    };

    const fetchExams = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('knowledge_base')
                .select('id, title, subject, grade, file_url, file_path, marking_scheme_url, marking_scheme_path, exam_type, exam_year, paper_number, review_status, structured_questions, created_at')
                .eq('type', 'PAST_PAPER')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setExams((data || []).map((row: any) => ({
                id: String(row.id),
                title: row.title,
                subject: row.subject || 'General',
                className: row.grade || 'Any',
                created_at: row.created_at,
                fileUrl: row.file_url,
                filePath: row.file_path,
                markingSchemeUrl: row.marking_scheme_url,
                markingSchemePath: row.marking_scheme_path,
                examType: row.exam_type,
                examYear: row.exam_year,
                paperNumber: row.paper_number,
                reviewStatus: row.review_status === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
                questionCount: Array.isArray(row.structured_questions) ? row.structured_questions.length : 0
            })));
        } catch (error) {
            console.error('Failed to fetch exams:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        if (!paperFile || uploading) return;
        setUploading(true);
        try {
            const result = await ingestPastPaper(paperFile, markingSchemeFile);
            setAnalyzedData(result);
            setTitle(paperFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' '));
            setSubject(result.subject || 'Mathematics');
            setGrade(result.grade || (result.examType === 'KPSEA' ? 'Grade 6' : 'Form 4'));
            setExamType(result.examType || 'OTHER');
            setExamYear(result.year ? String(result.year) : String(currentYear));
            setPaperCode(result.paperCode || '');
            setPaperNumber(result.paperNumber || '');
            setDurationMinutes(result.durationMinutes ? String(result.durationMinutes) : '');
            setTotalMarks(result.totalMarks ? String(result.totalMarks) : '');
        } catch (error) {
            console.error('Ingestion failed:', error);
            const message = error instanceof Error ? error.message : 'Unknown extraction error';
            alert('Somo could not structure this paper. ' + message);
        } finally {
            setUploading(false);
        }
    };

    const handleCreateExam = async () => {
        if (!paperFile || !analyzedData || !title.trim() || saving) return;
        setSaving(true);
        const uploadedPaths: string[] = [];

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No active admin session. Please log in again.');

            const safeTitle = title.replace(/[^a-z0-9-_]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80) || 'past_paper';
            const folder = [examType, examYear || 'unknown-year', subject].map(value =>
                String(value).replace(/[^a-z0-9-_]+/gi, '_')
            ).join('/');
            const stamp = Date.now();
            const paperExt = paperFile.name.split('.').pop() || 'pdf';
            const paperPath = folder + '/' + stamp + '_' + safeTitle + '.' + paperExt;

            const { error: paperUploadError } = await supabase.storage
                .from('syllabus-docs')
                .upload(paperPath, paperFile, { upsert: false });
            if (paperUploadError) throw paperUploadError;
            uploadedPaths.push(paperPath);

            const { data: { publicUrl: paperUrl } } = supabase.storage
                .from('syllabus-docs')
                .getPublicUrl(paperPath);

            let schemePath: string | null = null;
            let schemeUrl: string | null = null;
            if (markingSchemeFile) {
                const schemeExt = markingSchemeFile.name.split('.').pop() || 'pdf';
                schemePath = folder + '/' + stamp + '_' + safeTitle + '_marking_scheme.' + schemeExt;
                const { error: schemeUploadError } = await supabase.storage
                    .from('syllabus-docs')
                    .upload(schemePath, markingSchemeFile, { upsert: false });
                if (schemeUploadError) throw schemeUploadError;
                uploadedPaths.push(schemePath);
                schemeUrl = supabase.storage.from('syllabus-docs').getPublicUrl(schemePath).data.publicUrl;
            }

            const resolvedYear = Number(examYear);
            const resolvedDuration = Number(durationMinutes);
            const resolvedMarks = Number(totalMarks);

            const { data: insertedPaper, error: insertError } = await supabase
                .from('knowledge_base')
                .insert({
                    title: title.trim(),
                    grade: grade.trim(),
                    subject: subject.trim(),
                    type: 'PAST_PAPER',
                    file_url: paperUrl,
                    file_path: paperPath,
                    marking_scheme_url: schemeUrl,
                    marking_scheme_path: schemePath,
                    exam_type: examType,
                    exam_year: Number.isFinite(resolvedYear) ? resolvedYear : null,
                    paper_code: paperCode.trim() || null,
                    paper_number: paperNumber.trim() || null,
                    duration_minutes: Number.isFinite(resolvedDuration) && resolvedDuration > 0 ? resolvedDuration : null,
                    total_marks: Number.isFinite(resolvedMarks) && resolvedMarks >= 0 ? resolvedMarks : null,
                    structured_questions: analyzedData.questions,
                    exam_instructions: analyzedData.instructions || [],
                    marking_scheme_source: markingSchemeFile ? 'OFFICIAL' : 'AI_DRAFT',
                    review_status: publishImmediately ? 'PUBLISHED' : 'DRAFT',
                    source: 'SOMA',
                    is_official: Boolean(markingSchemeFile),
                    indexing_status: 'PENDING'
                })
                .select('*')
                .single();

            if (insertError) throw insertError;

            if (insertedPaper) {
                fetch(import.meta.env.VITE_SUPABASE_URL + '/functions/v1/ingest-document', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + session.access_token
                    },
                    body: JSON.stringify({ record: insertedPaper })
                }).catch(error => console.error('Past paper indexing trigger failed:', error));
            }

            setShowAdd(false);
            resetForm();
            await fetchExams();
            alert(publishImmediately
                ? 'Paper and marking scheme published successfully.'
                : 'Exam package saved as a draft.');
        } catch (error) {
            if (uploadedPaths.length > 0) {
                await supabase.storage.from('syllabus-docs').remove(uploadedPaths).catch(() => null);
            }
            console.error('Create exam failed:', error);
            const message = error instanceof Error ? error.message : 'Unknown upload error';
            alert('Failed to save exam package. ' + message);
        } finally {
            setSaving(false);
        }
    };

    const publishDraft = async (exam: Exam) => {
        const { error } = await supabase
            .from('knowledge_base')
            .update({ review_status: 'PUBLISHED' })
            .eq('id', exam.id);
        if (error) {
            alert('Could not publish this paper: ' + error.message);
            return;
        }
        setExams(current => current.map(item =>
            item.id === exam.id ? { ...item, reviewStatus: 'PUBLISHED' } : item
        ));
    };

    const handleDelete = async (exam: Exam) => {
        if (!confirm('Delete this paper, its marking scheme, and its structured questions?')) return;

        try {
            const paths = [exam.filePath, exam.markingSchemePath].filter(Boolean) as string[];
            if (paths.length > 0) {
                await supabase.storage.from('syllabus-docs').remove(paths);
            }
            const { error } = await supabase.from('knowledge_base').delete().eq('id', exam.id);
            if (error) throw error;
            setExams(current => current.filter(item => item.id !== exam.id));
        } catch (error) {
            console.error('Delete failed:', error);
            alert('Could not delete this exam package.');
        }
    };

    const filtered = exams.filter(exam => {
        const query = searchTerm.toLowerCase();
        return exam.title.toLowerCase().includes(query)
            || exam.subject.toLowerCase().includes(query)
            || String(exam.examYear || '').includes(query);
    });

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Candidate Exam Library</h2>
                    <p className="text-sm text-slate-500">Pair question papers with marking schemes and publish structured revision exams.</p>
                </div>
                <Button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700">
                    <Plus className="h-5 w-5" /> Add Exam Package
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                        placeholder="Search title, subject, or year..."
                        className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-6 py-3">
                    <span className="font-medium text-slate-500">Exam packages</span>
                    <span className="text-2xl font-black text-indigo-600">{exams.length}</span>
                </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {loading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-indigo-500" />
                        <p className="text-slate-400">Loading exam library...</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center">
                        <FileText className="mx-auto mb-4 h-12 w-12 text-slate-200" />
                        <p className="font-medium text-slate-500">No exam packages found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {filtered.map(exam => (
                            <div key={exam.id} className="flex flex-col gap-4 p-5 hover:bg-slate-50 md:flex-row md:items-center">
                                <div className="flex min-w-0 flex-1 items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                        <ClipboardCheck className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-slate-800">{exam.title}</p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            {[exam.examType, exam.examYear, exam.subject, exam.paperNumber && 'Paper ' + exam.paperNumber].filter(Boolean).join(' · ')}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                                                {exam.questionCount} questions
                                            </span>
                                            <span className={exam.markingSchemeUrl
                                                ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700'
                                                : 'rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700'}>
                                                {exam.markingSchemeUrl ? 'Official scheme paired' : 'AI draft marking'}
                                            </span>
                                            <span className={exam.reviewStatus === 'PUBLISHED'
                                                ? 'rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700'
                                                : 'rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600'}>
                                                {exam.reviewStatus}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2">
                                    {exam.reviewStatus === 'DRAFT' && (
                                        <button onClick={() => publishDraft(exam)} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100">
                                            Publish
                                        </button>
                                    )}
                                    {exam.fileUrl && (
                                        <a href={exam.fileUrl} target="_blank" rel="noreferrer" title="Open question paper" className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600">
                                            <ExternalLink className="h-5 w-5" />
                                        </a>
                                    )}
                                    {exam.markingSchemeUrl && (
                                        <a href={exam.markingSchemeUrl} target="_blank" rel="noreferrer" title="Open marking scheme" className="rounded-lg p-2 text-emerald-600 hover:bg-emerald-50">
                                            <FileCheck2 className="h-5 w-5" />
                                        </a>
                                    )}
                                    <button onClick={() => handleDelete(exam)} title="Delete exam package" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500">
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm" onClick={closeModal}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: 20 }}
                            onClick={event => event.stopPropagation()}
                            className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
                        >
                            <div className="p-6 sm:p-8">
                                <h3 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                                    <Plus className="h-6 w-6 text-indigo-600" /> Add Exam Package
                                </h3>
                                <p className="mt-2 text-sm text-slate-500">Upload the question paper and its matching marking scheme. Somo will pair every marking point to its question.</p>

                                {!analyzedData ? (
                                    <div className="mt-6 space-y-5">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <FilePicker
                                                id="question-paper-upload"
                                                label="Question paper"
                                                required
                                                file={paperFile}
                                                onChange={setPaperFile}
                                            />
                                            <FilePicker
                                                id="marking-scheme-upload"
                                                label="Marking scheme"
                                                file={markingSchemeFile}
                                                onChange={setMarkingSchemeFile}
                                            />
                                        </div>
                                        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                                            <div className="flex items-start gap-2">
                                                <BadgeInfo className="mt-0.5 h-5 w-5 shrink-0" />
                                                <p>An official marking scheme gives the strongest feedback. Without one, Somo creates an AI draft that remains clearly labelled.</p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleAnalyze}
                                            disabled={!paperFile}
                                            isLoading={uploading}
                                            className="mx-auto flex items-center gap-2 bg-indigo-600 text-white"
                                        >
                                            <Sparkles className="h-5 w-5" /> Analyze and pair documents
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="mt-6 space-y-5">
                                        <div className="flex flex-col gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="h-5 w-5 text-emerald-600" />
                                                <div>
                                                    <p className="font-bold text-emerald-900">Exam structured successfully</p>
                                                    <p className="text-xs text-emerald-700">{analyzedData.questions.length} questions · {analyzedData.markingSchemeSource === 'OFFICIAL' ? 'official marking scheme paired' : 'AI draft marking guide'}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setAnalyzedData(null)} className="text-xs font-bold uppercase text-emerald-700">Change files</button>
                                        </div>

                                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                            <Field label="Paper title" value={title} onChange={setTitle} className="lg:col-span-2" />
                                            <SelectField label="Exam" value={examType} onChange={value => setExamType(value as typeof examType)} options={['KCSE', 'KPSEA', 'KJSEA', 'OTHER']} />
                                            <Field label="Year" value={examYear} onChange={setExamYear} type="number" />
                                            <SelectField label="Subject" value={subject} onChange={setSubject} options={SUBJECTS} />
                                            <Field label="Grade / level" value={grade} onChange={setGrade} />
                                            <Field label="Paper code" value={paperCode} onChange={setPaperCode} placeholder="e.g. 121/1" />
                                            <Field label="Paper number" value={paperNumber} onChange={setPaperNumber} placeholder="e.g. 1" />
                                            <Field label="Duration (minutes)" value={durationMinutes} onChange={setDurationMinutes} type="number" />
                                            <Field label="Total marks" value={totalMarks} onChange={setTotalMarks} type="number" />
                                        </div>

                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100/70 px-4 py-3">
                                                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Question and marking preview</span>
                                                <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-bold text-indigo-600">{analyzedData.questions.length} items</span>
                                            </div>
                                            <div className="max-h-72 space-y-2 overflow-y-auto p-3">
                                                {analyzedData.questions.map((question, index) => (
                                                    <div key={question.id || index} className="rounded-xl border border-slate-200 bg-white p-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-800">Q{question.number} · {question.marks || 0} marks</p>
                                                                <p className="mt-1 text-sm text-slate-600">{question.text}</p>
                                                            </div>
                                                            <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600">{question.topic}</span>
                                                        </div>
                                                        <p className="mt-2 text-xs font-semibold text-emerald-700">
                                                            {(question.markingScheme || []).length} marking point{(question.markingScheme || []).length === 1 ? '' : 's'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 p-4">
                                            <input
                                                type="checkbox"
                                                checked={publishImmediately}
                                                onChange={event => setPublishImmediately(event.target.checked)}
                                                className="mt-1 h-4 w-4"
                                            />
                                            <span>
                                                <span className="block text-sm font-bold text-slate-800">Publish to learners after saving</span>
                                                <span className="block text-xs text-slate-500">Turn this off to keep the package as a private admin draft.</span>
                                            </span>
                                        </label>
                                    </div>
                                )}

                                <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                                    <button disabled={saving || uploading} onClick={closeModal} className="rounded-xl px-5 py-2 font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                                    {analyzedData && (
                                        <Button onClick={handleCreateExam} isLoading={saving} className="bg-indigo-600 px-7 text-white">
                                            {publishImmediately ? 'Save and publish' : 'Save draft'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

const FilePicker: React.FC<{
    id: string;
    label: string;
    required?: boolean;
    file: File | null;
    onChange: (file: File | null) => void;
}> = ({ id, label, required, file, onChange }) => (
    <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center hover:border-indigo-300">
        <input id={id} type="file" className="hidden" accept=".pdf,image/*" onChange={event => onChange(event.target.files?.[0] || null)} />
        <label htmlFor={id} className="cursor-pointer">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-white text-indigo-500 shadow-sm">
                {file ? <FileCheck2 className="h-6 w-6" /> : <Upload className="h-6 w-6" />}
            </div>
            <p className="font-bold text-slate-800">{label}{required ? ' *' : ' (optional)'}</p>
            <p className="mt-1 truncate text-sm text-slate-500">{file ? file.name : 'Choose PDF, JPG, or PNG'}</p>
        </label>
    </div>
);

const Field: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    placeholder?: string;
    className?: string;
}> = ({ label, value, onChange, type = 'text', placeholder, className = '' }) => (
    <label className={className}>
        <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
        <input
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={event => onChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
        />
    </label>
);

const SelectField: React.FC<{
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
}> = ({ label, value, onChange, options }) => (
    <label>
        <span className="mb-1 block text-sm font-bold text-slate-700">{label}</span>
        <select
            value={value}
            onChange={event => onChange(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
        >
            {options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
    </label>
);