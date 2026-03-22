import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Volume2, VolumeX, Send, ArrowLeft,
    MessageCircle, BookOpen, Languages, Sparkles,
    Globe, ChevronRight, Loader2, RefreshCw, Star,
    Zap, BookText, Headphones, PenTool, Flame
} from 'lucide-react';
import {
    chatTalkback, chatLanguageTutor, transcribeAudioForChat,
    TalkbackMessage, LanguageTutorResponse
} from '../../services/geminiService';
import {
    speakConversational, stopSpeech,
    TALKBACK_VOICES, LANGUAGE_TUTOR_VOICES
} from '../../services/elevenLabsService';

// ─── Types ───────────────────────────────────────────────────────
type FeatureScreen = 'HOME' | 'TALKBACK' | 'LANGUAGE_TUTOR';
type TutorMode = 'conversation' | 'pronunciation' | 'sentences' | 'story';
type ChatLang = 'en' | 'sw';

interface ConversationalTutorProps {
    onBack: () => void;
}

// ─── Constants ───────────────────────────────────────────────────
const GREETING: Record<ChatLang, string> = {
    en: "Hey there! I'm Somo Buddy 🌟 Your personal AI conversation partner. What's on your mind today? We can chat about anything — school, hobbies, or just have a fun conversation!",
    sw: "Habari! Mimi ni Somo Buddy 🌟 Mwenzako wa mazungumzo wa AI. Una nini akilini leo? Tunaweza kuzungumza kuhusu chochote — shule, burudani, au mazungumzo ya kawaida!"
};

const TUTOR_GREETING: Record<ChatLang, string> = {
    en: "Welcome! I'm Mwalimu Somo, your dedicated language coach 🎓 I'm here to help you speak, write and understand with confidence. Start by telling me something — anything — and I'll guide you from there!",
    sw: "Karibu! Mimi ni Mwalimu Somo, kocha wako wa lugha 🎓 Niko hapa kukusaidia kuzungumza, kuandika na kuelewa kwa ujasiri. Anza kwa kuniambia kitu chochote — nami nitakuongoza!"
};

const MODE_CONFIG: Record<TutorMode, { icon: React.ReactNode; en: string; sw: string; desc: string; color: string }> = {
    conversation: {
        icon: <MessageCircle className="w-4 h-4" />,
        en: 'Free Chat', sw: 'Mazungumzo',
        desc: 'Open conversation practice',
        color: 'bg-emerald-500'
    },
    pronunciation: {
        icon: <Headphones className="w-4 h-4" />,
        en: 'Pronunciation', sw: 'Matamshi',
        desc: 'Sound and tone coaching',
        color: 'bg-blue-500'
    },
    sentences: {
        icon: <PenTool className="w-4 h-4" />,
        en: 'Sentences', sw: 'Sentensi',
        desc: 'Build better sentences',
        color: 'bg-violet-500'
    },
    story: {
        icon: <BookText className="w-4 h-4" />,
        en: 'Storytelling', sw: 'Hadithi',
        desc: 'Creative narration',
        color: 'bg-amber-500'
    }
};

// ─── Audio Visualizer ────────────────────────────────────────────
const AudioWaveVisualizer: React.FC<{ isActive: boolean; color?: string }> = ({ isActive, color = '#6366f1' }) => (
    <div className="flex items-center justify-center gap-[3px] h-8">
        {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
                key={i}
                className="rounded-full"
                style={{ width: 4, backgroundColor: color }}
                animate={isActive ? {
                    height: [8, 24 + Math.random() * 12, 8],
                    opacity: [0.6, 1, 0.6]
                } : { height: 8, opacity: 0.3 }}
                transition={isActive ? {
                    duration: 0.5 + Math.random() * 0.3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.08
                } : { duration: 0.3 }}
            />
        ))}
    </div>
);

