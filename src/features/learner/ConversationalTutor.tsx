import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Volume2, VolumeX, Send, ArrowLeft,
    MessageCircle, Languages, Sparkles,
    Globe, Loader2, RefreshCw,
    Headphones, PenTool, BookText,
    PhoneCall, PhoneOff
} from 'lucide-react';
import {
    chatTalkback, chatLanguageTutor, transcribeAudioForChat,
    TalkbackMessage, LanguageTutorResponse,
    chatTalkbackStream, processStream, getPhoneticCoaching, PhoneticCoachingResult, SyllabusTutorContext
} from '../../services/geminiService';
import { useApp } from '../../context/AppContext';
import {
    speakConversational, stopSpeech,
    TALKBACK_VOICES, LANGUAGE_TUTOR_VOICES,
    queueSpeak, clearSpeechQueue
} from '../../services/elevenLabsService';

import somoBuddyImg from '../../assets/images/somo_buddy_avatar.png';
import { GeminiLiveSession } from '../../services/geminiLiveService';
import mwalimuSomoImg from '../../assets/images/mwalimu_somo_avatar.png';

// ─── Types ───────────────────────────────────────────────────────
type ActiveMode = 'TALKBACK' | 'LANGUAGE_TUTOR';
type TutorMode = 'conversation' | 'pronunciation' | 'sentences' | 'story';
type ChatLang = 'en' | 'sw';

