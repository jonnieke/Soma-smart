import axios from 'axios';
import { supabase } from '../lib/supabase';

const LOCAL_API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY;

// ==========================================================
// VOICE LIBRARY — curated from ElevenLabs premade catalogue
// ==========================================================

// Listen & Learn (educational narration)
// Alice — "Clear, Engaging Educator", British female, informative_educational use-case
const VOICE_ID_EN = "Xb7hH8MSUJpSbSDYk0k2"; // Alice
// Brian — "Deep, Resonant and Comforting", good for Swahili narration via multilingual_v2
const VOICE_ID_SW = "nPczCjzI2devNBz1zQrb"; // Brian

// Default voice for generic speak() calls (Alice — educational EN)
const VOICE_ID = VOICE_ID_EN;

// Talkback conversational tutor voices
export const TALKBACK_VOICES = {
    en: "EXAVITQu4vr4xnSDxMaL", // Sarah — Mature, Reassuring, Confident
    sw: "nPczCjzI2devNBz1zQrb",  // Brian — Deep, Resonant and Comforting
} as const;

// Language tutor voices (slightly more formal/teacher-like)
export const LANGUAGE_TUTOR_VOICES = {
    en: "JBFqnCBsd6RMkjVDRZzb", // George — Warm, Captivating Storyteller (British)
    sw: "nPczCjzI2devNBz1zQrb",  // Brian — Deep, Resonant and Comforting
} as const;

// Keep track of current audio to allow stopping
let currentAudio: HTMLAudioElement | null = null;

/**
 * Strip markdown/formatting characters so they are not spoken aloud by TTS.
 * e.g. **bold**, ### headers, bullet dashes, numbered lists, etc.
 */
const cleanForTTS = (raw: string): string => {
    return raw
        .replace(/^Curriculum Alignment:.*$/gim, '') // metadata sounds robotic when narrated
        .replace(/^Exam Insight:?/gim, 'Exam tip:')
        .replace(/#{1,6}\s*/g, '')           // remove markdown headers (# ## ###)
        .replace(/\*\*(.+?)\*\*/g, '$1')      // **bold** -> plain
        .replace(/\*(.+?)\*/g, '$1')          // *italic* -> plain
        .replace(/`(.+?)`/g, '$1')            // `code` -> plain
        .replace(/^\s*[-*+]\s+/gm, '')        // bullet points
        .replace(/^\s*\d+\.\s+/gm, '')        // numbered lists
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link text](url) -> link text
        .replace(/_+/g, '')                   // underscores
        .replace(/\n{2,}/g, '. ')             // paragraph breaks -> pause
        .replace(/\n/g, ' ')                  // single newlines -> space
        .replace(/\s{2,}/g, ' ')              // collapse whitespace
        .trim();
};

const LESSON_VOICE_SETTINGS = {
    stability: 0.30,
    similarity_boost: 0.86,
    style: 0.62,
    use_speaker_boost: true
};

const PODCAST_VOICE_SETTINGS = {
    stability: 0.32,
    similarity_boost: 0.84,
    style: 0.70,
    use_speaker_boost: true
};

export const stopSpeech = () => {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = "";
        currentAudio = null;
    }
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
};

export const speak = async (text: string, language: 'EN' | 'SW' = 'EN'): Promise<void> => {
    stopSpeech(); // Stop any pending speech

    const cleanText = cleanForTTS(text);
    // Pick voice based on language: Alice (EN) or Brian (SW)
    const selectedVoiceId = language === 'SW' ? VOICE_ID_SW : VOICE_ID_EN;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Check if we should attempt TTS at all
    if (!isLocal && !import.meta.env.VITE_SUPABASE_URL) {
         // Fallback directly if no proxy config exists
    } else {
        try {
            let audioBlob: Blob;

            if (isLocal && LOCAL_API_KEY && LOCAL_API_KEY.length > 10) {
                // Direct call bypass for local dev
                const response = await axios.post(
                    `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
                    {
                        text: cleanText,
                        model_id: "eleven_multilingual_v2",
                        voice_settings: LESSON_VOICE_SETTINGS,
                    },
                    {
                        headers: {
                            'xi-api-key': LOCAL_API_KEY,
                            'Content-Type': 'application/json',
                        },
                        responseType: 'blob',
                    }
                );
                audioBlob = response.data;
            } else {
                // Proxy call for production
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                
                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-proxy`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        voiceId: selectedVoiceId,
                        text: cleanText,
                        model_id: "eleven_multilingual_v2",
                        voice_settings: LESSON_VOICE_SETTINGS
                    })
                });

                if (!response.ok) throw new Error("Proxy response not ok");
                audioBlob = await response.blob();
            }

            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudio = audio;

            return new Promise((resolve, reject) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    currentAudio = null;
                    resolve();
                };
                audio.onerror = (e) => {
                    URL.revokeObjectURL(audioUrl);
                    currentAudio = null;
                    reject(e);
                };
                audio.play().catch(reject);
            });
        } catch (error: any) {
            console.error("ElevenLabs failed (General Speak):", error.response?.data || error.message);
            throw new Error("ElevenLabs voice is unavailable. Please check the ElevenLabs proxy/API key instead of falling back to robotic browser speech.");
        }
    }

    throw new Error("ElevenLabs voice is not configured. Browser speech fallback is disabled for Listen & Learn quality.");
};

