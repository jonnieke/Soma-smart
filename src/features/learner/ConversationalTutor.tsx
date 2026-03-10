import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Volume2, VolumeX, Send, ArrowLeft,
    MessageCircle, BookOpen, Languages, Sparkles, BookText,
    Globe, ChevronRight, Loader2, RefreshCw
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

// ─── Helpers ─────────────────────────────────────────────────────
const GREETING: Record<ChatLang, string> = {
    en: "Hi there! I'm Somo Buddy 🌟 I'm here to chat, learn and have fun with you! What would you like to talk about?",
    sw: "Habari! Mimi ni Somo Buddy 🌟 Niko hapa kuzungumza, kujifunza na kucheza nawe! Unataka tuzungumze nini?"
};

const TUTOR_GREETING: Record<ChatLang, string> = {
    en: "Hello, young learner! I'm Mwalimu Somo, your language coach 🎓 Let's make learning English fun! Say something and I'll help you get better!",
    sw: "Habari mdogo wangu! Mimi ni Mwalimu Somo, kocha wako wa lugha 🎓 Hebu tujifunze Kiswahili kwa furaha! Sema kitu na nitakusaidia!"
};

const MODE_EMOJIS: Record<TutorMode, string> = {
    conversation: '💬',
    pronunciation: '🗣️',
    sentences: '✍️',
    story: '📖'
};

const MODE_LABELS: Record<TutorMode, Record<ChatLang, string>> = {
    conversation: { en: 'Free Chat', sw: 'Mazungumzo' },
    pronunciation: { en: 'Pronunciation', sw: 'Matamshi' },
    sentences: { en: 'Sentences', sw: 'Sentensi' },
    story: { en: 'Storytelling', sw: 'Hadithi' }
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
            initial={{ opacity: 0, y: 12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
        >
            <div className={`max-w-[85%] ${isUser ? 'order-1' : 'order-1'}`}>
                {/* Main bubble */}
                <div className={`px-4 py-3 rounded-2xl ${isUser
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-md'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-md shadow-sm border border-slate-100 dark:border-slate-700'
                    }`}
                >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>

                    {/* Speaker button for AI messages */}
                    {!isUser && (
                        <button
                            onClick={() => onSpeak?.(message.text)}
                            className={`mt-2 p-1.5 rounded-lg transition-all ${isSpeaking
                                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400'
                                }`}
                            title="Listen"
                        >
                            {isSpeaking
                                ? <VolumeX className="w-3.5 h-3.5" />
                                : <Volume2 className="w-3.5 h-3.5" />
                            }
                        </button>
                    )}
                </div>

                {/* Language Tutor extras */}
                {!isUser && isLanguageTutor && tutorResponse && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2 space-y-2"
                    >
                        {/* Correction */}
                        {tutorResponse.correction && (
                            <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40">
                                <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-0.5">✏️ Correction</p>
                                <p className="text-xs text-amber-800 dark:text-amber-300">{tutorResponse.correction}</p>
                            </div>
                        )}

                        {/* Pronunciation */}
                        {tutorResponse.pronunciationTip && (
                            <div className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40">
                                <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-0.5">🗣️ Pronunciation</p>
                                <p className="text-xs text-blue-800 dark:text-blue-300">{tutorResponse.pronunciationTip}</p>
                            </div>
                        )}

                        {/* Example Sentence */}
                        {tutorResponse.exampleSentence && (
                            <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40">
                                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-0.5">📝 Practice</p>
                                <p className="text-xs text-emerald-800 dark:text-emerald-300 italic">{tutorResponse.exampleSentence}</p>
                            </div>
                        )}

                        {/* Story Segment */}
                        {tutorResponse.storySegment && (
                            <div className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40">
                                <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-0.5">📖 Story</p>
                                <p className="text-xs text-purple-800 dark:text-purple-300">{tutorResponse.storySegment}</p>
                            </div>
                        )}

                        {/* Encouragement */}
                        {tutorResponse.encouragement && (
                            <p className="text-xs text-center text-indigo-500 dark:text-indigo-400 font-medium mt-1">
                                {tutorResponse.encouragement}
                            </p>
                        )}
                    </motion.div>
                )}
            </div>
        </motion.div>
    );
};

