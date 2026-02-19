
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle } from 'lucide-react';

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
    return (
        <section className="py-20 bg-slate-50 relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <span className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4 inline-block">
                        Academic Year
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">
                        2026 School Calendar
                    </h2>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        Key dates for terms, exams, and holidays as released by the Ministry of Education.
                    </p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Event</th>
                                    <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Opening</th>
                                    <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest">Closing</th>
                                    <th className="p-6 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {calendarData.map((item, idx) => (
                                    <motion.tr
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${item.type === 'TERM' ? 'bg-blue-50/30' : ''
                                            }`}
                                    >
                                        <td className="p-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${item.type === 'TERM' ? 'bg-blue-500' :
                                                        item.type === 'EXAM' ? 'bg-orange-500' :
                                                            item.type === 'HOLIDAY' ? 'bg-slate-300' :
                                                                'bg-emerald-400'
                                                    }`} />
                                                <span className={`font-bold ${item.type === 'TERM' ? 'text-blue-900' :
                                                        item.type === 'EXAM' ? 'text-orange-700' : 'text-slate-700'
                                                    }`}>
                                                    {item.event}
                                                </span>
                                                {item.type === 'EXAM' && (
                                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded uppercase">Exam</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-6 text-slate-600 font-medium whitespace-nowrap">
                                            {item.opening}
                                        </td>
                                        <td className="p-6 text-slate-600 font-medium whitespace-nowrap">
                                            {item.closing}
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                                                <Clock className="w-3 h-3" />
                                                {item.duration}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-8 flex items-start gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <AlertCircle className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-800 leading-relaxed">
                        <strong>Note:</strong> Dates are subject to change by the Ministry of Education. The December Holiday for non-candidate classes begins on <strong>26th Oct 2026</strong> while national exams are in progress.
                    </p>
                </div>
            </div>
        </section>
    );
};
