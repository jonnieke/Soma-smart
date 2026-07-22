import React from 'react';
import { Send, Sparkles, ExternalLink, ShieldCheck, Flame } from 'lucide-react';
import { TelegramService, TELEGRAM_CHANNEL_URL } from '../services/telegramService';

interface TelegramBannerProps {
    variant?: 'COMPACT' | 'FULL';
    title?: string;
    description?: string;
}

export const TelegramBanner: React.FC<TelegramBannerProps> = ({
    variant = 'FULL',
    title = 'Join 20,000+ Candidates on Telegram',
    description = 'Get daily KCSE & KPSEA revision quizzes, past paper alerts, and AI study tips directly in your Telegram app.'
}) => {
    const isTWA = TelegramService.isTelegramWebApp();

    const handleJoin = () => {
        TelegramService.haptic('medium');
        TelegramService.joinChannel();
    };

    if (variant === 'COMPACT') {
        return (
            <div className="rounded-2xl bg-gradient-to-r from-sky-900/90 via-slate-900 to-indigo-950 p-4 border border-sky-500/30 flex items-center justify-between gap-3 text-white">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0 border border-sky-400/30">
                        <Send className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                        <h4 className="text-xs font-black text-white truncate">{title}</h4>
                        <p className="text-[11px] text-sky-200 truncate font-medium">Daily revision drills on Telegram</p>
                    </div>
                </div>

                <button
                    onClick={handleJoin}
                    className="shrink-0 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                >
                    <span>Join Channel</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="rounded-3xl bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-sky-500/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0 border border-sky-400/30 mt-1 sm:mt-0">
                        <Send className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5 max-w-xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 text-[10px] font-black uppercase tracking-wider">
                            <Flame className="w-3 h-3 text-amber-400 fill-amber-400" /> Official Telegram Revision
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-white leading-snug">
                            {title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="shrink-0 flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto">
                    <button
                        onClick={handleJoin}
                        className="w-full sm:w-auto bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-sky-950/40 inline-flex items-center justify-center gap-2"
                    >
                        <Send className="w-4 h-4" />
                        <span>Join Telegram Channel</span>
                    </button>

                    <button
                        onClick={() => {
                            TelegramService.haptic('medium');
                            TelegramService.openBot('revision');
                        }}
                        className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-3.5 rounded-2xl border border-slate-700 transition-all inline-flex items-center justify-center gap-1.5"
                    >
                        <Sparkles className="w-4 h-4 text-sky-400" />
                        <span>Launch Telegram Bot</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TelegramBanner;