// ─── AI Avatar ───────────────────────────────────────────────────
const AIAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; isTutor?: boolean; isAnimated?: boolean }> = ({
    size = 'md', isTutor = false, isAnimated = false
}) => {
    const sizeMap = { sm: 'w-8 h-8 text-base', md: 'w-11 h-11 text-xl', lg: 'w-20 h-20 text-4xl' };
    const gradient = isTutor
        ? 'from-emerald-400 via-teal-500 to-cyan-500'
        : 'from-indigo-400 via-purple-500 to-pink-500';

    return (
        <motion.div
            className={`${sizeMap[size]} rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
            animate={isAnimated ? { scale: [1, 1.05, 1] } : {}}
            transition={isAnimated ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
        >
            <span>{isTutor ? '🎓' : '🤖'}</span>
        </motion.div>
    );
};

// ─── Chat Bubble ─────────────────────────────────────────────────
const ChatBubble: React.FC<{
    message: TalkbackMessage;
    tutorResponse?: LanguageTutorResponse;
    isLanguageTutor?: boolean;
    onSpeak?: (text: string) => void;
    isSpeaking?: boolean;
}> = ({ message, tutorResponse, isLanguageTutor, onSpeak, isSpeaking }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 gap-2`}
        >
            {!isUser && (
                <AIAvatar size="sm" isTutor={isLanguageTutor} />
            )}

            <div className={`max-w-[80%] ${isUser ? '' : ''}`}>
                {/* Main bubble */}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-none shadow-md shadow-indigo-200 dark:shadow-indigo-900/30'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-md shadow-slate-200/80 dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700'
                }`}
                >
                    <p className="whitespace-pre-wrap">{message.text}</p>

                    {/* Speaker button for AI messages */}
                    {!isUser && (
                        <button
                            onClick={() => onSpeak?.(message.text)}
                            className={`mt-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${isSpeaking
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                            title="Listen"
                        >
                            {isSpeaking
                                ? <><VolumeX className="w-3.5 h-3.5" /> Stop</>
                                : <><Volume2 className="w-3.5 h-3.5" /> Listen</>
                            }
                        </button>
                    )}
                </div>

                {/* Language Tutor feedback cards */}
                {!isUser && isLanguageTutor && tutorResponse && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-2"
                    >
                        {tutorResponse.correction && (
                            <div className="px-3 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                                <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">✏️ Correction</p>
                                <p className="text-xs text-amber-800 dark:text-amber-300">{tutorResponse.correction}</p>
                            </div>
                        )}
                        {tutorResponse.pronunciationTip && (
                            <div className="px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
                                <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400 mb-1 flex items-center gap-1">🗣️ Pronunciation Tip</p>
                                <p className="text-xs text-blue-800 dark:text-blue-300">{tutorResponse.pronunciationTip}</p>
                            </div>
                        )}
                        {tutorResponse.exampleSentence && (
                            <div className="px-3 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
                                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">📝 Try This</p>
                                <p className="text-xs text-emerald-800 dark:text-emerald-300 italic">"{tutorResponse.exampleSentence}"</p>
                            </div>
                        )}
                        {tutorResponse.storySegment && (
                            <div className="px-3 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40">
                                <p className="text-[11px] font-bold text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-1">📖 Story</p>
                                <p className="text-xs text-purple-800 dark:text-purple-300">{tutorResponse.storySegment}</p>
                            </div>
                        )}
                        {tutorResponse.encouragement && (
                            <div className="flex items-center justify-center gap-2 py-1">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <p className="text-xs text-center text-indigo-500 dark:text-indigo-400 font-semibold">
                                    {tutorResponse.encouragement}
                                </p>
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            </div>
                        )}
                    </motion.div>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs flex-shrink-0 self-end border-2 border-indigo-200 dark:border-indigo-800">
                    You
                </div>
            )}
        </motion.div>
    );
};

