import React from 'react';
import {
    Users,
    GraduationCap,
    BookOpen,
    ShieldCheck,
    FileText,
    Plus,
    Upload,
    LogOut,
    Download,
    Settings,
    Mail,
    Lock,
    ArrowUpRight,
    TrendingUp,
    ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Button } from '../../components/Shared';
import { StatCard, TeacherRow, UsageBar } from './DashboardComponents';
import { SchoolProfile, SchoolStats, SchoolTeacher, SchoolMaterial } from '../../types';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 15
        }
    }
};

export const OverviewTab = ({
    schoolStats,
    schoolProfile,
    schoolTeachers,
    onViewAllTeachers,
    onRemoveTeacher,
    onViewMaterials,
    onOnboardStaff
}: {
    schoolStats: SchoolStats,
    schoolProfile: SchoolProfile,
    schoolTeachers: SchoolTeacher[],
    onViewAllTeachers: () => void,
    onRemoveTeacher: (id: string) => void,
    onViewMaterials: () => void,
    onOnboardStaff: () => void
}) => (
    <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-10"
    >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div variants={itemVariants}>
                <StatCard icon={<Users className="w-6 h-6" />} color="bg-blue-600" label="Teachers" value={schoolStats.teachers.toString()} trend={schoolStats.teacherTrend} />
            </motion.div>
            <motion.div variants={itemVariants}>
                <StatCard icon={<GraduationCap className="w-6 h-6" />} color="bg-purple-600" label="Students" value={schoolStats.students.toLocaleString()} trend={schoolStats.studentTrend} />
            </motion.div>
            <motion.div variants={itemVariants}>
                <StatCard icon={<BookOpen className="w-6 h-6" />} color="bg-orange-500" label="Lessons" value={schoolStats.lessons.toLocaleString()} trend={schoolStats.lessonTrend} />
            </motion.div>
            <motion.div variants={itemVariants}>
                <StatCard icon={<ShieldCheck className="w-6 h-6" />} color="bg-emerald-600" label="Status" value="Verified" trend={`Exp: ${new Date(schoolProfile.expiry).toLocaleDateString()}`} />
            </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-100/50 flex items-center justify-between bg-white/50">
                    <div>
                        <h3 className="font-black text-slate-900 text-2xl tracking-tight">Active Faculty</h3>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Top performing staff members</p>
                    </div>
                    <button
                        className="text-blue-600 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        onClick={onViewAllTeachers}
                    >
                        Directory
                    </button>
                </div>
                <div className="divide-y divide-slate-100/50 flex-1">
                    <AnimatePresence mode="popLayout">
                        {schoolTeachers.length > 0 ? (
                            schoolTeachers.slice(0, 5).map((teacher, index) => (
                                <TeacherRow key={teacher.id || index} {...teacher} onRemove={() => onRemoveTeacher(teacher.id)} />
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-20 text-center text-slate-400 font-bold italic"
                            >
                                Establishing faculty records...
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 flex flex-col">
                <h3 className="font-black text-slate-900 text-2xl mb-10 tracking-tight">Capacity Metrics</h3>
                <div className="space-y-12 flex-1">
                    <UsageBar label="Authorized Staff" current={schoolStats.teachers} max={schoolProfile.teacherLimit} color="bg-gradient-to-r from-blue-600 to-indigo-600" />
                    <UsageBar label="Student Licenses" current={schoolStats.students} max={schoolProfile.studentLimit || 5000} color="bg-gradient-to-r from-purple-600 to-fuchsia-600" />
                    <UsageBar label="Cloud Storage" current={schoolStats.storageUsed} max={100} color="bg-gradient-to-r from-orange-500 to-amber-500" />

                    <div className="mt-auto pt-10 border-t border-slate-100/50">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            className="p-8 bg-slate-950 rounded-[2rem] relative overflow-hidden group shadow-2xl shadow-blue-900/10"
                        >
                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 transform group-hover:rotate-12 transition-transform duration-500">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-white text-lg">Scale Up</p>
                                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Enterprise Upgrade</p>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-400 font-medium mb-6 leading-relaxed">Expand your institutional boundaries with enhanced storage and user limits.</p>
                                <button className="w-full py-4 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-50 transition-all shadow-xl hover:scale-105 active:scale-95">Upgrade License</button>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        </div>
    </motion.div>
);

export const TeachersTab = ({ teachers, onInvite, onRemove }: { teachers: any[], onInvite: () => void, onRemove: (id: string) => void }) => (
    <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[500px] flex flex-col"
    >
        <div className="p-10 border-b border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50">
            <div>
                <h3 className="font-black text-slate-900 text-3xl tracking-tight">Staff Directory</h3>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Authorized Educational Providers</p>
            </div>
            <Button className="px-10 py-5 text-[10px] font-black uppercase tracking-widest bg-blue-600 shadow-2xl shadow-blue-500/20 rounded-2xl hover:scale-105 transition-transform" onClick={onInvite}>
                <Plus className="w-5 h-5 mr-3" /> Link Faculty
            </Button>
        </div>
        <div className="divide-y divide-slate-100/50 flex-1">
            <AnimatePresence mode="popLayout">
                {teachers.length > 0 ? (
                    teachers.map((teacher, index) => (
                        <motion.div
                            key={teacher.id || index}
                            variants={itemVariants}
                            layout
                        >
                            <TeacherRow
                                {...teacher}
                                onRemove={() => {
                                    if (confirm(`Remove ${teacher.name} from faculty?`)) onRemove(teacher.id);
                                }}
                            />
                        </motion.div>
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-32 text-center text-slate-400"
                    >
                        <Users className="w-20 h-20 mx-auto mb-8 opacity-10" />
                        <p className="text-xl font-black text-slate-300 uppercase tracking-widest">No staff found</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </motion.div>
);

export const StudentsTab = ({ students, onAdd, onRemove, onImport }: { students: any[], onAdd: () => void, onRemove: (id: string) => void, onImport: () => void }) => (
    <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[500px] flex flex-col"
    >
        <div className="p-10 border-b border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50">
            <div>
                <h3 className="font-black text-slate-900 text-3xl tracking-tight">Learner Roster</h3>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Institutionally Linked Accounts</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" className="px-8 py-5 text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-2xl hover:bg-slate-50 transition-all" onClick={onImport}>
                    <Upload className="w-5 h-5 mr-3" /> Import CSV
                </Button>
                <Button className="px-8 py-5 text-[10px] font-black uppercase tracking-widest bg-purple-600 shadow-2xl shadow-purple-500/20 rounded-2xl hover:scale-105 transition-transform" onClick={onAdd}>
                    <Plus className="w-5 h-5 mr-3" /> Link Student
                </Button>
            </div>
        </div>
        <div className="divide-y divide-slate-100/50 flex-1">
            <AnimatePresence mode="popLayout">
                {students.length > 0 ? (
                    students.map((student, index) => (
                        <motion.div
                            key={student.id || index}
                            variants={itemVariants}
                            layout
                            className="p-8 flex items-center justify-between hover:bg-white hover:shadow-[0_10px_40px_rgba(0,0,0,0.04)] transition-all group cursor-pointer border-b border-transparent last:border-0"
                        >
                            <div className="flex items-center gap-6">
                                <div className="relative group/avatar">
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl shadow-purple-200 group-hover/avatar:rotate-6 transition-transform">
                                        {student.full_name.charAt(0)}
                                    </div>
                                    <div className="absolute -right-1 -bottom-1 w-6 h-6 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />
                                </div>
                                <div>
                                    <p className="font-black text-slate-900 text-xl leading-tight group-hover:text-purple-600 transition-colors">{student.full_name}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Verified Learner</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                                        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">ID: {student.student_id} • {student.grade}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right hidden lg:block">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Status</p>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100 uppercase tracking-widest">Active</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <motion.button
                                        whileHover={{ x: 5 }}
                                        className="p-4 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                                    >
                                        <ChevronRight className="w-7 h-7" />
                                    </motion.button>
                                    <button
                                        onClick={() => onRemove(student.id)}
                                        className="p-4 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                    >
                                        <LogOut className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-32 text-center text-slate-400"
                    >
                        <GraduationCap className="w-20 h-20 mx-auto mb-8 opacity-10" />
                        <p className="text-xl font-black text-slate-300 uppercase tracking-widest">No learners matched</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </motion.div>
);

export const MaterialsTab = ({ materials, onUpload, onDelete }: { materials: SchoolMaterial[], onUpload: () => void, onDelete: (id: string) => void }) => (
    <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden min-h-[500px] flex flex-col"
    >
        <div className="p-10 border-b border-slate-100/50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50">
            <div>
                <h3 className="font-black text-slate-900 text-3xl tracking-tight">Material Repository</h3>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">Institutional Knowledge Hub</p>
            </div>
            <Button className="px-10 py-5 text-[10px] font-black uppercase tracking-widest bg-emerald-600 shadow-2xl shadow-emerald-500/20 rounded-2xl hover:scale-105 transition-transform" onClick={onUpload}>
                <Upload className="w-5 h-5 mr-3" /> Distribute Asset
            </Button>
        </div>
        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 flex-1">
            <AnimatePresence mode="popLayout">
                {materials.length > 0 ? (
                    materials.map((item, index) => (
                        <motion.div
                            key={item.id}
                            variants={itemVariants}
                            whileHover={{ y: -8 }}
                            layout
                            className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="w-14 h-14 bg-slate-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner border border-slate-100 group-hover:rotate-6 transition-transform">
                                    <FileText className="w-7 h-7" />
                                </div>
                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${item.category === 'EXAM' ? 'bg-red-50 text-red-600 border-red-100' :
                                    item.category === 'NOTES' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    }`}>
                                    {item.category}
                                </span>
                            </div>
                            <div className="relative z-10">
                                <h4 className="font-black text-slate-900 text-xl mb-2 leading-[1.1] line-clamp-2 min-h-[2.2rem]">{item.title}</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-6">{item.target_grade} • {item.target_subject}</p>

                                <div className="flex items-center gap-3 mb-8 p-3 bg-slate-50 rounded-[1.5rem] border border-slate-100/50">
                                    <div className="w-8 h-8 bg-white rounded-xl shadow-sm flex items-center justify-center text-[10px] font-black text-blue-600 border border-slate-100 uppercase">{item.teacher_name?.charAt(0) || 'A'}</div>
                                    <div className="overflow-hidden">
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Contributor</p>
                                        <p className="text-xs font-black text-slate-700 truncate">{item.teacher_name || 'System Admin'}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <a
                                        href={item.file_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all text-center flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
                                    >
                                        <Download className="w-4 h-4" /> Download
                                    </a>
                                    <button
                                        onClick={() => onDelete(item.id)}
                                        className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-slate-100"
                                    >
                                        <LogOut className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-600 opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.06] transition-opacity" />
                        </motion.div>
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="col-span-full flex flex-col items-center justify-center py-40 text-slate-400"
                    >
                        <FileText className="w-24 h-24 opacity-10 mb-8" />
                        <p className="text-xl font-black text-slate-300 uppercase tracking-widest">Repository empty</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    </motion.div>
);

export const AnalyticsTab = ({ stats, teachers }: { stats: SchoolStats, teachers: SchoolTeacher[] }) => (
    <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        className="bg-white/70 backdrop-blur-xl rounded-[3rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-24 text-center max-w-4xl mx-auto"
    >
        <div className="w-32 h-32 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-inner group overflow-hidden relative">
            <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
            >
                <TrendingUp className="w-16 h-16 relative z-10" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
        </div>
        <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Intelligence Engine</h2>
        <p className="text-slate-400 font-bold uppercase tracking-[0.25em] text-xs mb-8">System Integration in Progress</p>
        <p className="text-slate-500 max-w-md mx-auto font-medium text-xl leading-relaxed">
            We are architecting a world-class analytics suite for deep institutional insights. Live tracking will be available in the next terminal update.
        </p>
        <div className="mt-12 flex items-center justify-center gap-4">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <div className="w-2 h-2 rounded-full bg-blue-600/60 animate-pulse delay-75" />
            <div className="w-2 h-2 rounded-full bg-blue-600/30 animate-pulse delay-150" />
        </div>
    </motion.div>
);

export const SettingsTab = ({
    profile,
    onUpdate
}: {
    profile: SchoolProfile,
    onUpdate: (updates: { name?: string, email?: string }) => Promise<{ success: boolean; message?: string }>
}) => {
    const [name, setName] = React.useState(profile.name);
    const [email, setEmail] = React.useState(profile.email);
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState({ type: '', text: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        const result = await onUpdate({ name, email });

        if (result.success) {
            setMessage({ type: 'success', text: 'Institutional profile updated successfully!' });
        } else {
            setMessage({ type: 'error', text: result.message || 'Failed to update profile.' });
        }
        setLoading(false);
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-5xl mx-auto space-y-12"
        >
            <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                <div className="p-10 border-b border-slate-100/50 bg-white/50">
                    <h3 className="font-black text-slate-900 text-3xl tracking-tight">Institutional Profile</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.25em] mt-1">Authorized Command Center</p>
                </div>
                <form onSubmit={handleSubmit} className="p-12 space-y-10">
                    {message.text && (
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`p-6 rounded-[1.5rem] border ${message.type === 'success' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' : 'bg-red-50/50 border-red-100 text-red-700'} font-black text-sm flex items-center gap-4`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white shadow-lg shadow-red-200'}`}>
                                {message.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                            </div>
                            {message.text}
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Entity Long Name</label>
                            <div className="relative group/input">
                                <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:border-blue-600 focus:bg-white focus:ring-8 focus:ring-blue-500/5 transition-all font-black text-slate-800 placeholder:text-slate-300"
                                    placeholder="Enter school name"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Administrative Endpoint</label>
                            <div className="relative group/input">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within/input:text-blue-600 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-200 bg-slate-50/50 outline-none focus:border-blue-600 focus:bg-white focus:ring-8 focus:ring-blue-500/5 transition-all font-black text-slate-800 placeholder:text-slate-300"
                                    placeholder="admin@school.com"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button
                            type="submit"
                            isLoading={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/20 px-12 py-5 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all"
                        >
                            Commit Changes
                        </Button>
                    </div>
                </form>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -8 }}
                    className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 group cursor-pointer"
                >
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-blue-100/50 group-hover:rotate-12 transition-transform duration-500">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-slate-900 text-2xl mb-3 tracking-tight">Security Protocol</h4>
                    <p className="text-slate-500 font-medium text-base mb-8 leading-relaxed">Update your administrative credentials to maintain terminal integrity.</p>
                    <button className="text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] hover:underline flex items-center gap-3">
                        Rotate Password <ArrowUpRight className="w-4 h-4" />
                    </button>
                </motion.div>

                <motion.div
                    variants={itemVariants}
                    whileHover={{ y: -8 }}
                    className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 group cursor-pointer"
                >
                    <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8 shadow-inner border border-purple-100/50 group-hover:rotate-12 transition-transform duration-500">
                        <Settings className="w-8 h-8" />
                    </div>
                    <h4 className="font-black text-slate-900 text-2xl mb-3 tracking-tight">System Quotas</h4>
                    <p className="text-slate-500 font-medium text-base mb-8 leading-relaxed">Institutional capacity limits and active resource allocation summary.</p>
                    <div className="flex flex-wrap gap-3">
                        <div className="px-4 py-2 bg-slate-100/80 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200/50">
                            Faculty: {profile.teacherLimit}
                        </div>
                        <div className="px-4 py-2 bg-slate-100/80 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest border border-slate-200/50">
                            Learners: {profile.studentLimit}
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};
