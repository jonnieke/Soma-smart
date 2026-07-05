import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, User, CheckSquare, MessageCircle, ChevronRight, Loader, TrendingUp, AlertCircle, PenLine, LogIn, ShieldAlert } from 'lucide-react';
import { getExamGuruResponse, markCandidateAnswer, getPredictedTopics, PredictedTopic, generatePracticeQuestions, PracticeQuestion, RateLimitError, SystemQuotaError } from '../../services/geminiService';
import { PlanLimitError } from '../../services/planLimitService';

interface Message {
    id: string;
    role: 'user' | 'guru';
    content: string;
    isMarkResult?: boolean;
}

const formatGuruMessage = (content: string) => content
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*[*]\s+/gm, '- ')
    .trim();

const formatMarkingResult = (content: string) => content
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*/g, '')
    .replace(/^\s*[*]\s+/gm, '- ')
    .trim();

const PROMPT_CHIPS = [
    'Give me a 5-question drill on photosynthesis',
    'Mark my answer on osmosis',
    'KCSE Maths Paper 1 hot topics',
    'Explain this past paper question step by step',
    'How do I score full marks in English essays?',
];

const SUBJECTS = [
    'Mathematics', 'Biology', 'Chemistry', 'Physics',
    'English', 'Kiswahili', 'History', 'Geography',
    'CRE', 'IRE', 'Agriculture', 'Business Studies',
    'Computer Studies', 'Home Science', 'Art & Design',
];

export type PanelMode = 'chat' | 'mark' | 'predict' | 'practice';

interface SyllabusContext {
    grade?: string;
    subject?: string;
    topic?: string;
    sourceTitle?: string;
}

