import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button, Card, Header } from '../components/Shared';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const initRecoverySession = async () => {
            try {
                const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
                const access_token = params.get('access_token');
                const refresh_token = params.get('refresh_token');
                const code = new URLSearchParams(window.location.search).get('code');

                if (code) {
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) throw error;
                    setSessionReady(true);
                    return;
                }

                if (access_token && refresh_token) {
                    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
                    if (error) throw error;
                    setSessionReady(true);
                    return;
                }

                const { data } = await supabase.auth.getSession();
                setSessionReady(Boolean(data.session));
            } catch (error: any) {
                setMessage({
                    type: 'error',
                    text: error.message || 'Auth session missing. Please open the password reset link from your email again.',
                });
                setSessionReady(false);
            }
        };

        initRecoverySession();
    }, []);

    // Keep user informed if they land here manually without the token
    useEffect(() => {
        if (sessionReady) return;
        if (!window.location.hash && !new URLSearchParams(window.location.search).get('code')) {
            setMessage({
                type: 'error',
                text: 'Open this page from the password reset email. A recovery session is required before you can change the password.',
            });
        }
    }, [sessionReady]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Auth session missing. Please reopen the password reset link from your email.');
            }

            const { error } = await supabase.auth.updateUser({ password });

            if (error) throw error;

            setMessage({ type: 'success', text: 'Password updated successfully! Redirecting to login...' });

            setTimeout(() => {
                navigate('/teacher'); // Or wherever the login is
            }, 2000);

        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || "Failed to update password." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
                    <p className="text-slate-500 mt-2">Enter your new secure password below.</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleUpdatePassword} className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <Button fullWidth type="submit" isLoading={loading} disabled={!sessionReady}>
                        {sessionReady ? 'Update Password' : 'Waiting for reset session...'}
                    </Button>
                </form>

                <div className="mt-6 text-center">
                    <button onClick={() => navigate('/')} className="text-slate-400 hover:text-slate-600 text-sm">
                        Cancel and return home
                    </button>
                </div>
            </Card>
        </div>
    );
};
