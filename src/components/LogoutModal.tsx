import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Heart, Sparkles, X } from 'lucide-react';
import { Button } from './Shared';

interface LogoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message?: string;
    cancelText?: string;
    confirmText?: string;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Wait, don't go yet! 🥺",
    message = "You're doing so well! If you stay, you can keep earning XP, level up, and use the Magic Scanner for your homework. Are you sure you want to log out?",
    cancelText = "Stay & Keep Learning! 🚀",
    confirmText = "Logout anyway"
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-indigo-100 dark:border-slate-700 overflow-hidden"
                    >
                        {/* Top Accent Bar */}
                        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-300 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-8 pb-10 text-center">
                            {/* Icon Container */}
                            <div className="relative w-24 h-24 mx-auto mb-6">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        rotate: [0, 5, -5, 0]
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    className="w-full h-full bg-indigo-50 dark:bg-slate-800 rounded-full flex items-center justify-center shadow-inner"
                                >
                                    <LogOut className="w-10 h-10 text-indigo-600 ml-1" />
                                </motion.div>
                                <motion.div
                                    animate={{ y: [0, -10, 0], opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                    className="absolute -top-2 -right-2 text-pink-500"
                                >
                                    <Heart className="w-6 h-6 fill-current" />
                                </motion.div>
                                <motion.div
                                    animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
                                    className="absolute -bottom-1 -left-1 text-amber-500"
                                >
                                    <Sparkles className="w-6 h-6 fill-current" />
                                </motion.div>
                            </div>

                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
                                {title}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-8 px-2 font-medium">
                                {message}
                            </p>

                            <div className="flex flex-col gap-3">
                                <Button
                                    fullWidth
                                    onClick={onClose}
                                    className="py-4 bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 text-lg rounded-2xl"
                                >
                                    {cancelText}
                                </Button>
                                <button
                                    onClick={onConfirm}
                                    className="py-3 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    {confirmText}
                                </button>
                            </div>
                        </div>

                        {/* Bottom Decoration */}
                        <div className="bg-slate-50 dark:bg-slate-800/60 py-4 px-8 border-t border-slate-100 dark:border-slate-700 flex justify-center">
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                                Somo Smart • Your Learning Buddy
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
