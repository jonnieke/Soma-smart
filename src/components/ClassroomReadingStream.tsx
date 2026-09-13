import React, { useEffect, useState } from 'react';
import { classroomService, ClassroomPost } from '../services/classroomService';

/** Reads through the existing membership-protected API; never uses local fallback posts. */
export const ClassroomReadingStream: React.FC<{ classId: string }> = ({ classId }) => {
    const [posts, setPosts] = useState<ClassroomPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(false);
        setPosts([]);
        classroomService.getClassStream(classId, true).then(rows => {
            if (active) setPosts(rows);
        }).catch(() => {
            if (active) setError(true);
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, [classId, attempt]);
    return <section className="space-y-4 text-left" aria-label="Classroom work">
        <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-xl text-slate-900">Your class work</h2>
            <button disabled={loading} onClick={() => setAttempt(value => value + 1)} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-50">Refresh</button>
        </div>
        {loading ? <p role="status">Loading class work…</p> : error ? <p role="alert">Could not load class work. Check your connection and class access, then refresh.</p> : posts.length === 0 ? <p>No class work has been posted yet.</p> : posts.map(post => <article key={post.id} className="rounded-xl border bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-bold text-indigo-700">{post.post_type === 'ASSIGNMENT' ? 'Assignment' : 'Class update'}</h3>
            <p className="whitespace-pre-wrap break-words text-slate-800 leading-relaxed">{post.content}</p>
        </article>)}
        <p className="text-sm text-slate-500">Complete written work as your teacher instructs. Online submission is not available here yet.</p>
    </section>;
};