// --- PODCAST PLAYER ---

let podcastController: AbortController | null = null;
let podcastQueue: HTMLAudioElement[] = [];

export const cancelPodcast = () => {
    if (podcastController) {
        podcastController.abort();
        podcastController = null;
    }
    podcastQueue.forEach(audio => {
        audio.pause();
        audio.src = "";
    });
    podcastQueue = [];
    stopSpeech();
};

export const playPodcast = async (
    script: Array<{ speaker: 'Host' | 'Guest', text: string }>,
    onProgress: (index: number) => void,
    onComplete: () => void,
    onError?: (error: any) => void
) => {
    cancelPodcast(); // Stop any existing playback
    podcastController = new AbortController();
    const signal = podcastController.signal;

    let useElevenLabs = true; // We will attempt to use proxy by default
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocal && (!LOCAL_API_KEY || LOCAL_API_KEY.length < 5)) {
        throw new Error("ElevenLabs API key is missing locally, so Listen & Learn cannot use the natural voice.");
    }

    const VOICES = {
        // Matilda — Knowledgeable, Professional, upbeat American female → "Rachel" host persona
        Host: "XrExE9yKIg1WjnnlVkGX",
        // George — Warm, Captivating Storyteller, British male → expert guest persona
        Guest: "JBFqnCBsd6RMkjVDRZzb",
    };

    // Helper to fetch audio
    const fetchAudio = async (text: string, voiceId: string): Promise<string> => {
        let audioBlob: Blob;

        if (isLocal && LOCAL_API_KEY) {
             const response = await axios.post(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                    text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: PODCAST_VOICE_SETTINGS,
                },
                {
                    headers: { 'xi-api-key': LOCAL_API_KEY, 'Content-Type': 'application/json' },
                    responseType: 'blob',
                }
            );
            audioBlob = response.data;
        } else {
             const { data: { session } } = await supabase.auth.getSession();
             const token = session?.access_token;
             const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-proxy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    voiceId,
                    text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: PODCAST_VOICE_SETTINGS
                })
             });
             if (!response.ok) throw new Error("Proxy error for podcast");
             audioBlob = await response.blob();
        }

        return URL.createObjectURL(audioBlob);
    };

    const playNativeBrowserSpeech = (text: string, speaker: 'Host' | 'Guest'): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (!window.speechSynthesis) {
                resolve(); // Just skip if no TTS
                return;
            }

            // To ensure we don't start reading if aborted already
            if (signal.aborted) {
                resolve();
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = speaker === 'Host' ? 1.05 : 0.95;
            utterance.pitch = speaker === 'Host' ? 1.1 : 0.9;

            const voices = window.speechSynthesis.getVoices();
            if (speaker === 'Host') {
                const voice = voices.find(v => (v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Google UK English Female") || v.name.includes("Samantha")));
                if (voice) utterance.voice = voice;
            } else {
                const voice = voices.find(v => (v.name.includes("Male") || v.name.includes("David") || v.name.includes("Google UK English Male") || v.name.includes("Daniel")));
                if (voice) utterance.voice = voice;
            }

            utterance.onend = () => resolve();
            utterance.onerror = (e) => { console.warn('Browser TTS fallback interrupted or failed', e); resolve(); };

            window.speechSynthesis.speak(utterance);
        });
    };

    try {
        // Pre-load voices if using native TTS
        if (!useElevenLabs && window.speechSynthesis.getVoices().length === 0) {
            window.speechSynthesis.getVoices();
        }

        for (let i = 0; i < script.length; i++) {
            if (signal.aborted) return;
            onProgress(i);

            const segment = script[i];

            if (useElevenLabs) {
                try {
                    const voiceId = VOICES[segment.speaker] || VOICES.Host;

                    // Fetch
                    const audioUrl = await fetchAudio(segment.text, voiceId);
                    if (signal.aborted) return;

                    const audio = new Audio(audioUrl);
                    podcastQueue.push(audio);
                    currentAudio = audio;

                    // Play and wait
                    await new Promise<void>((resolve, reject) => {
                        audio.onended = () => {
                            URL.revokeObjectURL(audioUrl);
                            resolve();
                        };
                        audio.onerror = (e) => {
                            URL.revokeObjectURL(audioUrl);
                            reject(e);
                        };
                        // Handle potential autoplay restrictions
                        audio.play().catch(err => {
                            console.warn("Autoplay blocked or playback error:", err);
                            reject(err);
                        });
                    });
                } catch (err: any) {
                    console.warn("ElevenLabs failed during podcast.", err.message || err);
                    throw new Error("ElevenLabs podcast voice failed. Robotic browser fallback is disabled for Listen & Learn.");
                }
            }

            if (!useElevenLabs && !signal.aborted) {
                await playNativeBrowserSpeech(segment.text, segment.speaker);
            }
        }

        if (!signal.aborted) {
            onComplete();
        }

    } catch (e) {
        console.error("Podcast Playback Error", e);
        if (!signal.aborted) {
            if (onError) onError(e);
            onComplete();
        }
    }
};

