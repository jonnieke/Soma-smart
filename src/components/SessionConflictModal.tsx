import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MonitorOff, LogOut, ShieldAlert, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const SessionConflictModal: React.FC = () => {
    const { sessionError, setSessionError, resolveSessionConflict, logout } = useApp();
    const [loading, setLoading] = React.useState(false);

    if (!sessionError) return null;

    const handleLogoutOthers = async () => {
        setLoading(true);
        await resolveSessionConflict();
        setLoading(false);
    };

    const handleLogout = async () => {
        setLoading(true);
        await logout();
        setSessionError(null);
        setLoading(false);
    };

    const isMulti = sessionError === 'MULTI_DEVICE';

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
                >
                    <div className="relative p-8 text-center">
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-orange-50 to-transparent opacity-50"></div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3 shadow-lg shadow-orange-100">
                                <ShieldAlert className="w-10 h-10" />
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">
                                Session Conflict
                            </h2>
                            <p className="text-slate-500 leading-relaxed mb-8">
                                {isMulti
                                    ? "Your account is currently active on other devices. To continue here, you need to manage your active sessions."
                                    : "You have been logged out because your account was accessed from another device."
                                }
                            </p>

                            <div className="space-y-4">
                                {isMulti && (
                                    <button
                                        onClick={handleLogoutOthers}
                                        disabled={loading}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 group hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                        <MonitorOff className="w-5 h-5 group-hover:animate-pulse" />
                                        {loading ? "Processing..." : "Logout Other Devices"}
                                    </button>
                                )}

                                <button
                                    onClick={handleLogout}
                                    disabled={loading}
                                    className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <LogOut className="w-5 h-5" />
                                    {isMulti ? "Exit This Device" : "Logout & Close"}
                                </button>
                            </div>

                            <div className="mt-8 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 py-2 rounded-full">
                                <Sparkles className="w-3 h-3 text-orange-400" />
                                Secured by Somo Smart Protection
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
