import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const TscLiveBanner: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [endDate, setEndDate] = useState<number | null>(null);

    useEffect(() => {
        const fetchPromoDate = async () => {
            try {
                // Fetch from Supabase
                const { data, error } = await supabase
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'promo_end_date')
                    .single();

                if (data && data.value) {
                    setEndDate(new Date(data.value).getTime());
                } else {
                    console.log("Promo date not found in DB, checking local storage or default");
                    // Fallback to local storage if DB fails or empty to avoid jarring UI
                    const STORAGE_KEY = 'soma_promo_end_date_v1';
                    const stored = localStorage.getItem(STORAGE_KEY);
                    if (stored) {
                        setEndDate(parseInt(stored, 10));
                    } else {
                        const now = new Date();
                        now.setDate(now.getDate() + 30);
                        setEndDate(now.getTime());
                    }
                }
            } catch (err) {
                console.error("Error fetching promo date:", err);
            }
        };

        fetchPromoDate();
    }, []);

    useEffect(() => {
        if (!endDate) return;

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = endDate - now;

            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            } else {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    if (!isVisible || !timeLeft) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white relative z-50 overflow-hidden shadow-xl"
                >
                    {/* Background Pattern */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                    <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                        {/* Left Side: Message */}
                        <div className="flex items-center gap-3 text-center sm:text-left">
                            <div className="bg-white/10 p-2 rounded-full hidden sm:block animate-pulse">
                                <Clock className="w-5 h-5 text-yellow-400" />
                            </div>
                            <p className="font-medium text-sm sm:text-base tracking-wide">
                                <span className="text-yellow-400 font-bold mr-2">LIMITED OFFER:</span>
                                Access and enjoy Soma Smart features for free!
                            </p>
                        </div>

                        {/* Right Side: Timer & Close */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2 font-mono text-lg font-bold bg-black/30 px-3 py-1.5 rounded-lg border border-white/10 shadow-inner">
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-yellow-400 text-xl">{String(timeLeft.days).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-indigo-200 uppercase">Days</span>
                                </div>
                                <span className="text-white/50 -mt-3">:</span>
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-white text-xl">{String(timeLeft.hours).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-indigo-200 uppercase">Hrs</span>
                                </div>
                                <span className="text-white/50 -mt-3">:</span>
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-white text-xl">{String(timeLeft.minutes).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-indigo-200 uppercase">Mins</span>
                                </div>
                                <span className="text-white/50 -mt-3">:</span>
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-white text-xl">{String(timeLeft.seconds).padStart(2, '0')}</span>
                                    <span className="text-[10px] text-indigo-200 uppercase">Secs</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsVisible(false)}
                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-indigo-200 hover:text-white"
                                aria-label="Close banner"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
