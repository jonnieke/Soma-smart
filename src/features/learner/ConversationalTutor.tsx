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

// Premium Assets
import somoBuddyImg from '../../assets/images/somo_buddy_avatar.png';
import mwalimuSomoImg from '../../assets/images/mwalimu_somo_avatar.png';

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

// ─── Premium UI Elements ─────────────────────────────────────────
const PremiumBackground: React.FC = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                x: [0, 100, 0],
                y: [0, 50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-500/10 blur-[100px] rounded-full"
        />
        <motion.div
            animate={{
                scale: [1, 1.3, 1],
                x: [0, -100, 0],
                y: [0, -50, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full"
        />
        <motion.div
            animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-blue-500/5 blur-[80px] rounded-full"
        />
    </div>
);

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
const AIAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; isTutor?: boolean; isAnimated?: boolean }> = ({
    size = 'md', isTutor = false, isAnimated = false
}) => {
    const sizeMap = { 
        sm: 'w-10 h-10', 
        md: 'w-16 h-16', 
        lg: 'w-24 h-24',
        xl: 'w-32 h-32'
    };
    
    return (
        <motion.div
            className={`${sizeMap[size]} rounded-3xl overflow-hidden shadow-2xl flex-shrink-0 relative group`}
            animate={isAnimated ? { 
                scale: [1, 1.05, 1],
                rotate: [0, 1, -1, 0] 
            } : {}}
            transition={isAnimated ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : {}}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${isTutor ? 'from-emerald-400/20 to-teal-600/20' : 'from-indigo-400/20 to-purple-600/20'} opacity-50 group-hover:opacity-100 transition-opacity`} />
            <img 
                src={isTutor ? mwalimuSomoImg : somoBuddyImg} 
                alt="AI Avatar" 
                className="w-full h-full object-cover relative z-10"
            />
            {isAnimated && (
                <motion.div 
                    className="absolute inset-0 border-2 border-white/30 rounded-3xl z-20"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            )}
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

            <div className={`max-w-[85%] ${isUser ? '' : ''}`}>
                {/* Main bubble */}
                <div className={`px-5 py-4 rounded-[2rem] text-sm leading-relaxed ${isUser
                    ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-br-sm shadow-xl shadow-indigo-500/20'
                    : 'bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-white/40 dark:border-slate-700/40 relative'
                }`}
                >
                    <p className="whitespace-pre-wrap font-medium">{message.text}</p>
                    
                    {!isUser && (
                        <div className="absolute -left-1.5 top-0 w-3 h-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-l border-t border-white/40 dark:border-slate-700/40 transform rotate-[-45deg] rounded-tl-sm" />
                    )}

                    {!isUser && (
                        <button
                            onClick={() => onSpeak?.(message.text)}
                            className={`mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold tracking-tight transition-all ${isSpeaking
                                ? 'bg-indigo-100/50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                                : 'bg-slate-50 dark:bg-slate-900/50 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                        >
                            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            {isSpeaking ? 'Stopping' : 'Listen Lesson'}
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
            <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col overflow-x-hidden relative">
                <PremiumBackground />

                {/* Hero Header */}
                <div className="relative px-5 pt-14 pb-32">
                    <button
                        onClick={onBack}
                        className="absolute top-5 left-4 z-50 p-2.5 rounded-2xl bg-white/20 hover:bg-white/40 backdrop-blur-xl border border-white/20 transition-all shadow-lg"
                    >
                        <ArrowLeft className="w-5 h-5 text-indigo-900 dark:text-white" />
                    </button>

                    <div className="relative z-10 text-center flex flex-col items-center">
                        <AIAvatar size="xl" isAnimated />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 text-[10px] font-black uppercase tracking-[0.2em]"
                        >
                            <Sparkles className="w-3 h-3" />
                            Premium AI Experience
                        </motion.div>

                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mt-4 mb-2 tracking-tight">
                            Talk &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Learn</span>
                        </h1>
                        <p className="text-base text-slate-500 dark:text-slate-400 max-w-xs font-medium leading-relaxed">
                            Your high-fidelity AI conversation partner. Master fluency anytime, anywhere.
                        </p>

                        <div className="flex justify-center flex-wrap gap-2 mt-8">
                            {[
                                { icon: <Headphones className="w-3.5 h-3.5" />, label: 'Professional Audio' },
                                { icon: <Globe className="w-3.5 h-3.5" />, label: 'Multilingual' },
                                { icon: <Flame className="w-3.5 h-3.5" />, label: 'Real-time' },
                            ].map(({ icon, label }) => (
                                <div key={label} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/60 dark:bg-slate-900/40 backdrop-blur border border-white/40 dark:border-slate-800/40 shadow-sm text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                                    <span className="text-indigo-500">{icon}</span> {label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Cards pulled up over the hero */}
                <div className="px-4 -mt-16 pb-24 space-y-4 relative z-10 max-w-2xl mx-auto w-full">

                    {/* Language Toggle */}
                    <div className="flex gap-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl p-2 rounded-[2rem] shadow-2xl border border-white/40 dark:border-slate-800/20">
                        {(['en', 'sw'] as ChatLang[]).map(lang => (
                            <button
                                key={lang}
                                onClick={() => setChatLang(lang)}
                                className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${chatLang === lang
                                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xl'
                                    : 'text-slate-400 dark:text-slate-500 hover:bg-white/40 dark:hover:bg-slate-800/40'
                                    }`}
                            >
                                <Globe className="w-4 h-4" />
                                {lang === 'en' ? 'English' : 'Kiswahili'}
                            </button>
                        ))}
                    </div>

                    {/* Talkback Card */}
                    <motion.button
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openChat('TALKBACK')}
                        className="w-full text-left"
                    >
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-indigo-600/5 dark:bg-indigo-400/5 p-1 border border-indigo-100/50 dark:border-indigo-800/30 group">
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.25rem] p-7 transition-all group-hover:bg-white/100 dark:group-hover:bg-slate-900/80">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
                                        <img src={somoBuddyImg} alt="Buddy" className="w-16 h-16 rounded-2xl relative z-10 border-2 border-white/50 dark:border-slate-800/50 object-cover" />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                                        Interactive
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Somo Buddy Talkback</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                                    {chatLang === 'sw'
                                        ? 'Zungumza na AI kwa sauti au maandishi. Uliza maswali, simulia hadithi, na ujifunze kwa mazungumzo ya asili!'
                                        : 'Master fluency through natural, high-fidelity AI conversations. Speak or type to your personal study buddy anytime.'}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                                                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                                            </div>
                                        ))}
                                        <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                            +
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Open Hub</span>
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 flex items-center justify-center transition-transform group-hover:translate-x-1">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.button>

                    {/* Language Coach Card */}
                    <motion.button
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openChat('LANGUAGE_TUTOR')}
                        className="w-full text-left"
                    >
                        <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-600/5 dark:bg-emerald-400/5 p-1 border border-emerald-100/50 dark:border-emerald-800/30 group">
                            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.25rem] p-7 transition-all group-hover:bg-white/100 dark:group-hover:bg-slate-900/80">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
                                        <img src={mwalimuSomoImg} alt="Tutor" className="w-16 h-16 rounded-2xl relative z-10 border-2 border-white/50 dark:border-slate-800/50 object-cover" />
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                        <Sparkles className="w-3 h-3" />
                                        Academic
                                    </div>
                                </div>

                                <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">
                                    {chatLang === 'sw' ? 'Mwalimu Somo' : 'Professional Coach'}
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                                    {chatLang === 'sw'
                                        ? 'Jifunze kutamka vizuri, kujenga sentensi nzuri, na kusimulia hadithi kwa ujasiri wa kipekee!'
                                        : 'A world-class academic engine designed to perfect your pronunciation, grammar, and storytelling skills.'}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        {[MODE_CONFIG.pronunciation, MODE_CONFIG.sentences].map((m, idx) => (
                                            <div key={idx} className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                                                {m.icon}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Start Training</span>
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-indigo-900/40 flex items-center justify-center transition-transform group-hover:translate-x-1">
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
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
                        className="p-6 rounded-[2rem] bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800/20 shadow-xl max-w-2xl mx-auto"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                            </div>
                            <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                                {chatLang === 'sw' ? 'Ukweli wa Kuvutia' : 'Expert Insight'}
                            </p>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            {chatLang === 'sw'
                                ? '🌍 Kiswahili kinazungumzwa na watu zaidi ya milioni 200 Afrika Mashariki. Ni lugha ya kweli ya bara!'
                                : '🌍 Swahili is spoken by over 200 million people — and practice with AI has been shown to boost fluency by up to 40%!'}
                        </p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // ─── CHAT SCREEN ─────────────────────────────────────────────
    const isTutor = screen === 'LANGUAGE_TUTOR';

    return (
        <div className="flex flex-col bg-slate-50 dark:bg-slate-950 relative" style={{ height: '100dvh' }}>
            <PremiumBackground />

            {/* ── Chat Header ── */}
            <div className="flex-shrink-0 relative z-50">
                <div className={`absolute inset-0 bg-gradient-to-r ${isTutor
                    ? 'from-emerald-600/90 to-teal-700/90'
                    : 'from-indigo-600/90 to-purple-700/90'
                } backdrop-blur-xl border-b border-white/10`} />
                
                <div className="relative px-4 pt-4 pb-4">
                    <div className="flex items-center justify-between">
                        {/* Left: Back + identity */}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { stopSpeech(); setScreen('HOME'); }}
                                className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all flex-shrink-0"
                            >
                                <ArrowLeft className="w-4 h-4 text-white" />
                            </button>

                            <AIAvatar size="sm" isTutor={isTutor} isAnimated={isLoading} />

                            <div>
                                <h2 className="text-[13px] font-black text-white leading-tight tracking-tight uppercase">
                                    {isTutor
                                        ? (chatLang === 'sw' ? 'Mwalimu Somo' : 'Professional Coach')
                                        : 'Somo Buddy'}
                                </h2>
                                <div className="flex items-center gap-1.5 mt-1">
                                    <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-bounce' : 'bg-emerald-400 animate-pulse'}`} />
                                    <span className="text-[10px] text-white/70 font-bold uppercase tracking-widest leading-none">
                                        {isLoading
                                            ? (chatLang === 'sw' ? 'Inafikiri...' : 'Thinking')
                                            : (chatLang === 'sw' ? 'Mtandaoni' : 'System Active')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Right: Lang toggle + reset */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setChatLang(l => l === 'en' ? 'sw' : 'en')}
                                className="px-3.5 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white text-[10px] font-black hover:bg-white/20 transition-all uppercase tracking-widest"
                            >
                                {chatLang === 'en' ? '🇬🇧 EN' : '🇰🇪 SW'}
                            </button>
                            <button onClick={resetChat} className="p-2.5 rounded-xl bg-white/10 border border-white/10 hover:bg-white/20 transition-all" title="New Session">
                                <RefreshCw className="w-4 h-4 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Mode pills — Language Tutor only */}
                    {isTutor && (
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-none">
                            {(Object.entries(MODE_CONFIG) as [TutorMode, typeof MODE_CONFIG[TutorMode]][]).map(([mode, config]) => (
                                <button
                                    key={mode}
                                    onClick={() => setTutorMode(mode)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 border ${tutorMode === mode
                                        ? 'bg-white text-emerald-800 border-white shadow-xl shadow-emerald-900/40'
                                        : 'bg-white/10 text-white border-white/10 hover:bg-white/20'
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
            <div className="flex-1 overflow-y-auto px-4 py-5 relative z-10">
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
                        <div className="px-5 py-4 rounded-[1.5rem] rounded-tl-none bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl border border-white/40 dark:border-slate-700/40 flex items-center gap-3">
                            <Loader2 className={`w-4 h-4 animate-spin ${isTutor ? 'text-emerald-500' : 'text-indigo-500'}`} />
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                {chatLang === 'sw' ? 'Inafikiri...' : 'Thinking...'}
                            </span>
                        </div>
                    </motion.div>
                )}

                <div ref={chatEndRef} className="h-4" />
            </div>

            {/* ── Input Area — fixed to bottom, always fully visible ── */}
            <div className="flex-shrink-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-t border-white/20 dark:border-slate-800/20 relative z-50 px-4 pt-3 pb-6">
                
                {/* Status indicators */}
                <div className="flex justify-center h-8 relative mb-2">
                    <AnimatePresence mode="wait">
                        {isRecording ? (
                            <motion.div
                                key="recording"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800"
                            >
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                <span className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest">
                                    Recording {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                                </span>
                            </motion.div>
                        ) : isSpeaking ? (
                            <motion.div
                                key="speaking"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800"
                            >
                                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AI is Speaking</span>
                                <button
                                    onClick={() => { stopSpeech(); setIsSpeaking(false); }}
                                    className="ml-2 pl-2 border-l border-indigo-200 dark:border-indigo-800 text-[9px] font-black text-red-500 uppercase tracking-widest"
                                >
                                    Stop
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="hint"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-1.5"
                            >
                                <Sparkles className="w-3 h-3 text-slate-400" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                                    {chatLang === 'sw' ? 'Gusa 🎤 kusema' : 'TAP 🎤 TO SPEAK OR TYPE'}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Input row */}
                <div className="flex items-end gap-3 max-w-2xl mx-auto">
                    {/* Text input container */}
                    <div className="flex-1 relative group">
                        <div className={`absolute inset-0 bg-gradient-to-r ${isTutor ? 'from-emerald-500/10 to-teal-600/10' : 'from-indigo-500/10 to-purple-600/10'} rounded-[1.75rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity`} />
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
                            placeholder={chatLang === 'sw' ? 'Andika ujumbe...' : 'Type your message...'}
                            className={`w-full px-6 py-4 rounded-[1.75rem] text-sm text-slate-900 dark:text-white placeholder:text-slate-400 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-2 transition-all focus:outline-none focus:bg-white dark:focus:bg-slate-800 ${
                                isTutor 
                                    ? 'border-emerald-100 dark:border-emerald-900/30 focus:border-emerald-500/50' 
                                    : 'border-indigo-100 dark:border-indigo-900/30 focus:border-indigo-500/50'
                            }`}
                            disabled={isLoading || isRecording}
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                        <AnimatePresence>
                            {inputText.trim() && (
                                <motion.button
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.5, opacity: 0 }}
                                    onClick={() => handleSendMessage(inputText)}
                                    disabled={isLoading}
                                    className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                                        isTutor 
                                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20' 
                                            : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/20'
                                    }`}
                                >
                                    <Send className="w-5 h-5 mx-auto" />
                                </motion.button>
                            )}
                        </AnimatePresence>

                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isLoading}
                            className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 ${
                                isRecording
                                    ? 'bg-red-500 text-white shadow-red-500/30 animate-pulse'
                                    : isTutor
                                        ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                        : 'bg-indigo-500 text-white shadow-indigo-500/20'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </motion.button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConversationalTutor;
