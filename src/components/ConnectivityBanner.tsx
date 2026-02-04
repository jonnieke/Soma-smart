import React from 'react';
import { WifiOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const ConnectivityBanner: React.FC = () => {
    const isOnline = useOnlineStatus();

    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-md"
                >
                    <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 backdrop-blur-md bg-opacity-90">
                        <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center shrink-0">
                            <WifiOff className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold">You're Offline</p>
                            <p className="text-[10px] text-slate-400 font-medium">Browsing saved lessons. AI features require internet.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />
                            <span className="text-[8px] font-bold text-amber-500 mt-1 uppercase">Saved Mode</span>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
