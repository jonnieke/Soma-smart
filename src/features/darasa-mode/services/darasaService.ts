import { LessonResult } from '../../../types';
import { generateDarasaLesson, generateDarasaRevision } from '../../../services/geminiService';

export const processLessonAudio = async (audioBlob: Blob, language: 'EN' | 'FR' = 'EN'): Promise<LessonResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64String = reader.result as string;
                // Remove prefix if present (e.g. data:audio/webm;base64,)
                const base64Data = base64String.split(',')[1];
                const mimeType = audioBlob.type || 'audio/webm'; // Default to webm if missing

                const result = await generateDarasaLesson(base64Data, mimeType, language);
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

export const processRevisionFile = async (file: File, language: 'EN' | 'FR' = 'EN'): Promise<LessonResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64String = reader.result as string;
                // e.g. "data:image/jpeg;base64,..."
                const base64Data = base64String.split(',')[1];
                const mimeType = file.type;

                const result = await generateDarasaRevision(base64Data, mimeType, language);
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

import { supabase } from '../../../lib/supabase';

// DB Table Name
const TABLE_NAME = 'darasa_lessons';

export const saveLessonToStorage = async (lesson: LessonResult): Promise<void> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("User not authenticated");

        // Validate ID format. If it's a timestamp (legacy from Gemini), generate a real UUID
        let lessonId = lesson.id;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(lessonId)) {
            // It's likely a timestamp string, so we generate a new UUID for DB storage
            lessonId = crypto.randomUUID();
        }

        // Upsert to Supabase
        const { error } = await supabase.from(TABLE_NAME).upsert({
            id: lessonId,
            user_id: user.id,
            topic: lesson.topic,
            summary: lesson.summary,
            content: { ...lesson, id: lessonId }, // Store full JSON with the correct UUID
            created_at: new Date().toISOString() // Ensure standard ISO format
        });

        if (error) {
            console.error("Supabase Upsert Error:", error);
            throw error;
        }
    } catch (e) {
        console.error("Failed to save lesson to cloud:", e);
        throw e;
    }
};

export const getLessonsFromStorage = async (): Promise<LessonResult[]> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data?.map(row => {
            // Handle legacy or structure differences if needed
            // Assuming row.content holds the full LessonResult structure
            return typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
        }) || [];
    } catch (e) {
        console.error("Failed to load lessons from cloud:", e);
        return [];
    }
};

export const deleteLessonFromStorage = async (id: string): Promise<void> => {
    try {
        const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);
        if (error) throw error;
    } catch (e) {
        console.error("Failed to delete lesson:", e);
        throw e;
    }
};
