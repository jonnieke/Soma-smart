import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogIn } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
    const { login } = useApp();
    const [code, setCode] = useState("");
    const [error, setError] = useState("");

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
                                    required
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase font-mono"
                                    placeholder="SOMA-XXXX"
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

                            <div className="space-y-3 pt-2">
                                <button
                                    type="submit"
                                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <LogIn className="w-4 h-4" /> Login
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