interface ConversationalTutorProps {
    onBack: () => void;
    onBeforeMessage?: () => boolean;
    initialActiveMode?: ActiveMode;
    initialTutorMode?: TutorMode;
    syllabusContext?: SyllabusTutorContext;
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

const formatSyllabusContext = (context?: SyllabusTutorContext) => {
    const parts: string[] = [];
    if (context?.grade) parts.push(`Grade ${context.grade}`);
    if (context?.subject) parts.push(context.subject);
    if (context?.topic) parts.push(context.topic);
    return parts.join(' / ');
};

const buildTutorGreeting = (
    mode: ActiveMode,
    lang: ChatLang,
    tutorMode: TutorMode,
    syllabusContext?: SyllabusTutorContext
) => {
    const contextLabel = formatSyllabusContext(syllabusContext);
    if (mode === 'TALKBACK') {
        if (contextLabel) {
            return lang === 'sw'
                ? `Karibu! Tuko kwenye ${contextLabel}. Niulize swali lako na nitakuelekeza hatua kwa hatua.`
                : `Welcome! We are working on ${contextLabel}. Ask your question and I will keep us anchored to this topic.`;
        }
        return GREETING[lang];
    }

    if (contextLabel && tutorMode !== 'pronunciation') {
        return lang === 'sw'
            ? `${TUTOR_GREETING[lang]} Tutaweka mazoezi ndani ya ${contextLabel}.`
            : `${TUTOR_GREETING[lang]} We will keep the practice tied to ${contextLabel}.`;
    }

    return TUTOR_GREETING[lang];
};

const buildSyllabusInstruction = (context?: SyllabusTutorContext) => {
    const contextLabel = formatSyllabusContext(context);
    if (!contextLabel) return '';
    return `Syllabus focus: ${contextLabel}. Keep answers anchored to this topic, give one clear step at a time, and ask a short check-for-understanding question.`;
};

const getQuickStarters = (lang: ChatLang, syllabusContext?: SyllabusTutorContext) => {
    const contextLabel = formatSyllabusContext(syllabusContext);
    if (contextLabel) {
        return lang === 'sw'
            ? [
                'Eleza mada hii kwa urahisi',
                'Nipe mfano mmoja ulio wazi',
                'Nipige swali la haraka',
                'Fupisha hoja muhimu',
                'Ni nini nikae nikikumbuke?'
            ]
            : [
                'Explain this topic simply',
                'Give me one clear example',
                'Ask me a quick question',
                'Summarize the key points',
                'What should I remember?'
            ];
    }

    return QUICK_STARTERS[lang];
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
                    : 'bg-white text-slate-800 rounded-tl-sm shadow-md border-2 border-slate-300'
                }`}
                >
                    <p className="whitespace-pre-wrap font-medium">{message.text.replace(/\*\*/g, '')}</p>
                    {!isUser && (
                        <button
                            onClick={() => onSpeak?.(message.text)}
                            className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${isSpeaking
                                ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800 border-2 border-slate-300'
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
                            <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800">
                                <span className="font-bold">✏️ </span>{tutorResponse.correction}
                            </div>
                        )}
                        {tutorResponse.pronunciationTip && (
                            <div className="px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800">
                                <span className="font-bold">🗣️ </span>{tutorResponse.pronunciationTip}
                            </div>
                        )}
                        {tutorResponse.exampleSentence && (
                            <div className="px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-800 italic">
                                &ldquo;{tutorResponse.exampleSentence}&rdquo;
                            </div>
                        )}
                        {tutorResponse.encouragement && (
                            <p className="text-center text-[10px] text-indigo-500 font-semibold py-0.5">
                                ⭐ {tutorResponse.encouragement}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {isUser && (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0 self-end border border-indigo-200">
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

// ─── Pronunciation Challenges ────────────────────────────────────
const PRONUNCIATION_CHALLENGES: Record<'easy' | 'medium' | 'hard', string[]> = {
    easy: [
        "The sun shines bright.",
        "A quick brown fox.",
        "I love reading books.",
        "Water is life.",
        "School starts at eight."
    ],
    medium: [
        "She sells sea shells by the sea shore.",
        "Learning English is an amazing adventure.",
        "We should protect our environment and plant trees.",
        "Practice makes perfect in speaking and writing.",
        "Education is the key to a bright future."
    ],
    hard: [
        "The sixth sick sheikh's sixth sheep's sick.",
        "Environmental preservation requires global cooperation and dedication.",
        "Phonetic pronunciation challenges are beneficial for young language learners.",
        "Peter Piper picked a peck of pickled peppers.",
        "He threw three free throws in the basketball match."
    ]
};

// ─── Pronunciation Matching Helper ─────────────────────────────────
const checkPronunciationMatch = (target: string, spoken: string): Array<{ word: string; isMatch: boolean }> => {
    const clean = (str: string) => str.toLowerCase().replace(new RegExp('[.,/#!$%^&*;:{}=\\-_`~()?"]', 'g'), "").trim();
    const targetWords = target.split(/\s+/);
    const spokenWords = spoken.split(/\s+/).map(clean).filter(Boolean);
    
    let spokenIdx = 0;
    return targetWords.map(tWord => {
        const cleanedT = clean(tWord);
        if (!cleanedT) return { word: tWord, isMatch: true }; // treat punctuation-only words as matched
        
        let matched = false;
        const lookahead = 3;
        for (let i = 0; i < lookahead; i++) {
            if (spokenIdx + i < spokenWords.length) {
                if (spokenWords[spokenIdx + i] === cleanedT) {
                    matched = true;
                    spokenIdx += i + 1;
                    break;
                }
            }
        }
        return { word: tWord, isMatch: matched };
    });
};

