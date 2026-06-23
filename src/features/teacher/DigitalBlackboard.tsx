import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Maximize2,
    Minimize2,
    Type,
    Palette,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    MonitorPlay
} from 'lucide-react';
import { MarkdownText } from '../../components/Shared';

interface DigitalBlackboardProps {
    onClose: () => void;
    title: string;
    content: string;
    simplifiedContent?: string;
}

export const DigitalBlackboard: React.FC<DigitalBlackboardProps> = ({ onClose, title, content, simplifiedContent }) => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isChalkTheme, setIsChalkTheme] = useState(false);
    const [fontSize, setFontSize] = useState(24);
    const [activeSection, setActiveSection] = useState<'NOTES' | 'SIMPLIFIED'>(simplifiedContent ? 'SIMPLIFIED' : 'NOTES');
    const [isFullScreen, setIsFullScreen] = useState(false);
    const deepDive = typeof content === 'string' ? content.trim() : '';
    const summary = typeof simplifiedContent === 'string' ? simplifiedContent.trim() : '';
    const hasAnyContent = Boolean(deepDive || summary);
    const activeText = activeSection === 'SIMPLIFIED' ? (summary || deepDive) : (deepDive || summary);
    const fallbackText = `## No note content found\n\nThis blackboard item has no readable lesson text yet.\n\n- Open **Create Notes** to generate content.\n- Or open **Library** and select another note.`;

    // Fullscreen toggle helper
    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullScreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullScreen(false);
            }
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[200] flex flex-col transition-colors duration-500 ${isChalkTheme ? 'bg-slate-900 text-amber-200' :
                    isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'
                }`}
        >
            {/* Top Toolbar */}
            <div className={`p-6 border-b flex items-center justify-between shrink-0 ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                <div className="flex items-center gap-6">
                    <button
                        onClick={onClose}
                        className={`p-3 rounded-2xl transition-all ${isChalkTheme ? 'bg-white/5 hover:bg-white/10' : isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-black tracking-tight">{title}</h2>
                        <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>Teach Mode</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {simplifiedContent && (
                        <div className={`flex p-1 rounded-xl shrink-0 ${isChalkTheme || isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                            <button
                                onClick={() => setActiveSection('SIMPLIFIED')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeSection === 'SIMPLIFIED' ? (isChalkTheme ? 'bg-amber-200 text-slate-900' : isDarkMode ? 'bg-white text-slate-950' : 'bg-slate-900 text-white') : 'opacity-40'}`}
                            >
                                Summary
                            </button>
                            <button
                                onClick={() => setActiveSection('NOTES')}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeSection === 'NOTES' ? (isChalkTheme ? 'bg-amber-200 text-slate-900' : isDarkMode ? 'bg-white text-slate-950' : 'bg-slate-900 text-white') : 'opacity-40'}`}
                            >
                                Deep Dive
                            </button>
                        </div>
                    )}

                    <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-4">
                        <button
                            onClick={() => {
                                if (isChalkTheme) {
                                    setIsChalkTheme(false);
                                    setIsDarkMode(false);
                                } else if (isDarkMode) {
                                    setIsChalkTheme(true);
                                } else {
                                    setIsDarkMode(true);
                                }
                            }}
                            title="Cycle Theme (Light, Dark, Chalk)"
                            className={`p-3 rounded-xl transition-all ${isChalkTheme ? 'bg-amber-200/20 text-amber-200' : isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}
                        >
                            <Palette className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setFontSize(prev => prev >= 64 ? 16 : prev + 8)}
                            className={`p-3 rounded-xl transition-all ${isChalkTheme ? 'bg-white/5 text-amber-200' : isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}
                        >
                            <Type className="w-5 h-5" />
                        </button>
                        <button
                            onClick={toggleFullScreen}
                            className={`p-3 rounded-xl transition-all ${isChalkTheme ? 'bg-white/5 text-amber-200' : isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-slate-100 hover:bg-slate-200'}`}
                        >
                            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Blackboard Canvas */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-12 md:p-24 selection:bg-amber-500/30">
                <motion.div
                    key={activeSection}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ fontSize: `${fontSize}px` }}
                    className={`max-w-5xl mx-auto leading-relaxed font-medium prose-headings:font-black prose-headings:tracking-tighter prose-strong:font-black ${isChalkTheme ? 'prose-invert prose-stone marker:text-amber-500 text-amber-100/90' :
                            isDarkMode ? 'prose prose-invert prose-slate' : 'prose prose-slate'
                        }`}
                >
                    <MarkdownText content={hasAnyContent ? activeText : fallbackText} />
                </motion.div>
            </div>

            {/* Bottom Controls */}
            <div className={`p-6 sm:p-8 border-t flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 shrink-0 ${isChalkTheme ? 'border-white/5 bg-slate-900' : isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-center gap-8">
                    <button className="opacity-40 hover:opacity-100 transition-all"><ChevronLeft className="w-8 h-8" /></button>
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isChalkTheme ? 'bg-amber-200 text-slate-900 shadow-xl shadow-amber-200/10' : isDarkMode ? 'bg-white text-slate-950 shadow-xl shadow-white/10' : 'bg-slate-900 text-white shadow-xl shadow-slate-200'}`}>
                            <Play className="w-6 h-6 fill-current" />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest opacity-40">Slide 1 / 1</span>
                    </div>
                    <button className="opacity-40 hover:opacity-100 transition-all"><ChevronRight className="w-8 h-8" /></button>
                </div>
            </div>

            {/* Watermark */}
            <div className="absolute bottom-8 right-8 opacity-20 flex items-center gap-2 pointer-events-none">
                <MonitorPlay className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Somo Smart Teach Mode</span>
            </div>
        </motion.div>
    );
};

