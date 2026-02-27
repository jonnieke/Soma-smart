import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
    const { theme, toggleTheme } = useApp();

    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTheme}
            className={`relative p-2 rounded-xl transition-all duration-300 overflow-hidden 
                ${theme === 'dark'
                    ? 'bg-slate-800 text-amber-400 hover:bg-slate-700 ring-1 ring-slate-700'
                    : 'bg-white text-indigo-600 hover:bg-slate-50 ring-1 ring-slate-200 shadow-sm'} 
                ${className}`}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <AnimatePresence mode="wait" initial={false}>
                {theme === 'dark' ? (
                    <motion.div
                        key="moon"
                        initial={{ y: 20, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 45 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Moon size={18} fill="currentColor" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="sun"
                        initial={{ y: 20, opacity: 0, rotate: -45 }}
                        animate={{ y: 0, opacity: 1, rotate: 0 }}
                        exit={{ y: -20, opacity: 0, rotate: 45 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Sun size={18} fill="currentColor" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Subtle glow effect in dark mode */}
            {theme === 'dark' && (
                <div className="absolute inset-0 bg-amber-400/5 blur-xl pointer-events-none" />
            )}
        </motion.button>
    );
};
