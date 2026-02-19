import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogIn, User, GraduationCap, X, Plus, CheckCircle, Eye, EyeOff, School as SchoolIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'STUDENT' | 'TEACHER' | 'SCHOOL';
    onSwitchToRegister?: (role?: 'STUDENT' | 'SCHOOL' | 'TEACHER') => void;
    onSuccess?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialTab = 'STUDENT', onSwitchToRegister, onSuccess }) => {
    const { login, loginTeacher, loginSchool, recoverStudentId, resetPassword } = useApp();
    const navigate = useNavigate();

    // Tab State
    const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER' | 'SCHOOL'>(initialTab);

    // Student State
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [showRecents, setShowRecents] = useState(false);
    const [showRecovery, setShowRecovery] = useState(false);

    // Recovery State
    const [recName, setRecName] = useState("");
    const [recPin, setRecPin] = useState("");
    const [recResult, setRecResult] = useState("");
    const [recents, setRecents] = useState<{ code: string, name: string }[]>([]);

    // Teacher State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Reset Password State
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);

    // Effect to reset/detect state when modal opens
    useEffect(() => {
        if (isOpen) {
            if (activeTab !== initialTab) setActiveTab(initialTab);
            try {
                const h = JSON.parse(localStorage.getItem('soma_recent_login') || '[]');
                setRecents(h);
                if (h.length > 0 && initialTab === 'STUDENT') {
                    setShowRecents(true);
                }
            } catch {
                // ignore
            }
        }
    }, [isOpen, initialTab]);

    const handleRecentClick = (recentCode: string) => {
        setCode(recentCode);
        login(recentCode).then(success => {
            if (success) {
                onClose();
                if (onSuccess) onSuccess();
                else navigate('/learner');
            }
            else setError("Expired or Invalid ID");
        });
    };

    const removeRecent = (e: React.MouseEvent, codeToRemove: string) => {
        e.stopPropagation();
        const updated = recents.filter(r => r.code !== codeToRemove);
        setRecents(updated);
        localStorage.setItem('soma_recent_login', JSON.stringify(updated));
        if (updated.length === 0) setShowRecents(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (activeTab === 'STUDENT') {
            const success = await login(code);
            if (success) {
                onClose();
                if (onSuccess) onSuccess();
                else navigate('/learner');
            } else {
                setError("Invalid Student ID. Please check and try again.");
            }
        } else if (activeTab === 'TEACHER') {
            setLoading(true);
            const { success, message } = await loginTeacher(email, password);
            setLoading(false);
            if (success) {
                onClose();
                if (onSuccess) onSuccess();
                else navigate('/teacher');
            } else {
                if (message && message.includes("Invalid login credentials")) {
                    setError("Account not found or password incorrect. If you are new, please Create Account below.");
                } else {
                    setError(message || "Login failed. Check your email and password.");
                }
            }
        } else if (activeTab === 'SCHOOL') {
            setLoading(true);
            const { success, message } = await loginSchool(email, password);
            setLoading(false);
            if (success) {
                onClose();
                if (onSuccess) onSuccess();
                else navigate('/school');
            } else {
                setError(message || "School login failed. Check your credentials.");
            }
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const success = await resetPassword(resetEmail);
        setLoading(false);
        if (success) {
            setResetSent(true);
        } else {
            setError("Failed to send reset email. Please try again.");
        }
    };

    if (!isOpen) return null;

    // View: Reset Password
    if (showReset) {
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
                                <Lock className="w-5 h-5 text-indigo-500" /> Reset Password
                            </h3>

                            {resetSent ? (
                                <div className="text-center py-4">
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                    >
                                        <CheckCircle className="w-8 h-8 text-green-600" />
                                    </motion.div>
                                    <p className="text-gray-900 font-bold mb-2">Check your inbox!</p>
                                    <p className="text-gray-500 text-sm mb-6">We&apos;ve sent a password reset link to <br /> <span className="font-bold text-indigo-600">{resetEmail}</span></p>
                                    <button
                                        onClick={() => { setShowReset(false); setResetSent(false); setResetEmail(""); }}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all"
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleReset}>
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-500 mb-4">
                                            Enter your email address and we&apos;ll send you a link to reset your password.
                                        </p>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                placeholder="teacher@school.com"
                                            />
                                        </div>
                                        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                                        <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-all">
                                            {loading ? "Sending..." : "Send Reset Link"}
                                        </button>
                                    </div>
                                </form>
                            )}
                            <button onClick={() => { setShowReset(false); setError(""); }} className="w-full mt-4 py-2 text-gray-500 hover:text-gray-800 font-medium text-sm">
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    // View: Saved Student Accounts (Sticky Login)
    if (showRecents && activeTab === 'STUDENT') {
        return (
            <AnimatePresence>
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border-4 border-blue-100"
                    >
                        <div className="bg-blue-600 p-6 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                            <h3 className="text-xl font-bold text-white relative z-10">Welcome Back!</h3>
                            <p className="text-blue-100 text-sm relative z-10">Who is learning today?</p>
                        </div>

                        <div className="p-6">
                            <div className="space-y-3">
                                {recents.map((r) => (
                                    <motion.div
                                        key={r.code}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleRecentClick(r.code)}
                                        className="relative group cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-slate-100 hover:border-blue-400 hover:bg-blue-50 transition-all bg-white shadow-sm">
                                            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 border-2 border-orange-200">
                                                <User className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-slate-800 text-lg">{r.name}</p>
                                                <p className="text-xs text-slate-500 font-mono bg-slate-100 inline-block px-1.5 py-0.5 rounded">{r.code}</p>
                                            </div>
                                            <button
                                                onClick={(e) => removeRecent(e, r.code)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                title="Remove account"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
                                <button
                                    onClick={() => setShowRecents(false)}
                                    className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-5 h-5" /> Use Another ID
                                </button>

                                <button
                                    onClick={() => { setShowRecents(false); setShowRecovery(true); }}
                                    className="text-sm text-orange-600 font-medium hover:underline text-center"
                                >
                                    Forgot your ID?
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    // View: ID Recovery
    if (showRecovery) {
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
                                <Lock className="w-5 h-5 text-orange-500" /> Recover ID
                            </h3>

                            {recResult ? (
                                <div className="text-center py-4">
                                    <motion.div
                                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                                    >
                                        <User className="w-8 h-8 text-green-600" />
                                    </motion.div>
                                    <p className="text-gray-600 mb-2">We found your account!</p>
                                    <p className="text-3xl font-mono font-bold text-blue-600 tracking-wider mb-6 bg-blue-50 py-2 rounded-lg">{recResult}</p>
                                    <button
                                        onClick={() => {
                                            setCode(recResult);
                                            setShowRecovery(false);
                                            setRecResult("");
                                        }}
                                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                                    >
                                        Use this ID
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setError("");
                                    setLoading(true);
                                    const id = await recoverStudentId(recName, recPin);
                                    setLoading(false);
                                    if (id) setRecResult(id);
                                    else setError("Details match no account. Check spelling!");
                                }}>
                                    <div className="space-y-4">
                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 mb-4">
                                            <p className="text-xs text-orange-800">
                                                Enter the Name and 4-digit PIN you used during registration.
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={recName}
                                                onChange={(e) => setRecName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="As registered"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Secret PIN</label>
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                required
                                                maxLength={4}
                                                value={recPin}
                                                onChange={(e) => setRecPin(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest text-center text-xl"
                                                placeholder="****"
                                            />
                                        </div>
                                        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
                                        <button type="submit" disabled={loading} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-md transition-all">
                                            {loading ? "Searching..." : "Find My ID"}
                                        </button>
                                    </div>
                                </form>
                            )}
                            <button onClick={() => { setShowRecovery(false); setError(""); setRecResult(""); }} className="w-full mt-4 py-2 text-gray-500 hover:text-gray-800 font-medium text-sm">
                                Cancel & Back to Login
                            </button>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        );
    }

    // Main Login View
    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="flex border-b shrink-0">
                        <button
                            className={`flex-1 py-4 font-bold text-sm ${activeTab === 'STUDENT' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => { setActiveTab('STUDENT'); setError(""); }}
                        >
                            Student
                        </button>
                        <button
                            className={`flex-1 py-4 font-bold text-sm ${activeTab === 'TEACHER' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => { setActiveTab('TEACHER'); setError(""); }}
                        >
                            Teacher
                        </button>
                        <button
                            className={`flex-1 py-4 font-bold text-sm ${activeTab === 'SCHOOL' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => { setActiveTab('SCHOOL'); setError(""); }}
                        >
                            School
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto">
                        <div className="text-center mb-6">
                            <div className={`w-16 h-16 ${activeTab === 'STUDENT' ? 'bg-blue-100 text-blue-600' : activeTab === 'SCHOOL' ? 'bg-blue-900/10 text-blue-900' : 'bg-indigo-100 text-indigo-600'} rounded-full flex items-center justify-center mx-auto mb-4 transition-colors`}>
                                {activeTab === 'STUDENT' ? <Lock className="w-8 h-8" /> : activeTab === 'SCHOOL' ? <SchoolIcon className="w-8 h-8" /> : <GraduationCap className="w-8 h-8" />}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{activeTab === 'STUDENT' ? "Student Login" : activeTab === 'SCHOOL' ? "School Hub Login" : "Teacher Login"}</h2>
                            <p className="text-gray-500 mt-2">{activeTab === 'STUDENT' ? "Enter your Student ID to continue." : "Enter your email and password."}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {activeTab === 'STUDENT' ? (
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-sm font-medium text-gray-700">Student ID</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowRecovery(true)}
                                            className="text-xs text-orange-600 font-bold hover:underline"
                                        >
                                            Forgot ID?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            name="student-id"
                                            autoComplete="off"
                                            required
                                            value={code}
                                            onChange={(e) => setCode(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase font-mono tracking-widest pl-11"
                                            placeholder="SOMA-XXXX"
                                        />
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                            <User className="w-5 h-5" />
                                        </div>
                                    </div>
                                    {recents.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowRecents(true)}
                                            className="text-xs text-blue-600 hover:underline mt-2 flex items-center gap-1"
                                        >
                                            <User className="w-3 h-3" /> View saved accounts ({recents.length})
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="teacher@school.com"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-sm font-medium text-gray-700">Password</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowReset(true)}
                                                className="text-xs text-indigo-600 font-bold hover:underline"
                                            >
                                                Forgot?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                                                placeholder="******"
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
                                </>
                            )}

                            {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 p-2 rounded">{error}</p>}

                            <div className="space-y-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 ${activeTab === 'STUDENT' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'} text-white rounded-lg font-bold transition-all shadow-lg flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]`}
                                >
                                    <LogIn className="w-4 h-4" /> {loading ? "Logging in..." : "Login"}
                                </button>

                                {/* Switch Links */}
                                {activeTab === 'STUDENT' && onSwitchToRegister && (
                                    <button
                                        type="button"
                                        onClick={() => onSwitchToRegister && onSwitchToRegister('STUDENT')}
                                        className="w-full py-2 text-sm text-blue-600 font-bold hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        New Student? Create Profile
                                    </button>
                                )}

                                {activeTab === 'TEACHER' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            if (onSwitchToRegister) onSwitchToRegister('TEACHER');
                                            // navigate('/teacher'); // Removed direct navigation, should open modal instead
                                        }}
                                        className="w-full py-2 text-sm text-indigo-600 font-bold hover:bg-indigo-50 rounded-lg transition-colors"
                                    >
                                        New Teacher? Create Account
                                    </button>
                                )}

                                {activeTab === 'SCHOOL' && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (onSwitchToRegister) onSwitchToRegister('SCHOOL');
                                        }}
                                        className="w-full py-2 text-sm text-blue-900 font-bold hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        Register Your School
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full py-2 text-sm text-gray-400 font-medium hover:text-gray-600 transition-colors"
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
