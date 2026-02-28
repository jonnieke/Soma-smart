import axios from 'axios';

const API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
// Using "Rachel" as default warm voice
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";
const BASE_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

// Keep track of current audio to allow stopping
let currentAudio: HTMLAudioElement | null = null;

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

export const speak = async (text: string): Promise<void> => {
    stopSpeech(); // Stop any pending speech

    // Try ElevenLabs First
    if (API_KEY && API_KEY.length > 10) {
        try {
            const response = await axios.post(
                BASE_URL,
                {
                    text,
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                },
                {
                    headers: {
                        'xi-api-key': API_KEY,
                        'Content-Type': 'application/json',
                    },
                    responseType: 'blob',
                }
            );

            const audioUrl = URL.createObjectURL(response.data);
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
        } catch (error) {
            console.error("ElevenLabs failed, falling back to browser TTS:", error);
        }
    }

    // Fallback: Browser Native TTS
    return new Promise((resolve, reject) => {
        if (!window.speechSynthesis) {
            reject(new Error("No TTS supporting browser interface found."));
            return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.0;

        // Find a better voice if possible (usually local voices sound better)
        const voices = window.speechSynthesis.getVoices();
        const googleVoice = voices.find(v => v.name.includes("Google") && v.lang.startsWith("en"));
        if (googleVoice) utterance.voice = googleVoice;

        utterance.onend = () => resolve();
        utterance.onerror = (e) => reject(e);

        window.speechSynthesis.speak(utterance);
    });
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

    let useElevenLabs = !!API_KEY && API_KEY.length >= 5;

    if (!useElevenLabs) {
        console.warn("ElevenLabs API Key is missing or invalid. Falling back to browser TTS.");
    } else {
        console.log(`[ElevenLabs] Starting podcast playback. Key starts with: ${API_KEY.substring(0, 4)}... (Length: ${API_KEY.length})`);
    }

    const VOICES = {
        Host: "21m00Tcm4TlvDq8ikWAM", // Rachel
        Guest: "ErXwobaYiN019PkySvjV"  // Antoni
    };

    // Helper to fetch audio
    const fetchAudio = async (text: string, voiceId: string): Promise<string> => {
        const response = await axios.post(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
            {
                text,
                model_id: "eleven_multilingual_v2",
                voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            },
            {
                headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
                responseType: 'blob',
            }
        );
        return URL.createObjectURL(response.data);
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
            utterance.onerror = (e) => reject(e);

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
                    console.warn("ElevenLabs failed during podcast, falling back to browser TTS.", err.message || err);
                    useElevenLabs = false; // Fallback for this and all subsequent segments
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
