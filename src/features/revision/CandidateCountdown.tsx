import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Calendar, AlertCircle, ChevronRight, Zap, Target } from 'lucide-react';

interface ExamEvent {
    id: string;
    name: string;
    date: Date;
    description: string;
    strategy: string;
    color: string;
}

export const CandidateCountdown: React.FC = () => {
    const exams: ExamEvent[] = [
        {
            id: 'kcse-2026',
            name: 'KCSE 2026',
            date: new Date('2026-10-26T08:00:00'),
            description: 'Kenya Certificate of Secondary Education',
            strategy: '300+ Days Left: Master the core concepts and practice Paper 1 topical questions.',
            color: 'indigo'
        },
        {
            id: 'kpsea-2026',
            name: 'KPSEA 2026',
            date: new Date('2026-10-19T08:00:00'),
            description: 'Kenya Primary School Education Assessment',
            strategy: 'Revise all Year 6 strands and take weekly timed mock assessments.',
            color: 'emerald'
        }
    ];

    const [timeLeft, setTimeLeft] = useState<{ [key: string]: { days: number, hours: number, mins: number, secs: number } }>({});
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            const newTimeLeft: { [key: string]: { days: number, hours: number, mins: number, secs: number } } = {};

            exams.forEach(exam => {
                const diff = exam.date.getTime() - new Date().getTime();
                if (diff > 0) {
                    newTimeLeft[exam.id] = {
                        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
                        mins: Math.floor((diff / 1000 / 60) % 60),
                        secs: Math.floor((diff / 1000) % 60)
                    };
                } else {
                    newTimeLeft[exam.id] = { days: 0, hours: 0, mins: 0, secs: 0 };
                }
            });

            setTimeLeft(newTimeLeft);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const activeExam = exams[activeIndex];
    const activeTime = timeLeft[activeExam.id] || { days: 0, hours: 0, mins: 0, secs: 0 };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all group">
            <div className="flex flex-col md:flex-row h-full">
                {/* Visual Countdown Side */}
                <div className={`w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-center relative overflow-hidden text-white ${activeExam.color === 'indigo' ? 'bg-indigo-600' : 'bg-emerald-600'
                    }`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-5 h-5 animate-pulse" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Countdown to Success</span>
                        </div>

                        <h3 className="text-2xl sm:text-4xl font-black tracking-tight mb-6 sm:mb-8">
                            {activeExam.name}
                        </h3>

                        <div className="grid grid-cols-4 gap-2 sm:gap-4">
                            {[
                                { label: 'Days', value: activeTime.days },
                                { label: 'Hrs', value: activeTime.hours },
                                { label: 'Mins', value: activeTime.mins },
                                { label: 'Secs', value: activeTime.secs }
                            ].map((unit, i) => (
                                <div key={i} className="flex flex-col items-center">
                                    <div className="bg-white/20 backdrop-blur-md rounded-2xl w-full aspect-square flex items-center justify-center mb-1.5 sm:mb-2 border border-white/20">
                                        <span className="text-xl sm:text-2xl font-black">{unit.value}</span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{unit.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Strategy Side */}
                <div className="w-full md:w-1/2 p-6 sm:p-8 bg-white dark:bg-slate-900 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-100 dark:border-amber-800">
                                <Zap className="w-3 h-3 fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-wider">Candidate Strategy</span>
                            </div>
                            <div className="flex gap-1">
                                {exams.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setActiveIndex(i)}
                                        className={`w-2 h-2 rounded-full transition-all ${activeIndex === i ? 'bg-indigo-600 w-4' : 'bg-slate-200 dark:bg-slate-700'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <h4 className="text-lg font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                            {activeExam.description}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 italic">
                            &quot;{activeExam.strategy}&quot;
                        </p>

                        <div className="space-y-3">
                            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
                                <Target className="w-4 h-4 text-indigo-500 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Priority Areas</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Based on previous 5-year patterns.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button className="mt-8 w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 group hover:gap-4 transition-all shadow-xl shadow-slate-200 dark:shadow-none">
                        Refine My Strategy <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
