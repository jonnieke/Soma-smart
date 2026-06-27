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
    ChevronRight,
    BarChart,
    PieChart,
    Activity,
    CheckCircle2,
    AlertTriangle,
    Zap,
    Clock,
    Sparkles
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
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                <div className="p-8 border-b border-slate-100/50 flex items-center justify-between bg-white/50">
                    <div>
                        <h3 className="font-black text-slate-900 text-2xl tracking-tight">Active Faculty</h3>
                        <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Top performing staff members</p>
                    </div>
                    <button
                        className="text-blue-600 text-[10px] font-black uppercase tracking-widest px-6 py-2.5 bg-blue-50/50 border border-blue-100/50 rounded-xl hover:bg-blue-600 hover:text-slate-900 transition-all shadow-sm"
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

            <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-10 flex flex-col">
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
                                    <div className="w-12 h-12 bg-blue-600 text-slate-900 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/40 transform group-hover:rotate-12 transition-transform duration-500">
                                        <TrendingUp className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-black text-slate-900 text-lg">Scale Up</p>
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
        className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden min-h-[500px] flex flex-col"
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
        className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden min-h-[500px] flex flex-col"
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
                                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 text-slate-900 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-xl shadow-purple-200 group-hover/avatar:rotate-6 transition-transform">
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
        className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden min-h-[500px] flex flex-col"
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
                                        className="flex-1 py-4 bg-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all text-center flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10"
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

