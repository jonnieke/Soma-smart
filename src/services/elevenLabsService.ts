import axios from 'axios';

const API_KEY = import.meta.env.VITE_ELEVEN_LABS_API_KEY;
// Using a "Rachel" or similar warm voice ID. You can replace this with a cloned "Teacher Wanjiku" voice ID from your ElevenLabs dashboard.
// Default ID (Rachel): 21m00Tcm4TlvDq8ikWAM
// Recommended for African Context (if cloned): Use the ID provided by ElevenLabs after cloning.
const VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

const BASE_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

export const generateSpeech = async (text: string): Promise<string> => {
    if (!API_KEY) {
        console.warn("ElevenLabs API Key missing. Falling back to browser TTS.");
        throw new Error("API Key missing");
    }

    try {
        const response = await axios.post(
            BASE_URL,
            {
                text,
                model_id: "eleven_multilingual_v2", // Better emotion and accents
                voice_settings: {
                    stability: 0.4, // Lower = more expressive
                    similarity_boost: 0.6,
                },
            },
            {
                headers: {
                    'xi-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
                responseType: 'blob', // Important for audio
            }
        );

        // Create a URL for the blob
        return URL.createObjectURL(response.data);
    } catch (error) {
        console.error("ElevenLabs API Error:", error);
        throw error;
    }
};
