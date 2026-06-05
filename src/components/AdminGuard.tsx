import React, { useEffect, useState } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminGuardProps {
    children: React.ReactNode;
    onNavigateBack: () => void;
}

type AuthStatus = 'idle' | 'authenticating' | 'authenticated' | 'failed';

const verifyAdminSession = async (): Promise<boolean> => {
    const { data, error } = await supabase.functions.invoke('admin-auth/verify');
    if (error) {
        console.error('Admin verification failed:', error.message);
        return false;
    }
    return data?.isAdmin === true;
};

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, onNavigateBack }) => {
    const [unlocked, setUnlocked] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [authStatus, setAuthStatus] = useState<AuthStatus>('idle');
    const [checkingSession, setCheckingSession] = useState(true);

    useEffect(() => {
        const checkExistingSession = async () => {
            setCheckingSession(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const isAdmin = await verifyAdminSession();
                if (isAdmin) {
                    setUnlocked(true);
                    setAuthStatus('authenticated');
                }
            } catch (error) {
                console.error('Error checking admin session:', error);
            } finally {
                setCheckingSession(false);
            }
        };

        checkExistingSession();
    }, []);

    const handleUnlock = async () => {
        setErrorMessage('');
        setSuccessMessage('');
        setAuthStatus('authenticating');

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail || !password) {
            setAuthStatus('failed');
            setErrorMessage('Enter your admin email and password.');
            return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password
        });

        if (signInError) {
            setAuthStatus('failed');
            setErrorMessage('Invalid login credentials. Use the password for this email inbox, then reset it if needed.');
            return;
        }

        const isAdmin = await verifyAdminSession();
        if (!isAdmin) {
            await supabase.auth.signOut();
            setAuthStatus('failed');
            setErrorMessage('This account is signed in, but it is not on the admin allowlist yet. A teacher account can still be used for admin if its email is added to ADMIN_EMAILS.');
            return;
        }

        setUnlocked(true);
        setAuthStatus('authenticated');
    };

    const handleForgotPassword = async () => {
        setErrorMessage('');
        setSuccessMessage('');

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setErrorMessage('Enter your admin email first.');
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
            setErrorMessage(error.message || 'Failed to send reset email.');
            return;
        }

        setSuccessMessage(`Password reset link sent to ${normalizedEmail}.`);
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!unlocked) {
        const isLoading = authStatus === 'authenticating';

        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
                <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 w-full max-w-sm text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Somo Admin</h2>
                    <p className="text-slate-400 text-sm mb-6">Sign in with an authorized admin account.</p>
                    <p className="text-slate-500 text-xs mb-6 leading-relaxed">
                        A teacher email can also unlock admin, as long as it&apos;s added to the admin allowlist.
                    </p>

                    <div className="space-y-3 text-left">
                        <label className="block">
                            <span className="sr-only">Admin email</span>
                            <input
                                type="email"
                                autoFocus
                                autoComplete="email"
                                placeholder="Admin email"
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white text-sm mb-1 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') handleUnlock();
                                }}
                            />
                        </label>

                        <label className="block">
                            <span className="sr-only">Admin password</span>
                            <input
                                type="password"
                                autoComplete="current-password"
                                placeholder="Password"
                                className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') handleUnlock();
                                }}
                            />
                        </label>
                    </div>

                    {errorMessage && (
                        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-200">
                            {errorMessage}
                        </p>
                    )}

                    {successMessage && (
                        <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-200">
                            {successMessage}
                        </p>
                    )}

                    <div className="mt-5 space-y-3">
                        <button
                            onClick={handleUnlock}
                            disabled={isLoading}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2"
                        >
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isLoading ? 'Verifying...' : 'Unlock Dashboard'}
                        </button>

                        <button
                            onClick={handleForgotPassword}
                            className="w-full text-slate-400 text-sm hover:text-slate-200 transition-colors font-medium"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <button onClick={onNavigateBack} className="text-slate-500 text-sm mt-6 hover:text-slate-300 transition-colors">
                        Return to Application
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<{ authStatus?: AuthStatus }>, { authStatus });
                }
                return child;
            })}
        </>
    );
};
