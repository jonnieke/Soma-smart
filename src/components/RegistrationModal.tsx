import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import confetti from 'canvas-confetti';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onSwitchToLogin: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, onSuccess, onSwitchToLogin }) => {
    const { registerStudent, studentCode } = useApp();
    const [name, setName] = useState("");
    const [grade, setGrade] = useState("");
    const [pin, setPin] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
    const [loading, setLoading] = useState(false);

    // Reset when opened
    React.useEffect(() => {
        if (isOpen) {
            setStep('FORM');
            setName("");
            setGrade("");
            setPin("");
            setParentPhone("");
        }
    }, [isOpen]);

    // Kenyan Grade Options (CBC System + PP)
    const gradeOptions = [
        "Play Group", "PP1", "PP2",
        "Grade 1", "Grade 2", "Grade 3",
        "Grade 4", "Grade 5", "Grade 6",
        "Grade 7 (JSS)", "Grade 8 (JSS)", "Grade 9 (JSS)"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (name && grade && pin.length >= 4 && parentPhone) {
            const result = await registerStudent(name, grade, pin, parentPhone);

            if (result.success) {
                // Trigger Confetti
                const duration = 3 * 1000;
                const animationEnd = Date.now() + duration;
                const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };

                const interval: any = setInterval(function () {
                    const timeLeft = animationEnd - Date.now();

                    if (timeLeft <= 0) {
                        return clearInterval(interval);
                    }

                    const particleCount = 50 * (timeLeft / duration);
                    confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() - 0.2 } });
                    confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 } });
                }, 250);

                setStep('SUCCESS');
            } else {
                alert("Registration Error: " + result.message);
            }
        } else if (!pin || pin.length < 4) {
            alert("Please create a 4-digit Secret PIN to protect your account.");
        } else if (!grade) {
            alert("Please select your Grade/Class.");
        } else if (!parentPhone) {
            alert("Please enter a Parent Phone Number for dashboard access.");
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
                                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
                                    <User className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Create Student Profile
                                </h2>
                                <p className="text-gray-500 mt-2">
                                    Register to start your personalized learning journey!
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
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
                                    <div className="relative">
                                        <select
                                            required
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white cursor-pointer"
                                        >
                                            <option value="" disabled>Select your Grade</option>
                                            {gradeOptions.map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            ▼
                                        </div>
                                    </div>
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
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none tracking-widest text-lg font-mono text-center"
                                        placeholder="0000"
                                    />
                                    <p className="text-xs text-orange-600 mt-1 font-medium bg-orange-50 p-2 rounded">
                                        Write this down! You will need it if you forget your Student ID.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone Number 📱</label>
                                    <input
                                        type="tel"
                                        required
                                        value={parentPhone}
                                        onChange={(e) => setParentPhone(e.target.value)}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g. 0712345678"
                                    />
                                    <p className="text-[10px] text-gray-500 mt-1">
                                        Parents will use this number to access your performance dashboard.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white rounded-lg font-bold text-lg transition-all shadow-lg mt-4 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? 'Processing...' : 'Get My Student ID'}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={onSwitchToLogin}
                                    className="text-sm font-medium text-slate-500 hover:text-slate-800 underline transition-colors"
                                >
                                    Already have an ID? Login here
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-white via-green-50 to-blue-50 opacity-50 z-0"></div>

                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-lg">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Complete!</h2>
                                <p className="text-gray-600 mb-6">Your unique Student ID has been generated.</p>

                                <div className="bg-white border-2 border-dashed border-blue-300 rounded-xl p-6 mb-6 shadow-sm">
                                    <p className="text-sm text-gray-500 uppercase font-bold tracking-wide mb-2">Your Student ID</p>
                                    <p className="text-4xl font-mono font-bold text-blue-600 tracking-wider copy select-all">{studentCode}</p>
                                    <p className="text-xs text-blue-400 mt-2 font-medium">We&apos;ll remember you on this device!</p>
                                </div>

                                <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                                    ⚠️ Save this ID! You will need it to login later, and for your parents to track your progress.
                                </p>

                                <button
                                    onClick={onSuccess}
                                    className="w-full py-3.5 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Let&apos;s Start Learning! 🚀
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
