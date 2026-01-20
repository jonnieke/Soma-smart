import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, School, Book, Plus, X, GraduationCap } from 'lucide-react';
import { Button } from './Shared';
import { TeacherProfile } from '../types';

interface TeacherOnboardingProps {
    onComplete: (profile: TeacherProfile) => void;
    onClose: () => void;
}

export const TeacherOnboarding: React.FC<TeacherOnboardingProps> = ({ onComplete, onClose }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState("");
    const [classes, setClasses] = useState<string[]>([]);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [currentInput, setCurrentInput] = useState("");

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

    const handleFinish = () => {
        if (name && classes.length > 0 && subjects.length > 0) {
            onComplete({ name, classes, subjects });
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
                    <h2 className="text-2xl font-bold">Welcome, Teacher!</h2>
                    <p className="text-indigo-200 text-sm">Let's set up your digital classroom.</p>
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
                            <label className="block font-bold text-slate-700">What's your name?</label>
                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Mr. Kamau"
                                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                            />
                            <Button fullWidth onClick={() => setStep(2)} disabled={!name}>Next</Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <label className="block font-bold text-slate-700">Which classes do you teach?</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddClass()}
                                    placeholder="e.g. Grade 4, Form 2"
                                    className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button onClick={handleAddClass} className="bg-indigo-100 text-indigo-600 p-3 rounded-xl hover:bg-indigo-200"><Plus className="w-6 h-6" /></button>
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-[100px]">
                                {classes.map((cls, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full flex items-center gap-2">
                                        {cls} <button onClick={() => removeItem(classes, setClasses, i)}><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                                    </span>
                                ))}
                                {classes.length === 0 && <p className="text-slate-400 text-sm italic w-full text-center py-8">Add at least one active class.</p>}
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">Back</Button>
                                <Button onClick={() => { setCurrentInput(""); setStep(3); }} disabled={classes.length === 0} className="flex-1">Next</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <label className="block font-bold text-slate-700">Which subjects do you teach?</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={currentInput}
                                    onChange={(e) => setCurrentInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                                    placeholder="e.g. Mathematics, Science"
                                    className="flex-1 p-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <button onClick={handleAddSubject} className="bg-indigo-100 text-indigo-600 p-3 rounded-xl hover:bg-indigo-200"><Plus className="w-6 h-6" /></button>
                            </div>

                            <div className="flex flex-wrap gap-2 min-h-[100px]">
                                {subjects.map((sub, i) => (
                                    <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full flex items-center gap-2">
                                        {sub} <button onClick={() => removeItem(subjects, setSubjects, i)}><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
                                    </span>
                                ))}
                                {subjects.length === 0 && <p className="text-slate-400 text-sm italic w-full text-center py-8">Add at least one subject.</p>}
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setStep(2)} className="flex-1">Back</Button>
                                <Button onClick={handleFinish} disabled={subjects.length === 0} className="flex-1 bg-green-600 hover:bg-green-700">Complete Setup</Button>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
