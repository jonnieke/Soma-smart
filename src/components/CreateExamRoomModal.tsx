import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, BookOpen, Clock, AlertTriangle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EducationLevel, ExamRoomType } from '../types';
import { examRoomService } from '../services/examRoomService';
import { Button } from './Shared';

interface CreateExamRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newRoomId: string) => void;
}

export const CreateExamRoomModal: React.FC<CreateExamRoomModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { studentProfile, educationLevel } = useApp();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [roomType, setRoomType] = useState<ExamRoomType>('EXAM_PREP');
    const [level, setLevel] = useState<EducationLevel>(educationLevel || EducationLevel.SENIOR);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentProfile) return;

        setLoading(true);
        setError(null);

        try {
            const newRoom = await examRoomService.createRoom({
                name,
                description,
                room_type: roomType,
                education_level: level,
                subject: subject || undefined,
                created_by: studentProfile.id,
                tags: subject ? [subject] : []
            });

            if (newRoom) {
                onSuccess(newRoom.id);
            } else {
                setError('Failed to create the room. Please try again.');
            }
        } catch (err: any) {
            console.error('Error creating room:', err);
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                >
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <Users className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create New Room</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm">
                                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Room Name *
                                </label>
                                <input
                                    required
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. KCSE Biology Revision 2024"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Description (Optional)
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="What will you study in this room?"
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Type *
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setRoomType('EXAM_PREP')}
                                            className={`py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all ${roomType === 'EXAM_PREP'
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                                }`}
                                        >
                                            <Clock className="w-4 h-4" /> Prep
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setRoomType('SUBJECT_STUDY')}
                                            className={`py-2 px-3 rounded-lg border-2 flex items-center justify-center gap-2 text-sm font-bold transition-all ${roomType === 'SUBJECT_STUDY'
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                                }`}
                                        >
                                            <BookOpen className="w-4 h-4" /> Study
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Level
                                    </label>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value as EducationLevel)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                                    >
                                        <option value={EducationLevel.JUNIOR}>Junior (PP1 - Gr 6)</option>
                                        <option value={EducationLevel.SENIOR}>Senior (Gr 7 - 12)</option>
                                        <option value={EducationLevel.CAMPUS}>Campus / College</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Subject (Optional)
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Mathematics"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                disabled={!name || loading}
                            >
                                {loading ? 'Creating...' : 'Create Room'}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
