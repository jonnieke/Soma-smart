import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, CheckCircle, X, GraduationCap, BookOpen, School } from 'lucide-react';
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

    // Teacher State
    const [teacherName, setTeacherName] = useState("");
    const [teacherEmail, setTeacherEmail] = useState("");
    const [teacherPhone, setTeacherPhone] = useState("");
    const [teacherPassword, setTeacherPassword] = useState("");
    const [teacherConfirmPassword, setTeacherConfirmPassword] = useState("");
    const [teacherClasses, setTeacherClasses] = useState<string[]>([]);
    const [teacherSubjects, setTeacherSubjects] = useState<string[]>([]);
    const [teacherSchool, setTeacherSchool] = useState(""); // Optional, for future use

    const [step, setStep] = useState<'FORM' | 'SUCCESS'>('FORM');
    const [loading, setLoading] = useState(false);

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
            setTeacherName("");
            setTeacherEmail("");
            setTeacherPhone("");
            setTeacherPassword("");
            setTeacherConfirmPassword("");
            setTeacherClasses([]);
            setTeacherSubjects([]);
            setTeacherSchool("");
        }
    }, [isOpen, initialRole]);

    // Grade options per education level
    const getGradeOptions = () => {
        switch (educationLevel) {
            case EducationLevel.JUNIOR:
                return ["Play Group", "PP1", "PP2", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"];
            case EducationLevel.SENIOR:
                return ["Grade 7 (JSS)", "Grade 8 (JSS)", "Grade 9 (JSS)", "Form 1", "Form 2", "Form 3", "Form 4"];
            case EducationLevel.CAMPUS:
                return ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Postgraduate"];
            default:
                return [];
        }
    };

    // All grade options for teacher (unchanged)
    const allGradeOptions = [
        "Play Group", "PP1", "PP2",
        "Grade 1", "Grade 2", "Grade 3",
        "Grade 4", "Grade 5", "Grade 6",
        "Grade 7 (JSS)", "Grade 8 (JSS)", "Grade 9 (JSS)",
        "Form 1", "Form 2", "Form 3", "Form 4"
    ];

    const subjectOptions = [
        "Mathematics", "English", "Kiswahili", "Science&Tech", "Social Studies", "CRE", "IRE", "Home Science", "Agriculture", "Computer Studies", "Business Studies", "History", "Geography", "Chemistry", "Biology", "Physics", "Indigenous Language", "French", "German", "Arabic", "Integrated Science", "Physical Education (PE)", "Music"
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
            subtitle: "Grade 7 – Form 4",
            gradient: "from-blue-50 to-indigo-50",
            border: "border-blue-400 ring-blue-200"
        },
        {
            level: EducationLevel.CAMPUS,
            icon: <GraduationCap className="w-6 h-6" />,
            title: "Campus",
            subtitle: "College / University",
            gradient: "from-purple-50 to-violet-50",
            border: "border-purple-400 ring-purple-200"
        }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (role === 'STUDENT') {
            if (!educationLevel) {
                alert("Please select your education level.");
                setLoading(false);
                return;
            }
            if (name && grade && pin.length >= 4 && parentPhone) {
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
                    alert("Registration Error: " + result.message);
                }
            } else if (!pin || pin.length < 4) {
                alert("Please create a 4-digit Secret PIN to protect your account.");
            } else if (!grade) {
                alert("Please select your Grade/Class.");
            } else if (!parentPhone) {
                alert("Please enter a Parent Phone Number for dashboard access.");
            }
        } else if (role === 'SCHOOL') {
            if (schoolPassword !== confirmPassword) {
                alert("Passwords do not match.");
                setLoading(false);
                return;
            }
            if (schoolPassword.length < 6) {
                alert("Password must be at least 6 characters.");
                setLoading(false);
                return;
            }

            const result = await registerSchool(schoolName, schoolEmail, schoolPassword);
            if (result.success) {
                triggerConfetti();
                setStep('SUCCESS');
            } else {
                alert("Registration Failed: " + result.message);
            }
        } else if (role === 'TEACHER') {
            if (teacherPassword !== teacherConfirmPassword) {
                alert("Passwords do not match.");
                setLoading(false);
                return;
            }
            if (teacherPassword.length < 6) {
                alert("Password must be at least 6 characters.");
                setLoading(false);
                return;
            }

            const result = await registerTeacher(teacherName, teacherEmail, teacherPassword, teacherClasses, teacherSubjects, teacherPhone);
            if (result.success) {
                triggerConfetti();
                setStep('SUCCESS');
            } else {
                alert("Registration Failed: " + result.message);
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

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {step === 'FORM' ? (
                        <div className="p-6 sm:p-8 overflow-y-auto">
                            <div className="text-center mb-8">
                                <div className="mb-8">
                                    <button
                                        onClick={onSwitchToLogin}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all border border-blue-100 dark:border-blue-800"
                                    >
                                        Already have an ID? Login here
                                    </button>
                                </div>

                                <div className={`w-20 h-20 bg-gradient-to-br ${role === 'SCHOOL' ? 'from-blue-800 to-slate-900 text-white' : role === 'TEACHER' ? 'from-emerald-500 to-teal-600 text-white' : 'from-blue-500 to-indigo-600 text-white'} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100 dark:shadow-none transition-all rotate-3`}>
                                    <User className="w-10 h-10" />
                                </div>
                                
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                    {role === 'SCHOOL' ? 'Register Your School' : role === 'TEACHER' ? 'Teacher Registration' : 'Create Student Profile'}
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed max-w-xs mx-auto mb-2">
                                    {role === 'SCHOOL' 
                                        ? 'Join the Somo Smart network and empower your teachers.' 
                                        : role === 'TEACHER' 
                                            ? 'Create your professional profile to start teaching.' 
                                            : 'Register to start your personalized learning journey!'}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {role === 'STUDENT' ? (
                                    <>
                                        {/* Education Level Selector */}
                                        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">I am a...</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {levelCards.map(card => (
                                                    <button
                                                        type="button"
                                                        key={card.level}
                                                        onClick={() => {
                                                            setEducationLevel(card.level);
                                                            setGrade(""); // Reset grade when level changes
                                                        }}
                                                        className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ${educationLevel === card.level
                                                                ? `${card.border} ring-2 bg-gradient-to-br ${card.gradient} shadow-md scale-[1.02]`
                                                                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 bg-white dark:bg-slate-800'
                                                            }`}
                                                    >
                                                        <div className={`mb-1.5 ${educationLevel === card.level ? 'text-blue-600' : 'text-gray-400'}`}>
                                                            {card.icon}
                                                        </div>
                                                        <span className={`text-xs font-bold ${educationLevel === card.level ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                                            {card.title}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{card.subtitle}</span>
                                                        {educationLevel === card.level && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center"
                                                            >
                                                                <CheckCircle className="w-3.5 h-3.5 text-white" />
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
                                                    placeholder="e.g. John Doe"
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
                                                        {educationLevel === EducationLevel.CAMPUS ? 'Year' : 'Grade'}
                                                    </label>
                                                    <div className="relative">
                                                        <select
                                                            required
                                                            value={grade}
                                                            onChange={(e) => setGrade(e.target.value)}
                                                            disabled={!educationLevel}
                                                            className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none appearance-none bg-white dark:bg-slate-800 cursor-pointer disabled:opacity-50 font-bold"
                                                        >
                                                            <option value="" disabled>Select...</option>
                                                            {getGradeOptions().map(g => (
                                                                <option key={g} value={g}>{g}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-[10px]">
                                                            ▼
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
                                                        placeholder="0000"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 ml-1">Parent Phone Number</label>
                                                <input
                                                    type="tel"
                                                    required
                                                    value={parentPhone}
                                                    onChange={(e) => setParentPhone(e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                    placeholder="e.g. 0712345678"
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : role === 'SCHOOL' ? (
                                    <>
                                        <div>
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
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Admin Email</label>
                                            <input
                                                type="email"
                                                required
                                                value={schoolEmail}
                                                onChange={(e) => setSchoolEmail(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                placeholder="admin@school.edu"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={schoolPassword}
                                                onChange={(e) => setSchoolPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                placeholder="******"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                placeholder="******"
                                            />
                                        </div>
                                    </>
                                ) : ( // TEACHER
                                    <>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                value={teacherName}
                                                onChange={(e) => setTeacherName(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                placeholder="e.g. Jane Doe"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                value={teacherEmail}
                                                onChange={(e) => setTeacherEmail(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                placeholder="jane.doe@example.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone Number (Optional)</label>
                                            <input
                                                type="tel"
                                                value={teacherPhone}
                                                onChange={(e) => setTeacherPhone(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                placeholder="0712345678"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={teacherPassword}
                                                onChange={(e) => setTeacherPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                placeholder="******"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                                            <input
                                                type="password"
                                                required
                                                value={teacherConfirmPassword}
                                                onChange={(e) => setTeacherConfirmPassword(e.target.value)}
                                                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all font-bold"
                                                placeholder="******"
                                            />
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 shadow-blue-900/20 text-white rounded-xl font-bold text-lg transition-all shadow-xl mt-4 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? 'Processing...' : role === 'SCHOOL' ? 'Create School Account' : role === 'TEACHER' ? 'Create Teacher Profile' : 'Get My Student ID'}
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="p-6 sm:p-8 text-center relative overflow-hidden overflow-y-auto">

                            <div className="absolute inset-0 bg-gradient-to-br from-white via-green-50 to-blue-50 opacity-50 z-0"></div>

                            <div className="relative z-10">
                                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-green-200 shadow-lg">
                                    <CheckCircle className="w-10 h-10 text-green-600" />
                                </div>
                                {role === 'SCHOOL' ? (
                                    <>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">School Registered!</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">Your school dashboard is ready.</p>
                                        <p className="text-sm text-blue-800 bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
                                            ✅ You can now login using your email <strong>{schoolEmail}</strong>.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Registration Complete!</h2>
                                        <p className="text-gray-600 dark:text-gray-400 mb-6">Your unique Student ID has been generated.</p>

                                        <div className="bg-white dark:bg-slate-800 border-2 border-dashed border-blue-300 rounded-xl p-6 mb-6 shadow-sm">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide mb-2">Your Student ID</p>
                                            <p className="text-4xl font-mono font-bold text-blue-600 tracking-wider copy select-all">{studentCode}</p>
                                            <p className="text-xs text-blue-400 mt-2 font-medium">We&apos;ll remember you on this device!</p>
                                        </div>

                                        <p className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                                            ⚠️ Save this ID! You will need it to login later, and for your parents to track your progress.
                                        </p>
                                    </>
                                )}

                                <button
                                    onClick={onSuccess}
                                    className="w-full py-3.5 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {role === 'SCHOOL' ? 'Go to School Dashboard 🏫' : role === 'TEACHER' ? 'Go to Teacher Dashboard 🍎' : "Let's Start Learning! 🚀"}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence >
    );
};
