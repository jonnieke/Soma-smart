import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Send, Users, Sparkles, CheckCircle } from 'lucide-react';
import { generatePracticeQuestions, PracticeQuestion } from '../../services/geminiService';

export const HomeworkCreator: React.FC<{
    onBack: () => void;
    subjects: string[];
    classes: string[];
    initialTopic?: string;
    initialGrade?: string;
    initialSubject?: string;
    initialDifficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}> = ({ onBack, subjects, classes, initialTopic, initialGrade, initialSubject, initialDifficulty }) => {
    const [topic, setTopic] = useState(initialTopic || '');
    const [diff, setDiff] = useState<'EASY' | 'MEDIUM' | 'HARD'>(initialDifficulty || 'MEDIUM');
    const [subject, setSubject] = useState(initialSubject || subjects[0] || 'Mathematics');
    const [grade, setGrade] = useState(initialGrade || classes[0] || 'Grade 6');
    const [generating, setGenerating] = useState(false);
    const [homework, setHomework] = useState<any>(null);

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const count = diff === 'HARD' ? 7 : diff === 'MEDIUM' ? 5 : 3;
            const examType = grade.includes('8') || grade.toLowerCase().includes('form') ? 'KCSE' : 'JSS';
            
            const generated = await generatePracticeQuestions(subject, topic, examType, count);
            
            if (generated && generated.length > 0) {
                setHomework({
                    title: `${topic} Assignment`,
                    questions: generated
                });
            } else {
                throw new Error("No questions generated");
            }
        } catch (error) {
            console.error(error);
            alert("Failed to generate homework. Please try again.");
        } finally {
            setGenerating(false);
        }
    };

    const handleAssign = () => {
        alert(`Homework assigned to all students in ${grade}! Check the Assignments tab to track submissions.`);
        onBack();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-24">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-semibold">
                <ArrowLeft className="w-5 h-5" />
                Back to Lesson Maker
            </button>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 md:p-12 shadow-xl">
                <div className="flex items-center gap-6 mb-8 border-b border-slate-100 dark:border-slate-800 pb-8">
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center shrink-0">
                        <BookOpen className="w-10 h-10 text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Homework Generator</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            Instantly create engaging, CBC-aligned homework assignments based on today's lesson.
                        </p>
                    </div>
                </div>

                {!homework ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Class/Grade</label>
                                <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none">
                                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700">Subject</label>
                                <select value={subject} onChange={e => setSubject(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none">
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">What did you teach today? (Topic)</label>
                            <textarea
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none resize-none"
                                rows={3}
                                placeholder="E.g., Addition of fractions with different denominators"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700">Difficulty</label>
                            <div className="flex gap-4">
                                {['EASY', 'MEDIUM', 'HARD'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDiff(level as any)}
                                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${diff === level ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!topic.trim() || generating}
                            className="w-full py-4 bg-slate-900 border-2 border-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300 disabled:border-slate-300 font-bold rounded-xl transition-colors mt-4 flex items-center justify-center gap-2"
                        >
                            {generating ? <Sparkles className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                            {generating ? "Crafting Assignment..." : "Generate Homework"}
                        </button>
                    </div>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 shadow-inner">
                            <h3 className="text-2xl font-black text-slate-900 mb-6">{homework.title}</h3>
                            <div className="space-y-4">
                                {homework.questions.map((q: PracticeQuestion, i: number) => (
                                    <div key={i} className="flex flex-col gap-2 p-5 bg-white rounded-xl border border-amber-200 shadow-sm">
                                        <div className="flex justify-between items-start gap-4">
                                            <span className="text-slate-800 font-bold text-lg leading-snug">Q{i + 1}. {q.text}</span>
                                            <span className="text-sm font-black text-amber-600 bg-amber-100 px-3 py-1 rounded-xl shrink-0 border border-amber-200">{q.marks} Marks</span>
                                        </div>
                                        <div className="mt-3 text-sm text-slate-600 bg-indigo-50/50 p-3 rounded-lg border-l-4 border-indigo-300">
                                            <span className="font-bold text-indigo-900 flex items-center gap-1 uppercase text-[10px] tracking-widest block mb-1">
                                                <CheckCircle className="w-3 h-3" /> Model Answer Outline
                                            </span>
                                            {q.modelAnswerOutline}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setHomework(null)} className="flex-1 py-4 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-colors">
                                Regenerate
                            </button>
                            <button onClick={handleAssign} className="flex-[2] flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded-xl transition-all shadow-md shadow-indigo-200">
                                <Send className="w-5 h-5" /> Assign to {grade}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

