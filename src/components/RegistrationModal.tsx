import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, GraduationCap, CheckCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { registerStudent, login, studentCode } = useApp();
    const [name, setName] = useState("");
    const [grade, setGrade] = useState("");
    const [pin, setPin] = useState("");
    const [loginId, setLoginId] = useState("");
    const [mode, setMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');
    const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (mode === 'REGISTER') {
            if (name && grade && pin.length >= 4) {
                await registerStudent(name, grade, pin);
                setStep('SUCCESS');
            } else if (!pin || pin.length < 4) {
                alert("Please create a 4-digit Secret PIN to protect your account.");
                setLoading(false);
                return;
            }
        } else {
            if (loginId) {
                const success = await login(loginId);
                if (success) {
                    onSuccess();
                } else {
                    alert("Invalid Student ID. Please check and try again.");
                }
            }
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {step === 'FORM' ? (
                        <div className="p-8">
                            <div className="text-center mb-6">
                                <div className={`w-16 h-16 ${mode === 'REGISTER' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'} rounded-full flex items-center justify-center mx-auto mb-4 transition-colors`}>
                                    <User className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {mode === 'REGISTER' ? 'Create Student Profile' : 'Student Login'}
                                </h2>
                                <p className="text-gray-500 mt-2">
                                    {mode === 'REGISTER' ? 'Register to start your personalized learning journey!' : 'Enter your Student ID to continue where you left off.'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {mode === 'REGISTER' ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="e.g. John Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade / Class</label>
                                            <input
                                                type="text"
                                                required
                                                value={grade}
                                                onChange={(e) => setGrade(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="e.g. Grade 5"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Secret PIN (For Recovery) 🔐</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={4}
                                                required
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none tracking-widest text-lg font-mono"
                                                placeholder="e.g. 1234"
                                            />
                                            <p className="text-xs text-orange-600 mt-1 font-medium bg-orange-50 p-2 rounded">
                                                Write this down! You will need it if you forget your Student ID.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                                        <input
                                            type="text"
                                            required
                                            value={loginId}
                                            onChange={(e) => setLoginId(e.target.value.toUpperCase())}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none text-center font-mono tracking-widest uppercase text-lg"
                                            placeholder="SOMA-XXXX"
                                        />
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3.5 ${mode === 'REGISTER' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg font-bold text-lg transition-colors shadow-lg mt-4 disabled:opacity-50`}
                                >
                                    {loading ? 'Processing...' : (mode === 'REGISTER' ? 'Get My Student ID' : 'Login')}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER')}
                                    className="text-sm font-medium text-slate-500 hover:text-slate-800 underline"
                                >
                                    {mode === 'REGISTER' ? 'Already have an ID? Login here' : "Don't have an ID? Create Profile"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
                            <p className="text-gray-600 mb-6">Your unique Student ID has been generated.</p>

                            <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 mb-6">
                                <p className="text-sm text-gray-500 uppercase font-bold tracking-wide mb-2">Your Student ID</p>
                                <p className="text-4xl font-mono font-bold text-blue-600 tracking-wider copy">{studentCode}</p>
                            </div>

                            <p className="text-sm text-yellow-700 bg-yellow-50 p-4 rounded-lg mb-6">
                                ⚠️ Save this ID! You will need it to login later, and for your parents to track your progress.
                            </p>

                            <button
                                onClick={onSuccess}
                                className="w-full py-3.5 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors shadow-lg"
                            >
                                Continue Learning
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
