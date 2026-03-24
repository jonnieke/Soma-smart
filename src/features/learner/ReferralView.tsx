import React, { useState } from 'react';
import { Gift, Share2, Copy, CheckCircle, ChevronRight, Award, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const ReferralView: React.FC = () => {
    const [copied, setCopied] = useState(false);
    
    // In a real app, this would be fetched from the user's profile
    const referralCode = "SOMO-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const referralLink = `https://somaai.co.ke/join?ref=${referralCode}`;
    const shareText = `Use my code ${referralCode} to get 1 FREE week of Somo Smart Pro! 🚀 It's the best AI study app for KCSE & KPSEA.`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsAppShare = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + referralLink)}`;
        window.open(url, '_blank');
    };

    const handleTwitterShare = () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-8"
            >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="flex-1 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-xs mb-6 uppercase tracking-wider border border-white/20 shadow-sm">
                            <Award className="w-4 h-4 text-amber-300 fill-current" />
                            Somo Rewards Program
                        </div>
                        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight">
                            Give 1 Week Pro,<br/>Get 1 Week Pro. 🎁
                        </h2>
                        <p className="text-orange-100 text-lg font-medium max-w-lg mb-8">
                            Invite your friends to Somo Smart. When they sign up using your link, you both instantly unlock 7 days of unlimited AI Smart Marking, Audio Lessons, and Premium Downloads!
                        </p>

                        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center justify-between gap-4 max-w-md mx-auto md:mx-0">
                            <div className="flex-1 overflow-hidden">
                                <p className="text-[10px] text-orange-200 uppercase font-bold tracking-wider mb-1">Your Unique Invite Link</p>
                                <p className="font-mono text-sm md:text-base font-bold truncate select-all">{referralLink}</p>
                            </div>
                            <button 
                                onClick={handleCopy}
                                className="flex-shrink-0 w-12 h-12 bg-white text-orange-600 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-colors shadow-lg"
                            >
                                {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 mb-8 px-4 md:px-0">
                {/* Sharing Options */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm"
                >
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                        <Share2 className="w-6 h-6 text-indigo-500" /> Share the wealth
                    </h3>
                    <div className="space-y-4">
                        <button 
                            onClick={handleWhatsAppShare}
                            className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-transform hover:-translate-y-0.5"
                        >
                            Share on WhatsApp <ArrowRight className="w-4 h-4 ml-2" />
                        </button>
                        <button 
                            onClick={handleTwitterShare}
                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            Post to X (Twitter)
                        </button>
                    </div>
                </motion.div>

                {/* Tracking Progress */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                            <Users className="w-6 h-6 text-emerald-500" /> Your Invites
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Track your successful referrals and claimed rewards.</p>
                        
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-5xl font-black text-slate-900 dark:text-white leading-none">0</span>
                            <span className="text-lg font-bold text-slate-400 mb-1">Friends joined</span>
                        </div>
                        
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[5%] rounded-full"></div>
                        </div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 text-right">0 / 5 to VIP Status</p>
                    </div>
                    
                    <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                            <Gift className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No rewards yet</p>
                            <p className="text-xs text-slate-500">Share your link to earn your first week.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
