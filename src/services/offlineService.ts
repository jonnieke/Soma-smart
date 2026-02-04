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
        } catch (e) {
            console.error("Local save failed", e);
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
        this.saveLearnerHistory(merged);
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
        this.saveTeacherHistory(merged);
        return merged;
    }
};
