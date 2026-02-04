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
