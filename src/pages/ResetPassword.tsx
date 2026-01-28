import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button, Card, Header } from '../components/Shared';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';

export const ResetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Check if we have a hash fragment (standard Supabase flow)
    useEffect(() => {
        const hash = window.location.hash;
        if (!hash || !hash.includes('access_token')) {
            // No token? Maybe they just navigated here manually.
            // But if they clicked the email link, it should have the hash.
        }
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
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
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    <Button fullWidth type="submit" isLoading={loading}>
                        Update Password
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
