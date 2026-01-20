import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogIn, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { login } = useApp();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

    const [showRecents, setShowRecents] = useState(false);
    const [recents, setRecents] = useState<{ code: string, name: string }[]>([]);

    React.useEffect(() => {
        if (isOpen) {
            try {
                const h = JSON.parse(localStorage.getItem('soma_recent_login') || '[]');
                setRecents(h);
            } catch { }
        }
    }, [isOpen]);

    const handleRecentClick = (recentCode: string) => {
        setCode(recentCode);
        login(recentCode).then(success => {
            if (success) onClose();
            else setError("Expired or Invalid ID");
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (login(code)) {
            onClose();
        } else {
            setError("Invalid Student ID. Please check and try again.");
        }
    };

    if (!isOpen) return null;

    if (showRecents) {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                    >
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" /> Saved Accounts
                            </h3>
                            {recents.length === 0 ? (
                                <p className="text-gray-500 text-center py-4">No saved accounts found on this device.</p>
                            ) : (
                                <div className="space-y-3">
                                    {recents.map((r, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleRecentClick(r.code)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all group"
                                        >
                                            <div className="text-left">
                                                <p className="font-bold text-gray-800">{r.name}</p>
                                                <p className="text-xs text-gray-500 font-mono">{r.code}</p>
                                            </div>
                                            <LogIn className="w-4 h-4 text-gray-300 group-hover:text-blue-500" />
                                        </button>
                                    ))}
                                </div>
                            )}
                            <button onClick={() => setShowRecents(false)} className="w-full mt-6 py-2 text-gray-500 hover:text-gray-800 font-medium">
                                Back to Login
                            </button>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                >
                    <div className="p-8">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Lock className="w-8 h-8 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Student Login</h2>
                            <p className="text-gray-500 mt-2">Enter your Student ID to continue.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                                <input
                                    type="text"
                                    name="student-id"
                                    autoComplete="username"
                                    required
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase font-mono"
                                    placeholder="SOMA-XXXX"
                                />
                                {/* Hidden password field to trigger browser save */}
                                <input type="password" name="password" autoComplete="current-password" value="soma-student" className="hidden" readOnly />
                            </div>

                            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

                            <div className="space-y-3 pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogIn className="w-4 h-4" /> Login
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowRecents(true)}
                                        className="py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        Forgot ID?
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="py-2 text-sm text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