// ─── Main Component ──────────────────────────────────────────────
export const ConversationalTutor: React.FC<ConversationalTutorProps> = ({ 
    onBack, 
    onBeforeMessage,
    initialActiveMode = 'TALKBACK',
    initialTutorMode = 'conversation',
    syllabusContext
}) => {
    const { educationLevel } = useApp();
    const [activeMode, setActiveMode] = useState<ActiveMode>(initialActiveMode);
    const [chatLang, setChatLang] = useState<ChatLang>('en');
    const [tutorMode, setTutorMode] = useState<TutorMode>(initialTutorMode);

    const [messages, setMessages] = useState<TalkbackMessage[]>(() => [{
        role: 'ai',
        text: buildTutorGreeting(initialActiveMode, 'en', initialTutorMode, syllabusContext),
        timestamp: Date.now()
    }]);
    const [tutorResponses, setTutorResponses] = useState<Map<number, LanguageTutorResponse>>(new Map());
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isLiveCall, setIsLiveCall] = useState(false);
    const liveSessionRef = useRef<GeminiLiveSession | null>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const isTutor = activeMode === 'LANGUAGE_TUTOR';

    // --- Pronunciation Challenge Mode States ---
    const [challengeDifficulty, setChallengeDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
    const [currentChallenge, setCurrentChallenge] = useState<string>('');
    const [spokenTranscript, setSpokenTranscript] = useState<string>('');
    const [matchedWords, setMatchedWords] = useState<Array<{ word: string; isMatch: boolean }>>([]);
    const [phoneticCoaching, setPhoneticCoaching] = useState<PhoneticCoachingResult | null>(null);
    const [isAnalyzingPronunciation, setIsAnalyzingPronunciation] = useState<boolean>(false);
    const [isPlayingChallengeAudio, setIsPlayingChallengeAudio] = useState<boolean>(false);

    // Enforce English for Pronunciation Mode ("Matamshi")
    useEffect(() => {
        if (isTutor && tutorMode === 'pronunciation') {
            setChatLang('en');
        }
    }, [isTutor, tutorMode]);

    // Load initial or random challenge on mode/difficulty change
    useEffect(() => {
        if (isTutor && tutorMode === 'pronunciation') {
            const list = PRONUNCIATION_CHALLENGES[challengeDifficulty];
            const randomPhrase = list[Math.floor(Math.random() * list.length)];
            setCurrentChallenge(randomPhrase);
            setSpokenTranscript('');
            setMatchedWords([]);
            setPhoneticCoaching(null);
            stopSpeech();
            setIsPlayingChallengeAudio(false);
        }
    }, [isTutor, tutorMode, challengeDifficulty]);

    const handleNextChallenge = useCallback(() => {
        const list = PRONUNCIATION_CHALLENGES[challengeDifficulty];
        let randomPhrase = list[Math.floor(Math.random() * list.length)];
        if (list.length > 1 && randomPhrase === currentChallenge) {
            const filtered = list.filter(p => p !== currentChallenge);
            randomPhrase = filtered[Math.floor(Math.random() * filtered.length)];
        }
        setCurrentChallenge(randomPhrase);
        setSpokenTranscript('');
        setMatchedWords([]);
        setPhoneticCoaching(null);
        stopSpeech();
        setIsPlayingChallengeAudio(false);
    }, [challengeDifficulty, currentChallenge]);

    const playChallengeTTS = useCallback(async () => {
        if (!currentChallenge) return;
        if (isPlayingChallengeAudio) {
            stopSpeech();
            setIsPlayingChallengeAudio(false);
            return;
        }
        setIsPlayingChallengeAudio(true);
        try {
            await speakConversational(currentChallenge, LANGUAGE_TUTOR_VOICES.en);
        } catch (err) {
            console.error("Challenge TTS failed:", err);
        } finally {
            setIsPlayingChallengeAudio(false);
        }
    }, [currentChallenge, isPlayingChallengeAudio]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        return () => {
            stopSpeech();
            if (liveSessionRef.current) {
                liveSessionRef.current.stop();
            }
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current?.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    // Switch mode — reset chat with appropriate greeting
    const switchMode = useCallback((mode: ActiveMode) => {
        stopSpeech();
        if (liveSessionRef.current) {
            liveSessionRef.current.stop();
            liveSessionRef.current = null;
            setIsLiveCall(false);
        }
        setActiveMode(mode);
        setMessages([{
            role: 'ai',
            text: buildTutorGreeting(mode, chatLang, tutorMode, syllabusContext),
            timestamp: Date.now()
        }]);
        setTutorResponses(new Map());
        setInputText('');
    }, [chatLang, syllabusContext, tutorMode]);

    // Reset current chat
    const resetChat = useCallback(() => {
        stopSpeech();
        if (liveSessionRef.current) {
            liveSessionRef.current.stop();
            liveSessionRef.current = null;
            setIsLiveCall(false);
        }
        setMessages([{
            role: 'ai',
            text: buildTutorGreeting(activeMode, chatLang, tutorMode, syllabusContext),
            timestamp: Date.now()
        }]);
        setTutorResponses(new Map());
        setInputText('');
    }, [activeMode, chatLang, syllabusContext, tutorMode]);

    const toggleLiveCall = useCallback(async () => {
        const isPronMode = isTutor && tutorMode === 'pronunciation';
        if (isLiveCall) {
            if (liveSessionRef.current) {
                liveSessionRef.current.stop();
                liveSessionRef.current = null;
            }
            setIsLiveCall(false);
            setMessages(prev => [...prev, {
                role: 'ai',
                text: (chatLang === 'sw' && !isPronMode) ? 'Simu ya moja kwa moja imekatika. 👋' : 'Live call disconnected. 👋',
                timestamp: Date.now()
            }]);
        } else {
            stopSpeech();
            clearSpeechQueue();

            const syllabusInstruction = buildSyllabusInstruction(syllabusContext);
            const sysInstruction = isPronMode
                ? `You are "Mwalimu Akili", an expert English pronunciation and speaking coach.
            The student's education grade/level is ${educationLevel || 'Secondary School'}.
            Your goal is to help the student practice English pronunciation, speech clarity, and conversation.
            
            GUIDELINES:
            1. You MUST speak exclusively in clear, slow, and standard English.
            2. Challenge the learner with a sentence or a word to repeat, or ask them to speak a sentence.
            3. Listen to their pronunciation and speech, and gently correct them on the spot.
            4. Provide audio-based coaching on how to make sounds (e.g., mouth positioning, syllable stress).
            5. Keep your sentences short, simple, and friendly, suitable for young learners.
            6. Encourage them with words like "Excellent attempt!" or "Let's try that one more time together."`
                : `You are "Akili", a warm, helpful Kenyan study companion. 
            The student's education grade/level is ${educationLevel || 'Secondary School'}.
            ${syllabusInstruction}
            You must speak exclusively in ${chatLang === 'sw' ? 'Kiswahili Sanifu' : 'English'}.
            Keep your spoken sentences short (1-3 sentences max) so that it is easy and comfortable to listen to in real-time.
            Encourage the student and guide them like a tutor. Ask short follow-up questions to test their understanding.`;
            const session = new GeminiLiveSession(
                sysInstruction,
                (text) => {
                    setMessages(prev => {
                        const newMessages = [...prev];
                        const lastMsg = newMessages[newMessages.length - 1];
                        if (lastMsg && lastMsg.role === 'ai' && lastMsg.text.startsWith('📞')) {
                            lastMsg.text = text;
                        } else if (lastMsg && lastMsg.role === 'ai' && !lastMsg.text.startsWith('Live call disconnected')) {
                            lastMsg.text += text;
                        } else {
                            newMessages.push({ role: 'ai', text, timestamp: Date.now() });
                        }
                        return newMessages;
                    });
                },
                (playing) => {
                    setIsSpeaking(playing);
                },
                (err) => {
                    console.error("Live call error:", err);
                    setIsLiveCall(false);
                    if (liveSessionRef.current) {
                        liveSessionRef.current.stop();
                        liveSessionRef.current = null;
                    }
                }
            );

            liveSessionRef.current = session;
            setIsLiveCall(true);
            setMessages(prev => [...prev, {
                role: 'ai',
                text: (chatLang === 'sw' && !isPronMode) ? '📞 Anapiga...' : '📞 Calling...',
                timestamp: Date.now()
            }]);
            
            try {
                await session.start();
            } catch (err) {
                console.error("Failed to start Live Session:", err);
                setIsLiveCall(false);
            }
        }
    }, [isLiveCall, chatLang, educationLevel, isTutor, tutorMode]);

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

                const stream = await chatTalkbackStream(text, messages, chatLang, educationLevel, syllabusContext);
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

                    const isPronMode = activeMode === 'LANGUAGE_TUTOR' && tutorMode === 'pronunciation';
                    if (isPronMode) {
                        setIsAnalyzingPronunciation(true);
                    }

                    try {
                        const targetLang = isPronMode ? 'en' : chatLang;
                        const transcript = await transcribeAudioForChat(base64, mimeType, targetLang);
                        if (transcript && transcript.trim()) {
                            if (isPronMode) {
                                const cleanTranscript = transcript.trim();
                                setSpokenTranscript(cleanTranscript);
                                const matches = checkPronunciationMatch(currentChallenge, cleanTranscript);
                                setMatchedWords(matches);
                                
                                const coaching = await getPhoneticCoaching(currentChallenge, cleanTranscript);
                                setPhoneticCoaching(coaching);
                            } else {
                                await handleSendMessage(transcript.trim());
                            }
                        }
                    } catch (err) {
                        console.error('Transcription failed:', err);
                    } finally {
                        setIsLoading(false);
                        setIsAnalyzingPronunciation(false);
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
    }, [chatLang, handleSendMessage, activeMode, tutorMode, currentChallenge]);

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

    const renderPronunciationChallenge = () => {
        if (!currentChallenge) return null;
        
        return (
            <div className="max-w-2xl mx-auto space-y-6 py-2 px-1">
                {/* 1. Header & Difficulty selector */}
                <div className="bg-white rounded-3xl p-6 shadow-xl border-2 border-slate-200 transition-all">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                <Headphones className="w-5 h-5 text-blue-500 animate-pulse" />
                                Pronunciation Challenge
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Practice speaking this phrase and receive word-by-word visual corrections.
                            </p>
                        </div>
                        
                        {/* Difficulty Pills */}
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {(['easy', 'medium', 'hard'] as const).map((diff) => (
                                <button
                                    key={diff}
                                    onClick={() => setChallengeDifficulty(diff)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                                        challengeDifficulty === diff
                                            ? diff === 'easy' ? 'bg-emerald-500 text-white shadow-md' :
                                              diff === 'medium' ? 'bg-blue-500 text-white shadow-md' :
                                              'bg-rose-500 text-white shadow-md'
                                            : 'text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {diff}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 2. Challenge Phrase Box */}
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        
                        {/* Listen Button top right */}
                        <button
                            onClick={playChallengeTTS}
                            className={`absolute top-3 right-3 p-2 rounded-xl border transition-all ${
                                isPlayingChallengeAudio
                                    ? 'bg-blue-500 border-blue-500 text-white animate-bounce'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                            title="Listen to standard pronunciation"
                        >
                            <Volume2 className="w-4 h-4" />
                        </button>

                        <div className="max-w-[85%] py-4">
                            {/* Word-by-word highlighting */}
                            <div className="flex flex-wrap justify-center gap-x-2 gap-y-3 mb-2">
                                {matchedWords.length > 0 ? (
                                    matchedWords.map((item, idx) => (
                                        <motion.span
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            transition={{ delay: idx * 0.05 }}
                                            key={idx}
                                            className={`text-lg sm:text-2xl font-black px-2 py-0.5 rounded-lg border-b-4 transition-all ${
                                                item.isMatch
                                                    ? 'text-emerald-600 border-emerald-500 bg-emerald-500/5'
                                                    : 'text-rose-600 border-rose-500 bg-rose-500/5'
                                            }`}
                                        >
                                            {item.word}
                                        </motion.span>
                                    ))
                                ) : (
                                    currentChallenge.split(/\s+/).map((word, idx) => (
                                        <span
                                            key={idx}
                                            className="text-lg sm:text-2xl font-black text-slate-800 border-b-4 border-slate-300 px-1"
                                        >
                                            {word}
                                        </span>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Prompt message */}
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                            {isPlayingChallengeAudio ? "Playing guide..." : "Click listen above, then repeat the phrase below"}
                        </p>
                    </div>

                    {/* 3. Action controls: Mic trigger */}
                    <div className="flex flex-col items-center justify-center mt-6 gap-3">
                        <div className="flex items-center gap-4">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl border-4 transition-all ${
                                    isRecording
                                        ? 'bg-rose-500 border-rose-200 text-white shadow-rose-500/30 animate-pulse'
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-500 text-white shadow-indigo-600/20'
                                }`}
                            >
                                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                            </motion.button>

                            {/* Try again / Next buttons */}
                            {spokenTranscript && (
                                <button
                                    onClick={handleNextChallenge}
                                    className="px-5 py-3 rounded-2xl bg-slate-100 border-2 border-slate-300 text-slate-700 hover:bg-slate-200 font-black text-xs uppercase tracking-wider transition-all"
                                >
                                    Next Challenge
                                </button>
                            )}
                        </div>

                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            {isRecording ? "I am listening to you... Tap to finish" : "Tap the microphone to speak"}
                        </p>
                    </div>
                </div>

                {/* 4. Transcribed user speech display */}
                {spokenTranscript && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block mb-1">
                            Your Attempt
                        </span>
                        <p className="text-sm font-semibold text-slate-700 italic">
                            &ldquo;{spokenTranscript}&rdquo;
                        </p>
                    </motion.div>
                )}

                {/* 5. Analysis & Tips Area */}
                {isAnalyzingPronunciation && (
                    <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-md flex flex-col items-center justify-center text-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                        <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                                Mwalimu Akili is listening...
                            </h4>
                            <p className="text-[11px] text-slate-500">
                                Analyzing your syllables, intonation, and speech accuracy...
                            </p>
                        </div>
                    </div>
                )}

                {phoneticCoaching && !isAnalyzingPronunciation && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-6"
                    >
                        {/* Score and feedback */}
                        <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100">
                            {/* Circular progress bar */}
                            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        className="stroke-slate-100"
                                        strokeWidth="8"
                                        fill="transparent"
                                    />
                                    <circle
                                        cx="48"
                                        cy="48"
                                        r="40"
                                        className={`transition-all duration-1000 ${
                                            phoneticCoaching.score >= 80 ? 'stroke-emerald-500' :
                                            phoneticCoaching.score >= 50 ? 'stroke-blue-500' :
                                            'stroke-rose-500'
                                        }`}
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={251.2}
                                        strokeDashoffset={251.2 - (251.2 * phoneticCoaching.score) / 100}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-slate-800 leading-none">
                                        {phoneticCoaching.score}%
                                    </span>
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                        Accuracy
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 text-center sm:text-left">
                                <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-1">
                                    {"Mwalimu's Feedback"}
                                </span>
                                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                                    {phoneticCoaching.feedback}
                                </p>
                            </div>
                        </div>

                        {/* Phonetic tips checklist */}
                        {phoneticCoaching.phoneticTips && phoneticCoaching.phoneticTips.length > 0 && (
                            <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Pronunciation & Mouth Guides
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {phoneticCoaching.phoneticTips.map((tip, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3"
                                        >
                                            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h5 className="text-xs font-black text-slate-850 capitalize">
                                                    {tip.word}
                                                </h5>
                                                <p className="text-xs text-slate-600 leading-relaxed mt-1 font-medium">
                                                    {tip.tip}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col bg-slate-50 relative" style={{ height: '100dvh' }}>

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
                                    {isTutor 
                                        ? (tutorMode === 'pronunciation' ? 'English Pronunciation Coach' : 'Language Coach') 
                                        : 'Akili'}
                                </h2>
                                {formatSyllabusContext(syllabusContext) && (
                                    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/80">
                                        {formatSyllabusContext(syllabusContext)}
                                    </p>
                                )}
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
                            {!(isTutor && tutorMode === 'pronunciation') ? (
                                <button
                                    onClick={() => setChatLang(l => {
                                        const next = l === 'en' ? 'sw' : 'en';
                                        setMessages([{ role: 'ai', text: buildTutorGreeting(activeMode, next, tutorMode, syllabusContext), timestamp: Date.now() }]);
                                        return next;
                                    })}
                                    className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white text-[10px] font-black hover:bg-white/20 transition-all uppercase tracking-wide"
                                >
                                    {chatLang === 'en' ? '🇬🇧 EN' : '🇰🇪 SW'}
                                </button>
                            ) : (
                                <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-wide">
                                    🇬🇧 EN ONLY
                                </div>
                            )}
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
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition-all border ${activeMode === 'TALKBACK' && !isLiveCall
                                ? 'bg-white text-indigo-700 border-white shadow-lg'
                                : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Study Buddy
                        </button>
                        <button
                            onClick={() => switchMode('LANGUAGE_TUTOR')}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition-all border ${activeMode === 'LANGUAGE_TUTOR' && !isLiveCall
                                ? 'bg-white text-indigo-700 border-white shadow-lg'
                                : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
                            }`}
                        >
                            <Languages className="w-3.5 h-3.5" />
                            Language Coach
                        </button>

                        <button
                            onClick={toggleLiveCall}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wide whitespace-nowrap transition-all border ${isLiveCall
                                ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-500/20'
                                : 'bg-white/10 text-white/80 border-white/10 hover:bg-white/20'
                            }`}
                        >
                            {isLiveCall ? <PhoneOff className="w-3.5 h-3.5" /> : <PhoneCall className="w-3.5 h-3.5" />}
                            {isLiveCall ? 'Hang Up' : 'Live Call'}
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
                {isTutor && tutorMode === 'pronunciation' && !isLiveCall ? (
                    renderPronunciationChallenge()
                ) : (
                    <>
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
                                    {getQuickStarters(chatLang, syllabusContext).map((starter, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleSendMessage(starter)}
                                            className="px-3 py-2 rounded-xl bg-white border-2 border-slate-300 text-xs font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all active:scale-95"
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
                                <div className="w-8 h-8 rounded-xl overflow-hidden border-2 border-slate-300 flex-shrink-0">
                                    <img src={isTutor ? mwalimuSomoImg : somoBuddyImg} alt="AI" className="w-full h-full object-cover" />
                                </div>
                                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-white shadow-sm border-2 border-slate-300 flex items-center gap-2">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {chatLang === 'sw' ? 'Inafikiri...' : 'Thinking...'}
                                    </span>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}

                <div ref={chatEndRef} className="h-2" />
            </div>

            {/* ── Input Area ── */}
            {!(isTutor && tutorMode === 'pronunciation' && !isLiveCall) ? (
                <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-4 pt-3 pb-6 relative z-50">
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
                                    className="text-[9px] font-black text-red-500 uppercase border-l border-slate-200 pl-2 ml-1"
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
                                    isLiveCall ? (chatLang === 'sw' ? 'Unazungumza moja kwa moja na Akili...' : 'Live call active...') :
                                    isRecording ? 'Listening...' :
                                    chatLang === 'sw' ? 'Andika ujumbe...' : 'Ask anything...'
                                }
                                className="w-full px-5 py-3.5 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 bg-slate-100 border-2 border-slate-300 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all"
                                disabled={isLoading || isRecording || isLiveCall}
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
                                        disabled={isLoading || isLiveCall}
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                            <Send className="w-4 h-4" />
                                    </motion.button>
                                )}
                            </AnimatePresence>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={isLoading || isLiveCall}
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
            ) : (
                <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 px-4 py-4 text-center z-50">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        English Pronunciation Mode (Matamshi ya Kiingereza) — English Only
                    </p>
                </div>
            )}
        </div>
    );
};

export default ConversationalTutor;

