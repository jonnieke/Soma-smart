import React from 'react';
import { WifiOff, Home, RefreshCw } from 'lucide-react';

export const OfflinePage: React.FC = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 font-sans">
            <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                <div className="relative">
                    <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <WifiOff className="w-12 h-12 text-orange-500" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center border border-slate-50">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">You're Offline</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        It looks like your internet connection is taking a break. Don't worry, your progress is safe!
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex items-center justify-center gap-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg shadow-indigo-200 active:scale-[0.98]"
                    >
                        <RefreshCw className="w-5 h-5" />
                        Try Again
                    </button>

                    <a
                        href="/"
                        className="flex items-center justify-center gap-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 px-8 rounded-2xl transition-all active:scale-[0.98]"
                    >
                        <Home className="w-5 h-5" />
                        Back to Home
                    </a>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                        Tip: Open Somo Smart while online to save lessons for later
                    </p>
                </div>
            </div>
        </div>
    );
};
