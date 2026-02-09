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
    const t = translations[language];
    const [step, setStep] = useState(initialStep);

    // Auth State
    const [name, setName] = useState(teacherProfile?.name || "");
    const [email, setEmail] = useState(teacherProfile?.email || "");
    const [password, setPassword] = useState("");

    // Profile State
    const [classes, setClasses] = useState<string[]>(teacherProfile?.classes || []);
    const [subjects, setSubjects] = useState<string[]>(teacherProfile?.subjects || []);
    const [currentInput, setCurrentInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleAddClass = () => {
        if (currentInput.trim()) {
            setClasses([...classes, currentInput.trim()]);
            setCurrentInput("");
        }
    };

    const handleAddSubject = () => {
        if (currentInput.trim()) {
            setSubjects([...subjects, currentInput.trim()]);
            setCurrentInput("");
        }
    };

    const removeItem = (list: string[], setList: (l: string[]) => void, index: number) => {
        const newList = [...list];
        newList.splice(index, 1);
        setList(newList);
    };

    const handleFinish = async () => {
        // Capture pending input if any
        let finalSubjects = [...subjects];
        if (currentInput.trim() && !subjects.includes(currentInput.trim())) {
            finalSubjects.push(currentInput.trim());
        }

        if (isEditing) {
            setLoading(true);
            // Verify we have a profile to update
            if (teacherProfile) {
                await updateTeacherProfile({
                    ...teacherProfile,
                    classes,
                    subjects: finalSubjects
                });
                onComplete({ ...teacherProfile, classes, subjects: finalSubjects });
            } else {
                alert(t.teacher.onboarding.errorNoProfile);
            }
            setLoading(false);
            return;
        }

        if (name && email && password && classes.length > 0 && finalSubjects.length > 0) {
            setLoading(true);
            const result = await registerTeacher(name, email, password, classes, finalSubjects);

            if (result.success) {
                onComplete({ id: 'new', name, classes, subjects: finalSubjects, email });
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
                <div className="bg-indigo-600 p-6 text-white text-center">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 text-indigo-200" />
                    <h2 className="text-2xl font-bold">{t.teacher.onboarding.welcomeTitle}</h2>
                    <p className="text-indigo-200 text-sm">{t.teacher.onboarding.welcomeSubtitle}</p>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto">
                    {/* Progress */}
                    <div className="flex gap-2 justify-center mb-6">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`h-2 rounded-full transition-all ${s <= step ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />
                        ))}
                    </div>

                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block font-bold text-slate-700 text-sm mb-1">{t.teacher.onboarding.fullName}</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Mr. Kamau"
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 text-sm mb-1">{t.teacher.onboarding.emailAddress}</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="teacher@school.com"
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block font-bold text-slate-700 text-sm mb-1">{t.teacher.onboarding.createPassword}</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="******"
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <Button fullWidth onClick={() => setStep(2)} disabled={!name || !email || !password || password.length < 6}>{t.teacher.onboarding.next}</Button>
                            {password && password.length < 6 && <p className="text-xs text-red-500">{t.teacher.onboarding.passwordLengthError}</p>}

                            {onLogin && (
                                <div className="pt-2 text-center">
                                    <button
                                        onClick={onLogin}
                                        className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
                                    >
                                        {t.teacher.onboarding.alreadyHaveAccount} <span className="font-bold underline decoration-indigo-200 underline-offset-4">{t.teacher.onboarding.loginHere}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <label className="block font-bold text-slate-700">{t.teacher.onboarding.classesTitle}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                                    placeholder="e.g. Grade 4, Form 2"
                                    className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-[100px]">
                                {classes.map((cls, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full flex items-center gap-2">
                                        {cls} <button onClick={() => removeItem(classes, setClasses, i)}><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                                    </span>
                                ))}
                                {classes.length === 0 && <p className="text-slate-400 text-sm italic w-full text-center py-8">{t.teacher.onboarding.addClassPrompt}</p>}
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">{t.teacher.onboarding.back}</Button>
                                <Button
                                    onClick={() => {
                                        if (currentInput.trim()) {
                                            setClasses([...classes, currentInput.trim()]);
                                        }
                                        setCurrentInput("");
                                        setStep(3);
                                    }}
                                    disabled={classes.length === 0 && !currentInput.trim()}
                                    className="flex-1"
                                >
                                    {t.teacher.onboarding.next}
                                </Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <label className="block font-bold text-slate-700">{t.teacher.onboarding.subjectsTitle}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                                    placeholder="e.g. Mathematics, Science"
                                    className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-[100px]">
                                {subjects.map((sub, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full flex items-center gap-2">
                                        {sub} <button onClick={() => removeItem(subjects, setSubjects, i)}><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                                    </span>
                                ))}
                                {subjects.length === 0 && <p className="text-slate-400 text-sm italic w-full text-center py-8">{t.teacher.onboarding.addSubjectPrompt}</p>}
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">{t.teacher.onboarding.back}</Button>
                                <Button
                                    onClick={handleFinish}
                                    disabled={(subjects.length === 0 && !currentInput.trim()) || loading}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
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
