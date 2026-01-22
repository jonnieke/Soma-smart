import React, { useState, useEffect } from 'react';
import { Play, Calendar, ExternalLink, Video } from 'lucide-react';
import { Button } from './Shared';

export const TscLiveBanner: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState("");

    // TSC Live details from the document
    const LIVE_LINK = "https://bit.ly/onlinelivestreaming";
    const START_DATE = new Date("2026-01-12T08:00:00");

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date();
            const diff = START_DATE.getTime() - now.getTime();

            if (diff > 0) {
                const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                setTimeLeft(`${days}d ${hours}h until launch`);
            } else {
                setTimeLeft("LIVE NOW");
            }
        };

        calculateTime();
        const timer = setInterval(calculateTime, 60000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-3xl p-6 mb-8 text-white shadow-xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red-500/50 border border-red-400/30 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-white rounded-full"></span> {timeLeft === "LIVE NOW" ? "LIVE ON AIR" : "UPCOMING EVENT"}
                        </span>
                        <span className="text-red-100 text-xs font-medium">Teachers Service Commission</span>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Free Online Livestreaming Lesson Program</h2>
                    <p className="text-red-100 text-sm mb-4 max-w-lg">
                        Join expert teachers from across the county for high-quality Term I lessons. Don't miss out on this opportunity!
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-red-100">
                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Start: 12th Jan, 2026</span>
                        <span className="flex items-center gap-1"><Video className="w-4 h-4" /> 8 Weeks Duration</span>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    <a href={LIVE_LINK} target="_blank" rel="noopener noreferrer">
                        <button className="bg-white text-red-700 hover:bg-gray-100 font-bold py-3 px-6 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                            <Play className="w-5 h-5 fill-current" />
                            Join Live Class
                        </button>
                    </a>
                    <p className="text-center text-xs text-red-200 mt-2">Via Microsoft Teams / Zoom</p>
                </div>
            </div>
        </div>
    );
};
