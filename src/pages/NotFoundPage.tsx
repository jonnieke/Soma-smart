import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, GraduationCap, Home, Users } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Helmet>
                <title>Page Not Found | Soma AI</title>
                <meta name="robots" content="noindex, follow" />
            </Helmet>

            <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-6">
                <div className="mx-auto inline-flex rounded-full bg-indigo-50 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-indigo-700">
                    404 · Page Not Found
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                        We couldn&apos;t find that study page
                    </h1>
                    <p className="text-sm text-slate-600">
                        The link may have moved. Jump straight back into your learning tools below.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition"
                    >
                        <Home className="h-4 w-4" /> Ask Akili Home
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/learner')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                    >
                        <GraduationCap className="h-4 w-4 text-indigo-600" /> My Classroom
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/exam-papers')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                    >
                        <FileText className="h-4 w-4 text-emerald-600" /> Past Papers
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/revision')}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
                    >
                        <BookOpen className="h-4 w-4 text-violet-600" /> Candidates Hub
                    </button>
                </div>

                <button
                    type="button"
                    onClick={() => navigate('/join')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
                >
                    <Users className="h-3.5 w-3.5" /> Joining a teacher&apos;s class with a code?
                </button>
            </div>
        </div>
    );
};
