import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, School, Book, Plus, X, GraduationCap } from 'lucide-react';
import { Button } from './Shared';
import { useApp } from '../context/AppContext';
import { TeacherProfile } from '../types';
import { translations } from '../data/translations';

interface TeacherOnboardingProps {
    onComplete: (profile: TeacherProfile) => void;
    onClose: () => void;
    onLogin?: () => void;
    initialStep?: number;
    isEditing?: boolean;
}

export const TeacherOnboarding: React.FC<TeacherOnboardingProps> = ({ onComplete, onClose, onLogin, initialStep = 1, isEditing = false }) => {
    const { registerTeacher, updateTeacherProfile, teacherProfile, language } = useApp();
    const baseTranslations = (translations as Record<string, any>).EN ?? Object.values(translations)[0] ?? {};
    const activeTranslations = (translations as Record<string, any>)[language] ?? baseTranslations;
    const baseTeacherTranslations = baseTranslations.teacher ?? {};
    const activeTeacherTranslations = activeTranslations.teacher ?? {};
    const t = {
        ...baseTranslations,
        ...activeTranslations,
        teacher: {
            ...baseTeacherTranslations,
            ...activeTeacherTranslations,
            onboarding: { ...(baseTeacherTranslations.onboarding ?? {}), ...(activeTeacherTranslations.onboarding ?? {}) },
        },
    };
    const [step, setStep] = useState(initialStep);

    // Auth State
    const [name, setName] = useState(teacherProfile?.name || "");
    const [email, setEmail] = useState(teacherProfile?.email || "");
    const [password, setPassword] = useState("");

    // Profile State
    const [classes, setClasses] = useState<string[]>(teacherProfile?.classes || []);
    const [subjects, setSubjects] = useState<string[]>(teacherProfile?.subjects || []);
    const [loading, setLoading] = useState(false);

    const removeItem = (list: string[], setList: (l: string[]) => void, index: number) => {
        const newList = [...list];
        newList.splice(index, 1);
        setList(newList);
    };

    const handleFinish = async () => {
        if (isEditing) {
            setLoading(true);
            // Verify we have a profile to update
            if (teacherProfile) {
                await updateTeacherProfile({
                    ...teacherProfile,
                    classes,
                    subjects: subjects
                });
                onComplete({ ...teacherProfile, classes, subjects: subjects });
            } else {
                alert(t.teacher.onboarding.errorNoProfile);
            }
            setLoading(false);
            return;
        }

        if (name && email && password && classes.length > 0 && subjects.length > 0) {
            setLoading(true);
            const result = await registerTeacher(name, email, password, classes, subjects, '');

            if (result.success) {
                onComplete({ id: 'new', name, classes, subjects: subjects, email });
            } else {
                // Handle Error
                if (result.message && (result.message.includes("already registered") || result.message.includes("unique constrain"))) {
                    alert(t.teacher.onboarding.accountExists);
                    if (onLogin) onLogin();
                } else {
                    alert(t.teacher.onboarding.registrationError + result.message);
                }
            }
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors z-10"
                >
                    <X className="w-6 h-6" />
                </button>
                <div className="bg-indigo-600 py-4 px-6 text-white text-center">
                    <GraduationCap className="w-8 h-8 mx-auto mb-1 text-indigo-200" />
                    <h2 className="text-xl font-bold">{t.teacher.onboarding.welcomeTitle}</h2>
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-[0.1em]">{t.teacher.onboarding.welcomeSubtitle}</p>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Progress */}
                    <div className="flex gap-2 justify-center mb-4">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-0.5">{t.teacher.onboarding.fullName}</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Mr. Kamau"
                                    className="w-full py-2.5 px-4 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium transition-all"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-0.5">{t.teacher.onboarding.emailAddress}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="teacher@school.com"
                                    className="w-full py-2.5 px-4 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium transition-all"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 text-[10px] uppercase tracking-wider mb-0.5">{t.teacher.onboarding.createPassword}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="******"
                                    className="w-full py-2.5 px-4 border-2 border-slate-100 rounded-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-medium transition-all"
                                />
                            </div>
                            <Button fullWidth onClick={() => setStep(2)} disabled={!name || !email || !password || password.length < 6} className="py-4 text-xs font-black uppercase tracking-widest">{t.teacher.onboarding.next}</Button>
                            {password && password.length < 6 && <p className="text-xs text-red-500 mt-1">{t.teacher.onboarding.passwordLengthError}</p>}

                            {onLogin && (
                                <div className="pt-1 text-center">
                                    <button
                                        onClick={onLogin}
                                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {t.teacher.onboarding.alreadyHaveAccount} <span className="text-indigo-600 hover:underline underline-offset-4">{t.teacher.onboarding.loginHere}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block font-black text-slate-700 uppercase tracking-widest text-[9px] ml-1">{t.teacher.onboarding.classesTitle}</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <School className="w-5 h-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val && !classes.includes(val)) {
                                                setClasses([...classes, val]);
                                            }
                                        }}
                                        className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-sm font-bold appearance-none cursor-pointer transition-all hover:bg-white"
                                    >
                                        <option value="" disabled>{(language as string) === 'FR' ? 'Sélectionner une classe' : 'Select a class...'}</option>
                                        <optgroup label="Pre-Primary (CBC)">
                                            <option value="PP1">PP1</option>
                                            <option value="PP2">PP2</option>
                                        </optgroup>
                                        <optgroup label="Primary/Junior School">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                                                <option key={n} value={`Grade ${n}`}>Grade {n}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="Secondary School (KCSE)">
                                            {[1, 2, 3, 4].map(n => (
                                                <option key={n} value={`Form ${n}`}>Form {n}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Classes ({classes.length})</span>
                                    {classes.length > 0 && (
                                        <button onClick={() => setClasses([])} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Clear All</button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 min-h-[80px] p-3 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
                                    {classes.map((cls, i) => (
                                        <motion.span
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            key={i}
                                            className="bg-white text-slate-700 px-4 py-2 rounded-xl flex items-center gap-3 border shadow-sm group hover:border-indigo-200 transition-all font-bold text-xs"
                                        >
                                            {cls}
                                            <button
                                                onClick={() => removeItem(classes, setClasses, i)}
                                                className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X className="w-3 h-3 text-slate-400 group-hover:text-red-500" />
                                            </button>
                                        </motion.span>
                                    ))}
                                    {classes.length === 0 && (
                                        <div className="w-full flex flex-col items-center justify-center py-6 opacity-40">
                                            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center mb-2">
                                                <Plus className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.teacher.onboarding.addClassPrompt}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl">{t.teacher.onboarding.back}</Button>
                                <Button
                                    onClick={() => setStep(3)}
                                    disabled={classes.length === 0}
                                    className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100"
                                >
                                    {t.teacher.onboarding.next}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="block font-black text-slate-700 uppercase tracking-widest text-[9px] ml-1">{t.teacher.onboarding.subjectsTitle}</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                                        <Book className="w-5 h-5 text-purple-500 group-hover:scale-110 transition-transform" />
                                    </div>
                                    <select
                                        value=""
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val && !subjects.includes(val)) {
                                                setSubjects([...subjects, val]);
                                            }
                                        }}
                                        className="w-full pl-12 pr-10 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none text-sm font-bold appearance-none cursor-pointer transition-all hover:bg-white"
                                    >
                                        <option value="" disabled>{(language as string) === 'FR' ? 'Sélectionner une matière' : 'Select a subject...'}</option>
                                        <optgroup label="Languages">
                                            <option value="English">English</option>
                                            <option value="Kiswahili">Kiswahili</option>
                                            <option value="French">French</option>
                                            <option value="German">German</option>
                                            <option value="Arabic">Arabic</option>
                                            <option value="Indigenous Language">Indigenous Language</option>
                                        </optgroup>
                                        <optgroup label="Sciences">
                                            <option value="Mathematics">Mathematics</option>
                                            <option value="Biology">Biology</option>
                                            <option value="Physics">Physics</option>
                                            <option value="Chemistry">Chemistry</option>
                                            <option value="General Science">General Science</option>
                                            <option value="Integrated Science">Integrated Science</option>
                                            <option value="Music">Music</option>
                                            <option value="Physical Education (PE)">Physical Education (PE)</option>
                                        </optgroup>
                                        <optgroup label="Humanities">
                                            <option value="Geography">Geography</option>
                                            <option value="History">History</option>
                                            <option value="CRE">CRE</option>
                                            <option value="IRE">IRE</option>
                                            <option value="HRE">HRE</option>
                                            <option value="Social Studies">Social Studies</option>
                                        </optgroup>
                                        <optgroup label="Applied & Technical">
                                            <option value="Agriculture">Agriculture</option>
                                            <option value="Home Science">Home Science</option>
                                            <option value="Computer Studies">Computer Studies</option>
                                            <option value="Business Studies">Business Studies</option>
                                            <option value="Aviation">Aviation</option>
                                        </optgroup>
                                        <optgroup label="Creative Arts">
                                            <option value="Music">Music</option>
                                            <option value="Art & Design">Art & Design</option>
                                        </optgroup>
                                    </select>
                                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Selected Subjects ({subjects.length})</span>
                                    {subjects.length > 0 && (
                                        <button onClick={() => setSubjects([])} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Clear All</button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 min-h-[80px] p-3 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl">
                                    {subjects.map((sub, i) => (
                                        <motion.span
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            key={i}
                                            className="bg-white text-slate-700 px-4 py-2 rounded-xl flex items-center gap-3 border shadow-sm group hover:border-purple-200 transition-all font-bold text-xs"
                                        >
                                            {sub}
                                            <button
                                                onClick={() => removeItem(subjects, setSubjects, i)}
                                                className="p-1 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <X className="w-3 h-3 text-slate-400 group-hover:text-red-500" />
                                            </button>
                                        </motion.span>
                                    ))}
                                    {subjects.length === 0 && (
                                        <div className="w-full flex flex-col items-center justify-center py-6 opacity-40">
                                            <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center mb-2">
                                                <Plus className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{t.teacher.onboarding.addSubjectPrompt}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl">{t.teacher.onboarding.back}</Button>
                                <Button
                                    onClick={handleFinish}
                                    disabled={subjects.length === 0 || loading}
                                    className="flex-1 py-4 text-xs font-black uppercase tracking-widest rounded-2xl bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-100"
                                >
                                    {loading ? t.teacher.onboarding.creatingAccount : t.teacher.onboarding.completeSetup}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
