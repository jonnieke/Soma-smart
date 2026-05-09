import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { classroomService, ClassroomDetails } from '../services/classroomService';

export const ClassJoinPage: React.FC = () => {
    const { classId } = useParams<{ classId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { studentProfile, isRegistered, studentCode } = useApp();
    const [classroom, setClassroom] = useState<ClassroomDetails | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'joining' | 'joined' | 'missing' | 'error'>('loading');
    const [message, setMessage] = useState('');

    const classNameFallback = searchParams.get('class') || 'your teacher class';
    const resolvedClassId = classId && classId !== 'undefined' && classId !== 'null' ? classId : null;

    useEffect(() => {
        let mounted = true;

        async function loadClassroom() {
            if (!resolvedClassId) {
                setStatus('ready');
                return;
            }

            try {
                const details = await classroomService.getClassById(resolvedClassId);
                if (!mounted) return;
                if (!details) {
                    setStatus('missing');
                    return;
                }
                setClassroom(details);
                setStatus('ready');
            } catch (error: any) {
                console.error('Could not load classroom invite:', error);
                if (!mounted) return;
                setStatus('error');
                setMessage(error?.message || 'Could not load this class invite.');
            }
        }

        loadClassroom();
        return () => {
            mounted = false;
        };
    }, [resolvedClassId]);

    const handleJoin = async () => {
        if (!resolvedClassId) {
            localStorage.setItem('soma_pending_class_name', classNameFallback);
            navigate('/learner');
            return;
        }

        if (!studentProfile?.id || !isRegistered) {
            localStorage.setItem('soma_pending_class_id', resolvedClassId);
            localStorage.setItem('soma_pending_class_name', title);
            navigate('/learner');
            return;
        }

        setStatus('joining');
        const result = studentCode
            ? await classroomService.joinClassWithStudentCode(resolvedClassId, studentCode)
            : await classroomService.joinClass(resolvedClassId, studentProfile.id);
        if (result.success) {
            setStatus('joined');
            return;
        }

        setStatus('error');
        setMessage(result.message || 'Could not join this class. Please try again.');
    };

    const title = classroom?.name || classNameFallback;
    const subject = classroom?.subject || 'Classroom';
    const teacherName = classroom?.profiles?.name || 'your teacher';

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <Helmet>
                <title>Join Class | Somo Smart</title>
                <meta name="theme-color" content="#25D366" />
            </Helmet>

            <div className="w-full max-w-md bg-white border-2 border-slate-200 rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-[#25D366] text-white p-6 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black">Join Class</h1>
                    <p className="text-sm font-bold text-emerald-50 mt-1">Somo Smart Classroom</p>
                </div>

                <div className="p-8">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center gap-3 py-8 text-slate-500">
                            <Loader2 className="w-8 h-8 animate-spin text-[#25D366]" />
                            <p className="font-bold">Loading invite...</p>
                        </div>
                    )}

                    {status === 'joined' && (
                        <div className="text-center space-y-5">
                            <CheckCircle2 className="w-16 h-16 text-[#25D366] mx-auto" />
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">You joined {title}</h2>
                                <p className="text-sm font-bold text-slate-500 mt-2">You can now continue learning in your learner dashboard.</p>
                            </div>
                            <button
                                onClick={() => navigate('/learner')}
                                className="w-full bg-slate-900 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2"
                            >
                                Go to Learner Dashboard <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {(status === 'ready' || status === 'missing' || status === 'error') && (
                        <div className="space-y-6">
                            {status === 'error' && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                    <p className="text-sm font-bold text-red-700">{message}</p>
                                </div>
                            )}

                            {status === 'missing' && (
                                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <p className="text-sm font-bold text-amber-800">This class invite could not be found. You can still continue to Somo Smart.</p>
                                </div>
                            )}

                            <div className="text-center">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-black">
                                    {teacherName.charAt(0).toUpperCase()}
                                </div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Teacher</p>
                                <h2 className="text-xl font-black text-slate-900 mt-1">{teacherName}</h2>
                            </div>

                            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Class</p>
                                <h3 className="text-2xl font-black text-slate-900 mt-1">{title}</h3>
                                <p className="text-sm font-bold text-slate-500 mt-1">{subject}</p>
                            </div>

                            <button
                                onClick={handleJoin}
                                disabled={status === 'joining'}
                                className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {studentProfile?.id && isRegistered ? 'Join Class' : 'Continue as Learner'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
