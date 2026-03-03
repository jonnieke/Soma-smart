
import React, { useState, useEffect } from 'react';
import { Lock, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ViewState } from '../types';

interface AdminGuardProps {
    children: React.ReactNode;
    onNavigateBack: () => void;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children, onNavigateBack }) => {
    const [unlocked, setUnlocked] = useState(false);
    const [pass, setPass] = useState('');
    const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'authenticated' | 'failed'>('idle');
    const [checkingSession, setCheckingSession] = useState(true);

    const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
    const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS;
    const ADMIN_AUTH_PASS = import.meta.env.VITE_ADMIN_AUTH_PASS;

    useEffect(() => {
        const checkExistingSession = async () => {
            setCheckingSession(true);
            try {
                if (!ADMIN_EMAIL) {
                    console.warn("Admin configuration missing, skipping session check.");
                    return;
                }

                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user?.email === ADMIN_EMAIL) {
                    console.log("Verified admin session found");
                    // We don't auto-unlock anymore as per user request for security
                    // But we set the status so the dashboard knows it's authenticated
                    setAuthStatus('authenticated');
                }
            } catch (e) {
                console.error("Error checking existing admin session:", e);
            } finally {
                setCheckingSession(false);
            }
        };
        checkExistingSession();
    }, [ADMIN_EMAIL]);

    const handleUnlock = async () => {
        const input = pass.trim().toLowerCase();

        if (!ADMIN_PASS || !ADMIN_EMAIL || !ADMIN_AUTH_PASS) {
            const missing = [
                !ADMIN_PASS && 'VITE_ADMIN_PASS',
                !ADMIN_EMAIL && 'VITE_ADMIN_EMAIL',
                !ADMIN_AUTH_PASS && 'VITE_ADMIN_AUTH_PASS'
            ].filter(Boolean).join(', ');

            alert(`System Configuration Error: Missing ${missing}. This usually means your Dev Server needs a full restart (Kill and Restart npm run dev) to pick up new .env variables.`);
            setAuthStatus('failed');
            return;
        }

        const isValid = input === ADMIN_PASS.toLowerCase();

        if (isValid) {
            setUnlocked(true);
            setAuthStatus('authenticating');

            try {
                // Silent sign-in to ensure RLS bypass via admin profile
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: ADMIN_EMAIL,
                    password: ADMIN_AUTH_PASS
                });

                if (signInError) {
                    console.error("Admin silent auth failed:", signInError.message);
                    setAuthStatus('failed');
                    alert("Authentication Error: " + signInError.message);
                } else {
                    console.log("Admin silent auth successful");
                    setAuthStatus('authenticated');
                }
            } catch (e) {
                console.error("Admin silent auth critical error:", e);
                setAuthStatus('failed');
            }
        } else {
            alert("Access Denied: Incorrect password.");
        }
    };

    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    if (!unlocked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
                <div className="bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700 w-full max-w-sm text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/20">
                        <Lock className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Somo Admin</h2>
                    <p className="text-slate-400 text-sm mb-6">Restricted Access Portal</p>

                    <input
                        type="password"
                        autoFocus
                        placeholder="Enter Password"
                        className="w-full bg-slate-900 border border-slate-600 rounded-xl p-4 text-white text-center text-lg font-mono mb-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUnlock();
                        }}
                    />

                    <button
                        onClick={handleUnlock}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-900/50"
                    >
                        Unlock Dashboard
                    </button>

                    <button onClick={onNavigateBack} className="text-slate-500 text-sm mt-6 hover:text-slate-300 transition-colors">
                        ← Return to Application
                    </button>
                </div>
            </div>
        );
    }

    // Clone child and pass authStatus if it's a component that can accept it
    return (
        <>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child as React.ReactElement<any>, { authStatus });
                }
                return child;
            })}
        </>
    );
};
