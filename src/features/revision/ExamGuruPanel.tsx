import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, X, User, CheckSquare, MessageCircle, ChevronRight, Loader, TrendingUp, AlertCircle, PenLine } from 'lucide-react';
import { getExamGuruResponse, markCandidateAnswer, getPredictedTopics, PredictedTopic, generatePracticeQuestions, PracticeQuestion } from '../../services/geminiService';

interface Message {
    id: string;
    role: 'user' | 'guru';
    content: string;
    isMarkResult?: boolean;
}

const PROMPT_CHIPS = [
    'How is Biology osmosis marked?',
    'KCSE Maths P1 structure?',
    'English essay format for KCSE?',
    'Chemistry P3 practical tips?',
    'Time plan for a 3-hour paper?',
];

const SUBJECTS = [
    'Mathematics', 'Biology', 'Chemistry', 'Physics',
    'English', 'Kiswahili', 'History', 'Geography',
    'CRE', 'IRE', 'Agriculture', 'Business Studies',
    'Computer Studies', 'Home Science', 'Art & Design',
];

type PanelMode = 'chat' | 'mark' | 'predict' | 'practice';

export const ExamGuruPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [mode, setMode] = useState<PanelMode>('chat');

    // --- Chat state ---
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'guru',
            content: "Exam Guru online. Ask me any Biology, Chemistry, Maths, English or other subject question — I'll show you exactly how KNEC marks it and what earns full marks. No vague advice. Just marks.",
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // --- Practice Questions state ---
    const [practiceSubject, setPracticeSubject] = useState('');
    const [practiceTopic, setPracticeTopic] = useState('');
    const [practiceExamType, setPracticeExamType] = useState<'KCSE' | 'KPSEA' | 'JSS'>('KCSE');
    const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState('');
    const [expandedPQ, setExpandedPQ] = useState<number | null>(null);

    const handleGenerate = async () => {
        if (!practiceSubject) return;
        setIsGenerating(true);
        setPracticeQuestions([]);
        setGenerateError('');
        setExpandedPQ(null);
        try {
            const questions = await generatePracticeQuestions(practiceSubject, practiceTopic, practiceExamType);
            if (questions.length === 0) setGenerateError('Could not generate questions. Try again.');
            else setPracticeQuestions(questions);
        } catch {
            setGenerateError('Generation failed. Check your connection.');
        } finally {
            setIsGenerating(false);
        }
    };

    // --- Predicted Topics state ---
    const [predictSubject, setPredictSubject] = useState('');
    const [predictExamType, setPredictExamType] = useState<'KCSE' | 'KPSEA' | 'JSS'>('KCSE');
    const [predictedTopics, setPredictedTopics] = useState<PredictedTopic[]>([]);
    const [isPredicting, setIsPredicting] = useState(false);
    const [predictError, setPredictError] = useState('');

    const handlePredict = async () => {
        if (!predictSubject) return;
        setIsPredicting(true);
        setPredictedTopics([]);
        setPredictError('');
        try {
            const topics = await getPredictedTopics(predictSubject, predictExamType);
            if (topics.length === 0) setPredictError('Could not generate predictions. Try again.');
            else setPredictedTopics(topics);
        } catch {
            setPredictError('Prediction failed. Check connection.');
        } finally {
            setIsPredicting(false);
        }
    };

    // --- Mark My Answer state ---
    const [markSubject, setMarkSubject] = useState('');
    const [markQuestion, setMarkQuestion] = useState('');
    const [markAnswer, setMarkAnswer] = useState('');
    const [markMarks, setMarkMarks] = useState('');
    const [isMarking, setIsMarking] = useState(false);
    const [markResult, setMarkResult] = useState<string | null>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        if (mode === 'chat') setTimeout(() => inputRef.current?.focus(), 300);
    }, [mode]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isTyping) return;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
        const newMsgs = [...messages, userMsg];
        setMessages(newMsgs);
        setInput('');
        setIsTyping(true);
        try {
            const history = newMsgs.map(m => ({ role: m.role, content: m.content }));
            const response = await getExamGuruResponse(text.trim(), history);
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'guru', content: response }]);
        } catch {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'guru', content: 'Connection issue. Please try again.' }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleMark = async () => {
        if (!markQuestion.trim() || !markAnswer.trim()) return;
        setIsMarking(true);
        setMarkResult(null);
        try {
            const result = await markCandidateAnswer(
                markQuestion.trim(),
                markAnswer.trim(),
                markSubject,
                markMarks ? parseInt(markMarks) : 0
            );
            setMarkResult(result);
        } catch {
            setMarkResult('Marking failed. Please check your connection and try again.');
        } finally {
            setIsMarking(false);
        }
    };

    const resetMark = () => {
        setMarkResult(null);
        setMarkQuestion('');
        setMarkAnswer('');
        setMarkMarks('');
    };

    return (
        <>
            {/* Mobile backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />

            {/* Panel */}
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed z-50 flex flex-col
                    bottom-0 left-0 right-0 h-[92vh] rounded-t-3xl
                    md:top-0 md:right-0 md:left-auto md:bottom-0 md:h-full md:w-[440px] md:rounded-none md:rounded-l-3xl
                    bg-slate-950 shadow-2xl border border-white/10 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-sm">Exam Guru AI</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">KNEC Expert · Online</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="flex bg-slate-900 border-b border-white/5 shrink-0 overflow-x-auto no-scrollbar">
                    <button onClick={() => setMode('chat')} className={`shrink-0 flex-1 flex items-center justify-center gap-1 py-3 text-[9px] font-black uppercase tracking-wider transition-colors min-w-0 px-2 ${ mode === 'chat' ? 'text-white border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300' }`}>
                        <MessageCircle className="w-3 h-3" /> Ask
                    </button>
                    <button onClick={() => setMode('mark')} className={`shrink-0 flex-1 flex items-center justify-center gap-1 py-3 text-[9px] font-black uppercase tracking-wider transition-colors min-w-0 px-2 ${ mode === 'mark' ? 'text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300' }`}>
                        <CheckSquare className="w-3 h-3" /> Mark Me
                    </button>
                    <button onClick={() => setMode('predict')} className={`shrink-0 flex-1 flex items-center justify-center gap-1 py-3 text-[9px] font-black uppercase tracking-wider transition-colors min-w-0 px-2 ${ mode === 'predict' ? 'text-white border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300' }`}>
                        <TrendingUp className="w-3 h-3" /> Hot Topics
                    </button>
                    <button onClick={() => setMode('practice')} className={`shrink-0 flex-1 flex items-center justify-center gap-1 py-3 text-[9px] font-black uppercase tracking-wider transition-colors min-w-0 px-2 ${ mode === 'practice' ? 'text-white border-b-2 border-rose-500' : 'text-slate-500 hover:text-slate-300' }`}>
                        <PenLine className="w-3 h-3" /> Practice
                    </button>
                </div>

                {/* ── CHAT MODE ── */}
                {mode === 'chat' && (
                    <>
                        {/* Prompt chips */}
                        <div className="px-4 py-2.5 bg-slate-900 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                            {PROMPT_CHIPS.map(chip => (
                                <button
                                    key={chip}
                                    onClick={() => sendMessage(chip)}
                                    className="shrink-0 text-[11px] font-bold text-indigo-300 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                            {messages.map(msg => (
                                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${msg.role === 'guru' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                        {msg.role === 'guru'
                                            ? <Sparkles className="w-3.5 h-3.5 text-white" />
                                            : <User className="w-3.5 h-3.5 text-slate-300" />
                                        }
                                    </div>
                                    <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed font-medium whitespace-pre-wrap ${
                                        msg.role === 'guru'
                                            ? 'bg-slate-800/80 text-slate-100 rounded-tl-none border border-white/5'
                                            : 'bg-indigo-600 text-white rounded-tr-none'
                                    }`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                                        <Sparkles className="w-3.5 h-3.5 text-white" />
                                    </div>
                                    <div className="bg-slate-800/80 border border-white/5 px-4 py-3.5 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:100ms]" />
                                            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:200ms]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input */}
                        <div className="px-4 pb-6 pt-3 bg-slate-950 border-t border-white/10 shrink-0">
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                                    placeholder="Ask about any subject or exam strategy..."
                                    className="w-full bg-slate-900 border-2 border-slate-800 focus:border-indigo-600 rounded-2xl pl-4 pr-12 py-3.5 text-sm font-medium text-white placeholder:text-slate-600 outline-none transition-all"
                                />
                                <button
                                    onClick={() => sendMessage(input)}
                                    disabled={!input.trim() || isTyping}
                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                                        input.trim() && !isTyping ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-700 cursor-not-allowed'
                                    }`}
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* ── MARK MY ANSWER MODE ── */}
                {mode === 'mark' && (
                    <div className="flex-1 overflow-y-auto">
                        {markResult ? (
                            /* Result view */
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-white font-black text-sm flex items-center gap-2">
                                        <CheckSquare className="w-4 h-4 text-emerald-400" /> Marking Result
                                    </h4>
                                    <button
                                        onClick={resetMark}
                                        className="text-[11px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                                    >
                                        Mark Another <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="bg-slate-900 border border-white/10 rounded-2xl p-5 text-[13px] text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                                    {markResult}
                                </div>
                                <button
                                    onClick={() => {
                                        // Send to chat for follow-up questions
                                        setMessages(prev => [...prev, {
                                            id: Date.now().toString(),
                                            role: 'guru',
                                            content: `📝 Marking result for your ${markSubject || 'answer'}:\n\n${markResult}`,
                                            isMarkResult: true
                                        }]);
                                        setMode('chat');
                                        resetMark();
                                    }}
                                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
                                >
                                    Discuss with Guru →
                                </button>
                            </div>
                        ) : (
                            /* Form view */
                            <div className="p-5 space-y-4">
                                <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-2xl p-4">
                                    <p className="text-emerald-300 text-xs font-bold leading-relaxed">
                                        📝 Type or paste a question and your written answer. The Guru will mark it exactly like KNEC — point by point, with your score and model answer.
                                    </p>
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Subject</label>
                                    <select
                                        value={markSubject}
                                        onChange={e => setMarkSubject(e.target.value)}
                                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors"
                                    >
                                        <option value="">Select subject (optional)</option>
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                {/* Marks */}
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Total Marks for This Question</label>
                                    <input
                                        type="number"
                                        value={markMarks}
                                        onChange={e => setMarkMarks(e.target.value)}
                                        placeholder="e.g. 4"
                                        min="1"
                                        max="40"
                                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600"
                                    />
                                </div>

                                {/* Question */}
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">The Question</label>
                                    <textarea
                                        value={markQuestion}
                                        onChange={e => setMarkQuestion(e.target.value)}
                                        placeholder="Paste or type the exam question here..."
                                        rows={3}
                                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 resize-none"
                                    />
                                </div>

                                {/* Answer */}
                                <div>
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Your Answer</label>
                                    <textarea
                                        value={markAnswer}
                                        onChange={e => setMarkAnswer(e.target.value)}
                                        placeholder="Type your answer exactly as you would write it in the exam..."
                                        rows={5}
                                        className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600 resize-none"
                                    />
                                </div>

                                <button
                                    onClick={handleMark}
                                    disabled={!markQuestion.trim() || !markAnswer.trim() || isMarking}
                                    className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                                        markQuestion.trim() && markAnswer.trim() && !isMarking
                                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                                            : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                    }`}
                                >
                                    {isMarking ? (
                                        <>
                                            <Loader className="w-4 h-4 animate-spin" />
                                            Marking like KNEC...
                                        </>
                                    ) : (
                                        <>
                                            <CheckSquare className="w-4 h-4" />
                                            Mark My Answer
                                        </>
                                    )}
                                </button>

                                <p className="text-[10px] text-slate-700 text-center font-bold uppercase tracking-widest">
                                    Strict KNEC marking • Point-by-point scoring
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── PREDICT MODE ── */}
                {mode === 'predict' && (
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        <div className="bg-amber-900/20 border border-amber-800/40 rounded-2xl p-4">
                            <p className="text-amber-300 text-xs font-bold leading-relaxed">
                                🔥 Based on KCSE/KPSEA past paper patterns 2015–2024, these topics are most likely to appear this year.
                            </p>
                        </div>

                        {/* Exam Type */}
                        <div className="grid grid-cols-3 gap-2">
                            {(['KCSE', 'KPSEA', 'JSS'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => { setPredictExamType(type); setPredictedTopics([]); }}
                                    className={`py-2 rounded-xl text-xs font-black transition-colors ${
                                        predictExamType === type
                                            ? 'bg-amber-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Subject */}
                        <select
                            value={predictSubject}
                            onChange={e => { setPredictSubject(e.target.value); setPredictedTopics([]); }}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-amber-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors"
                        >
                            <option value="">Select a subject...</option>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        <button
                            onClick={handlePredict}
                            disabled={!predictSubject || isPredicting}
                            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                                predictSubject && !isPredicting
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/40'
                                    : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                            }`}
                        >
                            {isPredicting ? (
                                <><Loader className="w-4 h-4 animate-spin" /> Analysing patterns...</>
                            ) : (
                                <><TrendingUp className="w-4 h-4" /> Generate Hot Topics</>
                            )}
                        </button>

                        {predictError && (
                            <div className="flex items-center gap-2 text-red-400 text-xs font-bold p-3 bg-red-900/20 rounded-xl border border-red-900/40">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {predictError}
                            </div>
                        )}

                        {predictedTopics.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {predictExamType} {predictSubject} · {predictedTopics.length} predicted topics
                                </p>
                                {predictedTopics.map((t, i) => (
                                    <div
                                        key={i}
                                        className={`rounded-2xl p-4 border ${
                                            t.probability === 'High'
                                                ? 'bg-rose-900/20 border-rose-800/40'
                                                : 'bg-slate-800/60 border-slate-700/60'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <p className="text-white font-black text-sm leading-tight">{t.topic}</p>
                                            <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${
                                                t.probability === 'High'
                                                    ? 'bg-rose-500/30 text-rose-300'
                                                    : 'bg-amber-500/20 text-amber-400'
                                            }`}>
                                                {t.probability === 'High' ? '🔥 High' : '⚡ Medium'}
                                            </span>
                                        </div>
                                        <p className="text-slate-400 text-[11px] mb-1.5">{t.reason}</p>
                                        <p className="text-indigo-400 text-[10px] font-bold">{t.paperSection}</p>
                                        <button
                                            onClick={() => {
                                                sendMessage(`Tell me what I need to know about "${t.topic}" for ${predictExamType} ${predictSubject} — what does KNEC expect and how is it marked?`);
                                                setMode('chat');
                                            }}
                                            className="mt-2 text-[10px] font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                                        >
                                            Ask Guru about this <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── PRACTICE MODE ── */}
                {mode === 'practice' && (
                    <div className="flex-1 overflow-y-auto p-5 space-y-4">
                        <div className="bg-rose-900/20 border border-rose-800/40 rounded-2xl p-4">
                            <p className="text-rose-300 text-xs font-bold leading-relaxed">
                                ✍️ Generate real KCSE-style practice questions. Try to answer them before revealing the marking guide.
                            </p>
                        </div>

                        {/* Exam type */}
                        <div className="grid grid-cols-3 gap-2">
                            {(['KCSE', 'KPSEA', 'JSS'] as const).map(type => (
                                <button key={type} onClick={() => { setPracticeExamType(type); setPracticeQuestions([]); }}
                                    className={`py-2 rounded-xl text-xs font-black transition-colors ${practiceExamType === type ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Subject */}
                        <select value={practiceSubject} onChange={e => { setPracticeSubject(e.target.value); setPracticeQuestions([]); }}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-rose-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors">
                            <option value="">Select subject...</option>
                            {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>

                        {/* Optional topic */}
                        <input type="text" value={practiceTopic} onChange={e => setPracticeTopic(e.target.value)}
                            placeholder="Optional: specific topic (e.g. Osmosis, Quadratic Equations)"
                            className="w-full bg-slate-900 border border-slate-700 focus:border-rose-600 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-600" />

                        <button onClick={handleGenerate} disabled={!practiceSubject || isGenerating}
                            className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${practiceSubject && !isGenerating ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>
                            {isGenerating ? <><Loader className="w-4 h-4 animate-spin" /> Generating...</> : <><PenLine className="w-4 h-4" /> Generate 3 Questions</>}
                        </button>

                        {generateError && (
                            <div className="flex items-center gap-2 text-red-400 text-xs font-bold p-3 bg-red-900/20 rounded-xl border border-red-900/40">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {generateError}
                            </div>
                        )}

                        {practiceQuestions.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    {practiceExamType} {practiceSubject}{practiceTopic ? ` · ${practiceTopic}` : ''} · {practiceQuestions.length} questions
                                </p>
                                {practiceQuestions.map((q, i) => (
                                    <div key={i} className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
                                        <div className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-rose-900/50 text-rose-300 text-[10px] font-black px-2 py-0.5 rounded-md">Q{q.number}</span>
                                                    <span className="text-[10px] text-slate-500 font-bold">{q.topic}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400">{q.marks} marks</span>
                                            </div>
                                            <p className="text-slate-200 text-sm font-medium leading-relaxed">{q.text}</p>
                                        </div>
                                        <div className="border-t border-slate-800 px-4 pb-3 pt-2 space-y-2">
                                            <button onClick={() => setExpandedPQ(expandedPQ === i ? null : i)}
                                                className="text-[11px] font-black text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors">
                                                {expandedPQ === i ? 'Hide' : 'Show'} Marking Guide <ChevronRight className={`w-3 h-3 transition-transform ${expandedPQ === i ? 'rotate-90' : ''}`} />
                                            </button>
                                            {expandedPQ === i && (
                                                <div className="bg-slate-800/50 rounded-xl p-3 text-[12px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                                                    {q.modelAnswerOutline}
                                                </div>
                                            )}
                                            <button onClick={() => { sendMessage(`Explain this ${practiceExamType} ${practiceSubject} question in detail and show how to get full marks: "${q.text}"`); setMode('chat'); }}
                                                className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                                                Ask Guru to explain <ChevronRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </motion.div>
        </>
    );
};
