import React, { useState } from 'react';
import { ThumbsUp, Flag, PenLine, CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';

interface AIFeedbackButtonsProps {
    aiResponse: string;
    originalPrompt?: string;
    source: 'EXPLANATION' | 'MARKING' | 'QUIZ' | 'DARASA' | 'STUDY';
    subject?: string;
    grade?: string;
    className?: string;
}

type FeedbackType = 'GOOD' | 'INCORRECT' | 'UNCLEAR' | 'CORRECTION';

export const AIFeedbackButtons: React.FC<AIFeedbackButtonsProps> = ({
    aiResponse,
    originalPrompt,
    source,
    subject,
    grade,
    className = '',
}) => {
    const { userId, role } = useApp();
    const [status, setStatus] = useState<'idle' | 'correcting' | 'submitting' | 'done'>('idle');
    const [correction, setCorrection] = useState('');
    const [submitted, setSubmitted] = useState<FeedbackType | null>(null);

    const submit = async (type: FeedbackType, correctionText?: string) => {
        setStatus('submitting');
        try {
            await supabase.from('ai_feedback').insert({
                user_id: userId || null,
                user_role: role === 'TEACHER' ? 'TEACHER' : 'LEARNER',
                feedback_type: type,
                original_prompt: originalPrompt || null,
                ai_response: aiResponse.slice(0, 4000), // cap for DB practicality
                correction: correctionText || null,
                subject: subject || null,
                grade: grade || null,
                source,
            });
            setSubmitted(type);
            setStatus('done');
        } catch (err) {
            console.warn('Feedback submission failed:', err);
            // Fail silently — never interrupt the user's learning flow
            setStatus('done');
        }
    };

    if (status === 'done' || submitted) {
        return (
            <div className={`flex items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 ${className}`}>
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {submitted === 'GOOD' ? 'Great! Thanks for confirming.' : 'Thank you — your correction helps improve Somo Smart for all Kenyan learners.'}
                </p>
            </div>
        );
    }

    if (status === 'correcting') {
        return (
            <div className={`pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 ${className}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">What is the correct answer?</p>
                <textarea
                    autoFocus
                    rows={3}
                    value={correction}
                    onChange={(e) => setCorrection(e.target.value)}
                    placeholder="Type the correct explanation or answer here (aligned with KNEC rubric)..."
                    className="w-full text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 font-medium text-slate-800 dark:text-slate-200 resize-none outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900"
                />
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => submit('CORRECTION', correction)}
                        disabled={!correction.trim() || status === 'submitting'}
                        className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        {status === 'submitting' ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                        Submit Correction
                    </button>
                    <button
                        onClick={() => setStatus('idle')}
                        className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex items-center gap-2 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 ${className}`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1 hidden sm:block">Rate:</p>
            {/* Helpful */}
            <button
                onClick={() => submit('GOOD')}
                title="This is correct and helpful"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
            >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Helpful</span>
            </button>

            {/* Incorrect */}
            <button
                onClick={() => submit('INCORRECT')}
                title="This answer is factually wrong"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
            >
                <Flag className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Incorrect</span>
            </button>

            {/* Correct It */}
            <button
                onClick={() => setStatus('correcting')}
                title="I know the right answer — let me correct this"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
            >
                <PenLine className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Correct It</span>
            </button>
        </div>
    );
};
