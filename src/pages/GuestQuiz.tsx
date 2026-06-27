import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Sparkles, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export const GuestQuiz: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [post, setPost] = useState<any>(null);
    const [teacher, setTeacher] = useState<any>(null);
    
    // Guest State
    const [guestName, setGuestName] = useState('');
    const [guestSession, setGuestSession] = useState<any>(null);
    const [quizStarted, setQuizStarted] = useState(false);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            try {
                // Fetch post
                const { data: postData, error: postError } = await supabase
                    .from('class_posts')
                    .select('*')
                    .eq('id', id)
                    .single();
                
                if (postError) throw postError;
                setPost(postData);

                // Fetch teacher profile
                if (postData.author_id) {
                    const { data: teacherData } = await supabase
                        .from('profiles')
                        .select('name')
                        .eq('id', postData.author_id)
                        .single();
                    if (teacherData) setTeacher(teacherData);
                }

                // Check for existing session
                const savedSession = localStorage.getItem(`somo_guest_${id}`);
                if (savedSession) {
                    setGuestSession(JSON.parse(savedSession));
                }
            } catch (err) {
                console.error("Error fetching quiz:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleStart = () => {
        if (!guestName.trim()) return;
        
        // Create mock session for prototype
        const session = {
            guestId: `guest_${Math.random().toString(36).substr(2, 9)}`,
            name: guestName,
            classId: post.class_id
        };
        
        localStorage.setItem(`somo_guest_${id}`, JSON.stringify(session));
        setGuestSession(session);
        setQuizStarted(true);
    };

    const handleSubmitMock = async () => {
        if (!guestSession || !post) return;
        
        setIsLoading(true);
        try {
            // Mock random score for prototype
            const mockScore = Math.floor(Math.random() * 40) + 60; // 60-100
            
            // In a real app, we'd insert into guest_students, then gradebook_entries
            // Here we insert directly if RLS allows, or we just simulate
            
            setScore(mockScore);
            setQuizCompleted(true);
            setQuizStarted(false);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-[#25D366] animate-spin" />
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-black text-slate-800 mb-2">Link Invalid or Expired</h1>
                <p className="text-slate-500 font-medium max-w-sm">This assignment link is no longer active. Please ask your teacher for a new link.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <Helmet>
                <title>Assignment | Somo Smart</title>
                <meta name="theme-color" content="#25D366" />
            </Helmet>

            <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden">
                {/* Header */}
                <div className="bg-[#25D366] p-6 text-white text-center">
                    <h1 className="text-2xl font-black tracking-tight mb-1">Somo Smart</h1>
                    <p className="text-emerald-50 font-medium text-sm opacity-90">Classroom Assignment</p>
                </div>

                <div className="p-8">
                    {!quizStarted && !quizCompleted && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">
                                    {teacher?.name?.charAt(0) || 'T'}
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Teacher {teacher?.name?.split(' ')[0] || ''}
                                </h2>
                                <p className="text-slate-500 mt-2 font-medium">assigned you a new task:</p>
                                <div className="mt-4 p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-left">
                                    <p className="font-bold text-slate-800">{post.content}</p>
                                </div>
                            </div>

                            {!guestSession ? (
                                <div className="space-y-4 pt-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Enter your full name to start:</label>
                                        <input
                                            type="text"
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            placeholder="e.g. Kelvin Mutua"
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:border-[#25D366] transition-colors"
                                        />
                                    </div>
                                    <button
                                        onClick={handleStart}
                                        disabled={!guestName.trim()}
                                        className="w-full bg-[#25D366] text-white font-black py-4 rounded-xl shadow-lg hover:bg-[#128C7E] transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        Start Assignment <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="pt-4">
                                    <button
                                        onClick={() => setQuizStarted(true)}
                                        className="w-full bg-[#25D366] text-white font-black py-4 rounded-xl shadow-lg hover:bg-[#128C7E] transition-colors flex justify-center items-center gap-2"
                                    >
                                        Resume as {guestSession.name} <ArrowRight className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {quizStarted && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-black text-slate-800">Assignment:</h2>
                            <p className="text-slate-600 font-medium">{post.content}</p>
                            
                            <div className="bg-amber-50 border-2 border-amber-200 p-6 rounded-2xl">
                                <p className="text-amber-800 font-bold text-center">
                                    [Prototype Demo: Imagine interactive multiple choice or essay questions here]
                                </p>
                            </div>

                            <button
                                onClick={handleSubmitMock}
                                className="w-full bg-[#25D366] text-white font-black py-4 rounded-xl shadow-lg hover:bg-[#128C7E] transition-colors"
                            >
                                Submit Assignment
                            </button>
                        </div>
                    )}

                    {quizCompleted && (
                        <div className="text-center space-y-6 py-8">
                            <CheckCircle2 className="w-20 h-20 text-[#25D366] mx-auto" />
                            <div>
                                <h2 className="text-3xl font-black text-slate-800 mb-2">Great Job!</h2>
                                <p className="text-slate-500 font-medium">Your assignment was sent directly to Teacher {teacher?.name?.split(' ')[0] || ''}&apos;s gradebook.</p>
                            </div>
                            
                            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 inline-block w-full">
                                <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest block mb-2">Your Score</span>
                                <span className="text-5xl font-black text-emerald-700">{score}%</span>
                            </div>
                            
                            <p className="text-xs font-bold text-slate-400 mt-8">You can safely close this window and return to WhatsApp.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
