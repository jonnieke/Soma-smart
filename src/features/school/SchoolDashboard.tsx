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
import { SchoolTeacher, UserRole } from '../../types';
import { supabase } from '../../lib/supabase';

export const SchoolDashboard: React.FC = () => {
    const { schoolProfile, logout, schoolStats, schoolTeachers, fetchSchoolStats, addTeacherToSchool, addStudentToSchool, removeUserFromSchool } = useApp();
    const [activeTab, setActiveTab] = React.useState('Overview');
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [inviteTerm, setInviteTerm] = React.useState('');
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [schoolStudents, setSchoolStudents] = React.useState<any[]>([]);

    React.useEffect(() => {
        if (schoolProfile) {
            fetchSchoolStats();
            fetchStudents();
        }
    }, [schoolProfile]);

    const fetchStudents = async () => {
        if (!schoolProfile) return;
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('school_id', schoolProfile.id)
            .eq('role', 'LEARNER');
        setSchoolStudents(data || []);
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteTerm) return;
        setIsProcessing(true);
        try {
            const result = activeTab === 'Teachers'
                ? await addTeacherToSchool(inviteTerm)
                : await addStudentToSchool(inviteTerm);

            if (result.success) {
                setInviteTerm('');
                setIsAddModalOpen(false);
                fetchStudents();
            } else {
                alert(result.message);
            }
        } finally {
            setIsProcessing(false);
        }
    };

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
                                        {schoolTeachers.length > 0 ? (
                                            schoolTeachers.map((teacher, index) => (
                                                <TeacherRow key={teacher.id || index} {...teacher} onRemove={() => removeUserFromSchool(teacher.id)} />
                                            ))
                                        ) : (
                                            <p className="p-8 text-center text-slate-500 font-medium">No teachers linked to your school yet.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Recent Activity */}
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                                    <h3 className="font-bold text-slate-800 text-lg mb-6">Subscription Usage</h3>
                                    <div className="space-y-6">
                                        <UsageBar label="Teacher Accounts" current={schoolStats.teachers} max={schoolProfile.teacherLimit} color="bg-blue-600" />
                                        <UsageBar label="Student Licenses" current={schoolStats.students} max={5000} color="bg-purple-600" />
                                        <UsageBar label="AI Ingestion" current={schoolStats.storageUsed} max={100} color="bg-orange-500" />

                                        <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                                    <ArrowUpRight className="w-5 h-5" />
                                                </div>
                                                <p className="font-bold text-slate-800 text-sm">Need more slots?</p>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium mb-3">Upgrade your school plan to include up to 100 teachers and 10,000 students.</p>
                                            <button className="text-blue-600 text-xs font-black uppercase tracking-wider hover:underline">Contact Account Manager</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : activeTab === 'Teachers' ? (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-lg">Staff Directory</h3>
                                <Button className="px-4 py-2 text-sm" onClick={() => setIsAddModalOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" /> Invite Teacher
                                </Button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {schoolTeachers.length > 0 ? (
                                    schoolTeachers.map((teacher, index) => (
                                        <TeacherRow
                                            key={teacher.id || index}
                                            {...teacher}
                                            onRemove={async () => {
                                                if (confirm(`Remove ${teacher.name} from school?`)) {
                                                    await removeUserFromSchool(teacher.id);
                                                }
                                            }}
                                        />
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-slate-500">
                                        <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">No teachers found.</p>
                                        <p className="text-sm">Click the button above to link a teacher by their email.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : activeTab === 'Students' ? (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-800 text-lg">Student Roster</h3>
                                <Button className="px-4 py-2 text-sm" onClick={() => setIsAddModalOpen(true)}>
                                    <Plus className="w-4 h-4 mr-2" /> Link Student
                                </Button>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {schoolStudents.length > 0 ? (
                                    schoolStudents.map((student, index) => (
                                        <div key={student.id || index} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                                                    {student.full_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 leading-snug">{student.full_name}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{student.student_id} • {student.grade}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (confirm(`Remove ${student.full_name} from school roster?`)) {
                                                        await removeUserFromSchool(student.id);
                                                        fetchStudents();
                                                    }
                                                }}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <LogOut className="w-5 h-5 text-slate-300 hover:text-red-500" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-slate-500">
                                        <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="font-bold">No students linked.</p>
                                        <p className="text-sm">Link students using their unique SOMA ID.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center">
                            <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">{activeTab === 'Overview' && !schoolStats ? 'Loading stats...' : `${activeTab} Management`}</h2>
                            <p className="text-slate-500 max-w-md mx-auto mb-8">
                                {activeTab === 'Overview' && !schoolStats ? 'Please wait while we fetch your school\'s data.' : `Connect your school's ${activeTab.toLowerCase()} data to Soma Smart for personalized learning insights.`}
                            </p>
                        </div>
                    )}
                </div>

                {/* Add Member Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 overflow-hidden"
                        >
                            <h2 className="text-2xl font-black text-slate-800 mb-2">
                                {activeTab === 'Teachers' ? 'Link a Teacher' : 'Link a Student'}
                            </h2>
                            <p className="text-slate-500 font-medium mb-6">
                                {activeTab === 'Teachers'
                                    ? 'Enter the email address of a registered teacher to add them to your staff.'
                                    : 'Enter the Student SOMA-ID to link them to your school.'}
                            </p>

                            <form onSubmit={handleAddUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                        {activeTab === 'Teachers' ? 'Teacher Email' : 'Student ID (e.g. SOMA-1234)'}
                                    </label>
                                    <input
                                        type={activeTab === 'Teachers' ? 'email' : 'text'}
                                        placeholder={activeTab === 'Teachers' ? 'teacher@example.com' : 'SOMA-XXXX'}
                                        value={inviteTerm}
                                        onChange={(e) => setInviteTerm(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-700 bg-slate-50"
                                        autoFocus
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setIsAddModalOpen(false)}
                                        disabled={isProcessing}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="flex-1 bg-blue-600"
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? 'Linking...' : 'Link to School'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
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

const TeacherRow = ({ name, subject, impact, lessons, onRemove }: SchoolTeacher & { onRemove?: () => void }) => (
    <div className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                {name.charAt(0)}
            </div>
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
            <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                    <ChevronRight className="w-5 h-5" />
                </button>
                {onRemove && (
                    <button onClick={onRemove} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                )}
            </div>
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
