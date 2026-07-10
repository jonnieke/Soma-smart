import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, ExternalLink } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';

export const SubscriptionExpiredModal: React.FC = () => {
    const { isPro, subscriptionExpiry, role } = useApp();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Only run on the client side
        if (typeof window === 'undefined') return;

        // Check if subscription has expired
        if (!isPro && subscriptionExpiry) {
            const expiryDate = new Date(subscriptionExpiry);
            const now = new Date();

            if (expiryDate < now) {
                // Check if they've already seen it this session
                const hasSeen = sessionStorage.getItem('hasSeenExpiryWarning');
                if (!hasSeen) {
                    setIsOpen(true);
                    sessionStorage.setItem('hasSeenExpiryWarning', 'true');
                }
            }
        }
    }, [isPro, subscriptionExpiry]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                    >
                        {/* Header Image/Pattern */}
                        <div className="h-32 bg-gradient-to-br from-amber-500 to-orange-600 relative overflow-hidden flex items-center justify-center">
                            <div className="absolute inset-0 bg-white/10 backdrop-blur-md" />
                            <AlertCircle className="w-16 h-16 text-white relative z-10" />
                        </div>

                        <button 
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 text-center">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                                Subscription Expired
                            </h2>
                            <p className="text-slate-600 dark:text-slate-300 mb-6">
                                It looks like your Somo Smart Pro access has expired. Renew your subscription today to continue enjoying unlimited features, AI tutoring, and deep insights.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        navigate('/pricing');
                                    }}
                                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                                >
                                    View Plans & Renew <ExternalLink className="w-4 h-4" />
                                </button>
                                
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors"
                                >
                                    Continue with Free Features
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
