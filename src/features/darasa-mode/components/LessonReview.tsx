import React, { useState } from 'react';
import { ArrowLeft, Save, Share2, FileText, HelpCircle, Check, Edit2, Eye } from 'lucide-react';
import { LessonResult } from '../../../types';

interface LessonReviewProps {
    lesson: LessonResult;
    onBack: () => void;
    onSave: (updatedLesson: LessonResult) => void;
    onDownload: (lesson: LessonResult) => void;
    onPreview: () => void;
}

export const LessonReview: React.FC<LessonReviewProps> = ({ lesson, onBack, onSave, onDownload, onPreview }) => {
    const [activeTab, setActiveTab] = useState<'NOTES' | 'QUIZ'>('NOTES');
    const [editedLesson, setEditedLesson] = useState<LessonResult>(lesson);

    const handleNoteChange = (index: number, field: 'title' | 'content', value: string) => {
        const newNotes = [...editedLesson.simplifiedNotes];
        newNotes[index] = { ...newNotes[index], [field]: value };
        setEditedLesson({ ...editedLesson, simplifiedNotes: newNotes });
    };

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white z-10 border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
                <button onClick={onBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="font-bold text-slate-800 text-lg">Review Lesson</h2>

                <div className="flex gap-3">
                    <button
                        onClick={() => onDownload(editedLesson)}
                        className="px-4 py-2 bg-white text-slate-600 font-medium rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                        Download Notes
                    </button>
                    <button
                        onClick={onPreview}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 font-medium rounded-lg hover:bg-indigo-200 transition-colors"
                    >
                        Preview Student View
                    </button>
                    <button
                        onClick={() => onSave(lesson)}
                        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Save & Close
                    </button>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-4 py-6">
                {/* Topic Input */}
                <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Topic</label>
                    <input
                        value={editedLesson.topic}
                        onChange={(e) => setEditedLesson({ ...editedLesson, topic: e.target.value })}
                        className="w-full text-2xl font-bold text-slate-900 border-none focus:ring-0 p-0 placeholder-slate-300"
                        placeholder="Lesson Topic..."
                    />
                    <div className="text-sm text-slate-500 mt-1">{new Date(editedLesson.date).toLocaleDateString()}</div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-lg mb-6 max-w-sm">
                    <button
                        onClick={() => setActiveTab('NOTES')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'NOTES' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <FileText className="w-4 h-4" /> Notes
                    </button>
                    <button
                        onClick={() => setActiveTab('QUIZ')}
                        className={`flex-1 py-2 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'QUIZ' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <HelpCircle className="w-4 h-4" /> Quiz ({editedLesson.quiz.length})
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {activeTab === 'NOTES' ? (
                        <>
                            {/* Summary Card */}
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-500 rounded-full" /> Summary</h4>
                                <textarea
                                    value={editedLesson.summary}
                                    onChange={(e) => setEditedLesson({ ...editedLesson, summary: e.target.value })}
                                    className="w-full bg-transparent border-none text-indigo-800 leading-relaxed resize-none focus:ring-0 text-sm"
                                    rows={3}
                                />
                            </div>

                            {/* Simple Notes */}
                            {editedLesson.simplifiedNotes.map((note, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors group">
                                    <div className="flex items-center justify-between mb-2">
                                        <input
                                            value={note.title}
                                            onChange={(e) => handleNoteChange(idx, 'title', e.target.value)}
                                            className="font-bold text-lg text-slate-800 border-none focus:ring-0 p-0 w-full"
                                        />
                                        <Edit2 className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                    <textarea
                                        value={note.content}
                                        onChange={(e) => handleNoteChange(idx, 'content', e.target.value)}
                                        className="w-full text-slate-600 leading-relaxed border-none focus:ring-0 p-0 resize-none"
                                        rows={note.content.split('\n').length + 2}
                                    />
                                </div>
                            ))}

                            <button className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold hover:border-slate-400 hover:text-slate-600 transition-all">
                                + Add Note Section
                            </button>
                        </>
                    ) : (
                        <>
                            {editedLesson.quiz.map((q, idx) => (
                                <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <span className="bg-slate-100 text-slate-500 font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div className="flex-1 space-y-4">
                                            <input
                                                value={q.question}
                                                className="w-full font-bold text-lg text-slate-900 border-b border-yellow-200 focus:border-yellow-400 focus:ring-0 px-0 py-1"
                                            />

                                            <div className="grid grid-cols-1 gap-2">
                                                {q.options.map((opt, optIdx) => (
                                                    <div key={optIdx} className={`flex items-center px-3 py-2 rounded-lg border ${optIdx === Number(q.correctAnswer) ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${optIdx === Number(q.correctAnswer) ? 'border-green-500 bg-green-500' : 'border-slate-300'}`}>
                                                            {optIdx === Number(q.correctAnswer) && <Check className="w-3 h-3 text-white" />}
                                                        </div>
                                                        <input
                                                            value={opt}
                                                            className="flex-1 bg-transparent border-none text-sm focus:ring-0 p-0"
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="bg-yellow-50 p-3 rounded-lg text-sm text-yellow-800 border border-yellow-100 italic">
                                                💡 {q.explanation}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