// ─── Main Component ──────────────────────────────────────────────
export const ConversationalTutor: React.FC<ConversationalTutorProps> = ({ onBack }) => {
    const [screen, setScreen] = useState<FeatureScreen>('HOME');
    const [chatLang, setChatLang] = useState<ChatLang>('en');
    const [tutorMode, setTutorMode] = useState<TutorMode>('conversation');

    // Chat state
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

    // Scroll to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cleanup on unmount
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
            let mimeType = 'audio/webm';
            if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
            else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';

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

                if (blob.size === 0) {
                    setIsRecording(false);
                    return;
                }

                // Convert to base64 for transcription
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = async () => {
                    const base64 = (reader.result as string).split(',')[1];
                    setIsLoading(true);

                    try {
                        const transcript = await transcribeAudioForChat(base64, mimeType, chatLang);
                        if (transcript.trim()) {
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

                // Auto-speak the reply
                const voiceId = TALKBACK_VOICES[chatLang];
                setIsSpeaking(true);
                try {
                    await speakConversational(reply, voiceId);
                } catch { /* silent */ } finally {
                    setIsSpeaking(false);
                }
            } else if (screen === 'LANGUAGE_TUTOR') {
                const response = await chatLanguageTutor(text, messages, chatLang, tutorMode);
                const aiMsg: TalkbackMessage = { role: 'ai', text: response.reply, timestamp: Date.now() };
                setMessages(prev => [...prev, aiMsg]);
                setTutorResponses(prev => new Map(prev).set(aiMsg.timestamp, response));

                // Auto-speak
                const voiceId = LANGUAGE_TUTOR_VOICES[chatLang];
                setIsSpeaking(true);
                try {
                    await speakConversational(response.reply, voiceId);
                } catch { /* silent */ } finally {
                    setIsSpeaking(false);
                }
            }
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: TalkbackMessage = {
                role: 'ai',
                text: chatLang === 'sw' ? 'Pole, kuna tatizo. Jaribu tena! 😊' : 'Oops, something went wrong. Let\'s try again! 😊',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    }, [screen, messages, chatLang, tutorMode]);

    const handleSpeak = useCallback(async (text: string) => {
        if (isSpeaking) {
            stopSpeech();
            setIsSpeaking(false);
            return;
        }
        const voiceId = screen === 'TALKBACK' ? TALKBACK_VOICES[chatLang] : LANGUAGE_TUTOR_VOICES[chatLang];
        setIsSpeaking(true);
        try {
            await speakConversational(text, voiceId);
        } catch { /* silent */ } finally {
            setIsSpeaking(false);
        }
    }, [isSpeaking, screen, chatLang]);

    // ─── Open a chat screen ──────────────────────────────────────
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-indigo-950 dark:to-purple-950 p-4 pb-20">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <button onClick={onBack} className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-sm hover:shadow-md transition-all">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Talk & Learn</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Speak, learn, and have fun with AI!</p>
                    </div>
                </div>

                {/* Language Selector */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setChatLang('en')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-sm transition-all ${chatLang === 'en'
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200 dark:shadow-blue-900/40'
                                : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                    >
                        <Globe className="w-4 h-4" />
                        English
                    </button>
                    <button
                        onClick={() => setChatLang('sw')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-semibold text-sm transition-all ${chatLang === 'sw'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40'
                                : 'bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
                            }`}
                    >
                        <Languages className="w-4 h-4" />
                        Kiswahili
                    </button>
                </div>

                {/* Feature Cards */}
                <div className="space-y-4">
                    {/* Talkback Card */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openChat('TALKBACK')}
                        className="w-full text-left"
                    >
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 shadow-xl shadow-purple-200 dark:shadow-purple-900/40">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                                    <MessageCircle className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">Somo Buddy Talkback</h2>
                                <p className="text-sm text-white/80 mb-4">
                                    {chatLang === 'sw' ? 'Zungumza na AI! Uliza maswali, simulia hadithi, na ujifunze!' : 'Chat with AI! Ask questions, tell stories, and learn together!'}
                                </p>
                                <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
                                    <span>Start Chatting</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </motion.button>

                    {/* Language Responder Card */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openChat('LANGUAGE_TUTOR')}
                        className="w-full text-left"
                    >
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/40">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-6 -translate-x-6" />
                            <div className="relative z-10">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-4">
                                    <BookOpen className="w-6 h-6 text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-white mb-1">
                                    {chatLang === 'sw' ? 'Mwalimu wa Lugha' : 'Language Coach'}
                                </h2>
                                <p className="text-sm text-white/80 mb-4">
                                    {chatLang === 'sw'
                                        ? 'Jifunze kutamka, kutengeneza sentensi, na kusimulia hadithi kwa Kiswahili!'
                                        : 'Learn pronunciation, sentence building, and storytelling in English & Kiswahili!'}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                    {(['conversation', 'pronunciation', 'sentences', 'story'] as TutorMode[]).map(mode => (
                                        <span key={mode} className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-semibold">
                                            {MODE_EMOJIS[mode]} {MODE_LABELS[mode][chatLang]}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2 text-white/90 text-xs font-medium">
                                    <span>{chatLang === 'sw' ? 'Anza Kujifunza' : 'Start Learning'}</span>
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </motion.button>
                </div>

                {/* Fun Facts Strip */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 p-4 rounded-2xl bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-white/50 dark:border-slate-700/50"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {chatLang === 'sw' ? 'Ukweli wa Kufurahisha' : 'Fun Fact'}
                        </p>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {chatLang === 'sw'
                            ? 'Kiswahili kinazungumzwa na watu zaidi ya milioni 100 ulimwenguni! Ni lugha rasmi ya Umoja wa Afrika. 🌍'
                            : 'Swahili is spoken by over 100 million people worldwide! It\'s the official language of the African Union. 🌍'}
                    </p>
                </motion.div>
            </div>
        );
    }

    // ─── CHAT SCREEN (Talkback or Language Tutor) ─────────────────
    const isTutor = screen === 'LANGUAGE_TUTOR';
    const accentColor = isTutor ? 'emerald' : 'indigo';

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Chat Header */}
            <div className={`sticky top-0 z-20 px-4 py-3 bg-gradient-to-r ${isTutor ? 'from-emerald-500 to-teal-600' : 'from-indigo-500 to-purple-600'
                } shadow-lg`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => { stopSpeech(); setScreen('HOME'); }} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">
                            <ArrowLeft className="w-4 h-4 text-white" />
                        </button>
                        <div>
                            <h2 className="text-sm font-bold text-white">
                                {isTutor
                                    ? (chatLang === 'sw' ? 'Mwalimu Somo' : 'Language Coach')
                                    : 'Somo Buddy'
                                }
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-[10px] text-white/80">
                                    {isLoading ? (chatLang === 'sw' ? 'Inafikiria...' : 'Thinking...') : (chatLang === 'sw' ? 'Mtandaoni' : 'Online')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Language toggle */}
                        <button
                            onClick={() => {
                                const newLang = chatLang === 'en' ? 'sw' : 'en';
                                setChatLang(newLang);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/20 text-white text-[10px] font-bold hover:bg-white/30 transition-colors"
                        >
                            {chatLang === 'en' ? '🇰🇪 SW' : '🇬🇧 EN'}
                        </button>

                        {/* Reset chat */}
                        <button onClick={resetChat} className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors" title="New Chat">
                            <RefreshCw className="w-3.5 h-3.5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Language Tutor Mode Switcher */}
                {isTutor && (
                    <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1 -mx-1 px-1">
                        {(['conversation', 'pronunciation', 'sentences', 'story'] as TutorMode[]).map(mode => (
                            <button
                                key={mode}
                                onClick={() => setTutorMode(mode)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${tutorMode === mode
                                        ? 'bg-white text-emerald-700 shadow-md'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                    }`}
                            >
                                {MODE_EMOJIS[mode]} {MODE_LABELS[mode][chatLang]}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
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

                {/* Loading indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start mb-3"
                    >
                        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                                <Loader2 className={`w-4 h-4 animate-spin text-${accentColor}-500`} />
                                <span className="text-xs text-slate-400">
                                    {chatLang === 'sw' ? 'Inafikiria...' : 'Thinking...'}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="sticky bottom-0 px-4 py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
                {/* Recording indicator */}
                <AnimatePresence>
                    {isRecording && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-center justify-center gap-3 mb-3 py-2"
                        >
                            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                            <AudioWaveVisualizer isActive={true} color={isTutor ? '#10b981' : '#6366f1'} />
                            <span className="text-xs font-mono text-slate-500">
                                {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Speaking indicator */}
                <AnimatePresence>
                    {isSpeaking && !isRecording && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="flex items-center justify-center gap-3 mb-3 py-2"
                        >
                            <Volume2 className={`w-4 h-4 text-${accentColor}-500`} />
                            <AudioWaveVisualizer isActive={true} color={isTutor ? '#10b981' : '#6366f1'} />
                            <span className="text-xs text-slate-400">
                                {chatLang === 'sw' ? 'Inasema...' : 'Speaking...'}
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-end gap-2">
                    {/* Text Input */}
                    <div className="flex-1 relative">
                        <input
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
                            className="w-full px-4 py-3 pr-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-700 transition"
                            disabled={isLoading || isRecording}
                        />
                        {inputText.trim() && (
                            <button
                                onClick={() => handleSendMessage(inputText)}
                                disabled={isLoading}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-gradient-to-r ${isTutor ? 'from-emerald-500 to-teal-600' : 'from-indigo-500 to-purple-600'
                                    } text-white shadow-md hover:shadow-lg transition-all`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Mic Button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoading}
                        className={`flex-shrink-0 p-3.5 rounded-2xl transition-all shadow-md ${isRecording
                                ? 'bg-red-500 text-white shadow-red-200 dark:shadow-red-900/40 animate-pulse'
                                : `bg-gradient-to-r ${isTutor ? 'from-emerald-500 to-teal-600' : 'from-indigo-500 to-purple-600'} text-white shadow-${accentColor}-200 dark:shadow-${accentColor}-900/40`
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
                    >
                        {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </motion.button>
                </div>

                {/* Helper text */}
                <p className="text-center text-[10px] text-slate-400 mt-2">
                    {isRecording
                        ? (chatLang === 'sw' ? 'Bonyeza kuacha kurekodi' : 'Tap to stop recording')
                        : (chatLang === 'sw' ? 'Bonyeza 🎤 kusema au andika ujumbe' : 'Tap 🎤 to speak or type a message')
                    }
                </p>
            </div>
        </div>
    );
};

export default ConversationalTutor;
