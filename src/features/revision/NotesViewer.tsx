import React, { useState, useEffect } from 'react';
import {
    ArrowLeft, BookOpen, Sparkles, Loader2, ChevronRight, Brain, ChevronDown,
    ChevronUp, AlertTriangle, Trophy, Zap, FileText, Lightbulb, Target,
    GraduationCap, Clock, CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    extractStructuredNotes, generateTopicQuiz, generateExamQuestions,
    fileToGenerativePart
} from '../../services/geminiService';
import {
    ExamAnalysis, TeacherActivity, StructuredStudyNotes, StudyTopic
} from '../../types';

interface Props {
    data: File | TeacherActivity;
    onStartPractice: (analysis: ExamAnalysis) => void;
    onExit: () => void;
}

const difficultyColor: Record<string, string> = {
    'Easy': 'bg-emerald-100 text-emerald-700',
    'Medium': 'bg-amber-100 text-amber-700',
    'Hard': 'bg-red-100 text-red-700'
};

const relevanceColor: Record<string, string> = {
    'Low': 'text-slate-400',
    'Medium': 'text-blue-500',
    'High': 'text-amber-500',
    'Very High': 'text-red-500'
};

const relevanceStars: Record<string, number> = {
    'Low': 1, 'Medium': 2, 'High': 3, 'Very High': 4
};

// Simple markdown-to-JSX renderer for clean note formatting
const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: { type: 'ol' | 'ul'; items: React.ReactNode[] } | null = null;

    const flushList = () => {
        if (listItems) {
            if (listItems.type === 'ol') {
                elements.push(
                    <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1.5 my-2 ml-1">
                        {listItems.items.map((item, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item}</li>)}
                    </ol>
                );
            } else {
                elements.push(
                    <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1.5 my-2 ml-1">
                        {listItems.items.map((item, i) => <li key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{item}</li>)}
                    </ul>
                );
            }
            listItems = null;
        }
    };

    const formatInline = (line: string): React.ReactNode => {
        // Bold + italic
        const parts: React.ReactNode[] = [];
        let remaining = line;
        let key = 0;
        while (remaining.length > 0) {
            const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
            const italicMatch = remaining.match(/\*(.+?)\*/);
            const match = boldMatch && (!italicMatch || (boldMatch.index! <= italicMatch.index!)) ? boldMatch : italicMatch;
            if (match && match.index !== undefined) {
                if (match.index > 0) parts.push(remaining.slice(0, match.index));
                if (match[0].startsWith('**')) {
                    parts.push(<strong key={key++} className="font-bold text-slate-900 dark:text-white">{match[1]}</strong>);
                } else {
                    parts.push(<em key={key++} className="italic text-slate-800 dark:text-slate-200">{match[1]}</em>);
                }
                remaining = remaining.slice(match.index + match[0].length);
            } else {
                parts.push(remaining);
                break;
            }
        }
        return parts.length === 1 ? parts[0] : <>{parts}</>;
    };

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) { flushList(); continue; }

        // Headings
        if (line.startsWith('### ')) {
            flushList();
            elements.push(<h4 key={`h4-${i}`} className="text-sm font-black text-indigo-700 dark:text-indigo-400 mt-4 mb-1">{line.slice(4)}</h4>);
        } else if (line.startsWith('## ')) {
            flushList();
            elements.push(<h3 key={`h3-${i}`} className="text-base font-black text-slate-800 dark:text-slate-200 mt-4 mb-1">{line.slice(3)}</h3>);
        } else if (line.startsWith('# ')) {
            flushList();
            elements.push(<h2 key={`h2-${i}`} className="text-lg font-black text-slate-900 dark:text-white mt-4 mb-2">{line.slice(2)}</h2>);
        }
        // Numbered lists
        else if (/^\d+\.\s/.test(line)) {
            const content = line.replace(/^\d+\.\s/, '');
            if (!listItems || listItems.type !== 'ol') { flushList(); listItems = { type: 'ol', items: [] }; }
            listItems.items.push(formatInline(content));
        }
        // Bullet lists
        else if (/^[-•*]\s/.test(line)) {
            const content = line.replace(/^[-•*]\s/, '');
            if (!listItems || listItems.type !== 'ul') { flushList(); listItems = { type: 'ul', items: [] }; }
            listItems.items.push(formatInline(content));
        }
        // Regular paragraph
        else {
            flushList();
            elements.push(<p key={`p-${i}`} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed my-1.5">{formatInline(line)}</p>);
        }
    }
    flushList();
    return <div className="space-y-0.5">{elements}</div>;
};

