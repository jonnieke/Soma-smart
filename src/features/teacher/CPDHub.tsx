import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Sparkles,
    BookOpen,
    GraduationCap,
    Send,
    Bot,
    Download,
    CheckCircle,
    PlayCircle,
    User,
    ArrowRight,
    Loader2,
    Award,
    CheckSquare,
    Square
} from 'lucide-react';
import { Button } from '../../components/Shared';
import { askPedagogyCoach } from '../../services/geminiService';

// --- Type definitions ---
interface Message {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
}

interface Course {
    id: string;
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
    duration: string;
    xp: number;
    progress: number; // 0 to 100
    modules: {
        id: string;
        title: string;
        completed: boolean;
        duration: string;
    }[];
}

export const CPDHub: React.FC = () => {
    // --- States ---
    const [courses, setCourses] = useState<Course[]>([
        {
            id: '5e_model',
            title: 'Mastering the 5-E Lesson Plan Model',
            description: 'Learn how to structure KICD-compliant lessons using the Engage, Explore, Explain, Elaborate, and Evaluate framework.',
            difficulty: 'Beginner',
            duration: '2 Hours',
            xp: 250,
            progress: 50,
            modules: [
                { id: '5e_1', title: 'Introduction to 5-E Pedagogical Flow', completed: true, duration: '20 min' },
                { id: '5e_2', title: 'Designing the Engage & Explore Phases', completed: true, duration: '30 min' },
                { id: '5e_3', title: 'Facilitating Explain & Elaborate Activities', completed: false, duration: '40 min' },
                { id: '5e_4', title: 'Creating Formative Evaluate Rubrics', completed: false, duration: '30 min' }
            ]
        },
        {
            id: 'active_learning',
            title: 'Active Learning & Scaffolding under CBC',
            description: 'Differentiate instructions, engage Junior Secondary students, and implement collaborative group learning strategies.',
            difficulty: 'Intermediate',
            duration: '3 Hours',
            xp: 400,
            progress: 25,
            modules: [
                { id: 'al_1', title: 'Active Learning vs Traditional Lecturing', completed: true, duration: '30 min' },
                { id: 'al_2', title: 'Instructional Scaffolding Techniques', completed: false, duration: '45 min' },
                { id: 'al_3', title: 'Managing JSS Team-Based Projects', completed: false, duration: '60 min' },
                { id: 'al_4', title: 'Handling Inclusive Classrooms in Kenya', completed: false, duration: '45 min' }
            ]
        },
        {
            id: 'assessments_cbc',
            title: 'Formative Assessment & Rubrics',
            description: 'Create KICD-compliant checklists, oral questioning flows, portfolios, and fair formative scoring rubrics.',
            difficulty: 'Advanced',
            duration: '2.5 Hours',
            xp: 350,
            progress: 0,
            modules: [
                { id: 'as_1', title: 'Introduction to Formative Assessment in CBC', completed: false, duration: '30 min' },
                { id: 'as_2', title: 'Constructing Criteria-Based Rubrics', completed: false, duration: '45 min' },
                { id: 'as_3', title: 'Managing Student Portfolio Collections', completed: false, duration: '45 min' },
                { id: 'as_4', title: 'Reporting & Grading under JSS Guidelines', completed: false, duration: '30 min' }
            ]
        }
    ]);

    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'model',
            text: "Jambo! I am Mwalimu Trainer, your Senior CBC Pedagogical Coach. I am here to help you structure lesson plans, master KICD compliance standards, and implement active learning methods in your classroom. Ask me anything!",
            timestamp: Date.now()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [xpAwarded, setXpAwarded] = useState<number | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle course module toggle
    const handleToggleModule = (courseId: string, moduleId: string) => {
        let xpGained = 0;
        const updated = courses.map(c => {
            if (c.id === courseId) {
                const updatedModules = c.modules.map(m => {
                    if (m.id === moduleId) {
                        const nextCompleted = !m.completed;
                        if (nextCompleted) xpGained = Math.round(c.xp / c.modules.length);
                        return { ...m, completed: nextCompleted };
                    }
                    return m;
                });
                const completedCount = updatedModules.filter(m => m.completed).length;
                const nextProgress = Math.round((completedCount / updatedModules.length) * 100);
                return {
                    ...c,
                    modules: updatedModules,
                    progress: nextProgress
                };
            }
            return c;
        });

        setCourses(updated);
        // Update active course preview
        if (activeCourse && activeCourse.id === courseId) {
            const currentCourse = updated.find(c => c.id === courseId);
            if (currentCourse) setActiveCourse(currentCourse);
        }

        if (xpGained > 0) {
            setXpAwarded(xpGained);
            setTimeout(() => setXpAwarded(null), 3000);
        }
    };

    // Ask Smart Coach
    const handleAskCoach = async (textToSend?: string) => {
        const query = (textToSend || inputText).trim();
        if (!query || isAsking) return;

        setInputText('');
        const userMsg: Message = { role: 'user', text: query, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setIsAsking(true);

        try {
            // Mapping UI Message format to Gemini Service expectations
            const chatHistory = messages.map(m => ({ role: m.role, text: m.text }));
            const coachReply = await askPedagogyCoach(query, chatHistory);
            
            const replyMsg: Message = { role: 'model', text: coachReply, timestamp: Date.now() };
            setMessages(prev => [...prev, replyMsg]);
        } catch (error) {
            console.error("Smart Coach query failed:", error);
            setMessages(prev => [
                ...prev,
                { role: 'model', text: "Oops, my session is a bit busy right now. Let's try again in a moment! 📝", timestamp: Date.now() }
            ]);
        } finally {
            setIsAsking(false);
        }
    };

    // Download mock resources
    const handleDownloadTemplate = (filename: string, content: string) => {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const starterSuggestions = [
        "Explain the 5-E lesson plan phases.",
        "How do I create a cbc assessment rubric?",
        "Give me an active learning activity for math."
    ];

    return (
        <div className="space-y-8 relative">
            {/* XP Notification Overlay */}
            <AnimatePresence>
                {xpAwarded && (
                    <motion.div
                        initial={{ opacity: 0, y: -50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 20, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm uppercase tracking-wider px-6 py-3 rounded-full shadow-2xl border-2 border-white flex items-center gap-2"
                    >
                        <Award className="w-5 h-5 text-white" />
                        <span>+{xpAwarded} XP Earned!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-600 to-indigo-900 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full text-indigo-100 text-xs font-black tracking-widest uppercase mb-4 border border-white/10 shadow-inner">
                            <GraduationCap className="w-4 h-4 text-pink-300" />
                            CPD Hub
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-3 text-white">CPD & Training Hub</h2>
                        <p className="text-indigo-100 font-medium max-w-xl text-lg opacity-90 leading-relaxed">
                            Master CBC pedagogical standards. Learn step-by-step methodologies, query the Smart Pedagogy Coach, and earn professional points.
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left/Middle: Courses & Resources */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Courses section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                                <BookOpen className="w-6 h-6 text-violet-500" />
                                CBC Pedagogy Courses
                            </h3>
                            <span className="text-xs font-black bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 px-3 py-1 rounded-full uppercase tracking-wider">
                                KICD Aligned
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {courses.map(course => (
                                <div
                                    key={course.id}
                                    className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 flex flex-col justify-between shadow-md hover:-translate-y-1 hover:shadow-xl hover:border-violet-100 dark:hover:border-violet-950 transition-all duration-300 group"
                                >
                                    <div>
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-[9px] font-black text-violet-600 bg-violet-50 dark:bg-violet-950 px-2 py-0.5 rounded uppercase tracking-wider">
                                                {course.difficulty}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {course.duration}
                                            </span>
                                        </div>
                                        <h4 className="text-lg font-black text-slate-800 dark:text-white mb-2 leading-snug group-hover:text-violet-600 transition-colors">
                                            {course.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-6">
                                            {course.description}
                                        </p>
                                    </div>

                                    <div>
                                        {/* Progress Bar */}
                                        <div className="space-y-1.5 mb-5">
                                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                <span>Progress</span>
                                                <span>{course.progress}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500"
                                                    style={{ width: `${course.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => setActiveCourse(course)}
                                            className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border-2 border-violet-100 text-violet-600 font-black text-xs uppercase tracking-widest hover:bg-violet-50 transition-all"
                                        >
                                            <PlayCircle className="w-4 h-4" />
                                            {course.progress === 0 ? 'Start Course' : course.progress === 100 ? 'Review Modules' : 'Resume Course'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resources section */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-8 space-y-6 shadow-md">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Free Classroom Templates</h3>
                            <p className="text-slate-400 text-xs font-bold mt-1">Download and edit standard templates designed for the Kenyan Competency-Based Curriculum.</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                {
                                    title: "KICD 5-E Lesson Plan Template",
                                    desc: "Includes Engage, Explore, Explain, Elaborate, and Evaluate blocks.",
                                    filename: "KICD_5E_Lesson_Plan_Template.txt",
                                    content: "CBC 5-E LESSON PLAN TEMPLATE\n\n1. ENGAGE: Opener activity to capture interest...\n2. EXPLORE: Student-led investigation...\n3. EXPLAIN: Concept development and vocabulary...\n4. ELABORATE: Scaffolding and real-life integration...\n5. EVALUATE: Formative checklists and rubrics..."
                                },
                                {
                                    title: "Termly Scheme of Work Skeleton",
                                    desc: "Standard 10-column outline ready to import into Excel.",
                                    filename: "Termly_Scheme_of_Work_Skeleton.csv",
                                    content: "Week,Lesson,Strand,Sub-strand,Outcomes,Inquiry Questions,Values,Experiences,Resources,Assessments\n1,1,Algebra,Linear Equations,Draft outcomes,Key questions,Critical Thinking,Group work,Somo Textbooks,Oral test"
                                },
                                {
                                    title: "Formative Rubric Guide",
                                    desc: "Guide on creating 4 levels of mastery checklists.",
                                    filename: "CBC_Formative_Rubric_Guide.txt",
                                    content: "CBC ASSESSMENT LEVELS:\n- Level 4: Exceeding Expectation (EE)\n- Level 3: Meeting Expectation (ME)\n- Level 2: Approaching Expectation (AE)\n- Level 1: Below Expectation (BE)\n\nSample check items included..."
                                }
                            ].map((res, idx) => (
                                <div
                                    key={idx}
                                    className="p-5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 flex flex-col justify-between group"
                                >
                                    <div>
                                        <h4 className="font-black text-slate-800 dark:text-white text-sm mb-1.5 leading-snug">
                                            {res.title}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                                            {res.desc}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => handleDownloadTemplate(res.filename, res.content)}
                                        className="mt-6 flex items-center gap-1 text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 group-hover:text-violet-700 transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Smart Pedagogy Coach Chat */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-xl flex flex-col h-[600px] justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-bl-[100px] pointer-events-none"></div>

                    {/* Chat Header */}
                    <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-4 flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-200 dark:shadow-none">
                            <Bot className="w-5.5 h-5.5" />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 dark:text-white text-base leading-none">Pedagogy Coach</h3>
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1 mt-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                Mwalimu Trainer Active
                            </span>
                        </div>
                    </div>

                    {/* Scrollable messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 px-1 pr-2 relative z-10 scrollbar-thin">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.role === 'model' && (
                                    <div className="w-7 h-7 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0 text-xs font-bold shadow-sm">
                                        MT
                                    </div>
                                )}
                                <div
                                    className={`p-3.5 rounded-2xl text-xs max-w-[85%] font-medium leading-relaxed ${
                                        msg.role === 'user'
                                            ? 'bg-slate-900 text-white rounded-tr-none'
                                            : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-850 rounded-tl-none'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isAsking && (
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 pl-1">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                                Mwalimu Trainer is thinking...
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Footer inputs */}
                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3 relative z-10">
                        {/* Quick Suggestions */}
                        <div className="flex flex-wrap gap-1.5">
                            {starterSuggestions.map((s, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAskCoach(s)}
                                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-violet-50 dark:bg-slate-950 dark:hover:bg-violet-950 border border-slate-100 dark:border-slate-850 text-slate-500 hover:text-violet-600 dark:text-slate-400 dark:hover:text-violet-300 rounded-lg text-[9px] font-bold text-left transition-colors"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>

                        {/* Input bar */}
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleAskCoach();
                            }}
                            className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-850"
                        >
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Ask about lesson plans or CBC..."
                                className="flex-1 bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 outline-none placeholder:text-slate-300"
                            />
                            <button
                                type="submit"
                                disabled={isAsking || !inputText.trim()}
                                className="p-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Course modules expansion modal */}
            <AnimatePresence>
                {activeCourse && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 w-full max-w-xl shadow-2xl relative"
                        >
                            <button
                                onClick={() => setActiveCourse(null)}
                                className="absolute top-6 right-6 p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors font-black text-slate-500"
                            >
                                ✕
                            </button>

                            <div className="mb-6">
                                <span className="text-[10px] font-black uppercase text-violet-600 bg-violet-50 dark:bg-violet-950 px-2 py-0.5 rounded tracking-wider">
                                    {activeCourse.difficulty} • {activeCourse.duration}
                                </span>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-3">
                                    {activeCourse.title}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-2">
                                    {activeCourse.description}
                                </p>
                            </div>

                            {/* Modules checklist */}
                            <div className="space-y-3.5 mb-8">
                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Course Syllabus Checkpoints</h4>
                                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                                    {activeCourse.modules.map(module => (
                                        <div
                                            key={module.id}
                                            onClick={() => handleToggleModule(activeCourse.id, module.id)}
                                            className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:border-violet-300 transition-all ${
                                                module.completed
                                                    ? 'border-emerald-100 bg-emerald-50/20 text-emerald-800 dark:border-emerald-950/20 dark:bg-emerald-950/10 dark:text-emerald-300'
                                                    : 'border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {module.completed ? (
                                                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <Square className="w-4 h-4 text-slate-400" />
                                                )}
                                                <span className="text-xs font-bold">{module.title}</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400">
                                                {module.duration}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Completed indicator */}
                            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-500 border border-amber-100 dark:border-amber-900 flex items-center justify-center">
                                        <Award className="w-5.5 h-5.5" />
                                    </div>
                                    <div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Completion Reward</span>
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-300">{activeCourse.xp} Total XP</span>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setActiveCourse(null)}
                                    className="bg-violet-600 hover:bg-violet-700 text-white font-black text-xs uppercase px-6 py-3 rounded-xl"
                                >
                                    {activeCourse.progress === 100 ? 'Course Completed!' : 'Keep Learning'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
