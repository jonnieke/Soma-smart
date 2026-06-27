import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle, X, GraduationCap, BookOpen, School, ChevronRight, Copy, MessageCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EducationLevel } from '../types';
import confetti from 'canvas-confetti';

interface RegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onSwitchToLogin: () => void;
    initialRole?: 'STUDENT' | 'SCHOOL' | 'TEACHER';
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ isOpen, onClose, onSuccess, onSwitchToLogin, initialRole = 'STUDENT' }) => {
    const { registerStudent, registerSchool, registerTeacher, studentCode } = useApp();
    const [role, setRole] = useState<'STUDENT' | 'SCHOOL' | 'TEACHER'>(initialRole);
    // Student State
    const [name, setName] = useState("");
    const [grade, setGrade] = useState("");
    const [pin, setPin] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [educationLevel, setEducationLevel] = useState<EducationLevel | ''>('');
    const [institutionName, setInstitutionName] = useState("");

    // School State
    const [schoolName, setSchoolName] = useState("");
    const [schoolEmail, setSchoolEmail] = useState("");
    const [schoolPassword, setSchoolPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [schoolCounty, setSchoolCounty] = useState("");
    const [schoolContact, setSchoolContact] = useState("");
    const [schoolPhone, setSchoolPhone] = useState("");

    // Teacher State
    const [teacherName, setTeacherName] = useState("");
    const [teacherEmail, setTeacherEmail] = useState("");
    const [teacherPhone, setTeacherPhone] = useState("");
    const [teacherPassword, setTeacherPassword] = useState("");
    const [teacherConfirmPassword, setTeacherConfirmPassword] = useState("");
    const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
    const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);

    const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [copied, setCopied] = useState(false);

    // Reset when opened
    React.useEffect(() => {
        if (isOpen) {
            setStep('FORM');
            setRole(initialRole);
            setName("");
            setGrade("");
            setPin("");
            setParentPhone("");
            setEducationLevel('');
            setInstitutionName("");
            setSchoolName("");
            setSchoolEmail("");
            setSchoolPassword("");
            setConfirmPassword("");
            setSchoolCounty("");
            setSchoolContact("");
            setSchoolPhone("");
            setTeacherName("");
            setTeacherEmail("");
            setTeacherPhone("");
            setTeacherPassword("");
            setTeacherConfirmPassword("");
            setTeacherClasses([]);
            setTeacherSubjects([]);
            setErrorMessage("");
            setCopied(false);
        }
    }, [isOpen, initialRole]);

    // Grade options per education level
    // Kenya 2025: CBC (Grade 1-10, Grade 11 from 2026) runs alongside 8-4-4 (Form 1-4 / KCSE)
    const getGradeOptions = () => {
        switch (educationLevel) {
            case EducationLevel.JUNIOR:
                return ["Play Group", "PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
            case EducationLevel.SENIOR:
                return [
                    "Grade 7 (JSS)", "Grade 8 (JSS)", "Grade 9 (JSS)",
                    "Grade 10 (CBC Senior)",
                    "Grade 11 (CBC — 2026)",
                    "Form 1", "Form 2", "Form 3 (KCSE)", "Form 4 (KCSE)"
                ];
            case EducationLevel.CAMPUS:
                return ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Postgraduate"];
            default:
                return [];
        }
    };

    const subjectOptions = [
        "Mathematics", "English", "Kiswahili", "Science & Technology", "Social Studies", "CRE", "IRE",
        "Home Science", "Agriculture", "Computer Studies", "Business Studies", "History", "Geography",
        "Chemistry", "Biology", "Physics", "Indigenous Language", "French", "German", "Arabic",
        "Integrated Science", "Physical Education (PE)", "Music", "Art & Craft"
    ];

    const kenyanCounties = [
        "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa", "Homa Bay",
        "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga", "Kisii",
        "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni", "Mandera",
        "Marsabit", "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi", "Nakuru", "Nandi",
        "Narok", "Nyamira", "Nyandarua", "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River",
        "Tharaka-Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot"
    ];

    const levelCards: { level: EducationLevel; icon: React.ReactNode; title: string; subtitle: string; gradient: string; border: string }[] = [
        {
            level: EducationLevel.JUNIOR,
            icon: <BookOpen className="w-6 h-6" />,
            title: "Junior",
            subtitle: "PP1 – Grade 6",
            gradient: "from-emerald-50 to-green-50",
            border: "border-emerald-300 ring-emerald-200"
        },
        {
            level: EducationLevel.SENIOR,
            icon: <School className="w-6 h-6" />,
            title: "Senior",
            subtitle: "Grade 7 – 12",
            gradient: "from-blue-50 to-indigo-50",
            border: "border-blue-400 ring-blue-200"
        },
        {
            level: EducationLevel.CAMPUS,
            icon: <GraduationCap className="w-6 h-6" />,
            title: "Campus",
            subtitle: "College / Uni",
            gradient: "from-purple-50 to-violet-50",
            border: "border-purple-400 ring-purple-200"
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setLoading(true);

        if (role === 'STUDENT') {
            if (!educationLevel) {
                setErrorMessage("Please select your education level above.");
                setLoading(false);
                return;
            }
            if (!grade) {
                setErrorMessage("Please select your Grade / Class.");
                setLoading(false);
                return;
            }
            if (!name.trim()) {
                setErrorMessage("Please enter your full name.");
                setLoading(false);
                return;
            }
            if (!pin || pin.length < 4) {
                setErrorMessage("Please create a 4-digit Secret PIN to protect your account.");
                setLoading(false);
                return;
            }
            if (!parentPhone.trim()) {
                setErrorMessage("Please enter a Parent/Guardian Phone Number.");
                setLoading(false);
                return;
            }

            const result = await registerStudent(
                name,
                grade,
                pin,
                parentPhone,
                educationLevel as EducationLevel,
                educationLevel === EducationLevel.CAMPUS ? institutionName : undefined
            );

            if (result.success) {
                triggerConfetti();
                setStep('SUCCESS');
            } else {
                setErrorMessage("Registration failed: " + (result.message || "Please try again."));
            }

        } else if (role === 'SCHOOL') {
            if (!schoolName.trim()) {
                setErrorMessage("Please enter your school name.");
                setLoading(false);
                return;
            }
            if (!schoolCounty) {
                setErrorMessage("Please select your county.");
                setLoading(false);
                return;
            }
            if (!schoolContact.trim()) {
                setErrorMessage("Please enter the contact person's name.");
                setLoading(false);
                return;
            }
            if (!schoolEmail.trim()) {
                setErrorMessage("Please enter the admin email address.");
                setLoading(false);
                return;
            }
            if (schoolPassword.length < 6) {
                setErrorMessage("Password must be at least 6 characters.");
                setLoading(false);
                return;
            }
            if (schoolPassword !== confirmPassword) {
                setErrorMessage("Passwords do not match. Please check and try again.");
                setLoading(false);
                return;
            }

            const result = await registerSchool(schoolName, schoolEmail, schoolPassword);
            if (result.success) {
                triggerConfetti();
                setStep('SUCCESS');
            } else {
                setErrorMessage("Registration failed: " + (result.message || "Please try again."));
            }

        } else if (role === 'TEACHER') {
            if (!teacherName.trim()) {
                setErrorMessage("Please enter your full name.");
                setLoading(false);
                return;
            }
            if (!teacherEmail.trim()) {
                setErrorMessage("Please enter your email address.");
                setLoading(false);
                return;
            }
            if (teacherPassword.length < 6) {
                setErrorMessage("Password must be at least 6 characters.");
                setLoading(false);
                return;
            }
            if (teacherPassword !== teacherConfirmPassword) {
                setErrorMessage("Passwords do not match. Please check and try again.");
                setLoading(false);
                return;
            }

            const result = await registerTeacher(teacherName, teacherEmail, teacherPassword, teacherClasses, teacherSubjects, teacherPhone);
            if (result.success) {
                triggerConfetti();
                setStep('SUCCESS');
            } else {
                setErrorMessage("Registration failed: " + (result.message || "Please try again."));
            }
        }
        setLoading(false);
    };

    const triggerConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 60 };

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 } });
        }, 250);
    };

    const handleCopyId = async () => {
        if (!studentCode) return;
        try {
            await navigator.clipboard.writeText(studentCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        } catch {
            // Fallback for older browsers / WebView
            const el = document.createElement('textarea');
            el.value = studentCode;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        }
    };

    const handleWhatsAppShare = () => {
        if (!studentCode) return;
        const msg = encodeURIComponent(
            `My Somo Smart Student ID is: *${studentCode}*\n\nDownload the app and use this ID to log in: https://somosmart.co.ke`
        );
        window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md relative flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[90vh] my-auto overflow-hidden"
                >
                    {/* --- STICKY HEADER --- */}
                    <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-40">
                        <button
                            onClick={onSwitchToLogin}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all border border-blue-100 dark:border-blue-800 group"
                        >
                            <User className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                            Already have an ID? Login
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors bg-slate-50 dark:bg-slate-800/50 rounded-full"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {step === 'FORM' ? (
                        <div className="p-6 sm:p-8 overflow-y-auto">
                            <div className="text-center mb-6">
                                <div className={`w-20 h-20 bg-gradient-to-br ${role === 'SCHOOL' ? 'from-blue-800 to-slate-900 text-white' : role === 'TEACHER' ? 'from-emerald-500 to-teal-600 text-white' : 'from-blue-500 to-indigo-600 text-white'} rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-blue-100 dark:shadow-none transition-all rotate-3`}>
                                    <User className="w-10 h-10" />
                                </div>

                                {/* Role toggle */}
                                <div className="flex rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden mb-4 mx-auto w-fit">
                                    {(['STUDENT', 'TEACHER', 'SCHOOL'] as const).map(r => (
                                        <button
                                            key={r}
                                            type="button"
                                            onClick={() => { setRole(r); setErrorMessage(""); }}
                                            className={`px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${role === r
                                                ? r === 'TEACHER' ? 'bg-emerald-500 text-white' : r === 'SCHOOL' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
                                                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
                                            }`}
                                        >
                                            {r === 'STUDENT' ? 'Student' : r === 'TEACHER' ? 'Teacher' : 'School'}
                                        </button>
                                    ))}
                                </div>

                                <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                    {role === 'SCHOOL' ? 'Register Your School' : role === 'TEACHER' ? 'Teacher Registration' : 'Create Student Profile'}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-xs mx-auto">
                                    {role === 'SCHOOL'
                                        ? 'Join the Somo Smart network and empower your school.'
                                        : role === 'TEACHER'
                                            ? 'Create your professional profile to start teaching.'
                                            : 'Register free and get your personal Student ID.'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {role === 'STUDENT' ? (
                                    <>
                                        {/* Education Level Selector */}
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">I am in...</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {levelCards.map(card => (
                                                    <button
                                                        type="button"
                                                        key={card.level}
                                                        onClick={() => {
                                                            setEducationLevel(card.level);
                                                            setGrade("");
                                                        }}
                                                        className={`relative flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-300 ${educationLevel === card.level
                                                            ? `${card.border} ring-4 ring-blue-500/10 bg-gradient-to-br ${card.gradient} shadow-lg shadow-blue-900/5 scale-[1.05]`
                                                            : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 bg-white dark:bg-slate-900/50'
                                                        }`}
                                                    >
                                                        <div className={`mb-1.5 transition-transform duration-300 ${educationLevel === card.level ? 'text-blue-600 scale-110' : 'text-slate-400'}`}>
                                                            {card.icon}
                                                        </div>
                                                        <span className={`text-[11px] font-black uppercase tracking-tight ${educationLevel === card.level ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-500'}`}>
                                                            {card.title}
                                                        </span>
                                                        <span className="text-[9px] text-slate-400 dark:text-slate-600 mt-0.5 font-bold uppercase tracking-tighter">{card.subtitle}</span>
                                                        {educationLevel === card.level && (
                                                            <motion.div
                                                                initial={{ scale: 0, rotate: -45 }}
                                                                animate={{ scale: 1, rotate: 0 }}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-950"
                                                            >
                                                                <CheckCircle className="w-4 h-4 text-white" />
                                                            </motion.div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                    placeholder="e.g. Jane Wanjiku"
                                                />
                                            </div>

                                            {/* Institution Name (Campus only) */}
                                            {educationLevel === EducationLevel.CAMPUS && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                >
                                                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Institution Name</label>
                                                    <input
                                                        type="text"
                                                        value={institutionName}
                                                        onChange={(e) => setInstitutionName(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-purple-500 outline-none transition-all font-bold"
                                                        placeholder="e.g. University of Nairobi"
                                                    />
                                                </motion.div>
                                            )}

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">
                                                        {educationLevel === EducationLevel.CAMPUS ? 'Year' : 'Grade / Class'}
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            required
                                                            value={grade}
                                                            onChange={(e) => setGrade(e.target.value)}
                                                            className={`w-full px-4 py-3.5 rounded-xl border-2 outline-none appearance-none transition-all font-bold ${!educationLevel
                                                                ? 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                                                : 'bg-white dark:bg-slate-800 border-blue-50 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 cursor-pointer shadow-sm'}`}
                                                        >
                                                            {!educationLevel ? (
                                                                <option value="">Choose Level ↑</option>
                                                            ) : (
                                                                <>
                                                                    <option value="">Select...</option>
                                                                    {getGradeOptions().map(g => (
                                                                        <option key={g} value={g}>{g}</option>
                                                                    ))}
                                                                </>
                                                            )}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500/50">
                                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Secret PIN</label>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        maxLength={4}
                                                        required
                                                        value={pin}
                                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none tracking-widest text-lg font-mono text-center font-bold"
                                                        placeholder="4 digits"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Parent / Guardian Phone</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={parentPhone}
                                                    onChange={(e) => setParentPhone(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                    placeholder="e.g. 0712 345 678"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1 ml-1">Used by parent to monitor your progress</p>
                                            </div>
                                        </div>
                                    </>
                                ) : role === 'SCHOOL' ? (
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">School Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={schoolName}
                                                    onChange={(e) => setSchoolName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                    placeholder="e.g. Nairobi Primary School"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">County</label>
                                                <div className="relative">
                                                    <select
                                                        required
                                                        value={schoolCounty}
                                                        onChange={(e) => setSchoolCounty(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none font-bold appearance-none"
                                                    >
                                                        <option value="">Select county...</option>
                                                        {kenyanCounties.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                        <ChevronRight className="w-4 h-4 rotate-90" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Phone</label>
                                                <input
                                                    type="tel"
                                                    value={schoolPhone}
                                                    onChange={(e) => setSchoolPhone(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none font-bold"
                                                    placeholder="0712 345 678"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Contact Person (Name)</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={schoolContact}
                                                    onChange={(e) => setSchoolContact(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none font-bold"
                                                    placeholder="e.g. Mr. Kamau (Deputy Head)"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Admin Email</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={schoolEmail}
                                                    onChange={(e) => setSchoolEmail(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none font-bold"
                                                    placeholder="admin@school.ke"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={schoolPassword}
                                                    onChange={(e) => setSchoolPassword(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none font-bold"
                                                    placeholder="Min 6 chars"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm</label>
                                                <input
                                                    type="password"
                                                    required
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none font-bold"
                                                    placeholder="Repeat"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : ( // TEACHER
                                    <>
                                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/50">
                                            <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">Teaching Details</label>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Classes I Teach</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {["Grade 1-6", "Grade 7-9 (JSS)", "Form 1-4 (KCSE)", "Grade 10+ (CBC Senior)", "Campus / University"].map(c => (
                                                            <button
                                                                type="button"
                                                                key={c}
                                                                onClick={() => {
                                                                    setTeacherClasses(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
                                                                }}
                                                                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all border-2 ${teacherClasses.includes(c)
                                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400'}`}
                                                            >
                                                                {c}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">My Main Subject</label>
                                                    <select
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-emerald-500 outline-none font-bold text-sm"
                                                        onChange={(e) => setTeacherSubjects([e.target.value])}
                                                    >
                                                        <option value="">Select Subject...</option>
                                                        {subjectOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={teacherName}
                                                    onChange={(e) => setTeacherName(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-all font-bold"
                                                    placeholder="e.g. Mr. John Kamau"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                                <input
                                                    type="email"
                                                    required
                                                    value={teacherEmail}
                                                    onChange={(e) => setTeacherEmail(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-all font-bold"
                                                    placeholder="teacher@school.ke"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">WhatsApp / Phone (optional)</label>
                                                <input
                                                    type="tel"
                                                    value={teacherPhone}
                                                    onChange={(e) => setTeacherPhone(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-all font-bold"
                                                    placeholder="0712 345 678"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1 ml-1">Used for M-PESA earnings payouts</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        value={teacherPassword}
                                                        onChange={(e) => setTeacherPassword(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-all font-bold"
                                                        placeholder="Min 6 chars"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm</label>
                                                    <input
                                                        type="password"
                                                        required
                                                        value={teacherConfirmPassword}
                                                        onChange={(e) => setTeacherConfirmPassword(e.target.value)}
                                                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-emerald-500 outline-none transition-all font-bold"
                                                        placeholder="Repeat"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Inline Error Message */}
                                {errorMessage && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
                                    >
                                        <span className="text-red-500 text-lg leading-none mt-0.5">⚠</span>
                                        <p className="text-red-700 dark:text-red-400 text-sm font-medium leading-snug">{errorMessage}</p>
                                    </motion.div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 shadow-blue-900/20 text-white rounded-xl font-bold text-lg transition-all shadow-xl mt-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                            Processing...
                                        </>
                                    ) : role === 'SCHOOL' ? 'Create School Account' : role === 'TEACHER' ? 'Create Teacher Profile' : 'Get My Student ID — Free'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        /* ─── SUCCESS SCREEN ─── */
                        <div className="p-6 sm:p-8 text-center relative overflow-hidden overflow-y-auto">
                            <div className="absolute inset-0 bg-gradient-to-br from-white via-green-50 to-blue-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 opacity-60 z-0" />

                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-5 shadow-green-200 shadow-lg">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>

                                {role === 'SCHOOL' ? (
                                    <>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">School Registered!</h2>
                                        <p className="text-slate-600 dark:text-slate-400 mb-5">Your school dashboard is ready. Our team will contact you to complete setup.</p>
                                        <div className="text-sm text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl mb-5 text-left">
                                            <p className="font-bold mb-1">Next steps:</p>
                                            <ul className="space-y-1 text-xs">
                                                <li>✅ Login with <strong>{schoolEmail}</strong></li>
                                                <li>📋 Set up your classes and invite teachers</li>
                                                <li>📱 Share student codes with learners</li>
                                            </ul>
                                        </div>
                                    </>
                                ) : role === 'TEACHER' ? (
                                    <>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome, Teacher!</h2>
                                        <p className="text-slate-600 dark:text-slate-400 mb-5">Your teacher profile is ready. Start creating lessons and growing your class.</p>
                                        <div className="text-sm text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl mb-5 text-left">
                                            <p className="font-bold mb-1">Quick start:</p>
                                            <ul className="space-y-1 text-xs">
                                                <li>✅ Login with <strong>{teacherEmail}</strong></li>
                                                <li>📝 Create your first lesson note</li>
                                                <li>🎓 Generate a class code for your students</li>
                                            </ul>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">You&apos;re in! 🎉</h2>
                                        <p className="text-slate-500 dark:text-slate-400 mb-4 text-sm">Your unique Student ID is ready. Save it — you&apos;ll need it to log in.</p>

                                        {/* Student ID display */}
                                        <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl p-5 mb-4 shadow-sm">
                                            <p className="text-xs text-slate-400 uppercase font-black tracking-widest mb-2">Your Student ID</p>
                                            <p className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-widest select-all">{studentCode}</p>
                                        </div>

                                        {/* Copy + WhatsApp share */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <button
                                                onClick={handleCopyId}
                                                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all ${copied
                                                    ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400 hover:text-blue-600'
                                                }`}
                                            >
                                                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                {copied ? 'Copied!' : 'Copy ID'}
                                            </button>
                                            <button
                                                onClick={handleWhatsAppShare}
                                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 bg-[#25D366]/10 border-[#25D366]/40 text-[#128C7E] dark:text-[#25D366] font-bold text-sm hover:bg-[#25D366]/20 transition-all"
                                            >
                                                <MessageCircle className="w-4 h-4" />
                                                Share via WhatsApp
                                            </button>
                                        </div>

                                        <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-xl mb-4 text-left">
                                            <strong>⚠ Important:</strong> Screenshot or save this ID. Your parent also needs it to monitor your progress.
                                        </div>
                                    </>
                                )}

                                <button
                                    onClick={onSuccess}
                                    className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {role === 'SCHOOL' ? 'Go to School Dashboard 🏫' : role === 'TEACHER' ? 'Open Teacher Dashboard 🍎' : "Start Learning Now 🚀"}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
