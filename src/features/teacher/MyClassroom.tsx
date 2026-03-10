import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingDown, TrendingUp, AlertCircle, Sparkles, User, Brain, Plus, Share2, ClipboardList, Send, FileText, CheckCircle, MessageCircle, UploadCloud } from 'lucide-react';
import { TeacherProfile } from '../../types';

interface StudentData {
    id: string;
    name: string;
    avatar: string;
    averageScore: number;
    trend: 'UP' | 'DOWN' | 'NEUTRAL';
    weakTopics: string[];
    strongTopics: string[];
    pendingAssignments: number;
    lastActive: string;
}

// Mock Data
const MOCK_STUDENTS: StudentData[] = [
    {
        id: '1', name: 'Almaz Njoroge', avatar: 'A', averageScore: 82, trend: 'UP',
        weakTopics: ['Fractions', 'Decimals'], strongTopics: ['Algebra', 'Geometry'], pendingAssignments: 1, lastActive: '2h ago'
    },
    {
        id: '2', name: 'Brian Ochieng', avatar: 'B', averageScore: 45, trend: 'DOWN',
        weakTopics: ['Algebra', 'Linear Equations'], strongTopics: ['Data Handling'], pendingAssignments: 3, lastActive: '1d ago'
    },
    {
        id: '3', name: 'Fatuma Hassan', avatar: 'F', averageScore: 91, trend: 'UP',
        weakTopics: ['Probability'], strongTopics: ['Everything'], pendingAssignments: 0, lastActive: '5m ago'
    },
    {
        id: '4', name: 'Kelvin Mutua', avatar: 'K', averageScore: 58, trend: 'NEUTRAL',
        weakTopics: ['Geometry', 'Area & Perimeter'], strongTopics: ['Fractions'], pendingAssignments: 2, lastActive: '4h ago'
    }
];

interface MyClassroomProps {
    teacherProfile: TeacherProfile | null;
    selectedClass: string;
    selectedSubject: string;
    onAssignQuiz: (studentIds: string[], topic: string) => void;
}

export const MyClassroom: React.FC<MyClassroomProps> = ({ teacherProfile, selectedClass, selectedSubject, onAssignQuiz }) => {
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);

    // Derived Analytics
    const classAverage = Math.round(MOCK_STUDENTS.reduce((acc, s) => acc + s.averageScore, 0) / MOCK_STUDENTS.length);
    const atRiskStudents = MOCK_STUDENTS.filter(s => s.averageScore < 50);

    const toggleStudent = (id: string) => {
        setSelectedStudents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const handleBulkAssign = () => {
        if (selectedStudents.length === 0) return;
        setIsAssigning(true);
        setTimeout(() => {
            onAssignQuiz(selectedStudents, "Targeted Remedial Revision");
            setIsAssigning(false);
            setSelectedStudents([]);
            alert("Custom revision materials have been sent directly to the selected students' portals!");
        }, 1500);
    };

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-indigo-500" />
                        {selectedClass}
                    </h2>
                    <p className="text-slate-500 font-medium mb-3">{selectedSubject} • {MOCK_STUDENTS.length} Students</p>
                    <div className="flex gap-2">
                        <button className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                            <MessageCircle className="w-4 h-4" /> Discussion Room
                        </button>
                        <button className="text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                            <UploadCloud className="w-4 h-4" /> Upload Material
                        </button>
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 items-center justify-center flex flex-col">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Class Average</span>
                        <span className="text-2xl font-black text-slate-800">{classAverage}%</span>
                    </div>
                    <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-100 items-center justify-center flex flex-col">
                        <span className="text-xs font-black text-red-400 uppercase tracking-widest">At Risk</span>
                        <span className="text-2xl font-black text-red-600 flex items-center gap-1">
                            <AlertCircle className="w-5 h-5" /> {atRiskStudents.length}
                        </span>
                    </div>
                </div>
            </div>

            {/* AI Insights Bar */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-[2rem] border border-indigo-100 flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="flex gap-4 items-start flex-1">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                            Soma AI Class Insight <Sparkles className="w-4 h-4 text-amber-500" />
                        </h3>
                        <p className="text-sm text-slate-700 leading-relaxed mt-1">
                            <strong>Algebra</strong> is the top struggle area this week, affecting {MOCK_STUDENTS.filter(s => s.weakTopics.includes('Algebra')).length} students.
                            Would you like me to generate a fun, low-stakes Algebra mini-game for them to practice over the weekend?
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => onAssignQuiz(MOCK_STUDENTS.map(s => s.id), 'Algebra Minigame')}
                    className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl shadow-indigo-600/20 transition-transform hover:scale-105"
                >
                    Auto-Assign Now
                </button>
            </div>

            {/* Actions & Filters */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-black text-slate-800">Student Roster</h3>
                <div className="flex gap-2">
                    <button
                        onClick={() => setSelectedStudents(MOCK_STUDENTS.length === selectedStudents.length ? [] : MOCK_STUDENTS.map(s => s.id))}
                        className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1"
                    >
                        {selectedStudents.length === MOCK_STUDENTS.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <AnimatePresence>
                        {selectedStudents.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                onClick={handleBulkAssign}
                                disabled={isAssigning}
                                className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-900 transition-colors"
                            >
                                {isAssigning ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                Assign Remedial ({selectedStudents.length})
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Roster Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_STUDENTS.map((student) => (
                    <motion.div
                        key={student.id}
                        whileHover={{ y: -2 }}
                        onClick={() => toggleStudent(student.id)}
                        className={`cursor-pointer bg-white p-5 rounded-2xl border transition-all ${selectedStudents.includes(student.id) ? 'border-2 border-indigo-500 shadow-md scale-[1.02]' : 'border-slate-100 hover:border-indigo-200'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-black ${student.averageScore < 50 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                                    {student.avatar}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-800">{student.name}</h4>
                                    <p className="text-xs text-slate-400 font-medium">Active {student.lastActive}</p>
                                </div>
                            </div>
                            <div className={`flex flex-col items-end`}>
                                <div className="flex items-center gap-1 font-black text-lg">
                                    {student.averageScore}%
                                    {student.trend === 'UP' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                                    {student.trend === 'DOWN' && <TrendingDown className="w-4 h-4 text-red-500" />}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Score</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-400 mt-0.5" />
                                <div className="text-sm">
                                    <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-0.5">Struggling With</span>
                                    {student.weakTopics.map((topic, i) => (
                                        <span key={i} className="inline-block bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-bold mr-1 mb-1">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                    <ClipboardList className="w-3.5 h-3.5" /> {student.pendingAssignments} pending assignments
                                </div>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedStudents.includes(student.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                                    {selectedStudents.includes(student.id) && <CheckCircle className="w-3 h-3 text-white" />}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};
