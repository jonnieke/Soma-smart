import { useState, useEffect } from 'react';
import { processLessonAudio, saveLessonToStorage, getLessonsFromStorage } from '../services/darasaService';
import { LessonResult } from '../../../types';
import { useApp } from '../../../context/AppContext';

export type DarasaState = 'idle' | 'recording' | 'processing' | 'audio_review' | 'review' | 'error';

interface UseDarasaLessonReturn {
    state: DarasaState;
    lesson: LessonResult | null;
    audioBlob: Blob | null;
    error: string | null;
    setState: (state: DarasaState) => void;
    captureAudio: (blob: Blob) => void;
    confirmProcessing: () => Promise<void>;
    reset: () => void;
    saveCurrentLesson: () => Promise<void>;
    history: LessonResult[];
    loadHistory: () => Promise<void>;
}

export const useDarasaLesson = (): UseDarasaLessonReturn => {
    const { language } = useApp();
    const [state, setState] = useState<DarasaState>('idle');
    const [lesson, setLesson] = useState<LessonResult | null>(null);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<LessonResult[]>([]);

    const captureAudio = (blob: Blob) => {
        setAudioBlob(blob);
        setState('audio_review');
    };

    const confirmProcessing = async () => {
        if (!audioBlob) return;

        try {
            setState('processing');
            setError(null);

            // Call the existing service
            const result = await processLessonAudio(audioBlob, language);

            if (!result) {
                throw new Error("No result generated.");
            }

            setLesson(result);
            setState('review');
        } catch (err: any) {
            console.error("Darasa Process Error:", err);
            setError(err.message || "Failed to generate lesson. Please try again.");
            setState('idle');
        }
    };

    const reset = () => {
        setState('idle');
        setLesson(null);
        setAudioBlob(null);
        setError(null);
    };

    const saveCurrentLesson = async () => {
        if (!lesson) return;
        try {
            await saveLessonToStorage(lesson);
            // Optional: Refresh history or show toast
        } catch (err: any) {
            console.error("Save Error:", err);
            setError("Failed to save lesson.");
        }
    };

    const loadHistory = async () => {
        const lessons = await getLessonsFromStorage();
        setHistory(lessons || []);
    };

    // Load history on mount
    useEffect(() => {
        loadHistory();
    }, []);

    return {
        state,
        lesson,
        audioBlob,
        error,
        history, // New
        setState,
        captureAudio,
        confirmProcessing,
        saveCurrentLesson, // New
        loadHistory, // New
        reset
    };
};