export const AnalyticsTab = ({ stats, teachers }: { stats: SchoolStats, teachers: SchoolTeacher[] }) => {
    // Mock data for the "Intelligence" feel
    const projectedMean = 9.4; // B+ 
    const meanTrend = "+0.6";
    const overallCompliance = 88;

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-10"
        >
            {/* Intelligence Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                        <Zap className="w-5 h-5 fill-current" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Engine v2.0</span>
                    </div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">School Intelligence Center</h2>
                    <p className="text-slate-500 font-medium text-lg">Predictive forecasting and institutional health metrics.</p>
                </div>
                <div className="flex gap-4">
                    <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                        <Download className="w-4 h-4" /> Export Report
                    </button>
                    <button className="px-6 py-3 bg-slate-900 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
                        Run Full Audit
                    </button>
                </div>
            </div>

            {/* Top Level Intelligence Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <motion.div variants={itemVariants} className="bg-slate-950 rounded-[2.5rem] p-8 text-slate-900 relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-6">Projected KCSE Mean</p>
                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-6xl font-black">{projectedMean}</span>
                            <span className="text-2xl font-bold text-blue-400 mb-2">(B+)</span>
                        </div>
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                            <TrendingUp className="w-4 h-4" /> {meanTrend} since Term 1
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full translate-x-12 -translate-y-12" />
                    <div className="absolute bottom-4 right-8 opacity-20 group-hover:opacity-40 transition-opacity">
                        <BarChart className="w-20 h-20" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 shadow-xl shadow-slate-200/50">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Syllabus Compliance</p>
                    <div className="flex items-end gap-3 mb-4">
                        <span className="text-6xl font-black text-slate-900">{overallCompliance}%</span>
                        <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow mb-2" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <span>Target: 100%</span>
                            <span>Remaining: 12%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${overallCompliance}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className="h-full bg-emerald-500 rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white/50 shadow-xl shadow-slate-200/50">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Growth Trajectory</p>
                    <div className="flex items-center gap-6 mb-8">
                        <div className="flex-1">
                            <div className="text-4xl font-black text-slate-900">+14%</div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency Index</p>
                        </div>
                        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                            <Activity className="w-8 h-8" />
                        </div>
                    </div>
                    <button className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-100 rounded-2xl hover:bg-blue-600 hover:text-slate-900 transition-all">
                        View Detailed Insights
                    </button>
                </motion.div>
            </div>

            {/* Compliance Matrix & Smart Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Syllabus Matrix / Heatmap */}
                <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Syllabus Compliance Heatmap</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time curriculum coverage</p>
                        </div>
                        <div className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">Term 1 Overview</div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-10">
                        {['Math', 'Eng', 'Kisw', 'Sci', 'Soc', 'CRE', 'Art', 'PE'].map((sub, i) => {
                            const compliance = 60 + (i * 5) % 40;
                            return (
                                <div key={sub} className="flex flex-col items-center gap-2">
                                    <div
                                        className={`w-full aspect-square rounded-2xl border-2 flex items-center justify-center transition-all hover:scale-105 cursor-help ${compliance > 90 ? 'bg-emerald-500/10 border-emerald-500 text-emerald-700' :
                                                compliance > 75 ? 'bg-blue-500/10 border-blue-500 text-blue-700' :
                                                    'bg-amber-500/10 border-amber-500 text-amber-700'
                                            }`}
                                        title={`${sub}: ${compliance}% Covered`}
                                    >
                                        <span className="font-black text-xs">{compliance}%</span>
                                    </div>
                                    <span className="text-[9px] font-black uppercase text-slate-400">{sub}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className="space-y-6 flex-1">
                        <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100/50">
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-black text-slate-700">Critical Path: Chemistry Form 4</span>
                                <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-lg">3 Weeks Lag</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                <div className="h-full bg-red-500 w-[62%] rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-black text-slate-800">Resource Gap Detected</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Physics Lab Manuals missing for Form 3</p>
                            </div>
                        </div>
                        <button className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:underline">Auto-Assign Materials</button>
                    </div>
                </motion.div>

                {/* Smart Interventions Feed */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-10 shadow-[0_20px_50px_-12px_rgba(59,130,246,0.3)] relative overflow-hidden flex flex-col h-[500px]">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 bg-white rounded-[1.2rem] flex items-center justify-center shadow-xl shadow-black/10 relative">
                                <Zap className="w-6 h-6 text-blue-600" />
                                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-white"></span>
                                </span>
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tight">Smart Feed</h3>
                                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em] mt-1">Live Interventions</p>
                            </div>
                        </div>

                        <div className="space-y-3 overflow-y-auto pr-2 flex-1 scrollbar-hide -mx-2 px-2">
                            {/* Critical Alert */}
                            <motion.div whileHover={{ scale: 1.02 }} className="bg-white rounded-3xl p-5 shadow-lg border border-red-100 cursor-pointer group">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-red-500 transition-colors">
                                        <AlertTriangle className="w-4 h-4 text-red-600 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-1 flex justify-between">
                                            <span>Critical Drop</span>
                                            <span>2m ago</span>
                                        </p>
                                        <p className="text-slate-900 font-medium text-sm leading-snug">
                                            Grade 8 Mathematics average has drifted below <span className="font-black text-red-600">65%</span>. 
                                            Action: Deploy <strong>Visual Master mode</strong> for &apos;Geometry&apos; sub-strand immediately.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Positive Insight */}
                            <motion.div whileHover={{ scale: 1.02 }} className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 cursor-pointer group hover:bg-white/20 transition-all">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-emerald-300 font-black uppercase tracking-widest mb-1 flex justify-between">
                                            <span>On Track</span>
                                            <span>1hr ago</span>
                                        </p>
                                        <p className="text-blue-50 font-medium text-sm leading-snug">
                                            Candidate readiness for <strong>English Paper 3</strong> is at an all-time high (89%). Suggest shifting instructional focus to Oral Literature.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Systemic Action */}
                            <motion.div whileHover={{ scale: 1.02 }} className="bg-white/10 backdrop-blur-xl rounded-3xl p-5 border border-white/20 cursor-pointer group hover:bg-white/20 transition-all">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Settings className="w-4 h-4 text-purple-300" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-purple-300 font-black uppercase tracking-widest mb-1 flex justify-between">
                                            <span>System Config</span>
                                            <span>2hrs ago</span>
                                        </p>
                                        <p className="text-blue-50 font-medium text-sm leading-snug">
                                            You have exactly 24 unassigned Teacher Invitations. Click here to auto-provision based on your current roster gap.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                        
                        <div className="pt-6 mt-2 border-t border-white/10">
                            <button className="w-full py-5 bg-white text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2">
                                Review & Apply 3 Actions
                            </button>
                        </div>
                    </div>

                    {/* Background Graphic */}
                    <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]" />
                    <div className="absolute -left-10 top-0 w-40 h-40 bg-blue-300 opacity-10 rounded-full blur-[60px]" />
                </motion.div>
            </div>
        </motion.div>
    );
};

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
            <motion.div variants={itemVariants} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden">
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
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${message.type === 'success' ? 'bg-emerald-500 text-slate-900' : 'bg-red-500 text-slate-900 shadow-lg shadow-red-200'}`}>
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
                            className="bg-blue-600 hover:bg-blue-700 text-slate-900 shadow-2xl shadow-blue-500/20 px-12 py-5 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:scale-105 active:scale-95 transition-all"
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
                    className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-10 group cursor-pointer"
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
                    className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)] p-10 group cursor-pointer"
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
