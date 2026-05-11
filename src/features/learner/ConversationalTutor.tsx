import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Volume2, VolumeX, Send, ArrowLeft,
    MessageCircle, Languages, Sparkles,
    Globe, Loader2, RefreshCw,
    Headphones, PenTool, BookText
} from 'lucide-react';
import {
    chatTalkback, chatLanguageTutor, transcribeAudioForChat,
    TalkbackMessage, LanguageTutorResponse,
    chatTalkbackStream, processStream
} from '../../services/geminiService';
import { useApp } from '../../context/AppContext';
import {
    speakConversational, stopSpeech,
    TALKBACK_VOICES, LANGUAGE_TUTOR_VOICES,
    queueSpeak, clearSpeechQueue
} from '../../services/elevenLabsService';

import somoBuddyImg from '../../assets/images/somo_buddy_avatar.png';
import mwalimuSomoImg from '../../assets/images/mwalimu_somo_avatar.png';

// ─── Types ───────────────────────────────────────────────────────
type ActiveMode = 'TALKBACK' | 'LANGUAGE_TUTOR';
type TutorMode = 'conversation' | 'pronunciation' | 'sentences' | 'story';
type ChatLang = 'en' | 'sw';

interface ConversationalTutorProps {
    onBack: () => void;
    onBeforeMessage?: () => boolean;
}

// ─── Constants ───────────────────────────────────────────────────
const GREETING: Record<ChatLang, string> = {
    en: "Hey! I'm Akili ✨ Your Kenyan learning buddy! Ask me anything — a subject, a concept, or something you're stuck on. Niko hapa!",
    sw: "Habari! Mimi ni Akili ✨ Rafiki yako wa kujifunza! Niulize chochote — somo, dhana, au kitu unachoshindwa. Niko hapa!"
};

const TUTOR_GREETING: Record<ChatLang, string> = {
    en: "Hi! I'm Mwalimu Akili 🎓 Tell me something — a sentence, a word, or a phrase — and I'll coach you from there!",
    sw: "Karibu! Mimi ni Mwalimu Akili 🎓 Niambie kitu — sentensi, neno, au msemo — nami nitakuongoza!"
};

const MODE_CONFIG: Record<TutorMode, { icon: React.ReactNode; en: string; sw: string; color: string }> = {
    conversation: {
        icon: <MessageCircle className="w-3.5 h-3.5" />,
        en: 'Free Chat', sw: 'Mazungumzo',
        color: 'emerald'
    },
    pronunciation: {
        icon: <Headphones className="w-3.5 h-3.5" />,
        en: 'Pronunciation', sw: 'Matamshi',
        color: 'blue'
    },
    sentences: {
        icon: <PenTool className="w-3.5 h-3.5" />,
        en: 'Sentences', sw: 'Sentensi',
        color: 'violet'
    },
    story: {
        icon: <BookText className="w-3.5 h-3.5" />,
        en: 'Story', sw: 'Hadithi',
        color: 'amber'
    }
};

// ─── Audio Visualizer ────────────────────────────────────────────
const AudioWaveVisualizer: React.FC<{ isActive: boolean }> = ({ isActive }) => (
    <div className="flex items-center justify-center gap-[3px] h-6">
        {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
                key={i}
                className="rounded-full bg-white/80"
                style={{ width: 3 }}
                animate={isActive ? {
                    height: [4, 16 + i * 4, 4],
                    opacity: [0.5, 1, 0.5]
                } : { height: 4, opacity: 0.3 }}
                transition={isActive ? {
                    duration: 0.6,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.1
                } : { duration: 0.3 }}
            />
        ))}
    </div>
);

