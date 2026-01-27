import { LessonResult } from '../../../types';
import { generateDarasaLesson } from '../../../services/geminiService';

export const processLessonAudio = async (audioBlob: Blob): Promise<LessonResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64String = reader.result as string;
                // Remove prefix if present (e.g. data:audio/webm;base64,)
                const base64Data = base64String.split(',')[1];

                const result = await generateDarasaLesson(base64Data);
                resolve(result);
            } catch (error) {
                console.error("Error processing lesson audio:", error);
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
    });
};
