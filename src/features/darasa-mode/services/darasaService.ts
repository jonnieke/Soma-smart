import { LessonResult } from '../../../types';
import { generateDarasaLesson, generateDarasaRevision } from '../../../services/geminiService';

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

export const processRevisionFile = async (file: File): Promise<LessonResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64String = reader.result as string;
                // e.g. "data:image/jpeg;base64,..."
                const base64Data = base64String.split(',')[1];
                const mimeType = file.type;

                const result = await generateDarasaRevision(base64Data, mimeType);
                resolve(result);
            } catch (error) {
                console.error("Error processing revision file:", error);
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

// Persistence Keys
const STORAGE_KEY = 'darasa_sessions_v1';

export const saveLessonToStorage = (lesson: LessonResult): void => {
    try {
        const existing = getLessonsFromStorage();
        const updated = [lesson, ...existing];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to save lesson", e);
    }
};

export const getLessonsFromStorage = (): LessonResult[] => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        console.error("Failed to load lessons", e);
        return [];
    }
};

export const deleteLessonFromStorage = (id: string): void => {
    try {
        const existing = getLessonsFromStorage();
        const updated = existing.filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
        console.error("Failed to delete lesson", e);
    }
};