// ─── Chat Bubble ─────────────────────────────────────────────────
const ChatBubble: React.FC<{
    message: TalkbackMessage;
    tutorResponse?: LanguageTutorResponse;
    isLanguageTutor?: boolean;
    isTutor?: boolean;
    onSpeak?: (text: string) => void;
    isSpeaking?: boolean;
}> = ({ message, tutorResponse, isLanguageTutor, isTutor, onSpeak, isSpeaking }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3 gap-2`}
        >
            {!isUser && (
                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0 self-end border border-white/20 shadow-md">
                    <img
                        src={isTutor ? mwalimuSomoImg : somoBuddyImg}
                        alt="AI"
                        className="w-full h-full object-cover"
                    />
                </div>
            )}

            <div className="max-w-[80%]">
                {/* Main bubble */}
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${isUser
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-lg shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-md border-2 border-slate-300 dark:border-slate-700/50'
                }`}
                >
                    <p className="whitespace-pre-wrap font-medium">{message.text.replace(/\*\*/g, '')}</p>
                    {!isUser && (
                        <button
                            onClick={() => onSpeak?.(message.text)}
                            className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${isSpeaking
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400 ring-1 ring-indigo-200 dark:ring-indigo-800'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border-2 border-slate-300 dark:border-slate-700'
                            }`}
                        >
                            {isSpeaking
                                ? <><VolumeX className="w-4 h-4" /> Stop</>
                                : <><Volume2 className="w-4 h-4" /> Listen</>
                            }
                        </button>
                    )}
                </div>

                {/* Language Tutor inline feedback (no separate cards) */}
                {!isUser && isLanguageTutor && tutorResponse && (
                    <div className="mt-1.5 space-y-1">
                        {tutorResponse.correction && (
                            <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 text-xs text-amber-800 dark:text-amber-300">
                                <span className="font-bold">✏️ </span>{tutorResponse.correction}
                            </div>
                        )}
                        {tutorResponse.pronunciationTip && (
                            <div className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 text-xs text-blue-800 dark:text-blue-300">
                                <span className="font-bold">🗣️ </span>{tutorResponse.pronunciationTip}
                            </div>
                        )}
                        {tutorResponse.exampleSentence && (
                            <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 text-xs text-emerald-800 dark:text-emerald-300 italic">
                                "{tutorResponse.exampleSentence}"
                            </div>
                        )}
                        {tutorResponse.encouragement && (
                            <p className="text-center text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold py-0.5">
                                ⭐ {tutorResponse.encouragement}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs flex-shrink-0 self-end border border-indigo-200 dark:border-indigo-800">
                    You
                </div>
            )}
        </motion.div>
    );
};

// ─── Quick Starters ───────────────────────────────────────────────
const QUICK_STARTERS: Record<ChatLang, string[]> = {
    en: [
        "Explain photosynthesis simply",
        "How do I solve quadratic equations?",
        "What caused World War 1?",
        "Help me with Kiswahili grammar",
        "Summarize the water cycle"
    ],
    sw: [
        "Eleza usanisinuru kwa urahisi",
        "Jinsi ya kutatua milinganyo ya pili",
        "Nini kilisababisha Vita vya Kwanza?",
        "Nisaidie na sarufi ya Kiingereza",
        "Fupisha mzunguko wa maji"
    ]
};

// ─── Main Component ──────────────────────────────────────────────
export const ConversationalTutor: React.FC<ConversationalTutorProps> = ({ onBack, onBeforeMessage }) => {
    const { educationLevel } = useApp();
    const [activeMode, setActiveMode] = useState<ActiveMode>('TALKBACK');
    const [chatLang, setChatLang] = useState<ChatLang>('en');
    const [tutorMode, setTutorMode] = useState<TutorMode>('conversation');

    const [messages, setMessages] = useState<TalkbackMessage[]>([{
        role: 'ai',
        text: GREETING['en'],
        timestamp: Date.now()
    }]);
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

    const isTutor = activeMode === 'LANGUAGE_TUTOR';

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

    // Switch mode — reset chat with appropriate greeting
    const switchMode = useCallback((mode: ActiveMode) => {
        stopSpeech();
        setActiveMode(mode);
        setMessages([{
            role: 'ai',
            text: mode === 'TALKBACK' ? GREETING[chatLang] : TUTOR_GREETING[chatLang],
            timestamp: Date.now()
        }]);
        setTutorResponses(new Map());
        setInputText('');
    }, [chatLang]);

    // Reset current chat
    const resetChat = useCallback(() => {
        stopSpeech();
        setMessages([{
            role: 'ai',
            text: isTutor ? TUTOR_GREETING[chatLang] : GREETING[chatLang],
            timestamp: Date.now()
        }]);
        setTutorResponses(new Map());
        setInputText('');
    }, [isTutor, chatLang]);

    // ─── Send Message ────────────────────────────────────────────
    const handleSendMessage = useCallback(async (text: string) => {
        if (!text.trim()) return;
        if (onBeforeMessage && !onBeforeMessage()) return;
        const userMsg: TalkbackMessage = { role: 'user', text: text.trim(), timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            if (activeMode === 'TALKBACK') {
                const voiceId = TALKBACK_VOICES[chatLang];
                setIsSpeaking(true);
                clearSpeechQueue();

                const stream = await chatTalkbackStream(text, messages, chatLang, educationLevel);
                let fullText = "";
                let spokenText = "";

                const aiMsgId = Date.now();
                setMessages(prev => [...prev, { role: 'ai', text: '', timestamp: aiMsgId }]);

                await processStream(stream, (chunk) => {
                    fullText = chunk;
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg && lastMsg.role === 'ai') {
                            lastMsg.text = fullText;
                        }
                        return newMessages;
                    });

                    const untranslated = fullText.slice(spokenText.length);
                    const sentenceMatch = untranslated.match(/[^.!?]+[.!?]/g);
                    if (sentenceMatch) {
                        for (const sentence of sentenceMatch) {
                            queueSpeak(sentence.trim(), voiceId);
                            spokenText += sentence;
                        }
                    }
                });

                // FALLBACK: If the stream finished but fullText is still empty, the model failed or proxy cut off
                if (!fullText.trim()) {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg && lastMsg.role === 'ai') {
                            lastMsg.text = chatLang === 'sw' ? "Samahani, kuna tatizo dogo na sijaisikia vizuri. Hebu tujaribu tena! 🌟" : "Hmm, I had a little hiccup and didn't catch that correctly. Let's try again! 🌟";
                        }
                        return newMessages;
                    });
                }

                const finalRemaining = fullText.slice(spokenText.length).trim();
                if (finalRemaining) {
                    queueSpeak(finalRemaining, voiceId);
                }

            } else {
                const response = await chatLanguageTutor(text, messages, chatLang, tutorMode);
                const aiMsg: TalkbackMessage = { role: 'ai', text: response.reply, timestamp: Date.now() };
                setMessages(prev => [...prev, aiMsg]);
                setTutorResponses(prev => new Map(prev).set(aiMsg.timestamp, response));
                const voiceId = LANGUAGE_TUTOR_VOICES[chatLang];
                setIsSpeaking(true);
                try { await speakConversational(response.reply, voiceId); } catch { /* silent */ } finally { setIsSpeaking(false); }
            }
        } catch (error) {
            console.error("Chat error:", error);
            setMessages(prev => [...prev, {
                role: 'ai',
                text: chatLang === 'sw' ? 'Pole, kuna tatizo. Jaribu tena! 😊' : "Oops, something went wrong. Let's try again! 😊",
                timestamp: Date.now()
            }]);
        } finally {
            setIsLoading(false);
        }
    }, [activeMode, messages, chatLang, tutorMode, onBeforeMessage]);

    // ─── Recording ───────────────────────────────────────────────
    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' :
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
                        if (transcript && transcript.trim()) {
                            await handleSendMessage(transcript.trim());
                        }
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
    }, [chatLang, handleSendMessage]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, [isRecording]);

    const handleSpeak = useCallback(async (text: string) => {
        if (isSpeaking) {
            clearSpeechQueue();
            setIsSpeaking(false);
            return;
        }
        const voiceId = isTutor ? LANGUAGE_TUTOR_VOICES[chatLang] : TALKBACK_VOICES[chatLang];
        setIsSpeaking(true);
        try { await speakConversational(text, voiceId); } catch { /* silent */ } finally { setIsSpeaking(false); }
    }, [isSpeaking, isTutor, chatLang]);

    const hasOnlyGreeting = messages.length === 1;

    return (
        <div className="flex flex-col bg-slate-50 dark:bg-slate-950 relative" style={{ height: '100dvh' }}>

            {/* ── Header ── */}
            <div className="flex-shrink-0 bg-gradient-to-r from-indigo-600 to-purple-700 relative z-50">
                <div className="px-4 pt-4 pb-3">
                    {/* Top row */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onBack}
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
                                aria-label="Go back"
                            >
                                <ArrowLeft className="w-4 h-4 text-white" />
                            </button>

                            <div className="w-9 h-9 rounded-xl overflow-hidden border border-white/20 shadow-md flex-shrink-0">
                                <img
                                    src={isTutor ? mwalimuSomoImg : somoBuddyImg}
                                    alt="AI"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div>
                                <h2 className="text-sm font-black text-white leading-tight">
                                    {isTutor ? 'Language Coach' : 'Akili'}
                                </h2>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-bounce' : isRecording ? 'bg-red-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
                                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest">
                                        {isLoading ? 'Thinking...' : isRecording ? `Listening ${recordingTime}s` : isSpeaking ? 'Speaking' : 'Ready'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right controls */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setChatLang(l => {
                                    const next = l === 'en' ? 'sw' : 'en';
                                    setMessages([{ role: 'ai', text: isTutor ? TUTOR_GREETING[next] : GREETING[next], timestamp: Date.now() }]);
                                    return next;
                                })}
                                className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white text-[10px] font-black hover:bg-white/20 transition-all uppercase tracking-wide"
                            >
                                {chatLang === 'en' ? '🇬🇧 EN' : '🇰🇪 SW'}
                            </button>
                            <button
                                onClick={resetChat}
                                className="p-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all"
                                title="New chat"
                            >
                                <RefreshCw className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Mode switcher — compact pill tabs */}
                    <div className="flex gap-1.5">
                        <button
                            onClick={() => switchMode('TALKBACK')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition-all border ${activeMode === 'TALKBACK'
                                ? 'bg-white text-indigo-700 border-white shadow-lg'
                                : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Study Buddy
                        </button>
                        <button
                            onClick={() => switchMode('LANGUAGE_TUTOR')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition-all border ${activeMode === 'LANGUAGE_TUTOR'
                                ? 'bg-white text-indigo-700 border-white shadow-lg'
                                : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
                            }`}
                        >
                            <Languages className="w-3.5 h-3.5" />
                            Language Coach
                        </button>

                        {/* Audio wave if speaking */}
                        {isSpeaking && (
                            <div className="ml-auto flex items-center">
                                <AudioWaveVisualizer isActive={isSpeaking} />
                            </div>
                        )}
                    </div>

                    {/* Language Tutor sub-modes */}
                    {isTutor && (
                        <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5 scrollbar-none">
                            {(Object.entries(MODE_CONFIG) as [TutorMode, typeof MODE_CONFIG[TutorMode]][]).map(([mode, config]) => (
                                <button
                                    key={mode}
                                    onClick={() => setTutorMode(mode)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide whitespace-nowrap transition-all flex-shrink-0 border ${tutorMode === mode
                                        ? 'bg-white/20 text-white border-white/40'
                                        : 'bg-transparent text-white/50 border-white/10 hover:bg-white/10'
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
            <div className="flex-1 overflow-y-auto px-4 py-4 relative z-10">

                {/* Quick starters — only shown when no additional messages yet */}
                {hasOnlyGreeting && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4"
                    >
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                            Quick Start
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_STARTERS[chatLang].map((starter, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleSendMessage(starter)}
                                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-700 dark:hover:text-indigo-400 hover:shadow-sm transition-all active:scale-95"
                                >
                                    {starter}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {messages.map((msg) => (
                        <ChatBubble
                            key={msg.timestamp}
                            message={msg}
                            tutorResponse={tutorResponses.get(msg.timestamp)}
                            isLanguageTutor={isTutor && msg.role === 'ai'}
                            isTutor={isTutor}
                            onSpeak={msg.role === 'ai' ? handleSpeak : undefined}
                            isSpeaking={isSpeaking}
                        />
                    ))}
                </AnimatePresence>

                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 mb-3"
                    >
                        <div className="w-8 h-8 rounded-xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 flex-shrink-0">
                            <img src={isTutor ? mwalimuSomoImg : somoBuddyImg} alt="AI" className="w-full h-full object-cover" />
                        </div>
                        <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white dark:bg-slate-800 shadow-sm border-2 border-slate-300 dark:border-slate-700 flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {chatLang === 'sw' ? 'Inafikiri...' : 'Thinking...'}
                            </span>
                        </div>
                    </motion.div>
                )}

                <div ref={chatEndRef} className="h-2" />
            </div>

            {/* ── Input Area ── */}
            <div className="flex-shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 relative z-50">

                {/* Status bar */}
                <AnimatePresence mode="wait">
                    {isRecording && (
                        <motion.div
                            key="rec"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-center gap-2 mb-2"
                        >
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                                Recording {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')} — Tap mic to send
                            </span>
                        </motion.div>
                    )}
                    {isSpeaking && !isRecording && (
                        <motion.div
                            key="spk"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center justify-center gap-2 mb-2"
                        >
                            <Volume2 className="w-3 h-3 text-indigo-500" />
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Speaking</span>
                            <button
                                onClick={() => { stopSpeech(); setIsSpeaking(false); }}
                                className="text-[9px] font-black text-red-500 uppercase border-l border-slate-200 dark:border-slate-700 pl-2 ml-1"
                            >
                                Stop
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Input row */}
                <div className="flex items-end gap-2 max-w-2xl mx-auto">
                    <div className="flex-1">
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
                            placeholder={
                                isRecording ? 'Listening...' :
                                chatLang === 'sw' ? 'Andika ujumbe...' : 'Ask anything...'
                            }
                            className="w-full px-5 py-3.5 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white dark:focus:bg-slate-700 transition-all"
                            disabled={isLoading || isRecording}
                        />
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                        <AnimatePresence>
                            {inputText.trim() && (
                                <motion.button
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    onClick={() => handleSendMessage(inputText)}
                                    disabled={isLoading}
                                    className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isLoading}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95 ${isRecording
                                ? 'bg-red-500 text-white shadow-red-500/30 animate-pulse'
                                : 'bg-indigo-500 text-white shadow-indigo-500/20'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConversationalTutor;
