import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    BookOpen,
    TrendingUp,
    Settings,
    Bell,
    Plus,
    Search,
    ChevronRight,
    GraduationCap,
    School as SchoolIcon,
    ShieldCheck,
    ArrowUpRight,
    LogOut,
    Calendar
} from 'lucide-react';
import { Button } from '../../components/Shared';
import { useApp } from '../../context/AppContext';
import { SchoolTeacher } from '../../types';

export const SchoolDashboard: React.FC = () => {
    const { schoolProfile, logout, schoolStats, schoolTeachers, fetchSchoolStats } = useApp();
    const [activeTab, setActiveTab] = React.useState('Overview');

    React.useEffect(() => {
        if (schoolProfile) {
            fetchSchoolStats();
        }
    }, [schoolProfile]);

    if (!schoolProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden lg:flex">
                <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                        <SchoolIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 leading-tight">Soma Schools</h2>
                        <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Admin Hub</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <NavItem
                        icon={<TrendingUp className="w-5 h-5" />}
                        label="Overview"
                        active={activeTab === 'Overview'}
                        onClick={() => setActiveTab('Overview')}
                    />
                    <NavItem
                        icon={<Users className="w-5 h-5" />}
                        label="Teachers"
                        active={activeTab === 'Teachers'}
                        onClick={() => setActiveTab('Teachers')}
                    />
                    <NavItem
                        icon={<GraduationCap className="w-5 h-5" />}
                        label="Students"
                        active={activeTab === 'Students'}
                        onClick={() => setActiveTab('Students')}
                    />
                    <NavItem
                        icon={<Calendar className="w-5 h-5" />}
                        label="Academic Year"
                        active={activeTab === 'Academic Year'}
                        onClick={() => setActiveTab('Academic Year')}
                    />
                    <NavItem
                        icon={<ShieldCheck className="w-5 h-5" />}
                        label="Subscriptions"
                        active={activeTab === 'Subscriptions'}
                        onClick={() => setActiveTab('Subscriptions')}
                    />
                    <NavItem
                        icon={<Settings className="w-5 h-5" />}
                        label="School Profile"
                        active={activeTab === 'School Profile'}
                        onClick={() => setActiveTab('School Profile')}
                    />
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all w-full font-medium"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                {/* Header */}
                <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 w-96">
                        <Search className="w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search teachers, students, or classes..."
                            className="bg-transparent border-none outline-none text-sm w-full font-medium text-slate-600 focus:ring-0"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
                            <Bell className="w-6 h-6" />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800">{schoolProfile.name}</p>
                                <p className="text-xs text-blue-600 font-bold">{schoolProfile.subscriptionStatus === 'TRIAL' ? 'Trial Period' : 'Premium Plan'}</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-200 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 font-bold">
                                {schoolProfile.name.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {/* Welcome Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-[2rem] p-8 text-white mb-8 relative overflow-hidden shadow-xl shadow-blue-200/50"
                    >
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-black mb-2 tracking-tight">Karibu Tena, {schoolProfile.name.split(' ')[0]}! 👋</h1>
                                <p className="text-blue-100 max-w-md font-medium">
                                    Your school's performance is currently being tracked. Teachers and Students can now link to your institution.
                                </p>
                            </div>
                            <Button
                                className="bg-orange-500 text-white hover:bg-orange-600 border-none font-black px-6 py-4 rounded-xl shadow-xl shadow-orange-200"
                                onClick={() => setActiveTab('Teachers')}
                            >
                                <Plus className="w-5 h-5" /> Add New Teacher
                            </Button>
                        </div>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
                    </motion.div>

                    {activeTab === 'Overview' && schoolStats ? (
                        <>
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <StatCard icon={<Users className="bg-blue-100 text-blue-600" />} label="Active Teachers" value={schoolStats.teachers.toString()} trend={schoolStats.teacherTrend} />
                                <StatCard icon={<GraduationCap className="bg-purple-100 text-purple-600" />} label="Active Students" value={schoolStats.students.toLocaleString()} trend={schoolStats.studentTrend} />
                                <StatCard icon={<BookOpen className="bg-orange-100 text-orange-600" />} label="Lessons Created" value={schoolStats.lessons.toLocaleString()} trend={schoolStats.lessonTrend} />
                                <StatCard icon={<ShieldCheck className="bg-green-100 text-green-600" />} label="Sub Status" value="Active" trend={`Renews in ${schoolProfile.daysRemaining || 30}d`} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Top Teachers */}
                                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-bold text-slate-800 text-lg">Leading Teachers</h3>
                                        <button className="text-blue-600 text-sm font-bold hover:underline" onClick={() => setActiveTab('Teachers')}>View All</button>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {schoolTeachers.map((teacher, index) => (
                                            <TeacherRow key={teacher.id || index} {...teacher} />
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                                    <h3 className="font-bold text-slate-800 text-lg mb-6">Subscription Usage</h3>
                                    <div className="space-y-6">
                                        <UsageBar label="Teacher Accounts" current={schoolStats.teachers} max={60} color="bg-blue-600" />
                                        <UsageBar label="Student Licenses" current={schoolStats.students} max={1500} color="bg-purple-600" />
                                        <UsageBar label="AI Ingestion" current={schoolStats.storageUsed} max={100} color="bg-orange-500" />

                                        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                                    <ArrowUpRight className="w-5 h-5" />
                                                </div>
                                                <p className="font-bold text-slate-800 text-sm">Need more slots?</p>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium mb-3">Upgrade your school plan to include up to 100 teachers and 5,000 students.</p>
                                            <button className="text-blue-600 text-xs font-black uppercase tracking-wider hover:underline">Contact Account Manager</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeTab === 'Overview' && !schoolStats ? 'Loading stats...' : `${activeTab} Management`}</h2>
                            <p className="text-slate-500 max-w-md mx-auto mb-8">
                                {activeTab === 'Overview' && !schoolStats ? 'Please wait while we fetch your school\'s data.' : `Connect your school's ${activeTab.toLowerCase()} data to Soma Smart for personalized learning insights.`}
                            </p>
                            {activeTab !== 'Overview' && (
                                <Button variant="primary" onClick={() => alert(`${activeTab} integration coming soon!`)}>
                                    <Plus className="w-5 h-5" /> Connect {activeTab}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all w-full font-medium ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
    >
        {icon}
        {label}
    </button>
);

const StatCard = ({ icon, label, value, trend }: { icon: React.ReactNode, label: string, value: string, trend: string }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
        <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-110`}>
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
        </div>
        <div>
            <h4 className="text-3xl font-black text-slate-900 mb-1">{value}</h4>
            <p className="text-xs text-blue-600 font-bold">{trend}</p>
        </div>
    </div>
);

const TeacherRow = ({ name, subject, impact, lessons }: SchoolTeacher) => (
    <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200"></div>
            <div>
                <p className="font-bold text-slate-800 leading-snug">{name}</p>
                <p className="text-xs text-slate-500 font-medium">{subject}</p>
            </div>
        </div>
        <div className="text-right flex items-center gap-8">
            <div className="hidden sm:block">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Impact</p>
                <p className="text-blue-600 font-black">{impact}</p>
            </div>
            <div className="hidden sm:block">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Lessons</p>
                <p className="font-black text-slate-800">{lessons}</p>
            </div>
            <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
    </div>
);

const UsageBar = ({ label, current, max, color }: { label: string, current: number, max: number, color: string }) => (
    <div>
        <div className="flex justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-600">{label}</span>
            <span className="text-slate-400">{current} / {max}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
                className={`h-full ${color} rounded-full transition-all duration-1000`}
                style={{ width: `${(current / max) * 100}%` }}
            ></div>
        </div>
    </div>
);