// ─── Main Component ──────────────────────────────────────────────
export const ConversationalTutor: React.FC<ConversationalTutorProps> = ({ onBack }) => {
    const [screen, setScreen] = useState<FeatureScreen>('HOME');
    const [chatLang, setChatLang] = useState<ChatLang>('en');
    const [tutorMode, setTutorMode] = useState<TutorMode>('conversation');

    const [messages, setMessages] = useState<TalkbackMessage[]>([]);
    const [tutorResponses, setTutorResponses] = useState<Map<number, LanguageTutorResponse>>(new Map());
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        return () => {
            stopSpeech();
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    // ─── Recording ───────────────────────────────────────────────
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            let mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
                MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                stream.getTracks().forEach(t => t.stop());
                if (timerRef.current) clearInterval(timerRef.current);
                setRecordingTime(0);
                if (blob.size === 0) { setIsRecording(false); return; }

                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64 = (reader.result as string).split(',')[1];
                    setIsLoading(true);
                    try {
                        const transcript = await transcribeAudioForChat(base64, mimeType, chatLang);
                        if (transcript.trim()) await handleSendMessage(transcript.trim());
                    } catch (err) {
                        console.error('Transcription failed:', err);
                    } finally {
                        setIsLoading(false);
                    }
                };
            };

            mediaRecorder.start(500);
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
        } catch (err) {
            console.error('Microphone error:', err);
        }
    }, [chatLang]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    // ─── Send Message ────────────────────────────────────────────
    const handleSendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;
        const userMsg: TalkbackMessage = { role: 'user', text: text.trim(), timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            if (screen === 'TALKBACK') {
                const reply = await chatTalkback(text, messages, chatLang);
                const aiMsg: TalkbackMessage = { role: 'ai', text: reply, timestamp: Date.now() };
                setMessages(prev => [...prev, aiMsg]);
                const voiceId = TALKBACK_VOICES[chatLang];
                setIsSpeaking(true);
                try { await speakConversational(reply, voiceId); } catch { /* silent */ } finally { setIsSpeaking(false); }
            } else if (screen === 'LANGUAGE_TUTOR') {
                const response = await chatLanguageTutor(text, messages, chatLang, tutorMode);
                const aiMsg: TalkbackMessage = { role: 'ai', text: response.reply, timestamp: Date.now() };
                setMessages(prev => [...prev, aiMsg]);
                setTutorResponses(prev => new Map(prev).set(aiMsg.timestamp, response));
                const voiceId = LANGUAGE_TUTOR_VOICES[chatLang];
                setIsSpeaking(true);
                try { await speakConversational(response.reply, voiceId); } catch { /* silent */ } finally { setIsSpeaking(false); }
            }
        } catch {
            const errorMsg: TalkbackMessage = {
                role: 'ai',
                text: chatLang === 'sw' ? 'Pole, kuna tatizo. Jaribu tena! 😊' : "Oops, something went wrong. Let's try again! 😊",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [screen, messages, chatLang, tutorMode]);

    const handleSpeak = useCallback(async (text: string) => {
        if (isSpeaking) { stopSpeech(); setIsSpeaking(false); return; }
        const voiceId = screen === 'TALKBACK' ? TALKBACK_VOICES[chatLang] : LANGUAGE_TUTOR_VOICES[chatLang];
        setIsSpeaking(true);
        try { await speakConversational(text, voiceId); } catch { /* silent */ } finally { setIsSpeaking(false); }
    }, [isSpeaking, screen, chatLang]);

    const openChat = useCallback((targetScreen: FeatureScreen) => {
        setMessages([{
            role: 'ai',
            text: targetScreen === 'TALKBACK' ? GREETING[chatLang] : TUTOR_GREETING[chatLang],
            timestamp: Date.now()
        }]);
        setTutorResponses(new Map());
        setScreen(targetScreen);
    }, [chatLang]);

    const resetChat = useCallback(() => {
        stopSpeech();
        setMessages([{
            role: 'ai',
            text: screen === 'TALKBACK' ? GREETING[chatLang] : TUTOR_GREETING[chatLang],
            timestamp: Date.now()
        }]);
        setTutorResponses(new Map());
    }, [screen, chatLang]);

    // ─── HOME SCREEN ─────────────────────────────────────────────
    if (screen === 'HOME') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-x-hidden">
                {/* Hero Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 px-5 pt-14 pb-28">
                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-pink-400/20 rounded-full translate-y-16 -translate-x-12 blur-xl" />

                    <button
                        onClick={onBack}
                        className="absolute top-5 left-4 p-2 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>

                    <div className="relative z-10 text-center">
                        {/* AI Avatar */}
                        <motion.div
                            className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-white/20 backdrop-blur-md border-2 border-white/30 flex items-center justify-center shadow-2xl"
                            animate={{ scale: [1, 1.04, 1] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <span className="text-4xl">🤖</span>
                        </motion.div>

                        <h1 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Talk &amp; Learn</h1>
                        <p className="text-sm text-white/75 max-w-xs mx-auto">
                            Your AI-powered speaking and language coach — available 24/7
                        </p>

                        {/* Stats row */}
                        <div className="flex justify-center gap-3 mt-5">
                            {[
                                { icon: <Flame className="w-3.5 h-3.5" />, label: 'AI-Powered' },
                                { icon: <Globe className="w-3.5 h-3.5" />, label: '2 Languages' },
                                { icon: <Zap className="w-3.5 h-3.5" />, label: 'Voice Input' },
                            ].map(({ icon, label }) => (
                                <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-white text-[11px] font-semibold border border-white/20">
                                    {icon} {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cards pulled up over the hero */}
                <div className="px-4 -mt-16 pb-24 space-y-4 relative z-10">

                    {/* Language Toggle */}
                    <div className="flex gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-lg shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-800">
                        {(['en', 'sw'] as ChatLang[]).map(lang => (
                            <button
                                key={lang}
                                onClick={() => setChatLang(lang)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${chatLang === lang
                                    ? lang === 'en'
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200 dark:shadow-blue-900/40'
                                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/40'
                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                {lang === 'en' ? '🇬🇧 English' : '🇰🇪 Kiswahili'}
                            </button>
                        ))}
                    </div>

                    {/* Talkback Card */}
                    <motion.button
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openChat('TALKBACK')}
                        className="w-full text-left"
                    >
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-1 shadow-xl shadow-purple-300/40 dark:shadow-purple-900/50">
                            <div className="bg-white/10 backdrop-blur rounded-[20px] p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                                        🤖
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                        Live AI
                                    </div>
                                </div>

                                <h2 className="text-xl font-extrabold text-white mb-1">Somo Buddy Talkback</h2>
                                <p className="text-sm text-white/80 mb-4 leading-relaxed">
                                    {chatLang === 'sw'
                                        ? 'Zungumza na AI kwa sauti au maandishi. Uliza maswali, simulia hadithi, na ujifunze kwa mazungumzo ya asili!'
                                        : 'Speak or type to your AI buddy. Ask questions, explore topics, and build confidence through natural conversations!'}
                                </p>

                                {/* Feature chips */}
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {[
                                        { icon: <Mic className="w-3 h-3" />, label: chatLang === 'sw' ? 'Kurekodi Sauti' : 'Voice Recording' },
                                        { icon: <Headphones className="w-3 h-3" />, label: chatLang === 'sw' ? 'Jibu la Sauti' : 'Audio Replies' },
                                        { icon: <Globe className="w-3 h-3" />, label: chatLang === 'sw' ? 'Kiswahili + Kiingereza' : 'EN + SW' },
                                    ].map(({ icon, label }) => (
                                        <span key={label} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-semibold">
                                            {icon} {label}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-white">
                                        {chatLang === 'sw' ? 'Anza Sasa' : 'Start Chatting'}
                                    </span>
                                    <div className="w-8 h-8 rounded-xl bg-white/25 flex items-center justify-center">
                                        <ChevronRight className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.button>

                    {/* Language Coach Card */}
                    <motion.button
                        whileHover={{ y: -3, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openChat('LANGUAGE_TUTOR')}
                        className="w-full text-left"
                    >
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-1 shadow-xl shadow-emerald-300/40 dark:shadow-emerald-900/50">
                            <div className="bg-white/10 backdrop-blur rounded-[20px] p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-3xl">
                                        🎓
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                                        <Sparkles className="w-3 h-3" />
                                        Coaching
                                    </div>
                                </div>

                                <h2 className="text-xl font-extrabold text-white mb-1">
                                    {chatLang === 'sw' ? 'Kocha wa Lugha' : 'Language Coach'}
                                </h2>
                                <p className="text-sm text-white/80 mb-4 leading-relaxed">
                                    {chatLang === 'sw'
                                        ? 'Jifunze kutamka vizuri, kujenga sentensi nzuri, na kusimulia hadithi kwa ujasiri wa kipekee!'
                                        : 'Master pronunciation, build perfect sentences, and tell amazing stories — guided by your personal AI language coach!'}
                                </p>

                                {/* Mode chips */}
                                <div className="grid grid-cols-2 gap-2 mb-5">
                                    {(Object.entries(MODE_CONFIG) as [TutorMode, typeof MODE_CONFIG[TutorMode]][]).map(([mode, config]) => (
                                        <div key={mode} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/20">
                                            <span className="text-white">{config.icon}</span>
                                            <span className="text-white text-[11px] font-semibold">{config[chatLang]}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-white">
                                        {chatLang === 'sw' ? 'Anza Kujifunza' : 'Start Learning'}
                                    </span>
                                    <div className="w-8 h-8 rounded-xl bg-white/25 flex items-center justify-center">
                                        <ChevronRight className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.button>

                    {/* Fun Fact Strip */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                {chatLang === 'sw' ? 'Ukweli wa Kuvutia' : 'Did You Know?'}
                            </p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            {chatLang === 'sw'
                                ? '🌍 Kiswahili kinazungumzwa na watu zaidi ya milioni 200 Afrika Mashariki. Ni lugha ya kweli ya bara!'
                                : '🌍 Swahili is spoken by over 200 million people in East Africa — and practice with AI has been shown to boost fluency by up to 40%!'}
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ─── CHAT SCREEN ─────────────────────────────────────────────
    const isTutor = screen === 'LANGUAGE_TUTOR';

    return (
        <div className="flex flex-col bg-slate-50 dark:bg-slate-950" style={{ height: '100dvh' }}>

            {/* ── Chat Header ── */}
            <div className={`flex-shrink-0 bg-gradient-to-r ${isTutor
                ? 'from-emerald-500 via-teal-500 to-cyan-600'
                : 'from-indigo-500 via-purple-500 to-pink-600'
            } shadow-lg`}>
                <div className="px-4 pt-4 pb-3">
                    <div className="flex items-center justify-between">
                        {/* Left: Back + identity */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { stopSpeech(); setScreen('HOME'); }}
                                className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0"
                            >
                                <ArrowLeft className="w-4 h-4 text-white" />
                            </button>

                            <AIAvatar size="sm" isTutor={isTutor} isAnimated={isLoading} />

                            <div>
                                <h2 className="text-sm font-extrabold text-white leading-tight">
                                    {isTutor
                                        ? (chatLang === 'sw' ? 'Mwalimu Somo' : 'Language Coach')
                                        : 'Somo Buddy'}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-bounce' : 'bg-green-400 animate-pulse'}`} />
                                    <span className="text-[10px] text-white/80 font-medium">
                                        {isLoading
                                            ? (chatLang === 'sw' ? 'Inafikiri...' : 'Thinking...')
                                            : (chatLang === 'sw' ? 'Mtandaoni' : 'Online')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Lang toggle + reset */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setChatLang(l => l === 'en' ? 'sw' : 'en')}
                                className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-[11px] font-bold hover:bg-white/30 transition-colors"
                            >
                                {chatLang === 'en' ? '🇰🇪 SW' : '🇬🇧 EN'}
                            </button>
                            <button onClick={resetChat} className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors" title="New Chat">
                                <RefreshCw className="w-3.5 h-3.5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Mode pills — Language Tutor only */}
                    {isTutor && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
                            {(Object.entries(MODE_CONFIG) as [TutorMode, typeof MODE_CONFIG[TutorMode]][]).map(([mode, config]) => (
                                <button
                                    key={mode}
                                    onClick={() => setTutorMode(mode)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${tutorMode === mode
                                        ? 'bg-white text-emerald-700 shadow-md'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                                >
                                    {config.icon}
                                    {config[chatLang]}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Messages ── */}
            <div className="flex-1 overflow-y-auto px-4 py-5">
                <AnimatePresence>
                    {messages.map((msg) => (
                        <ChatBubble
                            key={msg.timestamp}
                            message={msg}
                            tutorResponse={tutorResponses.get(msg.timestamp)}
                            isLanguageTutor={isTutor && msg.role === 'ai'}
                            onSpeak={msg.role === 'ai' ? handleSpeak : undefined}
                            isSpeaking={isSpeaking}
                        />
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 mb-4"
                    >
                        <AIAvatar size="sm" isTutor={isTutor} />
                        <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-700 flex items-center gap-2.5">
                            <Loader2 className={`w-4 h-4 animate-spin ${isTutor ? 'text-emerald-500' : 'text-indigo-500'}`} />
                            <span className="text-xs text-slate-400">
                                {chatLang === 'sw' ? 'Inafikiri...' : 'Thinking...'}
                            </span>
                        </div>
                    </motion.div>
                )}

                <div ref={chatEndRef} className="h-4" />
            </div>

            {/* ── Input Area — fixed to bottom, always fully visible ── */}
            <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">

                {/* Recording indicator */}
                <AnimatePresence>
                    {isRecording && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800"
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <AudioWaveVisualizer isActive={true} color={isTutor ? '#10b981' : '#6366f1'} />
                            <span className="text-xs font-mono font-bold text-slate-500">
                                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Speaking indicator */}
                <AnimatePresence>
                    {isSpeaking && !isRecording && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800"
                        >
                            <Volume2 className={`w-4 h-4 ${isTutor ? 'text-emerald-500' : 'text-indigo-500'}`} />
                            <AudioWaveVisualizer isActive={true} color={isTutor ? '#10b981' : '#6366f1'} />
                            <button
                                onClick={() => { stopSpeech(); setIsSpeaking(false); }}
                                className="text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors"
                            >
                                {chatLang === 'sw' ? 'Simama' : 'Stop'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input row */}
                <div className="px-4 py-3 flex items-end gap-2">
                    {/* Text input */}
                    <div className="flex-1 relative min-w-0">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && inputText.trim()) {
                                    e.preventDefault();
                                    handleSendMessage(inputText);
                                }
                            }}
                            placeholder={chatLang === 'sw' ? 'Andika ujumbe...' : 'Type a message...'}
                            className={`w-full px-4 py-3 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 transition bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-200 dark:focus:border-indigo-800 ${isTutor ? 'focus:ring-emerald-300 dark:focus:ring-emerald-800' : 'focus:ring-indigo-300 dark:focus:ring-indigo-800'}`}
                            disabled={isLoading || isRecording}
                        />
                    </div>

                    {/* Send button — shows when text is present */}
                    <AnimatePresence>
                        {inputText.trim() && (
                            <motion.button
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                onClick={() => handleSendMessage(inputText)}
                                disabled={isLoading}
                                className={`flex-shrink-0 p-3 rounded-2xl bg-gradient-to-r ${isTutor
                                    ? 'from-emerald-500 to-teal-600 shadow-emerald-200 dark:shadow-emerald-900/40'
                                    : 'from-indigo-500 to-purple-600 shadow-indigo-200 dark:shadow-indigo-900/40'
                                } text-white shadow-md hover:shadow-lg transition-all`}
                            >
                                <Send className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Mic button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoading}
                        className={`flex-shrink-0 p-3 rounded-2xl transition-all shadow-md ${isRecording
                            ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-200 dark:shadow-red-900/40 animate-pulse'
                            : `bg-gradient-to-r ${isTutor
                                ? 'from-emerald-500 to-teal-600 shadow-emerald-200 dark:shadow-emerald-900/40'
                                : 'from-indigo-500 to-purple-600 shadow-indigo-200 dark:shadow-indigo-900/40'
                            } text-white hover:shadow-lg`
                        } ${isLoading ? 'opacity-40 cursor-not-allowed' : ''}`}
                    >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </motion.button>
                </div>

                {/* Helper hint */}
                <p className="text-center text-[10px] text-slate-400 pb-3">
                    {isRecording
                        ? (chatLang === 'sw' ? '🔴 Inarekodiwa — gusa kuacha' : '🔴 Recording — tap mic to stop')
                        : (chatLang === 'sw' ? 'Gusa 🎤 kusema au andika ujumbe' : 'Tap 🎤 to speak or type a message')
                    }
                </p>
            </div>
        </div>
    );
};

export default ConversationalTutor;
