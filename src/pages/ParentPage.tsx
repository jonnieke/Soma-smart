import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ParentDashboard } from '../features/parent/Parent';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { ViewState, UserRole } from '../types';
import { Loader2, Users, ArrowRight, AlertCircle } from 'lucide-react';

const CHILD_LINK_KEY = 'soma_parent_linked_child';

interface LinkedChild {
    studentCode: string;
    studentId: string;
    name?: string;
}

export const ParentPage: React.FC = () => {
    const navigate = useNavigate();
    const { learnerHistory, studentCode, userId, loginParent, role, isRegistered } = useApp();

    const [linkedChild, setLinkedChild] = useState<LinkedChild | null>(() => {
        try { return JSON.parse(localStorage.getItem(CHILD_LINK_KEY) || 'null'); } catch { return null; }
    });
    const [codeInput, setCodeInput] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');

    // If user is a learner (not parent role), show own data
    const isParentRole = role === UserRole.PARENT || (!isRegistered && !userId);
    const showLinkScreen = isParentRole && !linkedChild;

    const handleSearch = async () => {
        const code = codeInput.trim().toUpperCase();
        if (!code) return;
        setSearching(true);
        setSearchError('');

        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, full_name, student_id')
            .or(`student_id.eq.${code},id.eq.${code}`)
            .limit(1)
            .maybeSingle();

        setSearching(false);
        if (error || !data) {
            setSearchError('No learner found with that code. Ask your child for their student ID from the Somo Smart app.');
            return;
        }
        const child: LinkedChild = {
            studentCode: data.student_id || code,
            studentId: data.id,
            name: data.full_name || data.name || undefined
        };
        setLinkedChild(child);
        localStorage.setItem(CHILD_LINK_KEY, JSON.stringify(child));
    };

    const handleNavigate = (view: ViewState) => {
        if (view === ViewState.DASHBOARD) navigate('/');
    };

    // Use linked child if parent role, otherwise own data
    const effectiveStudentCode = (isParentRole && linkedChild) ? linkedChild.studentCode : (studentCode || '');
    const effectiveStudentId = (isParentRole && linkedChild) ? linkedChild.studentId : (userId || '');

    return (
        <>
            <Helmet>
                <html lang="en" />
                <title>Parent Portal | Track Learner Progress &amp; Study Activity — Somo Smart</title>
                <meta name="description" content="Mama Soma Parent Portal for Kenyan parents. Track your child's study time, subject scores, quiz attempts, and learning activity on Somo Smart." />
                <meta name="keywords" content="Mama Soma Kenya, parent learning dashboard, track child KCSE progress, CBC parent monitoring Kenya, Somo Smart parent portal" />

                {/* AIO & Search Engine Optimization */}
                <meta name="smart-search-index" content="index" />
                <meta name="ai-knowledge-base" content="parent-portal" />
                <meta name="educational-framework" content="CBC, KCSE" />
                <meta name="target-audience" content="Parents, Guardians" />
                <meta name="robots" content="index, follow, max-image-preview:large" />

                {/* OpenGraph */}
                <meta property="og:site_name" content="Somo Smart" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="Parent Portal | Track Learner Progress — Somo Smart" />
                <meta property="og:description" content="Mama Soma Parent Portal. Monitor your child's KCSE &amp; CBC learning progress." />
                <meta property="og:image" content="https://www.somaai.co.ke/hero_option_a.png" />
                <meta property="og:url" content="https://www.somaai.co.ke/parent" />

                <link rel="canonical" href="https://www.somaai.co.ke/parent" />
            </Helmet>

            {showLinkScreen ? (
                <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl border-2 border-slate-200 w-full max-w-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                <Users className="w-7 h-7" />
                            </div>
                            <h1 className="text-xl font-black">Mama Soma</h1>
                            <p className="text-indigo-100 text-sm mt-1">Parent learning dashboard</p>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <p className="text-sm font-black text-slate-700 mb-1">Enter your child&apos;s student code</p>
                                <p className="text-xs font-bold text-slate-400 mb-4">
                                    Your child can find their code in the Somo Smart app under <span className="text-indigo-600">Me → Profile</span>.
                                </p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={codeInput}
                                        onChange={e => setCodeInput(e.target.value.toUpperCase())}
                                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                        placeholder="e.g. SOMA-ABC123"
                                        className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 uppercase focus:outline-none focus:border-indigo-400"
                                    />
                                    <button
                                        onClick={handleSearch}
                                        disabled={searching || !codeInput.trim()}
                                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 rounded-xl font-black transition-colors"
                                    >
                                        {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                    </button>
                                </div>
                                {searchError && (
                                    <div className="mt-3 flex gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs font-bold text-amber-800">{searchError}</p>
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-slate-100 pt-4">
                                <p className="text-xs font-bold text-slate-400 text-center">
                                    Don&apos;t have an account?{' '}
                                    <button onClick={() => navigate('/')} className="text-indigo-600 underline">Go to Somo Smart</button>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {isParentRole && linkedChild && (
                        <div className="bg-indigo-50 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900 px-4 py-2 flex items-center justify-between">
                            <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">
                                Viewing: <span className="text-indigo-900 dark:text-white">{linkedChild.name || linkedChild.studentCode}</span>
                            </p>
                            <button
                                onClick={() => { setLinkedChild(null); localStorage.removeItem(CHILD_LINK_KEY); }}
                                className="text-xs font-bold text-indigo-400 hover:text-indigo-700 underline"
                            >
                                Switch child
                            </button>
                        </div>
                    )}
                    <ParentDashboard
                        onNavigate={handleNavigate}
                        activityLog={isParentRole ? [] : learnerHistory}
                        validStudentCode={effectiveStudentCode}
                        studentId={effectiveStudentId}
                        login={loginParent}
                    />
                </>
            )}
        </>
    );
};



