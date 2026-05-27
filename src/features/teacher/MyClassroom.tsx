import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingDown, TrendingUp, AlertCircle, Sparkles, Plus, Share2, ClipboardList, Send, FileText, CheckCircle, MessageCircle, UploadCloud, Megaphone, Table, Brain, Smartphone } from 'lucide-react';
import { TeacherProfile } from '../../types';
import { classroomService, ClassroomPost, ClassMember, GradebookEntry } from '../../services/classroomService';
import { getBulkMasteryMemories } from '../../services/learnerMemoryService';
import { warnIfDev } from '../../utils/logger';
import { BulkBillingModal } from './BulkBillingModal';

interface MyClassroomProps {
    teacherProfile: TeacherProfile | null;
    selectedClass: string;
    selectedSubject: string;
    onAssignQuiz: (studentIds: string[], topic: string) => void;
    onWorkflowStepCompleted?: (step: 'PUBLISH_STREAM', message: string, metadata?: Record<string, unknown>) => void;
}

export const MyClassroom: React.FC<MyClassroomProps> = ({ teacherProfile, selectedClass, selectedSubject, onAssignQuiz, onWorkflowStepCompleted }) => {
    const [view, setView] = useState<'STREAM' | 'GRADEBOOK' | 'ROSTER'>('STREAM');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);
    const [postText, setPostText] = useState("");
    const [isPosting, setIsPosting] = useState(false);
    const [classroomNotice, setClassroomNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Phase 2 additions
    const [gradingMode, setGradingMode] = useState<'PERCENT' | 'CBC'>('PERCENT');
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);

    const getCBCDescriptor = (score: number) => {
        if (score >= 80) return { code: 'EE', label: 'Exceeding Expectation', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
        if (score >= 60) return { code: 'ME', label: 'Meeting Expectation', color: 'bg-blue-100 text-blue-800 border-blue-200' };
        if (score >= 40) return { code: 'AE', label: 'Approaching Expectation', color: 'bg-amber-100 text-amber-800 border-amber-200' };
        return { code: 'BE', label: 'Below Expectation', color: 'bg-rose-100 text-rose-800 border-rose-200' };
    };

    // Backend State
    const [stream, setStream] = useState<ClassroomPost[]>([]);
    const [students, setStudents] = useState<ClassMember[]>([]);
    const [gradebook, setGradebook] = useState<GradebookEntry[]>([]);
    const [currentClassId, setCurrentClassId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [masteryData, setMasteryData] = useState<any[]>([]);
    const baseJoinUrl = 'https://somaai.co.ke/join';
    const isLocalClass = Boolean(currentClassId?.startsWith('local-class:'));
    const classJoinUrl = currentClassId && !isLocalClass ? `${baseJoinUrl}/${currentClassId}` : `${baseJoinUrl}?class=${encodeURIComponent(selectedClass)}`;
    const classroomShareUrl = currentClassId && !isLocalClass ? `https://somaai.co.ke/class/${currentClassId}` : classJoinUrl;

    const showClassroomNotice = (type: 'success' | 'error' | 'info', text: string) => {
        setClassroomNotice({ type, text });
        window.setTimeout(() => {
            setClassroomNotice((prev) => (prev?.text === text ? null : prev));
        }, 5000);
    };

    // Load Data
    useEffect(() => {
        async function loadClassroom() {
            if (!teacherProfile) return;
            const normalizedClass = String(selectedClass || '').trim();
            const looksLikePlaceholder =
                !normalizedClass ||
                normalizedClass.toLowerCase() === 'selected department' ||
                normalizedClass.toLowerCase() === 'department' ||
                normalizedClass.toLowerCase() === 'classe';
            if (looksLikePlaceholder) {
                setCurrentClassId(null);
                setStream([]);
                setStudents([]);
                setGradebook([]);
                setMasteryData([]);
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            try {
                const activeClass = await classroomService.getOrCreateClassByName(
                    teacherProfile.id,
                    normalizedClass,
                    selectedSubject
                );
                setCurrentClassId(activeClass.id);

                const [streamData, rosterData, gradebookData] = await Promise.all([
                    classroomService.getClassStream(activeClass.id),
                    classroomService.getClassRoster(activeClass.id),
                    classroomService.getGradebook(activeClass.id)
                ]);

                // Fetch actual cognitive mastery for all students
                const studentIds = rosterData.map(s => s.student_id);
                const memoryData = await getBulkMasteryMemories(studentIds);

                setStream(streamData);
                setStudents(rosterData);
                setGradebook(gradebookData);
                setMasteryData(memoryData);
            } catch (err) {
                warnIfDev("Classroom load degraded to fallback mode:", err);
                setCurrentClassId(null);
                setStream([]);
                setStudents([]);
                setGradebook([]);
                setMasteryData([]);
            } finally {
                setIsLoading(false);
            }
        }
        loadClassroom();
    }, [teacherProfile, selectedClass, selectedSubject]);

    useEffect(() => {
        setClassroomNotice(null);
    }, [selectedClass, selectedSubject]);

    // Derive UI state
    const decoratedStudents = students.map(s => {
        const studentGrades = gradebook.filter(g => g.student_id === s.student_id);
        const gradeScore = studentGrades.length > 0
            ? Math.round(studentGrades.reduce((acc, g) => acc + (g.score / g.max_score) * 100, 0) / studentGrades.length)
            : 0;

        const memory = masteryData.find(m => m.learner_id === s.student_id);
        
        let averageScore = gradeScore;
        let weakTopics = ['Algebra', 'Geometry']; // fallback

        if (memory && memory.mastery_graph) {
            const topics = Object.values(memory.mastery_graph) as number[];
            if (topics.length > 0) {
                // If they have SM-2 mastery data, use that as their true cognitive score
                averageScore = Math.round(topics.reduce((a, b) => a + b, 0) / topics.length);
            }
            if (memory.weak_topics && memory.weak_topics.length > 0) {
                weakTopics = memory.weak_topics.slice(0, 3);
            }
        }

        return {
            id: s.student_id,
            name: s.profiles?.name || 'Unknown Student',
            avatar: s.profiles?.name?.charAt(0).toUpperCase() || 'S',
            averageScore,
            trend: averageScore > 50 ? 'UP' : 'DOWN',
            weakTopics,
            pendingAssignments: 0,
            lastActive: memory?.last_synced_at ? new Date(memory.last_synced_at).toLocaleDateString() : 'Recently'
        };
    });

    const classAverage = decoratedStudents.length > 0
        ? Math.round(decoratedStudents.reduce((acc, s) => acc + s.averageScore, 0) / decoratedStudents.length)
        : 0;

    const atRiskStudents = decoratedStudents.filter(s => s.averageScore < 50);

    // Calculate most common weak topic across the class for the Smart Insight
    const topicCounts = decoratedStudents.flatMap(s => s.weakTopics).reduce((acc, topic) => {
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const mostCommonWeakTopic = Object.keys(topicCounts).length > 0 
        ? Object.entries(topicCounts).sort((a, b) => b[1] - a[1])[0][0] 
        : 'Algebra';
    const studentsNeedingHelp = topicCounts[mostCommonWeakTopic] || 0;

    const toggleStudent = (id: string) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkAssign = async () => {
        if (selectedStudents.length === 0 || !currentClassId || !teacherProfile) return;
        setIsAssigning(true);
        try {
            const newAssignment = await classroomService.createPost(currentClassId, teacherProfile.id, 'ASSIGNMENT', "Targeted Remedial Revision assigned via Darasa Mode.");
            setStream([newAssignment, ...stream]);
            
            onAssignQuiz(selectedStudents, "Targeted Remedial Revision");
            setSelectedStudents([]);
            showClassroomNotice('success', `Assigned targeted revision to ${selectedStudents.length} learner${selectedStudents.length === 1 ? '' : 's'}.`);
            onWorkflowStepCompleted?.(
                'PUBLISH_STREAM',
                'Step 3 complete: Assessment assigned from Classroom.',
                { source: 'classroom_bulk_assign', class_name: selectedClass, subject: selectedSubject, students: selectedStudents.length }
            );
        } catch (err) {
            console.error(err);
            showClassroomNotice('error', "Assignment failed. Try again once class sync is stable.");
        } finally {
            setIsAssigning(false);
        }
    };

    const resolveClassIdForPosting = async (): Promise<string | null> => {
        if (!teacherProfile) return null;
        if (currentClassId) return currentClassId;

        const fallbackClass = String(selectedClass || teacherProfile.classes?.[0] || '').trim();
        const fallbackSubject = String(selectedSubject || teacherProfile.subjects?.[0] || '').trim();
        const normalizedClass = fallbackClass.toLowerCase();
        const normalizedSubject = fallbackSubject.toLowerCase();
        const hasPlaceholder =
            normalizedClass === 'selected department' ||
            normalizedClass === 'department' ||
            normalizedClass === 'classe' ||
            normalizedSubject === 'selected department' ||
            normalizedSubject === 'department' ||
            normalizedSubject === 'subject';
        if (!fallbackClass || !fallbackSubject || hasPlaceholder) return null;

        const cls = await classroomService.getOrCreateClassByName(teacherProfile.id, fallbackClass, fallbackSubject);
        setCurrentClassId(cls.id);
        return cls.id;
    };

    const openWhatsAppShare = (message: string, shareWindow?: Window | null) => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        if (shareWindow && !shareWindow.closed) {
            shareWindow.location.replace(url);
            return;
        }
        const popup = window.open(url, '_blank', 'noopener,noreferrer');
        if (!popup) {
            window.location.href = url;
        }
    };

    const handlePostAndShare = async () => {
        if (!postText.trim()) return;
        if (!teacherProfile) {
            showClassroomNotice('error', "Teacher profile is still loading. Please retry in a few seconds.");
            return;
        }

        // Reserve a tab during the click so browsers allow the WhatsApp handoff after the async post.
        const shareWindow = window.open('about:blank', '_blank');
        if (shareWindow) {
            shareWindow.document.title = 'Opening WhatsApp...';
            shareWindow.document.body.innerHTML = '<p style="font-family: system-ui, sans-serif; padding: 24px;">Opening WhatsApp...</p>';
        }
        setIsPosting(true);
        const textToShare = postText.trim();

        try {
            const classId = await resolveClassIdForPosting();
            if (!classId) {
                if (shareWindow && !shareWindow.closed) {
                    shareWindow.close();
                }
                showClassroomNotice('error', "Select class and subject first, then post to stream.");
                return;
            }

            const newPost = await classroomService.createPost(classId, teacherProfile.id, 'ANNOUNCEMENT', textToShare);
            setStream((prev) => [newPost, ...prev]);
            setPostText("");

            const className = selectedClass || teacherProfile.classes?.[0] || 'my class';
            const resolvedShareUrl = classId.startsWith('local-class:')
                ? `${baseJoinUrl}?class=${encodeURIComponent(className)}`
                : `https://somaai.co.ke/class/${classId}`;
            const shareMessage = `New announcement for ${className}: ${textToShare} - View on Somo Smart: ${resolvedShareUrl}`;
            openWhatsAppShare(shareMessage, shareWindow);
            showClassroomNotice('success', "Announcement posted and WhatsApp handoff started.");
            onWorkflowStepCompleted?.(
                'PUBLISH_STREAM',
                'Step 3 complete: Announcement posted to class stream.',
                { source: 'classroom_post_share', class_name: className, subject: selectedSubject }
            );
        } catch (err) {
            console.error(err);
            if (shareWindow && !shareWindow.closed) {
                shareWindow.close();
            }
            showClassroomNotice('error', "Post failed. Check class sync/network then retry.");
        } finally {
            setIsPosting(false);
        }
    };

    const handleParentReport = (e: React.MouseEvent, student: any) => {
        e.stopPropagation();
        
        const firstName = student.name.split(' ')[0] || 'Learner';
        const focusText = student.weakTopics.length > 0 
            ? `*Current Focus Areas:*\n${student.weakTopics.map((t: string) => `- ${t}`).join('\n')}\n\n💡 To help ${firstName} improve, we recommend reviewing these topics this week.`
            : `Great job! ${firstName} has no critical weak topics right now.`;

        const trendIcon = student.trend === 'UP' ? '📈' : student.trend === 'DOWN' ? '📉' : '➖';
        const cbc = getCBCDescriptor(student.averageScore);

        const message = `*Somo Smart Progress Report* 📚
*Student:* ${student.name}
*Class:* ${selectedClass}
*Overall Mastery:* ${student.averageScore}% (${cbc.code} - ${cbc.label}) ${trendIcon}

${focusText}

View full dashboard: https://somaai.co.ke/parent/${student.id}`;

        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    if (isLoading) {
        return <div className="flex justify-center p-12"><Sparkles className="w-8 h-8 text-emerald-500 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] shadow-sm border-2 border-slate-300">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-2 tracking-tight">
                        <Users className="w-8 h-8 text-emerald-500" />
                        {selectedClass}
                    </h2>
                    <p className="text-slate-500 font-bold tracking-wider uppercase text-xs mt-1">{selectedSubject} • {students.length} Students</p>
                </div>

                <div className="flex w-full md:w-auto gap-3 sm:gap-4">
                    <div className="bg-slate-50 px-4 sm:px-6 py-3 rounded-2xl border-2 border-slate-300 items-center justify-center flex flex-col flex-1 md:flex-none">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Class Average</span>
                        <span className="text-2xl font-black text-slate-800">{classAverage}%</span>
                    </div>
                    <div className="bg-red-50 px-4 sm:px-6 py-3 rounded-2xl border-2 border-red-200 items-center justify-center flex flex-col flex-1 md:flex-none">
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">At Risk</span>
                        <span className="text-2xl font-black text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-5 h-5" /> {atRiskStudents.length}
                        </span>
                    </div>
                </div>
            </div>

            {isLocalClass && (
                <div className="max-w-3xl mx-auto bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-black text-amber-900">Temporary local classroom mode</p>
                        <p className="text-xs font-bold text-amber-800/80 mt-1">
                            Posts can still be shared to WhatsApp, but they are saved on this device until classroom sync reconnects.
                        </p>
                    </div>
                </div>
            )}

            {/* Internal Navigation Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b-2 border-slate-200">
                <button
                    onClick={() => setView('STREAM')}
                    className={`flex min-h-[48px] items-center gap-2 px-4 sm:px-6 py-3 font-black text-xs sm:text-sm uppercase tracking-wider transition-all border-b-4 whitespace-nowrap ${view === 'STREAM' ? 'text-emerald-600 border-emerald-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                    <MessageCircle className="w-5 h-5" /> Stream
                </button>
                <button
                    onClick={() => setView('GRADEBOOK')}
                    className={`flex min-h-[48px] items-center gap-2 px-4 sm:px-6 py-3 font-black text-xs sm:text-sm uppercase tracking-wider transition-all border-b-4 whitespace-nowrap ${view === 'GRADEBOOK' ? 'text-emerald-600 border-emerald-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                    <Table className="w-5 h-5" /> Gradebook
                </button>
                <button
                    onClick={() => setView('ROSTER')}
                    className={`flex min-h-[48px] items-center gap-2 px-4 sm:px-6 py-3 font-black text-xs sm:text-sm uppercase tracking-wider transition-all border-b-4 whitespace-nowrap ${view === 'ROSTER' ? 'text-teal-600 border-teal-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                >
                    <Users className="w-5 h-5" /> Roster
                </button>
            </div>

            {/* View Render */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={view}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* --- STREAM VIEW --- */}
                    {view === 'STREAM' && (
                        <div className="space-y-6 max-w-3xl mx-auto pb-20 sm:pb-0">
                            <div className="bg-white border-2 border-slate-300 rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 shadow-sm">
                                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700">Quick Win Flow</p>
                                    <p className="text-sm font-semibold text-emerald-900 mt-1">Write one class update and tap <span className="font-black">Post & Share to WhatsApp</span> to publish to stream and notify learners instantly.</p>
                                </div>
                                {classroomNotice && (
                                    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-semibold ${classroomNotice.type === 'success'
                                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        : classroomNotice.type === 'error'
                                            ? 'border-red-200 bg-red-50 text-red-800'
                                            : 'border-blue-200 bg-blue-50 text-blue-800'
                                        }`}>
                                        {classroomNotice.text}
                                    </div>
                                )}
                                <div className="flex gap-3 sm:gap-4">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                        {teacherProfile?.name?.charAt(0) || 'T'}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <textarea
                                            placeholder="Announce something to your class..."
                                            value={postText}
                                            onChange={(e) => setPostText(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-sm font-medium focus:outline-none focus:border-emerald-400 focus:bg-white transition-all resize-none h-24"
                                        />
                                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                                            <span>Tip: include assignment title and deadline.</span>
                                            <span>{postText.trim().length}/500</span>
                                        </div>
                                        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                                            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                                                <Share2 className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={handlePostAndShare}
                                                disabled={isPosting || !postText.trim()}
                                                className="min-h-[48px] bg-[#25D366] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <Share2 className="w-4 h-4" /> {isPosting ? 'Posting...' : 'Post & Share to WhatsApp'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="sm:hidden fixed bottom-16 left-0 right-0 z-20 px-4">
                                <button
                                    onClick={handlePostAndShare}
                                    disabled={isPosting || !postText.trim()}
                                    className="w-full min-h-[52px] bg-[#25D366] text-white rounded-2xl font-black text-sm shadow-lg hover:bg-[#128C7E] transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <Share2 className="w-4 h-4" /> {isPosting ? 'Posting...' : 'Post & Share to WhatsApp'}
                                </button>
                            </div>

                            {stream.length === 0 ? (
                                <div className="text-center p-8 text-slate-400 font-bold">No posts in this class stream yet.</div>
                            ) : (
                                stream.map(post => (
                                    <div key={post.id} className="bg-white border-2 border-slate-300 rounded-[2rem] p-6 shadow-sm flex gap-4">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${post.post_type === 'ANNOUNCEMENT' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {post.post_type === 'ANNOUNCEMENT' ? <Megaphone className="w-6 h-6" /> : <ClipboardList className="w-6 h-6" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-bold text-slate-800">{teacherProfile?.name || 'Teacher'}</span>
                                                <span className="text-xs font-bold text-slate-400">• {new Date(post.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-slate-600 font-medium mb-3">{post.content}</p>
                                            <button
                                                onClick={() => openWhatsAppShare(`New announcement for ${selectedClass}: ${post.content} - View on Somo Smart: ${classroomShareUrl}`)}
                                                className="inline-flex items-center gap-1.5 bg-[#25D366]/10 text-[#128C7E] px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#25D366]/20 transition-colors"
                                            >
                                                <Share2 className="w-3.5 h-3.5" /> Share to WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* --- GRADEBOOK VIEW --- */}
                    {view === 'GRADEBOOK' && (
                        <div className="bg-white border-2 border-slate-300 rounded-[2.5rem] p-8 shadow-sm overflow-x-auto">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">Gradebook Matrix</h3>
                                    <p className="text-sm font-medium text-slate-500">Auto-graded assignments and quizzes.</p>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Grading Mode Toggle */}
                                    <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
                                        <button
                                            onClick={() => setGradingMode('PERCENT')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${gradingMode === 'PERCENT' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            Percentages
                                        </button>
                                        <button
                                            onClick={() => setGradingMode('CBC')}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${gradingMode === 'CBC' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                                        >
                                            Kenyan CBC (JSS)
                                        </button>
                                    </div>
                                    <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors">
                                        <UploadCloud className="w-4 h-4" /> Export CSV
                                    </button>
                                </div>
                            </div>
                            
                            {decoratedStudents.length === 0 ? (
                                <div className="text-center p-8 text-slate-400 font-bold">No students have joined this class yet.</div>
                            ) : (
                                <>
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr>
                                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-200">Student</th>
                                                <th className="py-3 px-4 text-xs font-black uppercase tracking-widest text-slate-400 border-b-2 border-slate-200">
                                                    {gradingMode === 'PERCENT' ? 'Average Score' : 'CBC Rating / Descriptor'}
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {decoratedStudents.map((student) => {
                                                const cbc = getCBCDescriptor(student.averageScore);
                                                return (
                                                    <tr key={student.id} className="hover:bg-slate-50 border-b border-slate-100">
                                                        <td className="py-4 px-4 font-bold text-slate-800 flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs">{student.avatar}</div>
                                                            {student.name}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            {gradingMode === 'PERCENT' ? (
                                                                <span className="font-black text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                                                    {student.averageScore}%
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`px-2.5 py-1 rounded-full font-black text-xs border ${cbc.color}`}>
                                                                        {cbc.code}
                                                                    </span>
                                                                    <span className="text-xs font-bold text-slate-500">
                                                                        {cbc.label}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>

                                    {/* CBC Scale Legend */}
                                    {gradingMode === 'CBC' && (
                                        <div className="mt-8 p-5 bg-indigo-50/20 rounded-3xl border border-indigo-100/80">
                                            <h4 className="text-xs font-black text-indigo-900 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                                <Brain className="w-4 h-4 text-indigo-650" />
                                                Kenyan JSS CBC Grading Scale Legend
                                            </h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-150 shadow-sm">
                                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">EE</span>
                                                    <div className="text-[10px] leading-tight">
                                                        <p className="font-black text-slate-800">Exceeding Expectation</p>
                                                        <p className="text-slate-400 font-bold mt-0.5">80% - 100%</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-150 shadow-sm">
                                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">ME</span>
                                                    <div className="text-[10px] leading-tight">
                                                        <p className="font-black text-slate-800">Meeting Expectation</p>
                                                        <p className="text-slate-400 font-bold mt-0.5">60% - 79%</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-150 shadow-sm">
                                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">AE</span>
                                                    <div className="text-[10px] leading-tight">
                                                        <p className="font-black text-slate-800">Approaching Expectation</p>
                                                        <p className="text-slate-400 font-bold mt-0.5">40% - 59%</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-slate-150 shadow-sm">
                                                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200">BE</span>
                                                    <div className="text-[10px] leading-tight">
                                                        <p className="font-black text-slate-800">Below Expectation</p>
                                                        <p className="text-slate-400 font-bold mt-0.5">0% - 39%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* --- ROSTER VIEW --- */}
                    {view === 'ROSTER' && (
                        <div className="space-y-6">
                            {/* Smart Insights Bar inside Roster */}
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-[2rem] border-2 border-emerald-200 flex flex-col md:flex-row items-center gap-6 justify-between">
                                <div className="flex gap-4 items-start flex-1">
                                    <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-200">
                                        <Brain className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-emerald-900 flex items-center gap-2">
                                            Somo Smart Insight <Sparkles className="w-4 h-4 text-amber-500" />
                                        </h3>
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed mt-1">
                                            <strong>{mostCommonWeakTopic}</strong> is a projected struggle area for {studentsNeedingHelp > 0 ? studentsNeedingHelp : decoratedStudents.length} students.
                                            Would you like me to generate a fun, low-stakes {mostCommonWeakTopic} mini-game for them to practice?
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onAssignQuiz(decoratedStudents.map(s => s.id), `${mostCommonWeakTopic} Minigame`)}
                                    className="whitespace-nowrap bg-[#25D366] hover:bg-[#128C7E] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-green-600/20 transition-transform hover:scale-105 flex items-center gap-2"
                                >
                                    <Share2 className="w-4 h-4" /> Assign & Send via WhatsApp
                                </button>
                            </div>

                            {/* Actions & Filters */}
                            <div className="flex justify-between items-center gap-4 flex-wrap">
                                <h3 className="text-lg font-black text-slate-800">Student Profiles</h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setIsBillingModalOpen(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-indigo-100 hover:shadow-lg transition-all uppercase tracking-wider"
                                    >
                                        <Smartphone className="w-4 h-4" /> Collect Fees (M-Pesa)
                                    </button>
                                    <button
                                        onClick={() => setSelectedStudents(decoratedStudents.length === selectedStudents.length ? [] : decoratedStudents.map(s => s.id))}
                                        className="text-sm font-bold text-slate-500 hover:text-emerald-650 transition-colors px-3 py-1"
                                    >
                                        {selectedStudents.length === decoratedStudents.length ? 'Deselect All' : 'Select All'}
                                    </button>
                                    <AnimatePresence>
                                        {selectedStudents.length > 0 && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                onClick={handleBulkAssign}
                                                disabled={isAssigning}
                                                className="bg-[#25D366] text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#128C7E] transition-colors"
                                            >
                                                {isAssigning ? <Sparkles className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                                                Assign & Send via WhatsApp ({selectedStudents.length})
                                            </motion.button>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {decoratedStudents.length === 0 && (
                                <div className="text-center p-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center gap-4">
                                    <p className="text-slate-500 font-bold">No students have joined this class yet.</p>
                                    <a 
                                        href={`https://wa.me/?text=${encodeURIComponent(`Join my Somo Smart class: ${selectedClass} - ${classJoinUrl}`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-[#128C7E] transition-colors"
                                    >
                                        <Share2 className="w-5 h-5" /> Invite via WhatsApp
                                    </a>
                                </div>
                            )}

                            {/* Roster Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {decoratedStudents.map((student) => (
                                    <motion.div
                                        key={student.id}
                                        whileHover={{ y: -2 }}
                                        onClick={() => toggleStudent(student.id)}
                                        className={`cursor-pointer bg-white p-5 rounded-2xl transition-all ${selectedStudents.includes(student.id) ? 'border-4 border-emerald-500 shadow-md scale-[1.02]' : 'border-2 border-slate-300 hover:border-emerald-300'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black ${student.averageScore < 50 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                                    {student.avatar}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800">{student.name}</h4>
                                                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active {student.lastActive}</p>
                                                </div>
                                            </div>
                                            <div className={`flex flex-col items-end`}>
                                                <div className="flex items-center gap-1 font-black text-lg">
                                                    {student.averageScore}%
                                                    {student.trend === 'UP' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                                                    {student.trend === 'DOWN' && <TrendingDown className="w-4 h-4 text-red-500" />}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Score</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                                                <div className="text-sm">
                                                    <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-0.5">Focus Areas</span>
                                                    {student.weakTopics.map((topic, i) => (
                                                        <span key={i} className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold mr-1 mb-1">
                                                            {topic}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                                <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                    <ClipboardList className="w-3.5 h-3.5" /> {student.pendingAssignments} pending assignments
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button 
                                                        onClick={(e) => handleParentReport(e, student)}
                                                        className="bg-[#25D366] text-white px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-widest flex items-center gap-1 hover:bg-[#128C7E] transition-colors"
                                                    >
                                                        <Share2 className="w-3 h-3" /> Report
                                                    </button>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedStudents.includes(student.id) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                                                        {selectedStudents.includes(student.id) && <CheckCircle className="w-3 h-3 text-white" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            <AnimatePresence>
                {isBillingModalOpen && (
                    <BulkBillingModal 
                        isOpen={isBillingModalOpen} 
                        onClose={() => setIsBillingModalOpen(false)} 
                        students={decoratedStudents}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};
