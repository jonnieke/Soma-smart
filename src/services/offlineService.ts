import { LearnerActivity, TeacherActivity } from '../types';

const LEARNER_HISTORY_KEY = 'soma_learner_history_local';
const TEACHER_HISTORY_KEY = 'soma_teacher_history_local';

export const offlineService = {
    // Learner History
    getLearnerHistory(): LearnerActivity[] {
        try {
            const data = localStorage.getItem(LEARNER_HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Local load failed", e);
            return [];
        }
    },

    saveLearnerHistory(history: LearnerActivity[]) {
        try {
            localStorage.setItem(LEARNER_HISTORY_KEY, JSON.stringify(history));
        } catch (e: any) {
            console.error("Local save failed", e);
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                // Determine what to do: trim history or clear it
                // For now, let's keep only the last 50 items if it fails
                try {
                    const existing = this.getLearnerHistory();
                    if (existing.length > 50) {
                        const trimmed = existing.slice(0, 50);
                        localStorage.setItem(LEARNER_HISTORY_KEY, JSON.stringify(trimmed));
                    } else {
                        // Critical failure, clear all
                        this.clearLearnerHistory();
                    }
                } catch (retryError) {
                    console.error("Retry save failed", retryError);
                }
            }
        }
    },

    clearLearnerHistory() {
        try {
            localStorage.removeItem(LEARNER_HISTORY_KEY);
        } catch (e) {
            console.error("Local clear failed", e);
        }
    },

    // Teacher History
    getTeacherHistory(): TeacherActivity[] {
        try {
            const data = localStorage.getItem(TEACHER_HISTORY_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Local load failed", e);
            return [];
        }
    },

    saveTeacherHistory(history: TeacherActivity[]) {
        try {
            localStorage.setItem(TEACHER_HISTORY_KEY, JSON.stringify(history));
        } catch (e) {
            console.error("Local save failed", e);
        }
    },

    clearTeacherHistory() {
        try {
            localStorage.removeItem(TEACHER_HISTORY_KEY);
        } catch (e) {
            console.error("Local clear failed", e);
        }
    },

    // Merge logic: keep local pending ones, update the rest from remote
    mergeLearnerHistory(remoteHistory: LearnerActivity[]): LearnerActivity[] {
        const local = this.getLearnerHistory();
        const pending = local.filter(item => item.pendingSync);

        // Combine remote with pending local
        // Use a Map to avoid duplicates, prioritizing pending
        const map = new Map<string, LearnerActivity>();
        remoteHistory.forEach(item => map.set(item.id, item));
        pending.forEach(item => map.set(item.id, item));

        const merged = Array.from(map.values()).sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // SAVE ONLY A SUBSET TO LOCAL STORAGE TO PREVENT QUOTA EXCEEDED
        // Keep all pending, plus up to 20 recent items
        const pendingIds = new Set(pending.map(p => p.id));
        const limitedForStorage = merged.filter(item => pendingIds.has(item.id) || merged.indexOf(item) < 20);

        this.saveLearnerHistory(limitedForStorage);
        return merged;
    },

    mergeTeacherHistory(remoteHistory: TeacherActivity[]): TeacherActivity[] {
        const local = this.getTeacherHistory();
        const pending = local.filter(item => item.pendingSync);

        const map = new Map<string, TeacherActivity>();
        remoteHistory.forEach(item => map.set(item.id, item));
        pending.forEach(item => map.set(item.id, item));

        const merged = Array.from(map.values()).sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        // SAVE ONLY A SUBSET TO LOCAL STORAGE
        const pendingIds = new Set(pending.map(p => p.id));
        const limitedForStorage = merged.filter(item => pendingIds.has(item.id) || merged.indexOf(item) < 20);

        this.saveTeacherHistory(limitedForStorage);
        return merged;
    }
};
