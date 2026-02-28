import React, { useState } from 'react';
import { ViewState } from '../../types';
import { AdminLayout } from './layout/AdminLayout';
import { Overview } from './views/Overview';
import { UsersView } from './views/Users';
import { FinancialsView } from './views/Financials';
import { SettingsView } from './views/Settings';
import { CurriculumView } from './views/Curriculum';
import { ExamsView } from './views/Exams';
import { AnalyticsView } from './views/Analytics';
import { StrategyLabView } from './views/StrategyLab';
import { Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AdminProps {
    onNavigate: (view: ViewState) => void;
}

export const AdminDashboard: React.FC<AdminProps> = ({ onNavigate }) => {
    // 1. Security Logic
    const [unlocked, setUnlocked] = useState(false);
    const [pass, setPass] = useState("");
    const [activeTab, setActiveTab] = useState('OVERVIEW');

    const handleUnlock = async () => {
        const adminPass = import.meta.env.VITE_ADMIN_PASS;
        const isValid = adminPass && pass.trim().toLowerCase() === adminPass.toLowerCase();
        if (isValid) {
            try {
                const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
                const adminAuthPass = import.meta.env.VITE_ADMIN_AUTH_PASS;

                if (!adminEmail || !adminAuthPass) {
                    console.error("Admin credentials (Email/AuthPass) missing in environment.");
                    setUnlocked(true); // Still unlock UI if local pass matched
                    return;
                }
                // Ensure the admin has a valid Supabase session to bypass RLS and Edge Function 401s
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: adminEmail,
                    password: adminAuthPass
                });

                if (signInError) {
                    // Create it if it doesn't exist
                    await supabase.auth.signUp({
                        email: adminEmail,
                        password: adminAuthPass
                    });
                }
            } catch (e) {
                console.error("Admin silent auth failed:", e);
            }
            setUnlocked(true);
        } else {
            alert("Access Denied");
        }
    };

    // 2. Lock Screen Render
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

                    <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="text-slate-500 text-sm mt-6 hover:text-slate-300 transition-colors">
                        ← Return to Application
                    </button>
                </div>
            </div>
        )
    }

    // 3. Main Dashboard Render
    return (
        <AdminLayout
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onLogout={async () => {
                await supabase.auth.signOut();
                setUnlocked(false);
            }}
        >
            {activeTab === 'OVERVIEW' && <Overview />}
            {activeTab === 'USERS' && <UsersView />}
            {activeTab === 'FINANCE' && <FinancialsView />}
            {activeTab === 'CURRICULUM' && <CurriculumView />}
            {activeTab === 'EXAMS' && <ExamsView />}
            {activeTab === 'ANALYTICS' && <AnalyticsView />}
            {activeTab === 'STRATEGY_LAB' && <StrategyLabView />}
            {activeTab === 'SETTINGS' && <SettingsView />}
        </AdminLayout>
    );
};
