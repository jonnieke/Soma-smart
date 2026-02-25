import { LearnerActivity, TeacherActivity } from '../types';

const LEARNER_HISTORY_KEY = 'soma_learner_history_local';
const TEACHER_HISTORY_KEY = 'soma_teacher_history_local';

export const offlineService = {
    // Learner History
    getLearnerHistory(): LearnerActivity[] {
        try {
            const data = localStorage.getItem(LEARNER_HISTORY_KEY);
            if (data) {
                const parsed = JSON.parse(data) as LearnerActivity[];
                // Filter out corrupted activities where topic is just a timestamp
                return parsed.filter(item => !/^\d{13}$/.test(item.topic));
            }
            return [];
        } catch (e) {
            console.error("Local load failed", e);
            return [];
        }
    },

    saveLearnerHistory(history: LearnerActivity[]) {
        try {
            // ONLY keep full details for the 3 most recent activities.
            // Strip the heavy "details" payload from older items to prevent QuotaExceededError.
            const historyToSave = history.map((item, index) => {
                if (index >= 3 && item.details) {
                    const { details, ...rest } = item;
                    return rest;
                }
                return item;
            });
            localStorage.setItem(LEARNER_HISTORY_KEY, JSON.stringify(historyToSave));
        } catch (e: any) {
            console.error("Local save failed", e);
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                // If the quota still fails, aggressively keep only 10 items total
                try {
                    const existing = this.getLearnerHistory();
                    if (existing.length > 10) {
                        const trimmed = existing.slice(0, 10).map(item => {
                            const { details, ...rest } = item;
                            return rest;
                        });
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
