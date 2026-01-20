import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Upload, BookOpen, Brain, TrendingUp, ArrowRight } from 'lucide-react';
import { ViewState, RevisionMode } from '../../types';
import { motion } from 'framer-motion';

interface Props {
    onStartSession: (file: File, mode: RevisionMode) => void;
    onNavigate: (view: ViewState) => void;
}

export const RevisionLanding: React.FC<Props> = ({ onStartSession, onNavigate }) => {
    const [dragActive, setDragActive] = useState(false);
    const [selectedMode, setSelectedMode] = useState<RevisionMode>(RevisionMode.LEARN);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onStartSession(e.dataTransfer.files[0], selectedMode);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onStartSession(e.target.files[0], selectedMode);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-8 rounded-b-[3rem] shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50 -mr-16 -mt-16"></div>
                <div className="absolute top-20 left-10 w-24 h-24 bg-purple-100 rounded-full blur-2xl opacity-50"></div>

                <button onClick={() => onNavigate(ViewState.DASHBOARD)} className="mb-4 text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1 font-medium">
                    ← Back to Dashboard
                </button>

                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Revision Assistant</h1>
                <p className="text-slate-500 font-medium">Master your exams with step-by-step guidance.</p>
            </div>

            <div className="max-w-xl mx-auto px-6 mt-8 space-y-8">

                {/* Mode Selection */}
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setSelectedMode(RevisionMode.LEARN)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedMode === RevisionMode.LEARN ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-500 hover:border-indigo-200'}`}
                    >
                        <BookOpen className="w-6 h-6" />
                        <span className="text-xs font-bold">Learn Mode</span>
                    </button>

                    <button
                        onClick={() => setSelectedMode(RevisionMode.EXAM)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedMode === RevisionMode.EXAM ? 'border-orange-600 bg-orange-50 text-orange-700' : 'border-slate-100 bg-white text-slate-500 hover:border-orange-200'}`}
                    >
                        <Brain className="w-6 h-6" />
                        <span className="text-xs font-bold">Exam Mode</span>
                    </button>

                    <button
                        onClick={() => setSelectedMode(RevisionMode.WEAK_AREAS)}
                        className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedMode === RevisionMode.WEAK_AREAS ? 'border-rose-600 bg-rose-50 text-rose-700' : 'border-slate-100 bg-white text-slate-500 hover:border-rose-200'}`}
                    >
                        <TrendingUp className="w-6 h-6" />
                        <span className="text-xs font-bold">Weak Areas</span>
                    </button>
                </div>

                {/* Upload Area */}
                <div
                    className={`relative border-2 border-dashed rounded-3xl p-10 flex flex-col items-center text-center transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white'}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleChange}
                        accept="image/*"
                    />

                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 text-indigo-600">
                        <Upload className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Upload Exam Paper</h3>
                    <p className="text-slate-500 text-sm mb-6">Drag and drop or tap to browse.<br />Supports Images & Scans.</p>

                    <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors pointer-events-none">
                        Select File
                    </button>
                </div>

                {/* Info Card */}
                <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                        <Brain className="w-5 h-5" /> How it works
                    </h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> We analyze your exam paper instantly.</li>
                        <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> You choose a question to revise.</li>
                        <li className="flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" /> AI guides you step-by-step (CBC style).</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
