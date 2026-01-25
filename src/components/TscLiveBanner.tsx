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
        <a
            href={LIVE_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-800 text-white rounded-full p-1 pr-5 inline-flex items-center gap-3 shadow-lg hover:shadow-red-500/20 hover:scale-105 transition-all duration-300 w-auto max-w-full"
        >
            {/* Pulsing glow if live */}
            {timeLeft === "LIVE NOW" && (
                <div className="absolute inset-0 bg-red-500 animate-pulse opacity-20"></div>
            )}

            <div className="bg-white text-red-700 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm relative z-10">
                <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>

            <div className="flex flex-col relative z-10">
                <span className="text-[10px] font-bold opacity-90 uppercase tracking-wider flex items-center gap-1.5 text-red-100">
                    {timeLeft === "LIVE NOW" ? (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-100 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            LIVE ON AIR
                        </>
                    ) : (
                        <>
                            <Calendar className="w-3 h-3" />
                            STARTING SOON
                        </>
                    )}
                </span>
                <span className="text-sm font-bold leading-none text-white whitespace-nowrap">TSC Online Lessons</span>
            </div>

            <ExternalLink className="w-4 h-4 text-red-200 opacity-50 group-hover:opacity-100 ml-auto" />
        </a>
    );
};
