
import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const calendarData = [
    { event: "Term I", opening: "5th Jan 2026", closing: "2nd Apr 2026", duration: "13 Weeks", type: "TERM" },
    { event: "Half term", opening: "25th Feb 2026", closing: "1st Mar 2026", duration: "5 Days", type: "BREAK" },
    { event: "April Holiday", opening: "7th Apr 2026", closing: "24th Apr 2026", duration: "3 Weeks", type: "HOLIDAY" },
    { event: "Term II", opening: "27th Apr 2026", closing: "31st Jul 2026", duration: "14 Weeks", type: "TERM" },
    { event: "Half term", opening: "24th Jun 2026", closing: "28th Jun 2026", duration: "5 Days", type: "BREAK" },
    { event: "August Holiday", opening: "3rd Aug 2026", closing: "21st Aug 2026", duration: "3 Weeks", type: "HOLIDAY" },
    { event: "Term III", opening: "24th Aug 2026", closing: "23rd Oct 2026", duration: "9 Weeks", type: "TERM" },
    { event: "KPSEA", opening: "26th Oct 2026", closing: "29th Oct 2026", duration: "4 Days", type: "EXAM" },
    { event: "KILEA", opening: "26th Oct 2026", closing: "30th Oct 2026", duration: "5 Days", type: "EXAM" },
    { event: "KJSEA & KPLEA", opening: "26th Oct 2026", closing: "5th Nov 2026", duration: "7 Days", type: "EXAM" },
    { event: "KCSE", opening: "2nd Nov 2026", closing: "20th Nov 2026", duration: "3 Weeks", type: "EXAM" },
    { event: "December Holiday", opening: "26th Oct 2026", closing: "1st Jan 2027", duration: "10 Weeks", type: "HOLIDAY" },
];

export const SchoolCalendar: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 320; // Approximately one card width + gap
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    return (
        <section className="py-16 bg-white dark:bg-slate-900 relative overflow-hidden transition-colors border-t border-slate-100 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs mb-3 uppercase tracking-wider dark:bg-blue-900/30 dark:text-blue-400">
                            <Calendar className="w-4 h-4" /> Academic Year
                        </div>
                        <h2 className="text-3xl font-extrabold text-[#1a2b5e] dark:text-white tracking-tight">
                            2026 School Calendar
                        </h2>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="flex items-start gap-3 bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 max-w-md">
                            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium">
                                Dates are subject to change. December Holiday for non-candidates begins <strong>26th Oct 2026</strong>.
                            </p>
                        </div>
                        <div className="flex gap-2 self-end sm:self-center shrink-0">
                            <button onClick={() => scroll('left')} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-sm cursor-pointer" aria-label="Scroll left">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button onClick={() => scroll('right')} className="p-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-sm cursor-pointer" aria-label="Scroll right">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto pb-8 gap-5 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0"
                >
                    {calendarData.map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.05 }}
                            className={`min-w-[280px] snap-center bg-white dark:bg-slate-950 rounded-3xl p-6 border shadow-sm group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between
                                ${item.type === 'TERM' ? 'border-blue-200 dark:border-blue-800/50' :
                                    item.type === 'EXAM' ? 'border-orange-200 dark:border-orange-800/50' :
                                        'border-slate-200 dark:border-slate-800/50'}`}
                        >
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                        ${item.type === 'TERM' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400' :
                                            item.type === 'EXAM' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400' :
                                                item.type === 'HOLIDAY' ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' :
                                                    'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'}`}
                                    >
                                        <Calendar className="w-5 h-5" />
                                    </div>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-100 dark:border-slate-800">
                                        <Clock className="w-3.5 h-3.5" />
                                        {item.duration}
                                    </div>
                                </div>
                                <h3 className={`text-xl font-bold mb-1 ${item.type === 'TERM' ? 'text-blue-900 dark:text-blue-100' :
                                    item.type === 'EXAM' ? 'text-orange-700 dark:text-orange-300' : 'text-slate-800 dark:text-slate-200'}`}>
                                    {item.event}
                                </h3>
                                {item.type === 'EXAM' && (
                                    <span className="inline-block mb-3 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 text-[10px] font-black rounded uppercase tracking-widest">National Exam</span>
                                )}
                            </div>

                            <div className={`mt-6 pt-4 border-t flex flex-col gap-2 ${item.type === 'TERM' ? 'border-blue-100 dark:border-blue-800/30' :
                                item.type === 'EXAM' ? 'border-orange-100 dark:border-orange-800/30' :
                                    'border-slate-100 dark:border-slate-800'}`}>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-500 font-medium">Opens</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-300">{item.opening}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 dark:text-slate-500 font-medium">Closes</span>
                                    <span className="font-bold text-slate-800 dark:text-slate-300">{item.closing}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}} />
        </section>
    );
};
