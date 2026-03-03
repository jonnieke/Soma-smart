import React from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    ChevronRight,
    Download,
    Search,
    Filter,
    ArrowUpRight,
    Target
} from 'lucide-react';
import { Button } from '../../components/Shared';

interface GradebookViewProps {
    students: any[];
    onViewDetail: (studentId: string) => void;
}

export const GradebookView: React.FC<GradebookViewProps> = ({ students, onViewDetail }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [gradeFilter, setGradeFilter] = React.useState('All');

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesGrade = gradeFilter === 'All' || s.grade === gradeFilter;
        return matchesSearch && matchesGrade;
    });

    // Mock performance data generation for the "WOW" effect
    const getPerformance = (id: string) => {
        // In a real app, this would come from a 'grades' or 'mastery' table
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const avg = 65 + (hash % 30);
        const trend = (hash % 10) - 3;
        const projected = avg + trend + 2;

        return {
            avg: avg,
            trend: trend,
            projected: Math.min(100, projected),
            grade: projected > 80 ? 'A' : projected > 70 ? 'B' : projected > 60 ? 'C' : 'D'
        };
    };

    return (
        <div className="space-y-8">
            {/* Action Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white/50 backdrop-blur-sm p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search student by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium text-slate-700"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <select
                        value={gradeFilter}
                        onChange={(e) => setGradeFilter(e.target.value)}
                        className="px-6 py-4 rounded-2xl border border-slate-200 outline-none bg-white font-black text-[10px] uppercase tracking-widest text-slate-600 focus:border-blue-500 transition-all cursor-pointer"
                    >
                        <option value="All">All Grades</option>
                        <option value="Grade 4">Grade 4</option>
                        <option value="Grade 5">Grade 5</option>
                        <option value="Grade 6">Grade 6</option>
                        <option value="Form 1">Form 1</option>
                        <option value="Form 2">Form 2</option>
                        <option value="Form 3">Form 3</option>
                        <option value="Form 4">Form 4</option>
                    </select>
                    <Button variant="outline" className="flex items-center gap-2 px-8">
                        <Download className="w-4 h-4" /> Export
                    </Button>
                </div>
            </div>

            {/* Performance Legend / High Level Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-200 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">School Mean Score</p>
                        <div className="text-4xl font-black">74.2%</div>
                        <p className="text-[10px] font-bold mt-2 flex items-center gap-1">
                            <ArrowUpRight className="w-3 h-3" /> +2.4% this term
                        </p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-xl shadow-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">KCSE Prediction</p>
                        <div className="text-4xl font-black text-blue-400">B+ (9.4)</div>
                        <p className="text-[10px] font-bold mt-2 text-blue-300">Targeting A- for top 10%</p>
                    </div>
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-blue-500/20">
                        <Target className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                <div className="bg-emerald-600 rounded-[2rem] p-8 text-white shadow-xl shadow-emerald-200 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Syllabus Completion</p>
                        <div className="text-4xl font-black">88.5%</div>
                        <p className="text-[10px] font-bold mt-2">Ahead of schedule by 2 weeks</p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20">
                        <Filter className="w-8 h-8" />
                    </div>
                </div>
            </div>

            {/* Gradebook Table */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xl font-black text-slate-800">Learner Performance Index</h3>
                    <div className="flex gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500" title="High Performing" />
                        <span className="w-3 h-3 rounded-full bg-blue-500" title="On Track" />
                        <span className="w-3 h-3 rounded-full bg-amber-500" title="Needs Attention" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-50 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">
                                <th className="px-8 py-6">Student</th>
                                <th className="px-8 py-6">Grade</th>
                                <th className="px-8 py-6 text-center">Avg Score</th>
                                <th className="px-8 py-6 text-center">Trend</th>
                                <th className="px-8 py-6 text-center">KCSE Prediction</th>
                                <th className="px-8 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredStudents.length > 0 ? filteredStudents.map(student => {
                                const perf = getPerformance(student.id);
                                return (
                                    <tr key={student.id} className="group hover:bg-blue-50/30 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-blue-100 transition-transform group-hover:scale-110 group-hover:rotate-3 ${perf.avg > 80 ? 'bg-gradient-to-br from-emerald-400 to-emerald-600' :
                                                        perf.avg > 70 ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                                                            'bg-gradient-to-br from-indigo-400 to-indigo-600'
                                                    }`}>
                                                    {student.full_name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-lg leading-tight">{student.full_name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID: {student.student_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-[11px] font-black rounded-xl border border-slate-200 uppercase">
                                                {student.grade}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-black text-slate-700">{perf.avg}%</span>
                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${perf.avg > 80 ? 'bg-emerald-500' : perf.avg > 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                                                        style={{ width: `${perf.avg}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={`inline-flex items-center gap-1 font-black px-3 py-1 rounded-full text-[10px] ${perf.trend >= 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                                                }`}>
                                                {perf.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                                                {perf.trend > 0 ? `+${perf.trend}` : perf.trend}%
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="inline-flex flex-col">
                                                <span className={`text-lg font-black ${perf.projected > 80 ? 'text-emerald-600' :
                                                        perf.projected > 70 ? 'text-blue-600' : 'text-slate-600'
                                                    }`}>
                                                    {perf.grade}
                                                </span>
                                                <span className="text-[9px] font-black text-slate-400 tracking-tighter uppercase whitespace-nowrap">
                                                    Projected: {perf.projected}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <motion.button
                                                whileHover={{ x: 5 }}
                                                onClick={() => onViewDetail(student.id)}
                                                className="p-4 text-slate-300 hover:text-blue-600 hover:bg-white rounded-2xl transition-all shadow-sm group-hover:shadow-md"
                                            >
                                                <ChevronRight className="w-6 h-6" />
                                            </motion.button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-32 text-center text-slate-400 font-bold italic">
                                        No students found matching your criteria...
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
