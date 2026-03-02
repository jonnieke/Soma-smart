import { LearnerActivity, TeacherActivity } from '../types';

const DB_NAME = 'SomaSmartDB';
const DB_VERSION = 1;
const STORES = {
    LEARNER_HISTORY: 'learner_history',
    TEACHER_HISTORY: 'teacher_history'
};

class DBService {
    private db: IDBDatabase | null = null;

    private async getDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event: any) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORES.LEARNER_HISTORY)) {
                    db.createObjectStore(STORES.LEARNER_HISTORY, { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains(STORES.TEACHER_HISTORY)) {
                    db.createObjectStore(STORES.TEACHER_HISTORY, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event: any) => {
                this.db = event.target.result;
                resolve(this.db!);
            };

            request.onerror = (event: any) => {
                reject(event.target.error);
            };
        });
    }

    async putLearnerActivity(activity: LearnerActivity): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.LEARNER_HISTORY, 'readwrite');
        const store = tx.objectStore(STORES.LEARNER_HISTORY);
        await new Promise((resolve, reject) => {
            const request = store.put(activity);
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
        });
    }

    async getLearnerActivities(): Promise<LearnerActivity[]> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.LEARNER_HISTORY, 'readonly');
        const store = tx.objectStore(STORES.LEARNER_HISTORY);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                // Sort by date descending
                const results = (request.result as LearnerActivity[]).sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async putTeacherActivity(activity: TeacherActivity): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.TEACHER_HISTORY, 'readwrite');
        const store = tx.objectStore(STORES.TEACHER_HISTORY);
        await new Promise((resolve, reject) => {
            const request = store.put(activity);
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
        });
    }

    async getTeacherActivities(): Promise<TeacherActivity[]> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.TEACHER_HISTORY, 'readonly');
        const store = tx.objectStore(STORES.TEACHER_HISTORY);
        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => {
                const results = (request.result as TeacherActivity[]).sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                );
                resolve(results);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteLearnerActivity(id: string): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.LEARNER_HISTORY, 'readwrite');
        const store = tx.objectStore(STORES.LEARNER_HISTORY);
        await new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteTeacherActivity(id: string): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction(STORES.TEACHER_HISTORY, 'readwrite');
        const store = tx.objectStore(STORES.TEACHER_HISTORY);
        await new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(undefined);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAll(): Promise<void> {
        const db = await this.getDB();
        const tx = db.transaction([STORES.LEARNER_HISTORY, STORES.TEACHER_HISTORY], 'readwrite');
        tx.objectStore(STORES.LEARNER_HISTORY).clear();
        tx.objectStore(STORES.TEACHER_HISTORY).clear();
    }
}

export const dbService = new DBService();