export const ExamGuruPanel: React.FC<{ onClose: () => void; onLogin?: () => void; initialMode?: PanelMode; initialPrompt?: string; syllabusContext?: SyllabusContext }> = ({ onClose, onLogin, initialMode = 'chat', initialPrompt = '', syllabusContext }) => {
    const focusTopic = syllabusContext?.topic || syllabusContext?.sourceTitle || '';
    const contextLabel = [syllabusContext?.grade, syllabusContext?.subject, syllabusContext?.topic || syllabusContext?.sourceTitle].filter(Boolean).join(' - ');
    const openingMessage = contextLabel
        ? `Quick check: what is the first thing you would say about ${focusTopic || contextLabel}? Choose a drill, paste a question, or answer in one line and I will keep us on this exact topic.`
        : "Exam Guru online. Pick a drill, paste a question, or ask for a marking check. I will stay on the exact paper skill, show what earns marks, and keep the repair conversation on the missed point.";
    const focusSubject = syllabusContext?.subject || '';
    const contextualPromptChips = contextLabel
        ? [
            focusTopic ? `Give me a 5-question drill on ${focusTopic}` : 'Give me a 5-question drill on this topic',
            focusTopic ? `Mark my answer on ${focusTopic}` : 'Mark my answer on this topic',
            focusSubject ? `KCSE ${focusSubject} hot topics` : 'KCSE hot topics for this subject',
            focusTopic ? `Explain ${focusTopic} step by step` : 'Explain this question step by step',
            focusSubject ? `How do I score full marks in ${focusSubject}?` : 'How do I score full marks here?',
        ]
        : PROMPT_CHIPS;
    const [mode, setMode] = useState<PanelMode>(initialMode);
    const [rateLimited, setRateLimited] = useState(false);
    const [quotaExceeded, setQuotaExceeded] = useState(false);

    // --- Chat state ---
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'guru',
            content: openingMessage,
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const autoSentInitialPromptRef = useRef('');
    const practiceContextAutoRunRef = useRef('');

    // --- Drill Questions state ---
    const [practiceSubject, setPracticeSubject] = useState('');
    const [practiceTopic, setPracticeTopic] = useState('');
    const [practiceExamType, setPracticeExamType] = useState<'KCSE' | 'KPSEA' | 'JSS'>('KCSE');
    const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestion[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState('');
    const [expandedPQ, setExpandedPQ] = useState<number | null>(null);

    const generatePracticeDrill = async (subject: string, topic: string, examType: 'KCSE' | 'KPSEA' | 'JSS') => {
        if (!subject) return false;
        setIsGenerating(true);
        setPracticeQuestions([]);
        setGenerateError('');
        setExpandedPQ(null);
        try {
            const questions = await generatePracticeQuestions(subject, topic, examType);
            if (questions.length === 0) setGenerateError('Could not generate questions. Try again.');
            else setPracticeQuestions(questions);
            return questions.length > 0;
        } catch (err: any) {
            if (err instanceof RateLimitError) { setRateLimited(true); }
            else if (err instanceof SystemQuotaError) { setQuotaExceeded(true); }
            else { setGenerateError('Generation failed. Check your connection.'); }
            return false;
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerate = async () => {
        await generatePracticeDrill(practiceSubject, practiceTopic, practiceExamType);
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
        } catch (err: any) {
            if (err instanceof RateLimitError) { setRateLimited(true); }
            else if (err instanceof SystemQuotaError) { setQuotaExceeded(true); }
            else { setPredictError('Prediction failed. Check connection.'); }
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

    useEffect(() => {
        setMode(initialMode);
    }, [initialMode]);

    useEffect(() => {
        if (!syllabusContext) return;
        if (syllabusContext.subject) {
            setPracticeSubject(prev => prev || syllabusContext.subject || '');
            setPredictSubject(prev => prev || syllabusContext.subject || '');
            setMarkSubject(prev => prev || syllabusContext.subject || '');
        }
        if (syllabusContext.topic || syllabusContext.sourceTitle) {
            setPracticeTopic(prev => prev || syllabusContext.topic || syllabusContext.sourceTitle || '');
        }
    }, [syllabusContext?.grade, syllabusContext?.subject, syllabusContext?.topic, syllabusContext?.sourceTitle]);

    useEffect(() => {
        if (mode !== 'practice' || !contextLabel || !focusSubject) return;
        if (practiceQuestions.length > 0 || isGenerating) return;
        const autoRunKey = `${contextLabel}::${focusTopic}`;
        if (practiceContextAutoRunRef.current === autoRunKey) return;
        practiceContextAutoRunRef.current = autoRunKey;
        if (practiceSubject !== focusSubject) setPracticeSubject(focusSubject);
        if (focusTopic && practiceTopic !== focusTopic) setPracticeTopic(focusTopic);
        void generatePracticeDrill(focusSubject, focusTopic, practiceExamType);
    }, [mode, contextLabel, focusSubject, focusTopic, practiceQuestions.length, isGenerating, practiceSubject, practiceTopic, practiceExamType]);

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
        } catch (err: any) {
            if (err instanceof RateLimitError) { setRateLimited(true); }
            else if (err instanceof SystemQuotaError) { setQuotaExceeded(true); }
            else if (err instanceof PlanLimitError) { setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'guru', content: err.message }]); }
            else { setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'guru', content: 'Connection issue. Please try again.' }]); }
        } finally {
            setIsTyping(false);
        }
    };

    useEffect(() => {
        const prompt = initialPrompt.trim();
        if (!prompt) return;

        if (initialMode !== 'chat') {
            setInput(prompt);
            return;
        }

        if (autoSentInitialPromptRef.current === prompt) return;
        autoSentInitialPromptRef.current = prompt;
        setInput('');
        void sendMessage(prompt);
    }, [initialMode, initialPrompt]);

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
        } catch (err: any) {
            if (err instanceof RateLimitError) { setRateLimited(true); }
            else if (err instanceof SystemQuotaError) { setQuotaExceeded(true); }
            else if (err instanceof PlanLimitError) { setMarkResult(err.message); }
            else { setMarkResult('Marking failed. Please check your connection and try again.'); }
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

    const discussMarkingResult = async () => {
        if (!markResult) return;
        const question = markQuestion.trim();
        const answer = markAnswer.trim();
        const result = formatMarkingResult(markResult);
        const subject = markSubject || 'this subject';
        const followUpPrompt = `Continue this marking conversation. Stay on the same topic and do not introduce a new topic until I say I understand.

Subject: ${subject}
Question:
${question}

My answer:
${answer}

Your marking result:
${result}

Now help me repair only the missed areas. Start with the first lost mark only, explain it in simple terms, show the exact wording that would earn it, then ask me one follow-up question to check if I understand.
Do not move to a new topic, new example, or new question until the candidate answers this follow-up or explicitly asks to continue.`;

        setMode('chat');
        setMarkResult(null);
        await sendMessage(followUpPrompt);
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
                            <h3 className="text-white font-black text-sm">Exam Guru Smart</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">KNEC Drill Desk · Soma Library grounded</span>
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
                        <MessageCircle className="w-3 h-3" /> Drill
                    </button>
                    <button onClick={() => setMode('mark')} className={`shrink-0 flex-1 flex items-center justify-center gap-1 py-3 text-[9px] font-black uppercase tracking-wider transition-colors min-w-0 px-2 ${ mode === 'mark' ? 'text-white border-b-2 border-emerald-500' : 'text-slate-500 hover:text-slate-300' }`}>
                        <CheckSquare className="w-3 h-3" /> Mark
                    </button>
                    <button onClick={() => setMode('predict')} className={`shrink-0 flex-1 flex items-center justify-center gap-1 py-3 text-[9px] font-black uppercase tracking-wider transition-colors min-w-0 px-2 ${ mode === 'predict' ? 'text-white border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300' }`}>
                        <TrendingUp className="w-3 h-3" /> High-Yield
                    </button>
                    <button onClick={() => setMode('practice')} className={`shrink-0 flex-1 flex items-center justify-center gap-1 py-3 text-[9px] font-black uppercase tracking-wider transition-colors min-w-0 px-2 ${ mode === 'practice' ? 'text-white border-b-2 border-rose-500' : 'text-slate-500 hover:text-slate-300' }`}>
                        <PenLine className="w-3 h-3" /> Drill Set
                    </button>
                </div>
                {contextLabel && (
                    <div className="bg-emerald-500/10 border-b border-white/5 px-4 py-2.5">
                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] font-bold text-emerald-200">
                            Focused on {contextLabel}
                        </div>
                    </div>
                )}

                {/* ── RATE LIMIT GATE ── */}
                <AnimatePresence>
                {rateLimited && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-end pb-10 justify-center bg-slate-950/90 backdrop-blur-sm"
                    >
                        <div className="w-full max-w-xs mx-4 bg-slate-900 border border-indigo-700/60 rounded-3xl p-6 text-center shadow-2xl space-y-4">
                            <div className="w-14 h-14 bg-indigo-900/50 border border-indigo-700/60 rounded-2xl flex items-center justify-center mx-auto">
                                <ShieldAlert className="w-7 h-7 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-base">Daily daily limit Reached</h3>
                                <p className="text-slate-400 text-xs mt-2 leading-relaxed font-medium">
                                    You&apos;ve used your free smart quota for today. Sign in or create a free account to get more Exam Guru sessions every day.
                                </p>
                            </div>
                            <button
                                onClick={() => { onClose(); onLogin?.(); }}
                                className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                            >
                                <LogIn className="w-4 h-4" /> Sign In to Continue
                            </button>
                            <button
                                onClick={() => setRateLimited(false)}
                                className="text-slate-600 text-xs font-bold hover:text-slate-400 transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* ── QUOTA EXCEEDED GATE ── */}
                <AnimatePresence>
                {quotaExceeded && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-end pb-10 justify-center bg-slate-950/90 backdrop-blur-sm"
                    >
                        <div className="w-full max-w-xs mx-4 bg-slate-900 border border-rose-700/60 rounded-3xl p-6 text-center shadow-2xl space-y-4">
                            <div className="w-14 h-14 bg-rose-900/50 border border-rose-700/60 rounded-2xl flex items-center justify-center mx-auto">
                                <AlertCircle className="w-7 h-7 text-rose-400" />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-base">Platform at Capacity</h3>
                                <p className="text-slate-400 text-xs mt-2 leading-relaxed font-medium">
                                    Our smart systems are currently handling maximum traffic. The engineers have been notified. Please try again in a few minutes.
                                </p>
                            </div>
                            <button
                                onClick={() => { setQuotaExceeded(false); onClose(); }}
                                className="w-full py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm flex items-center justify-center gap-2 transition-colors shadow-lg"
                            >
                                <X className="w-4 h-4" /> Close Panel
                            </button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                {/* ── CHAT MODE ── */}
                {mode === 'chat' && (
                    <>
                        {/* Prompt chips */}
                        <div className="px-4 py-2.5 bg-slate-900 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                            <span className="shrink-0 text-[10px] font-black text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl whitespace-nowrap">
                                Uses indexed past papers when available
                            </span>
                            {contextualPromptChips.map(chip => (
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
                                        {msg.role === 'guru' ? formatGuruMessage(msg.content) : msg.content}
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
                                    placeholder="Type a topic, mark scheme question, or paper problem..."
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
                        {contextLabel && (
                            <div className="px-5 pt-5">
                                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[11px] font-bold text-emerald-200 leading-relaxed">
                                    Marking is already focused on {contextLabel}. Paste the question and your answer, and I will keep the marking on this topic.
                                </div>
                            </div>
                        )}
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
                                    {formatMarkingResult(markResult)}
                                </div>
                                <button
                                    onClick={discussMarkingResult}
                                    className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors"
                                >
                                    Repair Missed Marks with Guru
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
                                            Mark Answer
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
                        {contextLabel && (
                            <div className="bg-amber-900/20 border border-amber-800/40 rounded-2xl p-4">
                                <p className="text-amber-300 text-xs font-bold leading-relaxed">
                                    {focusSubject ? `This prediction lane is already anchored to ${focusSubject}. Use it for likely questions on the current lesson.` : 'This prediction lane is already anchored to your current lesson.'}
                                </p>
                            </div>
                        )}
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
                                <><TrendingUp className="w-4 h-4" /> Generate High-Yield Topics</>
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
                                            Drill this topic <ChevronRight className="w-3 h-3" />
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
                        {contextLabel && (
                            <div className="bg-rose-900/20 border border-rose-800/40 rounded-2xl p-4">
                                <p className="text-rose-300 text-xs font-bold leading-relaxed">
                                    {focusTopic ? `Practice is ready for ${focusTopic}. Generate the drill from the current topic and keep the style exam-like.` : 'Practice is already anchored to your current lesson. Generate an exam-style drill from this topic.'}
                                </p>
                            </div>
                        )}
                        <div className="bg-rose-900/20 border border-rose-800/40 rounded-2xl p-4">
                            <p className="text-rose-300 text-xs font-bold leading-relaxed">
                                ✍️ Generate real KCSE-style drill questions. Try to answer them before revealing the marking guide.
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
                            {isGenerating ? <><Loader className="w-4 h-4 animate-spin" /> Generating...</> : <><PenLine className="w-4 h-4" /> Generate Drill</>}
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
                                                Explain this drill <ChevronRight className="w-3 h-3" />
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