export const NotesViewer: React.FC<Props> = ({ data, onStartPractice, onExit }) => {
    // Core state
    const [loading, setLoading] = useState(true);
    const [loadingPhase, setLoadingPhase] = useState('Reading your notes...');
    const [notes, setNotes] = useState<StructuredStudyNotes | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Topic interaction state
    const [expandedTopicId, setExpandedTopicId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'notes' | 'examTips' | 'mistakes'>('notes');

    // Quiz state
    const [quizLoadingTopicId, setQuizLoadingTopicId] = useState<number | null>(null);
    const [topicQuiz, setTopicQuiz] = useState<{ topicId: number; analysis: ExamAnalysis } | null>(null);

    // Full exam questions
    const [loadingFullQuestions, setLoadingFullQuestions] = useState(false);
    const [fullAnalysis, setFullAnalysis] = useState<ExamAnalysis | null>(null);

    // Data
    const [base64Data, setBase64Data] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string>('');

    const isOfficial = !(data instanceof File) && 'file_path' in (data as any);
    const title = isOfficial ? (data as any).title : (data as File).name;
    const subject = isOfficial ? (data as any).subject || '' : '';
    const grade = isOfficial ? (data as any).grade || '' : '';

    useEffect(() => {
        const init = async () => {
            try {
                let b64 = '';
                let mt = '';

                if (data instanceof File) {
                    b64 = await fileToGenerativePart(data);
                    mt = data.type;
                } else if (isOfficial) {
                    const res = data as any;
                    const encodedPath = res.file_path.split('/').map(encodeURIComponent).join('/');
                    const docUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/syllabus-docs/${encodedPath}`;
                    setLoadingPhase('Downloading document...');

                    const response = await fetch(docUrl);
                    if (!response.ok) throw new Error('Failed to fetch document');

                    const blob = await response.blob();
                    mt = blob.type || 'application/pdf';
                    const reader = new FileReader();
                    b64 = await new Promise((resolve) => {
                        reader.onloadend = () => {
                            const result = reader.result as string;
                            resolve(result.split(',')[1] || '');
                        };
                        reader.readAsDataURL(blob);
                    });
                }

                setBase64Data(b64);
                setMimeType(mt);

                if (!b64) {
                    setError('Could not read document content.');
                    setLoading(false);
                    return;
                }

                // Extract structured notes via AI
                setLoadingPhase('AI is analyzing and structuring your notes...');
                const structuredNotes = await extractStructuredNotes(b64, mt, subject, grade);
                setNotes(structuredNotes);

                // Auto-expand first topic
                if (structuredNotes.topics.length > 0) {
                    setExpandedTopicId(structuredNotes.topics[0].id);
                }

                setLoading(false);
            } catch (err) {
                console.error('Error loading notes:', err);
                setError('Failed to process notes. Please try again.');
                setLoading(false);
            }
        };
        init();
    }, [data]);

    const handleTopicQuiz = async (topic: StudyTopic) => {
        if (quizLoadingTopicId === topic.id) return;
        setQuizLoadingTopicId(topic.id);
        setTopicQuiz(null);
        try {
            const analysis = await generateTopicQuiz(
                topic, notes?.subject || subject, notes?.grade || grade
            );
            setTopicQuiz({ topicId: topic.id, analysis });
        } catch (e) {
            console.error('Error generating topic quiz:', e);
        } finally {
            setQuizLoadingTopicId(null);
        }
    };

    const handleFullExamQuestions = async () => {
        if (!base64Data || loadingFullQuestions) return;
        setLoadingFullQuestions(true);
        try {
            const analysis = await generateExamQuestions(
                base64Data, mimeType, notes?.subject || subject, notes?.grade || grade, 10
            );
            setFullAnalysis(analysis);
        } catch (e) {
            console.error('Error generating full questions:', e);
        } finally {
            setLoadingFullQuestions(false);
        }
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
                <div className="w-20 h-20 relative mb-6">
                    <div className="absolute inset-0 border-4 border-blue-200 dark:border-blue-900/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <Brain className="w-8 h-8 text-blue-600 dark:text-blue-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-slate-700 dark:text-white font-bold text-lg mb-2">Processing Your Notes</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm animate-pulse max-w-xs text-center">{loadingPhase}</p>
                <div className="mt-6 flex gap-2">
                    {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                </div>
            </div>
        );
    }

    // --- Error State ---
    if (error) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 p-6">
                <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
                <p className="font-bold text-slate-700 mb-2">Something went wrong</p>
                <p className="text-sm text-slate-500 mb-4">{error}</p>
                <button onClick={onExit} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold text-sm">Go Back</button>
            </div>
        );
    }

    if (!notes) return null;

    // --- Main Notes View ---
    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm shrink-0 transition-colors">
                <div className="flex items-center gap-3">
                    <button onClick={onExit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-base font-black text-slate-900 dark:text-white">{notes.title || title}</h1>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            <GraduationCap className="w-3 h-3" />
                            {notes.subject} • {notes.grade} • {notes.totalTopics} examinable topics
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {!fullAnalysis ? (
                        <button
                            onClick={handleFullExamQuestions}
                            disabled={loadingFullQuestions}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
                        >
                            {loadingFullQuestions ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <Sparkles className="w-3 h-3" />
                            )}
                            Generate Full Exam
                        </button>
                    ) : (
                        <button
                            onClick={() => onStartPractice(fullAnalysis)}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                        >
                            <Trophy className="w-3 h-3" />
                            Start Exam Practice ({fullAnalysis.questions.length} Qs)
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto p-4 space-y-4">

                    {/* Overview Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white relative overflow-hidden"
                    >
                        <div className="relative z-10">
                            <BookOpen className="w-8 h-8 mb-3 opacity-80" />
                            <h2 className="text-xl font-black mb-2">{notes.title}</h2>
                            <p className="text-blue-100 text-sm leading-relaxed">{notes.overview}</p>
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                    </motion.div>

                    {/* Topic Cards */}
                    {notes.topics.map((topic, idx) => {
                        const isExpanded = expandedTopicId === topic.id;
                        const hasQuiz = topicQuiz?.topicId === topic.id;

                        return (
                            <motion.div
                                key={topic.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors"
                            >
                                {/* Topic Header */}
                                <button
                                    onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center shrink-0">
                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{idx + 1}</span>
                                        </div>
                                        <div className="text-left flex-1 min-w-0">
                                            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200 truncate">{topic.title}</h3>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${difficultyColor[topic.difficulty] || 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                                    {topic.difficulty}
                                                </span>
                                                <span className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-0.5">
                                                    {Array.from({ length: relevanceStars[topic.examRelevance] || 2 }).map((_, i) => (
                                                        <Zap key={i} className={`w-2.5 h-2.5 fill-current ${relevanceColor[topic.examRelevance] || 'text-slate-400 dark:text-slate-600'}`} />
                                                    ))}
                                                    <span className="ml-0.5">{topic.examRelevance}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                                </button>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            {/* Key Concepts Tags */}
                                            <div className="px-5 pb-3">
                                                <div className="flex flex-wrap gap-1.5">
                                                    {topic.keyConcepts.map((concept, i) => (
                                                        <span key={i} className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-lg font-bold">
                                                            {concept}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Tab Buttons */}
                                            <div className="px-5 flex gap-1 mb-3">
                                                {([
                                                    { key: 'notes', label: 'Study Notes', icon: BookOpen },
                                                    { key: 'examTips', label: 'Exam Tips', icon: Target },
                                                    { key: 'mistakes', label: 'Common Mistakes', icon: AlertTriangle }
                                                ] as const).map(tab => (
                                                    <button
                                                        key={tab.key}
                                                        onClick={() => setActiveTab(tab.key)}
                                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${activeTab === tab.key
                                                            ? 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300'
                                                            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                            }`}
                                                    >
                                                        <tab.icon className="w-3 h-3" />
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Tab Content */}
                                            <div className="px-5 pb-4">
                                                {activeTab === 'notes' && (
                                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 max-h-96 overflow-y-auto">
                                                        {renderMarkdown(topic.content)}
                                                    </div>
                                                )}

                                                {activeTab === 'examTips' && (
                                                    <div className="space-y-2">
                                                        {topic.examTips.map((tip, i) => (
                                                            <div key={i} className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-3">
                                                                <Lightbulb className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                                                                <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">{tip}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {activeTab === 'mistakes' && (
                                                    <div className="space-y-2">
                                                        {topic.commonMistakes.map((mistake, i) => (
                                                            <div key={i} className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-3">
                                                                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                                                <p className="text-xs text-red-700 dark:text-red-300 font-medium">{mistake}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Topic Quiz Button */}
                                            <div className="px-5 pb-5 border-t border-slate-100 dark:border-slate-800 pt-4">
                                                {!hasQuiz ? (
                                                    <button
                                                        onClick={() => handleTopicQuiz(topic)}
                                                        disabled={quizLoadingTopicId === topic.id}
                                                        className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                                                    >
                                                        {quizLoadingTopicId === topic.id ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Generating Quiz...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Sparkles className="w-4 h-4" />
                                                                Test Your Knowledge — Quick Quiz
                                                            </>
                                                        )}
                                                    </button>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                                                <span className="font-bold text-xs text-emerald-800">
                                                                    {topicQuiz!.analysis.questions.length} Questions Ready
                                                                </span>
                                                            </div>
                                                            {topicQuiz!.analysis.questions.map(q => (
                                                                <div key={q.id} className="text-[11px] text-slate-600 py-1 pl-6 border-l-2 border-emerald-200 ml-2 mt-1">
                                                                    <span className="font-bold text-emerald-600">Q{q.number}:</span> {q.text.slice(0, 80)}...
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button
                                                            onClick={() => onStartPractice(topicQuiz!.analysis)}
                                                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                                                        >
                                                            <Trophy className="w-4 h-4" />
                                                            Start Topic Practice
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}

                    {/* Bottom Spacer */}
                    <div className="h-6" />
                </div>
            </div>
        </div>
    );
};
