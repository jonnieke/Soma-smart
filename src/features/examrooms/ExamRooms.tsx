import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    Users, Search, Plus, BookOpen, GraduationCap,
    School, Clock, Filter, ArrowRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ExamRoom, EducationLevel, ExamRoomType } from '../../types';
import { examRoomService } from '../../services/examRoomService';
import { DashboardLayout } from '../../components/DashboardLayout';
import { LoginModal } from '../../components/LoginModal';
import { RegistrationModal } from '../../components/RegistrationModal';
import { CreateExamRoomModal } from '../../components/CreateExamRoomModal';

export const ExamRooms: React.FC = () => {
    const navigate = useNavigate();
    const { educationLevel, studentProfile, theme } = useApp();

    const [showLogin, setShowLogin] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [showCreateRoom, setShowCreateRoom] = useState(false);

    const [rooms, setRooms] = useState<ExamRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<ExamRoomType | 'ALL'>('ALL');

    useEffect(() => {
        loadRooms();
    }, [educationLevel]);

    const loadRooms = async () => {
        setLoading(true);
        const levelToFetch = educationLevel || EducationLevel.SENIOR;
        const fetchedRooms = await examRoomService.fetchRooms(levelToFetch);

        if (fetchedRooms.length === 0) {
            setRooms([
                {
                    id: 'mock-1',
                    name: 'KCSE Mathematics Revision 2024',
                    description: 'Daily past paper review and Q&A sessions.',
                    room_type: 'EXAM_PREP',
                    education_level: EducationLevel.SENIOR,
                    subject: 'Mathematics',
                    created_by: 'system',
                    created_at: new Date().toISOString(),
                    is_active: true,
                    member_count: 142,
                    tags: ['KCSE', 'Math', 'Past Papers']
                },
                {
                    id: 'mock-2',
                    name: 'Biology Paper 3 Practicals',
                    description: 'Mastering biology practicals with AI explanations.',
                    room_type: 'SUBJECT_STUDY',
                    education_level: EducationLevel.SENIOR,
                    subject: 'Biology',
                    created_by: 'system',
                    created_at: new Date().toISOString(),
                    is_active: true,
                    member_count: 85,
                    tags: ['Biology', 'Practicals']
                }
            ]);
        } else {
            setRooms(fetchedRooms);
        }
        setLoading(false);
    };

    const handleJoinRoom = async (roomId: string) => {
        if (!studentProfile) {
            setShowLogin(true);
            return;
        }

        navigate(`/exam-rooms/${roomId}`);
    };

    const handleCreateRoomClick = () => {
        if (!studentProfile) {
            setShowLogin(true);
            return;
        }
        setShowCreateRoom(true);
    };

    const filteredRooms = rooms.filter(room => {
        const matchesSearch = room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            room.subject?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = activeFilter === 'ALL' || room.room_type === activeFilter;
        return matchesSearch && matchesType;
    });

    return (
        <DashboardLayout activeTab="EXAM_ROOMS" onTabChange={(tab) => {
            if (tab !== 'EXAM_ROOMS') {
                navigate('/learner', { state: { targetTab: tab } });
            }
        }}>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                            <Users className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                            Exam Rooms
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
                            Collaborative AI-powered study sessions. Ask questions, share notes, and solve problems together with peers and Somo AI.
                        </p>
                    </div>
                    <button
                        onClick={handleCreateRoomClick}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        Create Room
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by room name or subject..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-blue-500 dark:focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all dark:text-white"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {(['ALL', 'EXAM_PREP', 'SUBJECT_STUDY'] as const).map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-3 rounded-2xl text-sm font-bold tracking-wide flex items-center gap-2 transition-all ${activeFilter === filter
                                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50 shadow-sm'
                                    : 'bg-white text-slate-600 border-2 border-slate-100 hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:border-slate-700'
                                    }`}
                            >
                                {filter === 'ALL' && <Filter className="w-4 h-4" />}
                                {filter === 'EXAM_PREP' && <Clock className="w-4 h-4" />}
                                {filter === 'SUBJECT_STUDY' && <BookOpen className="w-4 h-4" />}
                                {filter.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rooms Grid */}
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-800 dark:border-t-blue-500"></div>
                    </div>
                ) : filteredRooms.length === 0 ? (
                    <div className="text-center py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                        <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">No rooms found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search or create a new room.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRooms.map((room) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={room.id}
                                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 hover:-translate-y-1 flex flex-col"
                            >
                                {/* Room Card Header / Banner Area */}
                                <div className="h-24 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
                                        {room.room_type === 'EXAM_PREP' ? (
                                            <Clock className="w-32 h-32" />
                                        ) : (
                                            <BookOpen className="w-32 h-32" />
                                        )}
                                    </div>
                                    <div className="relative flex justify-between items-start">
                                        <span className="px-3 py-1 bg-white/60 dark:bg-slate-950/60 backdrop-blur rounded-full text-xs font-bold tracking-wider text-slate-700 dark:text-slate-300 shadow-sm border border-white/20 dark:border-slate-800/50">
                                            {room.subject || room.room_type.replace('_', ' ')}
                                        </span>
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 dark:bg-slate-950/60 backdrop-blur rounded-full text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm border border-white/20 dark:border-slate-800/50">
                                            <Users className="w-3.5 h-3.5" />
                                            {room.member_count}
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {room.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 flex-1">
                                        {room.description || "Join this room to study collaboratively with peers and the Somo AI assistant."}
                                    </p>

                                    {/* Tags */}
                                    {room.tags && room.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {room.tags.map(tag => (
                                                <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded-md">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleJoinRoom(room.id)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-700 hover:text-blue-700 dark:text-slate-300 dark:hover:text-blue-400 rounded-xl font-bold transition-colors group/btn"
                                    >
                                        Join Room
                                        <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                <LoginModal
                    isOpen={showLogin}
                    onClose={() => setShowLogin(false)}
                    onSuccess={() => setShowLogin(false)}
                    onSwitchToRegister={() => {
                        setShowLogin(false);
                        setShowRegister(true);
                    }}
                />

                <RegistrationModal
                    isOpen={showRegister}
                    onClose={() => setShowRegister(false)}
                    onSuccess={() => setShowRegister(false)}
                    onSwitchToLogin={() => {
                        setShowRegister(false);
                        setShowLogin(true);
                    }}
                    initialRole="STUDENT"
                />

                <CreateExamRoomModal
                    isOpen={showCreateRoom}
                    onClose={() => setShowCreateRoom(false)}
                    onSuccess={(roomId) => {
                        setShowCreateRoom(false);
                        loadRooms();
                        navigate(`/exam-rooms/${roomId}`);
                    }}
                />
            </div>
        </DashboardLayout>
    );
};
