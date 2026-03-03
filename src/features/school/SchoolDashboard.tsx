import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    TrendingUp,
    Settings,
    Bell,
    Plus,
    Search,
    GraduationCap,
    School as SchoolIcon,
    LogOut,
    FileText,
    BarChart3,
    Upload,
    Download,
    Activity,
    ChevronRight
} from 'lucide-react';
import { Button } from '../../components/Shared';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { NavItem } from './DashboardComponents';
import { OverviewTab, TeachersTab, StudentsTab, MaterialsTab, AnalyticsTab, SettingsTab } from './DashboardTabs';
import { GradebookView } from './GradebookView';
import logoImg from '../../assets/images/main_logo.png';

export const SchoolDashboard: React.FC = () => {
    const {
        schoolProfile, logout, schoolStats, schoolTeachers, updateSchoolProfile,
        fetchSchoolStats, addTeacherToSchool, addStudentToSchool,
        registerStudentForSchool, removeUserFromSchool,
        schoolMaterials, fetchSchoolMaterials, shareSchoolMaterial, deleteSchoolMaterial
    } = useApp();

    const [activeTab, setActiveTab] = React.useState('Overview');
    const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = React.useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
    const [addMode, setAddMode] = React.useState<'LINK' | 'REGISTER'>('LINK');
    const [inviteTerm, setInviteTerm] = React.useState('');
    const [regName, setRegName] = React.useState('');
    const [regGrade, setRegGrade] = React.useState('Grade 4');
    const [regPin, setRegPin] = React.useState('');
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [schoolStudents, setSchoolStudents] = React.useState<any[]>([]);
    const [searchQuery, setSearchQuery] = React.useState('');

    React.useEffect(() => {
        if (schoolProfile) {
            fetchSchoolStats();
            fetchStudents();
            fetchSchoolMaterials();
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
        setIsProcessing(true);
        try {
            let result: { success: boolean, message?: string, data?: string };

            if (activeTab === 'Teachers') {
                if (!inviteTerm) return;
                result = await addTeacherToSchool(inviteTerm);
            } else {
                if (addMode === 'LINK') {
                    if (!inviteTerm) return;
                    result = await addStudentToSchool(inviteTerm);
                } else {
                    if (!regName || !regGrade || !regPin) return;
                    result = await registerStudentForSchool(regName, regGrade, regPin);
                }
            }

            if (result.success) {
                setInviteTerm('');
                setRegName('');
                setRegPin('');
                setIsAddModalOpen(false);
                fetchStudents();
                if (result.data) {
                    alert(`Student registered successfully! SOMA-ID: ${result.data}`);
                }
            } else {
                alert(result.message);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const [uploadTitle, setUploadTitle] = React.useState('');
    const [uploadCat, setUploadCat] = React.useState<'NOTES' | 'EXAM' | 'ASSIGNMENT' | 'OTHER'>('NOTES');
    const [uploadGrade, setUploadGrade] = React.useState('Grade 4');
    const [uploadSubject, setUploadSubject] = React.useState('Math');

    const handleUploadMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            const result = await shareSchoolMaterial({
                title: uploadTitle,
                category: uploadCat,
                target_grade: uploadGrade,
                target_subject: uploadSubject,
                file_url: 'https://example.com/placeholder.pdf'
            });
            if (result.success) {
                setIsUploadModalOpen(false);
                setUploadTitle('');
            } else {
                alert(result.message);
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkImport = async (csvText: string) => {
        setIsProcessing(true);
        try {
            const rows = csvText.split('\n').slice(1);
            let count = 0;
            for (const row of rows) {
                const [name, grade, pin] = row.split(',');
                if (name && grade && pin) {
                    await registerStudentForSchool(name.trim(), grade.trim(), pin.trim());
                    count++;
                }
            }
            alert(`Imported ${count} students successfully.`);
            setIsImportModalOpen(false);
            fetchStudents();
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
            <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-slate-200/50 flex flex-col hidden lg:flex m-4 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 sticky top-4 h-[calc(100vh-2rem)]">
                <div className="p-8 border-b border-slate-100/50 flex items-center justify-center">
                    <img src={logoImg} alt="Somo Smart" className="h-12 w-auto object-contain" />
                </div>

                <nav className="flex-1 p-6 space-y-2">
                    <NavItem icon={<TrendingUp className="w-5 h-5" />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
                    <NavItem icon={<Users className="w-5 h-5" />} label="Faculty" active={activeTab === 'Teachers'} onClick={() => setActiveTab('Teachers')} />
                    <NavItem icon={<GraduationCap className="w-5 h-5" />} label="Learners" active={activeTab === 'Students'} onClick={() => setActiveTab('Students')} />
                    <NavItem icon={<FileText className="w-5 h-5" />} label="Resources" active={activeTab === 'Materials'} onClick={() => setActiveTab('Materials')} />
                    <NavItem icon={<Activity className="w-5 h-5" />} label="Gradebook" active={activeTab === 'Gradebook'} onClick={() => setActiveTab('Gradebook')} />
                    <NavItem icon={<BarChart3 className="w-5 h-5" />} label="Analytics" active={activeTab === 'Analytics'} onClick={() => setActiveTab('Analytics')} />
                    <div className="pt-4 mt-4 border-t border-slate-100/50">
                        <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" active={activeTab === 'Settings'} onClick={() => setActiveTab('Settings')} />
                    </div>
                </nav>

                <div className="p-6 border-t border-slate-100/50">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all w-full font-black text-xs uppercase tracking-widest"
                    >
                        <LogOut className="w-5 h-5" /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4">
                <header className="h-24 bg-white/70 backdrop-blur-xl border border-slate-200/50 px-8 flex items-center justify-between sticky top-0 z-50 rounded-[2.5rem] shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-4 bg-slate-100/50 px-6 py-3 rounded-2xl border border-slate-200/50 w-[30rem] transition-all focus-within:ring-4 focus-within:ring-blue-100 focus-within:border-blue-400 group">
                        <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Universal Search (Teachers, Students, Materials...)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full font-bold text-slate-700 placeholder:text-slate-400 focus:ring-0"
                        />
                        <div className="px-2 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-black text-slate-400 shadow-sm">⌘K</div>
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <button className="relative p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all">
                                <Bell className="w-6 h-6" />
                                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            </button>
                        </div>

                        <div className="h-10 w-px bg-slate-100" />

                        <div className="flex items-center gap-4 group cursor-pointer">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{schoolProfile.name}</p>
                                <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">{schoolProfile.subscriptionStatus === 'TRIAL' ? 'Commercial Trial' : 'Institutional Pro'}</p>
                            </div>
                            <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl p-0.5 shadow-sm border border-slate-200 group-hover:scale-105 transition-transform">
                                <div className="w-full h-full bg-white rounded-[0.8rem] flex items-center justify-center text-blue-600 font-black text-lg">
                                    {schoolProfile.name.charAt(0)}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-12">
                    {/* Welcome Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative rounded-[3rem] p-12 text-white overflow-hidden shadow-2xl shadow-blue-900/10 group border border-white/10"
                    >
                        {/* Mesh Gradient Background */}
                        <div className="absolute inset-0 bg-slate-950">
                            <motion.div
                                animate={{
                                    scale: [1, 1.2, 1],
                                    rotate: [0, 90, 0],
                                    x: [0, 50, 0]
                                }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-1/2 -left-1/2 w-full h-full bg-blue-600/30 blur-[120px] rounded-full"
                            />
                            <motion.div
                                animate={{
                                    scale: [1.2, 1, 1.2],
                                    rotate: [0, -90, 0],
                                    x: [0, -50, 0]
                                }}
                                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-indigo-600/30 blur-[120px] rounded-full"
                            />
                            <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-3xl" />
                        </div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-12">
                            <div>
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                                        Active Terminal
                                    </span>
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                        Encryption Active
                                    </span>
                                </div>
                                <h1 className="text-6xl font-black mb-6 tracking-tight leading-none bg-gradient-to-r from-white via-white to-blue-200 bg-clip-text text-transparent">
                                    System Status: Optimal
                                </h1>
                                <p className="text-blue-100/70 max-w-xl font-bold text-xl leading-relaxed mb-4">
                                    Administrator session established for <span className="text-white underline decoration-blue-500 decoration-4 underline-offset-8">{schoolProfile.name}</span>.
                                </p>
                                <div className="flex gap-8 text-blue-200/50 uppercase text-[10px] font-black tracking-widest py-4 border-t border-white/5 mt-4">
                                    <div className="flex flex-col">
                                        <span className="text-white text-base font-black">{schoolStats?.teachers || 0}</span>
                                        Staff Online
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white text-base font-black">{schoolStats?.students || 0}</span>
                                        Active Learners
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-white text-base font-black">Stable</span>
                                        Connection
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button
                                    className="bg-white !text-slate-900 hover:bg-blue-50 border-none font-black px-10 py-5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 text-sm uppercase tracking-widest"
                                    onClick={() => setActiveTab('Materials')}
                                >
                                    <FileText className="w-5 h-5 mr-3 !text-slate-900" /> Material Hub
                                </Button>
                                <Button
                                    className="bg-blue-600 text-white hover:bg-blue-700 border-none font-black px-10 py-5 rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95 shadow-blue-600/20 text-sm uppercase tracking-widest ring-4 ring-blue-600/10"
                                    onClick={() => {
                                        setInviteTerm('');
                                        setIsAddModalOpen(true);
                                    }}
                                >
                                    <Plus className="w-5 h-5 mr-3" /> Onboard Staff
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="p-8 space-y-8">
                    {activeTab === 'Overview' && schoolStats ? (
                        <OverviewTab
                            schoolStats={schoolStats}
                            schoolProfile={schoolProfile}
                            schoolTeachers={schoolTeachers}
                            onViewAllTeachers={() => setActiveTab('Teachers')}
                            onRemoveTeacher={removeUserFromSchool}
                            onViewMaterials={() => setActiveTab('Materials')}
                            onOnboardStaff={() => { setInviteTerm(''); setIsAddModalOpen(true); }}
                        />
                    ) : activeTab === 'Teachers' ? (
                        <TeachersTab
                            teachers={schoolTeachers.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                            onInvite={() => { setInviteTerm(''); setIsAddModalOpen(true); }}
                            onRemove={removeUserFromSchool}
                        />
                    ) : activeTab === 'Students' ? (
                        <StudentsTab
                            students={schoolStudents.filter(s => s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || s.student_id.toLowerCase().includes(searchQuery.toLowerCase()))}
                            onAdd={() => { setInviteTerm(''); setIsAddModalOpen(true); }}
                            onRemove={async (id) => {
                                await removeUserFromSchool(id);
                                fetchStudents();
                            }}
                            onImport={() => setIsImportModalOpen(true)}
                        />
                    ) : activeTab === 'Materials' ? (
                        <MaterialsTab
                            materials={schoolMaterials.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))}
                            onUpload={() => setIsUploadModalOpen(true)}
                            onDelete={async (id) => {
                                if (confirm("Delete this material?")) deleteSchoolMaterial(id);
                            }}
                        />
                    ) : activeTab === 'Gradebook' ? (
                        <GradebookView
                            students={schoolStudents}
                            onViewDetail={(id) => {
                                // For now, just a placeholder detail view
                                alert(`Viewing detailed performance for ${id}. (Feature coming in next phase)`);
                            }}
                        />
                    ) : activeTab === 'Analytics' ? (
                        <AnalyticsTab stats={schoolStats} teachers={schoolTeachers} />
                    ) : activeTab === 'Settings' ? (
                        <SettingsTab profile={schoolProfile!} onUpdate={updateSchoolProfile} />
                    ) : (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-20 text-center">
                            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Settings className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Module Under Maintenance</h2>
                            <p className="text-slate-500 max-w-sm mx-auto font-medium text-lg leading-relaxed">
                                We are currently enhancing the <span className="text-blue-600 font-bold">{activeTab}</span> experience. Check back soon for world-class updates.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            {/* Modals */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAddModalOpen(false)}></div>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 overflow-hidden">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">
                            {activeTab === 'Teachers' ? 'Link a Teacher' : (addMode === 'LINK' ? 'Link a Student' : 'Register New Student')}
                        </h2>
                        <p className="text-slate-500 font-medium mb-6">
                            {activeTab === 'Teachers' ? 'Enter the email address of a registered teacher.' : (addMode === 'LINK' ? 'Enter the Student SOMA-ID.' : 'Create a new managed student account.')}
                        </p>

                        {activeTab === 'Students' && (
                            <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                                <button className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === 'LINK' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`} onClick={() => setAddMode('LINK')}>Link Existing</button>
                                <button className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMode === 'REGISTER' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500'}`} onClick={() => setAddMode('REGISTER')}>Register New</button>
                            </div>
                        )}

                        <form onSubmit={handleAddUser} className="space-y-4">
                            {activeTab === 'Teachers' || (activeTab === 'Students' && addMode === 'LINK') ? (
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{activeTab === 'Teachers' ? 'Teacher Email' : 'Student ID'}</label>
                                    <input type={activeTab === 'Teachers' ? 'email' : 'text'} placeholder={activeTab === 'Teachers' ? 'teacher@example.com' : 'SOMA-XXXX'} value={inviteTerm} onChange={e => setInviteTerm(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium bg-slate-50" autoFocus required />
                                </div>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Student Full Name</label>
                                        <input type="text" placeholder="e.g. John Doe" value={regName} onChange={e => setRegName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium bg-slate-50" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Grade</label>
                                            <select value={regGrade} onChange={e => setRegGrade(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium bg-slate-50">
                                                {['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">4-Digit PIN</label>
                                            <input type="text" maxLength={4} placeholder="1234" value={regPin} onChange={e => setRegPin(e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium bg-slate-50" required />
                                        </div>
                                    </div>
                                </>
                            )}
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="ghost" className="flex-1 bg-blue-600 text-white hover:bg-blue-700 font-bold" disabled={isProcessing}>{isProcessing ? 'Processing...' : 'Submit'}</Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {isUploadModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)}></div>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 overflow-hidden">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Share Material</h2>
                        <form onSubmit={handleUploadMaterial} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Title</label>
                                <input type="text" placeholder="e.g. Science Notes" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium bg-slate-50" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Category</label>
                                    <select value={uploadCat} onChange={e => setUploadCat(e.target.value as any)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium bg-slate-50">
                                        <option value="EXAM">Exam</option>
                                        <option value="NOTES">Notes</option>
                                        <option value="ASSIGNMENT">Assignment</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Grade</label>
                                    <select value={uploadGrade} onChange={e => setUploadGrade(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium bg-slate-50">
                                        {['Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8'].map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Subject</label>
                                <input type="text" placeholder="e.g. Science" value={uploadSubject} onChange={e => setUploadSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none font-medium bg-slate-50" required />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
                                <Button type="submit" variant="ghost" className="flex-1 bg-orange-600 text-white hover:bg-orange-700 font-bold" disabled={isProcessing}>Upload</Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {isImportModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsImportModalOpen(false)}></div>
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 overflow-hidden">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Bulk Import</h2>
                        <p className="text-slate-500 font-medium mb-6 text-sm">Upload CSV: <b>name, grade, pin</b></p>
                        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 mb-6 text-center">
                            <Download className="w-10 h-10 text-slate-300 mb-4" />
                            <input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onload = (ev) => handleBulkImport(ev.target?.result as string);
                                    reader.readAsText(file);
                                }
                            }} />
                            <label htmlFor="csv-upload" className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 cursor-pointer hover:bg-slate-100 shadow-sm">Select CSV File</label>
                        </div>
                        <Button variant="outline" className="w-full" onClick={() => setIsImportModalOpen(false)}>Close</Button>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