// --- CONVERSATIONAL TTS (for Talkback / Language Tutor) ---
export const speakConversational = async (text: string, voiceId: string): Promise<void> => {
    stopSpeech(); // Stop any existing speech

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (!isLocal || (isLocal && LOCAL_API_KEY && LOCAL_API_KEY.length > 10)) {
        try {
            const isSwahiliVoice = voiceId === 'nt9hK6jZNn8o3C1F4w9u' || voiceId === 'Xb7hK6jZNn8o3C1F4w9u';
            const payload: any = {
                text,
                model_id: isSwahiliVoice ? "eleven_multilingual_v2" : "eleven_flash_v2_5",
                voice_settings: {
                    stability: isSwahiliVoice ? 0.45 : 0.5,
                    similarity_boost: 0.8,
                    style: 0.1,
                    use_speaker_boost: true,
                },
            };

            let audioBlob: Blob;

            if (isLocal && LOCAL_API_KEY) {
                const response = await axios.post(
                    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                    payload,
                    {
                        headers: {
                            'xi-api-key': LOCAL_API_KEY,
                            'Content-Type': 'application/json',
                        },
                        responseType: 'blob',
                    }
                );
                audioBlob = response.data;
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                const token = session?.access_token;
                const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-proxy`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ voiceId, ...payload })
                });
                if (!response.ok) throw new Error("Conversational proxy error");
                audioBlob = await response.blob();
            }

            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            currentAudio = audio;

            return new Promise((resolve, reject) => {
                audio.onended = () => {
                    URL.revokeObjectURL(audioUrl);
                    currentAudio = null;
                    resolve();
                };
                audio.onerror = (e) => {
                    URL.revokeObjectURL(audioUrl);
                    currentAudio = null;
                    reject(e);
                };
                audio.play().catch(reject);
            });
        } catch (error: any) {
            console.error("ElevenLabs Conversational TTS failed:", error.response?.data || error.message);
        }
    }

    // Fallback: Browser native TTS
    return new Promise((resolve, reject) => {
        if (!window.speechSynthesis) {
            resolve();
            return;
        }
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = (voiceId === 'nt9hK6jZNn8o3C1F4w9u' || voiceId === 'Xb7hK6jZNn8o3C1F4w9u') ? 'sw' : 'en-US';
        utterance.rate = 1.0;
        utterance.onend = () => resolve();
        utterance.onerror = (e) => { console.warn('Browser TTS fallback interrupted or failed', e); resolve(); };
        window.speechSynthesis.speak(utterance);
    });
};

// --- SPEECH QUEUEING FOR STREAMING ---
let speechQueue: string[] = [];
let isProcessingQueue = false;

const processQueue = async (voiceId: string) => {
    if (isProcessingQueue || speechQueue.length === 0) return;
    isProcessingQueue = true;
    try {
        while (speechQueue.length > 0) {
            const nextText = speechQueue.shift();
            if (nextText) {
                try { await speakConversational(nextText, voiceId); } catch (e) { console.error('Speech queue error:', e); }
            }
        }
    } finally {
        isProcessingQueue = false;
    }
};

export const queueSpeak = (text: string, voiceId: string) => {
    speechQueue.push(text);
    processQueue(voiceId);
};

export const clearSpeechQueue = () => {
    speechQueue = [];
    isProcessingQueue = false;
    stopSpeech();
};
