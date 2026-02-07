import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Header, Card, Button } from '../../components/Shared';
import { ViewState, LearnerActivity } from '../../types';
import { calculateTotalXP, calculateLevel } from '../../services/gamificationService';
import { LogoutModal } from '../../components/LogoutModal';
import { Book, CheckCircle, Clock, Lock, User, TrendingUp, Award, AlertCircle, ChevronRight, Activity, Calendar, Star, Zap, Home, X, LogOut, CreditCard } from 'lucide-react';

interface ParentProps {
    onNavigate: (view: ViewState) => void;
    activityLog: LearnerActivity[];
    validStudentCode: string;
    login: (code: string, phone: string) => Promise<{ success: boolean; message?: string }>;
}

export const ParentDashboard: React.FC<ParentProps> = ({ onNavigate, activityLog, validStudentCode, login }) => {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [inputCode, setInputCode] = useState('');
    const [inputPhone, setInputPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogin = async () => {
        if (!inputCode || !inputPhone) {
            setError('Please enter both Student ID and Parent Phone Number.');
            return;
        }

        setLoading(true);
        setError('');
        const result = await login(inputCode, inputPhone);
        setLoading(false);

        if (result.success) {
            setIsAuthenticated(true);
        } else {
            setError(result.message || 'Invalid credentials. Please check your Student ID and Phone Number.');
        }
    };

    // --- ANALYTICS ENGINE ---
    const stats = useMemo(() => {
        const quizzes = activityLog.filter(a => a.type === 'QUIZ' && a.score !== undefined);
        const topics = activityLog.filter(a => a.type === 'EXPLANATION');

        const totalQuizzes = quizzes.length;
        const avgScore = totalQuizzes > 0
            ? Math.round(quizzes.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalQuizzes)
            : 0;

        const masteryLevel = avgScore >= 80 ? 'Master' : avgScore >= 50 ? 'Developing' : 'Beginner';

        // Mock Subject Detection (In a real app, topics would have tags)
        const subjects: Record<string, number> = { 'Math': 0, 'Science': 0, 'History': 0, 'English': 0 };
        topics.forEach(t => {
            const lower = t.topic.toLowerCase();
            if (lower.match(/math|fraction|algebra|number|geometry/)) subjects['Math']++;
            else if (lower.match(/science|biology|physics|chemistry|plant|animal|space/)) subjects['Science']++;
            else if (lower.match(/history|war|ancient|king|queen|year/)) subjects['History']++;
            else subjects['English']++;
        });

        // Prepare Graph Data (Last 7 Quizzes)
        const graphData = quizzes.slice(0, 7).reverse().map((q, i) => ({
            label: `Q${i + 1}`,
            value: q.score || 0
        }));

        // Gamification Stats
        const totalXP = calculateTotalXP(activityLog);
        const levelInfo = calculateLevel(totalXP);

        return {
            totalQuizzes,
            avgScore,
            masteryLevel,
            totalTopics: topics.length,
            subjects,
            graphData,
            level: levelInfo.level,
            xp: levelInfo.totalXP,
            nextLevelProgress: levelInfo.progressPercent
        };
    }, [activityLog]);


    // --- LOGIN VIEW ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-white flex flex-col">
                <Header title="Parent Access" onHome={() => onNavigate(ViewState.DASHBOARD)} />
                <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-50 via-white to-puple-50">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-xl bg-white rounded-[2rem] shadow-2xl border border-indigo-100 p-8 text-center relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

                        <button
                            onClick={() => onNavigate(ViewState.DASHBOARD)}
                            className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-red-500 transition-colors z-20"
                            title="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="bg-indigo-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Lock className="w-10 h-10 text-indigo-600" />
                        </div>

                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Welcome, Parent!</h2>
                        <p className="text-slate-500 mb-8 px-4">
                            Unlock real-time insights into your child&apos;s learning journey. Enter their Student ID to begin.
                        </p>

                        <div className="space-y-6">
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="SOMA-XXXX"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xl font-bold tracking-widest uppercase focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300"
                                    value={inputCode}
                                    onChange={(e) => setInputCode(e.target.value)}
                                />
                            </div>

                            <div className="relative group">
                                <Activity className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="tel"
                                    placeholder="Parent Phone Number"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-lg font-bold focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all placeholder:text-slate-300"
                                    value={inputPhone}
                                    onChange={(e) => setInputPhone(e.target.value)}
                                />
                            </div>

                            {error && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-red-500 text-sm font-medium bg-red-50 p-3 rounded-xl flex items-center justify-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> {error}
                                </motion.div>
                            )}

                            <Button fullWidth onClick={handleLogin} disabled={loading} className="py-4 text-lg shadow-xl shadow-indigo-200">
                                {loading ? 'Checking...' : 'View Progress'}
                            </Button>
                        </div>

                        {validStudentCode ? (
                            <div className="mt-8 pt-6 border-t border-dashed border-slate-200">
                                <p className="text-xs text-indigo-400 uppercase font-bold tracking-widest mb-3">Login Help</p>
                                <p className="text-[10px] text-slate-400">
                                    Use the Student ID (SOMA-XXXX) and the Phone Number used during registration.
                                </p>
                            </div>
                        ) : (
                            <div className="mt-8">
                                <p className="text-xs text-slate-400 bg-slate-50 py-2 px-4 rounded-full inline-block">
                                    Hint: Register a student profile first to generate an ID.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        );
    }

    // --- DASHBOARD VIEW ---
    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans max-w-4xl mx-auto shadow-2xl border-x border-slate-100 relative">

            {/* --- CUSTOM HEADER --- */}
            <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-slate-800 leading-tight">Student Overview</h1>
                        <p className="text-xs text-slate-500 font-medium">ID: {validStudentCode}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors group" title="Back to Home">
                        <Home className="w-6 h-6 text-slate-500 group-hover:text-indigo-600" />
                    </button>
                    <button onClick={() => navigate('/pricing')} className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors group" title="Pricing Plans">
                        <CreditCard className="w-6 h-6 text-indigo-600" />
                    </button>
                    <button onClick={() => setShowLogoutModal(true)} className="p-2 bg-red-50 hover:bg-red-100 rounded-xl transition-colors group" title="Logout">
                        <LogOut className="w-6 h-6 text-red-500 group-hover:text-red-600" />
                    </button>
                </div>
            </header>

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={() => {
                    setIsAuthenticated(false);
                    onNavigate(ViewState.DASHBOARD);
                }}
                title="Leaving So Soon, Parent? 👋"
                message="Your child's learning journey is always active! Staying logged in lets you see their most recent XP gains and exercise results instantly. Are you sure you want to log out?"
            />

            <main className="p-6 space-y-8">

                {/* 1. HERO GREETING */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-200 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-900/30 rounded-full blur-2xl -ml-10 -mb-10"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider mb-3 border border-white/10">
                                <Activity className="w-3 h-3" /> Live Updates
                            </div>
                            <h2 className="text-3xl font-extrabold mb-2">
                                {stats.avgScore >= 80 ? "Flying High! 🦅" : stats.avgScore >= 50 ? "Making Progress! 🌱" : "Ready to Grow! 🚀"}
                            </h2>
                            <p className="text-indigo-100 max-w-sm">
                                {stats.avgScore >= 80
                                    ? "Your child is showing excellent mastery of recent topics."
                                    : "Consistent practice is paying off. Keep up the momentum!"}
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                                <p className="text-indigo-200 text-xs font-bold uppercase mb-1">Avg Score</p>
                                <p className="text-3xl font-extrabold text-white">{stats.avgScore}%</p>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center min-w-[100px]">
                                <p className="text-indigo-200 text-xs font-bold uppercase mb-1 flex items-center justify-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Level
                                </p>
                                <p className="text-3xl font-extrabold text-white">{stats.level}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>


                {/* 2. STATS GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatsCard
                        icon={<Book className="w-5 h-5 text-blue-600" />}
                        label="Topics Scanned"
                        value={stats.totalTopics}
                        color="bg-blue-50"
                    />
                    <StatsCard
                        icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                        label="Quizzes Taken"
                        value={stats.totalQuizzes}
                        color="bg-green-50"
                    />
                    <StatsCard
                        icon={<Award className="w-5 h-5 text-amber-600" />}
                        label="Mastery Level"
                        value={stats.masteryLevel}
                        color="bg-amber-50"
                        isText
                    />
                    <StatsCard
                        icon={<Zap className="w-5 h-5 text-purple-600" />}
                        label="Streak"
                        value="3 Days"
                        color="bg-purple-50"
                        isText
                    />
                </div>


                {/* 3. PERFORMANCE & SUBJECTS ROW */}
                <div className="grid md:grid-cols-3 gap-6">

                    {/* Performance Graph */}
                    <div className="md:col-span-2 bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-500" /> Performance Trend
                            </h3>
                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">Last 7 Quizzes</span>
                        </div>

                        {/* Custom SVG Line Chart */}
                        <div className="h-48 w-full flex items-end justify-between px-2 gap-2 relative">
                            {/* Grid Lines */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                                <div className="w-full h-px bg-slate-400"></div>
                                <div className="w-full h-px bg-slate-400"></div>
                                <div className="w-full h-px bg-slate-400"></div>
                            </div>

                            {stats.graphData.length > 0 ? (
                                stats.graphData.map((d, i) => (
                                    <div key={i} className="flex flex-col items-center gap-2 w-full group relative">

                                        {/* Tooltip */}
                                        <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded mb-2">
                                            {d.value}%
                                        </div>

                                        {/* Bar (Using bar here as it's cleaner for simple parent view than complex SVG line path) */}
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${d.value}%` }}
                                            transition={{ duration: 1, type: 'spring' }}
                                            className={`w-full max-w-[40px] rounded-t-xl opacity-90 hover:opacity-100 transition-all ${d.value >= 80 ? 'bg-gradient-to-t from-green-400 to-green-500' :
                                                d.value >= 50 ? 'bg-gradient-to-t from-blue-400 to-blue-500' :
                                                    'bg-gradient-to-t from-amber-400 to-amber-500'
                                                }`}
                                        ></motion.div>
                                        <span className="text-xs font-bold text-slate-400">{d.label}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 italic">
                                    No data available yet.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Subject Breakdown */}
                    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Book className="w-5 h-5 text-purple-500" /> Interests
                        </h3>
                        <div className="space-y-4">
                            {Object.entries(stats.subjects).map(([subject, count], i) => {
                                const total = Math.max(1, stats.totalTopics);
                                const pct = (count / total) * 100;
                                if (pct === 0 && i > 1) return null; // Hide empty if not core

                                return (
                                    <div key={subject}>
                                        <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                                            <span>{subject}</span>
                                            <span>{Math.round(pct)}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                className={`h-full rounded-full ${subject === 'Math' ? 'bg-indigo-500' :
                                                    subject === 'Science' ? 'bg-green-500' :
                                                        'bg-blue-400'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>


                {/* 4. ACTIVITY FEED */}
                <div>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-lg">
                        <Calendar className="w-5 h-5 text-indigo-500" /> Recent Activity
                    </h3>
                    <div className="space-y-3">
                        {activityLog.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-[2rem] border border-slate-100">
                                <p className="text-slate-400">No activity recorded yet.</p>
                            </div>
                        ) : (
                            activityLog.slice(0, 10).map((item, i) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    key={item.id}
                                    className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg ${item.type === 'QUIZ'
                                        ? (item.score || 0) >= 80 ? 'bg-green-100 text-green-600' : (item.score || 0) >= 50 ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                        : 'bg-indigo-50 text-indigo-600'
                                        }`}>
                                        {item.type === 'QUIZ' ? (item.score || 0) + '%' : <Book className="w-6 h-6" />}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-slate-800 truncate">{item.topic}</h4>
                                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                            {item.type === 'QUIZ' ? 'Assessment' : 'Lesson Study'} • {item.date}
                                        </p>
                                    </div>

                                    {item.type === 'QUIZ' && (
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${(item.score || 0) >= 80 ? 'bg-green-100 text-green-700' :
                                            (item.score || 0) >= 50 ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {(item.score || 0) >= 80 ? 'Mastered' : 'Practice'}
                                        </span>
                                    )}
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
};

// --- HELPER COMPONENTS ---

const StatsCard = ({ icon, label, value, color, isText = false }: any) => (
    <motion.div whileHover={{ y: -5 }} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col items-start gap-3">
        <div className={`p-3 rounded-xl ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className={`font-extrabold text-slate-800 ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
        </div>
    </motion.div>
);