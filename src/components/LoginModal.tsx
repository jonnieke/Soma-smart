import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, LogIn, User, GraduationCap } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: 'STUDENT' | 'TEACHER';
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialTab = 'STUDENT' }) => {
    const { login, loginTeacher, recoverStudentId, resetPassword } = useApp();

    // Tab State
    const [activeTab, setActiveTab] = useState<'STUDENT' | 'TEACHER'>(initialTab);

    React.useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);


    // Student State
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [showRecents, setShowRecents] = useState(false);
    const [showRecovery, setShowRecovery] = useState(false);
    const [showTeacherRecovery, setShowTeacherRecovery] = useState(false);

    // Recovery State
    const [recName, setRecName] = useState("");
    const [recPin, setRecPin] = useState("");
    const [recResult, setRecResult] = useState("");
    const [recents, setRecents] = useState<{ code: string, name: string }[]>([]);

    // Teacher State
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (activeTab === 'STUDENT') {
            if (login(code)) {
                onClose();
            } else {
                setError("Invalid Student ID. Please check and try again.");
            }
        } else {
            setLoading(true);
            const success = await loginTeacher(email, password);
            setLoading(false);
            if (success) {
                onClose();
            } else {
                setError("Login failed. Check your email and password.");
            }
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
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <User className="w-8 h-8 text-green-600" />
                                    </div>
                                    <p className="text-gray-600 mb-2">We found your account!</p>
                                    <p className="text-3xl font-mono font-bold text-blue-600 tracking-wider mb-6">{recResult}</p>
                                    <button
                                        onClick={() => { setCode(recResult); setShowRecovery(false); }}
                                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                                    >
                                        Login with this ID
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    setError("");
                                    const id = await recoverStudentId(recName, recPin);
                                    if (id) setRecResult(id);
                                    else setError("Details match no account.");
                                }}>
                                    <div className="space-y-4">
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
                                                type="password"
                                                required
                                                maxLength={4}
                                                value={recPin}
                                                onChange={(e) => setRecPin(e.target.value)}
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none font-mono tracking-widest"
                                                placeholder="****"
                                            />
                                        </div>
                                        {error && <p className="text-red-500 text-sm">{error}</p>}
                                        <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold">
                                            Find My ID
                                        </button>
                                    </div>
                                </form>
                            )}
                            <button onClick={() => { setShowRecovery(false); setError(""); setRecResult(""); }} className="w-full mt-4 py-2 text-gray-500 hover:text-gray-800 font-medium">
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
                    <div className="flex border-b">
                        <button
                            className={`flex-1 py-4 font-bold text-sm ${activeTab === 'STUDENT' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => { setActiveTab('STUDENT'); setError(""); }}
                        >
                            Student Login
                        </button>
                        <button
                            className={`flex-1 py-4 font-bold text-sm ${activeTab === 'TEACHER' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-gray-500 hover:bg-gray-50'}`}
                            onClick={() => { setActiveTab('TEACHER'); setError(""); }}
                        >
                            Teacher Login
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="text-center mb-6">
                            <div className={`w-16 h-16 ${activeTab === 'STUDENT' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'} rounded-full flex items-center justify-center mx-auto mb-4 transition-colors`}>
                                {activeTab === 'STUDENT' ? <Lock className="w-8 h-8" /> : <GraduationCap className="w-8 h-8" />}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">{activeTab === 'STUDENT' ? "Student Login" : "Teacher Login"}</h2>
                            <p className="text-gray-500 mt-2">{activeTab === 'STUDENT' ? "Enter your Student ID to continue." : "Enter your email and password."}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {activeTab === 'STUDENT' ? (
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none"
                                            placeholder="******"
                                        />
                                    </div>
                                </>
                            )}

                            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

                            <div className="space-y-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-3 ${activeTab === 'STUDENT' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2`}
                                >
                                    <LogIn className="w-4 h-4" /> {loading ? "Logging in..." : "Login"}
                                </button>

                                <div className="grid grid-cols-2 gap-3">
                                    {activeTab === 'STUDENT' ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowRecovery(true)}
                                            className="py-2 text-sm text-orange-600 font-medium hover:bg-orange-50 rounded-lg transition-colors"
                                        >
                                            Forgot ID?
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowTeacherRecovery(true)}
                                            className="py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
                                        >
                                            Forgot Password?
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="py-2 text-sm text-gray-500 font-medium hover:bg-gray-100 rounded-lg transition-colors ml-auto"
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
