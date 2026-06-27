import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ScanLine, Upload, CheckCircle2, AlertCircle, FileText, ArrowLeft, Loader2, Sparkles, X, Plus } from 'lucide-react';
import { gradeStudentSubmission, fileToGenerativePart } from '../../services/geminiService';
import { updateStudentMasteryFromTeacher } from '../../services/learnerMemoryService';
import { classroomService, ClassMember, GradebookEntry, AssignmentPost } from '../../services/classroomService';
import { useApp } from '../../context/AppContext';
import { AIFeedbackButtons } from '../../components/AIFeedbackButtons';

export const MarkingManager: React.FC = () => {
    const { isOnline } = useApp();
    const [view, setView] = useState<'OVERVIEW' | 'GRADE'>('OVERVIEW');

    // Grading State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Context State
    const { teacherProfile } = useApp();
    const [students, setStudents] = useState<ClassMember[]>([]);
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [recentAssignments, setRecentAssignments] = useState<AssignmentPost[]>([]);
    const [recentGradebook, setRecentGradebook] = useState<GradebookEntry[]>([]);
    const [assignmentTitle, setAssignmentTitle] = useState("Math Quiz: Decimals");
    const [assignmentContext, setAssignmentContext] = useState("Grade 5 Mathematics - Topic: Operations on Decimals");
    const [totalMarks, setTotalMarks] = useState<number>(10);
    const [rubric, setRubric] = useState("1. Correct addition formulation (2 marks)\n2. Correct carry-overs (3 marks)\n3. Correct decimal placement (2 marks)\n4. Final answer correct (3 marks)");

    const [result, setResult] = useState<{ 
        extractedText: string;
        totalScore: number;
        marksBreakdown: Array<{ criterion: string; awarded: number; possible: number; rationale: string; }>;
        cbcCompetencies: string[];
        remedialAdvice: string;
        identifiedTopic: string;
    } | null>(null);
    const [memoryUpdateSuccess, setMemoryUpdateSuccess] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadTeacherMarkingData = React.useCallback(async () => {
        if (!teacherProfile) return;
        try {
            const classes = await classroomService.getClassesForTeacher(teacherProfile.id);
            let allMembers: ClassMember[] = [];
            let allGradebook: GradebookEntry[] = [];
            for (const c of classes) {
                const roster = await classroomService.getClassRoster(c.id);
                allMembers = [...allMembers, ...roster];
                const gradebook = await classroomService.getGradebook(c.id);
                allGradebook = [...allGradebook, ...gradebook];
            }

            const uniqueStudents = Array.from(new Map(allMembers.map(item => [item.student_id, item])).values());
            setStudents(uniqueStudents);
            if (uniqueStudents.length > 0 && !selectedStudentId) {
                setSelectedStudentId(uniqueStudents[0].student_id);
            }

            setRecentGradebook(
                allGradebook
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .slice(0, 20)
            );

            const assignments = await classroomService.getTeacherAssignments(teacherProfile.id);
            setRecentAssignments(assignments.slice(0, 20));
        } catch (err) {
            console.error("Failed to load students for grading", err);
        }
    }, [teacherProfile, selectedStudentId]);

    React.useEffect(() => {
        loadTeacherMarkingData();
    }, [loadTeacherMarkingData]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setResult(null);
        setError(null);
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setResult(null);
        setMemoryUpdateSuccess(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const runAutoGrader = async () => {
        if (!selectedFile || !isOnline || !selectedStudentId) return;

        setIsProcessing(true);
        setError(null);

        try {
            const base64Data = await fileToGenerativePart(selectedFile);
            const gradingResult = await gradeStudentSubmission(
                base64Data,
                selectedFile.type,
                assignmentTitle,
                assignmentContext,
                totalMarks,
                rubric
            );
            
            setResult(gradingResult);

            const selectedStudent = students.find(s => s.student_id === selectedStudentId);
            if (selectedStudent?.class_id && selectedStudentId) {
                await classroomService.createGradebookEntry({
                    classId: selectedStudent.class_id,
                    studentId: selectedStudentId,
                    title: assignmentTitle,
                    score: gradingResult.totalScore,
                    maxScore: totalMarks
                });
            }

            // Sync to Learner Memory!
            if (selectedStudentId && gradingResult.identifiedTopic) {
                const { success } = await updateStudentMasteryFromTeacher(
                    selectedStudentId,
                    gradingResult.identifiedTopic,
                    gradingResult.totalScore,
                    totalMarks
                );
                setMemoryUpdateSuccess(success);
            }
            await loadTeacherMarkingData();
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to auto-grade submission.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (view === 'GRADE') {
        return (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto pb-24 space-y-6">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => setView('OVERVIEW')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-6 h-6 text-slate-500" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Auto-Grader Canvas</h2>
                        <p className="text-slate-500 font-medium text-sm">Upload a student&apos;s handwritten paper to grade it instantly.</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Left: Input & Image */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100">
                            <h3 className="font-black text-slate-900 mb-4 uppercase tracking-wider text-xs">Assignment Context</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Student</label>
                                    <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-900 outline-none">
                                        <option value="" disabled>Select a student...</option>
                                        {students.map(s => (
                                            <option key={s.student_id} value={s.student_id}>{s.profiles?.name || s.student_id}</option>
                                        ))}
                                    </select>
                                    {students.length === 0 && (
                                        <p className="mt-2 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                                            No learners found yet. Ask learners to join your class first from Classroom.
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Title</label>
                                    <input type="text" value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-bold text-slate-900" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Context / Subject</label>
                                        <input type="text" value={assignmentContext} onChange={e => setAssignmentContext(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-medium text-slate-900" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Total Marks</label>
                                        <input type="number" value={totalMarks} onChange={e => setTotalMarks(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-black text-indigo-600 text-center" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block">Rubric / Answer Key</label>
                                    <textarea value={rubric} onChange={e => setRubric(e.target.value)} rows={4} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 font-medium text-slate-900 resize-none" placeholder="Enter expected answers, steps, and points..." />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border-2 border-slate-100 min-h-[300px] flex flex-col">
                            <h3 className="font-black text-slate-900 mb-4 uppercase tracking-wider text-xs">Student Submission</h3>

                            {!previewUrl ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-colors cursor-pointer group"
                                >
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <Upload className="w-8 h-8 text-indigo-400" />
                                    </div>
                                    <p className="font-black text-slate-700">Upload Answer Sheet Photo</p>
                                    <p className="text-xs font-bold justify-center text-slate-400 mt-1 uppercase tracking-widest">Images or Scans</p>
                                </div>
                            ) : (
                                <div className="flex-1 relative rounded-2xl overflow-hidden border-2 border-slate-100 flex items-center justify-center bg-slate-100">
                                    <img src={previewUrl} alt="Submission Preview" className="max-h-[400px] w-auto object-contain" />
                                    <button
                                        onClick={handleClearFile}
                                        className="absolute top-4 right-4 bg-white/80 p-2 rounded-full text-slate-700 hover:text-red-600 hover:bg-white backdrop-blur-sm transition-all shadow-sm"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                        </div>
                    </div>

                    {/* Right: Results Panel */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border-2 border-slate-100 flex flex-col relative overflow-hidden">
                        {isProcessing && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                                <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mb-4" />
                                <h3 className="font-black text-slate-900 tracking-tight text-lg">Marking Submission...</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 text-center max-w-xs">Connecting to Super Teacher OS Vision Model</p>
                            </div>
                        )}

                        {!result && !isProcessing && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mb-6">
                                    <Sparkles className="w-12 h-12" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2">Ready to Grade</h3>
                                <p className="text-slate-500 font-medium max-w-sm mb-8">Upload a paper and configure the rubric to generate instant, accurate feedback.</p>

                                <button
                                    onClick={runAutoGrader}
                                    disabled={!selectedFile || !isOnline || !selectedStudentId}
                                    className={`px-8 py-4 rounded-xl font-black text-sm transition-all shadow-lg flex items-center gap-2 ${selectedFile && isOnline && selectedStudentId ? 'bg-emerald-600 text-white shadow-emerald-200 hover:bg-emerald-700 hover:scale-105' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                                >
                                    <ScanLine className="w-5 h-5" /> Run Auto-Grader
                                </button>
                                {!selectedStudentId && (
                                    <p className="mt-3 text-[11px] font-bold text-amber-700">
                                        Select a learner to enable grading and save results.
                                    </p>
                                )}
                            </div>
                        )}

                        {error && !isProcessing && (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-red-600">
                                <AlertCircle className="w-12 h-12 mb-4" />
                                <p className="font-bold">{error}</p>
                            </div>
                        )}

                        {result && !isProcessing && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center border border-emerald-200">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 tracking-tight text-xl">Grading Complete</h3>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Smart Verified</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-4xl font-black text-slate-900">{result.totalScore}<span className="text-lg text-slate-400">/{totalMarks}</span></p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Final Score</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
                                    {/* Memory Sync Success Banner */}
                                    {memoryUpdateSuccess && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                                            <Sparkles className="w-6 h-6 text-emerald-500 shrink-0" />
                                            <div>
                                                <h4 className="font-black text-emerald-900 text-sm">Learner Memory Updated</h4>
                                                <p className="text-xs font-medium text-emerald-700">The student&apos;s mastery of <strong>{result.identifiedTopic}</strong> was synced to the cloud.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Extracted Text Details */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                        <h4 className="font-black text-slate-700 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                                            <FileText className="w-3 h-3" /> Transcribed Output
                                        </h4>
                                        <p className="text-sm font-medium text-slate-800 leading-relaxed italic border-l-4 border-indigo-200 pl-3">&quot;{result.extractedText}&quot;</p>
                                    </div>

                                    {/* CBC Competencies */}
                                    {result.cbcCompetencies && result.cbcCompetencies.length > 0 && (
                                        <div>
                                            <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-3">Demonstrated Competencies</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {result.cbcCompetencies.map((comp, idx) => (
                                                    <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1 rounded-full">
                                                        {comp}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Mark Breakdown */}
                                    <div>
                                        <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-3">KNEC Mark Breakdown</h4>
                                        <div className="space-y-3">
                                            {result.marksBreakdown.map((mb, i) => (
                                                <div key={i} className="bg-white border-2 border-slate-100 rounded-xl p-4 shadow-sm flex gap-4">
                                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-lg bg-emerald-50 text-emerald-700">
                                                        {mb.awarded}<span className="text-xs text-emerald-400">/{mb.possible}</span>
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-slate-900 text-sm">{mb.criterion}</h5>
                                                        <p className="text-slate-600 text-xs leading-relaxed mt-1">{mb.rationale}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Remedial Advice */}
                                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
                                        <h4 className="font-black text-amber-800 uppercase tracking-wider text-[10px] mb-2 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" /> Teacher Action Plan
                                        </h4>
                                        <p className="text-sm font-medium text-amber-900 leading-relaxed">{result.remedialAdvice}</p>
                                    </div>
                                </div>

                                {/* AI Feedback Buttons — teacher corrections build the KNEC training dataset */}
                                <AIFeedbackButtons
                                    aiResponse={result.remedialAdvice}
                                    originalPrompt={`Assignment: ${assignmentTitle} | Context: ${assignmentContext}`}
                                    source="MARKING"
                                    subject={assignmentContext}
                                    grade={assignmentContext}
                                    className="mb-4 mt-6"
                                />

                                <div className="pt-4 flex gap-4">
                                    <button onClick={handleClearFile} className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors">Grade Next Paper</button>
                                    <button onClick={() => setView('OVERVIEW')} className="flex-1 py-3 px-4 rounded-xl bg-slate-900 text-white font-bold transition-all hover:bg-slate-800 shadow-xl shadow-slate-200">Save & Close</button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-24">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-[3rem] p-8 md:p-12 text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black mb-2 tracking-tight">Assignment Marking</h2>
                        <p className="opacity-90 font-medium max-w-sm">Grade handwritten tests automatically using our CBE-aligned Smart Vision.</p>
                    </div>
                    <button
                        onClick={() => setView('GRADE')}
                        className="bg-white text-emerald-700 px-8 py-4 rounded-2xl font-black shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center gap-2 border-2 border-transparent"
                    >
                        <ScanLine className="w-5 h-5" /> Auto-Grade New Paper
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Active Assignments */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-xl text-slate-900 tracking-tight">Active Assignments</h3>
                        <button className="text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                            <Plus className="w-4 h-4" /> New Assignment
                        </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                        {recentAssignments.length === 0 && (
                            <div className="sm:col-span-2 bg-white rounded-[2rem] p-6 border-2 border-dashed border-slate-200 text-center">
                                <p className="font-black text-slate-700">No assignment posts yet</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Create an assignment in Classroom to track it here.</p>
                            </div>
                        )}
                        {recentAssignments.map(assignment => (
                            <div key={assignment.id} className="bg-white rounded-[2rem] p-6 border-2 border-slate-100 shadow-sm hover:border-emerald-100 transition-colors group cursor-pointer">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg">
                                        A
                                    </div>
                                    <span className="bg-slate-50 text-slate-500 font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded">
                                        {assignment.class_name}
                                    </span>
                                </div>
                                <h4 className="font-black text-slate-900 text-lg tracking-tight mb-1 group-hover:text-emerald-600 transition-colors">{assignment.title}</h4>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(assignment.created_at).toLocaleDateString()}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Submissions Sidebar */}
                <div className="space-y-6">
                    <h3 className="font-black text-xl text-slate-900 tracking-tight">Recently Graded</h3>
                    <div className="bg-white rounded-[2rem] p-6 border-2 border-slate-100 shadow-sm space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {recentGradebook.length === 0 && (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center py-8">No graded submissions yet</p>
                        )}
                        {recentGradebook.map(sub => {
                            const percentage = sub.max_score > 0 ? Math.round((sub.score / sub.max_score) * 100) : 0;
                            const isGood = percentage >= 70;
                            const student = students.find(s => s.student_id === sub.student_id);

                            return (
                                <div key={sub.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black ${isGood ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {percentage}%
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-sm">{student?.profiles?.name || sub.student_id}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[150px]">{sub.title}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
