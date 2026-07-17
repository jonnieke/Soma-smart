import React, { useState, useEffect } from 'react';
import { Gift, Share2, Copy, CheckCircle, Award, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export const ReferralView: React.FC = () => {
    const { studentCode, userId } = useApp();
    const [copied, setCopied] = useState(false);
    const [referralCount, setReferralCount] = useState(0);

    const codeBase = (studentCode || userId || '').slice(0, 6).toUpperCase();
    const referralCode = codeBase ? `SOMO-${codeBase}` : 'SOMO-FRIEND';
    const referralLink = `https://somaai.co.ke/?ref=${referralCode}`;
    const shareText = `Use my code ${referralCode} to join Somo Smart — the best AI study app for KCSE, KPSEA & CBC! 🚀 Sign up free:`;

    useEffect(() => {
        if (!referralCode || referralCode === 'SOMO-FRIEND') return;
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('referred_by', referralCode)
            .then(({ count }) => {
                if (count != null) setReferralCount(count);
            });
    }, [referralCode]);

    const handleCopy = () => {
        navigator.clipboard?.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleWhatsAppShare = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralLink}`)}`, '_blank');
    };

    const rewardTiers = [
        { friends: 1, reward: '3 extra smart answers', icon: '✨' },
        { friends: 3, reward: '1 week Pro free', icon: '🎁' },
        { friends: 5, reward: 'VIP Status + 1 month Pro', icon: '👑' },
    ];

    const nextTier = rewardTiers.find(t => referralCount < t.friends) || rewardTiers[rewardTiers.length - 1];
    const progressPct = Math.min(100, Math.round((referralCount / nextTier.friends) * 100));

    return (
        <div className="max-w-4xl mx-auto py-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-orange-500 via-rose-500 to-purple-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-8"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />

                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-xs mb-6 uppercase tracking-wider border border-white/20">
                        <Award className="w-4 h-4 text-amber-300 fill-current" />
                        Somo Rewards Program
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight leading-tight">
                        Invite friends,<br />earn Pro free. 🎁
                    </h2>
                    <p className="text-orange-100 text-base md:text-lg font-medium max-w-lg mb-8">
                        Every friend who registers with your code earns you rewards — starting from 1 friend.
                    </p>

                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center justify-between gap-4 max-w-md">
                        <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] text-orange-200 uppercase font-bold tracking-wider mb-1">Your unique code</p>
                            <p className="font-mono text-base md:text-lg font-black truncate select-all">{referralCode}</p>
                        </div>
                        <button
                            onClick={handleCopy}
                            className="shrink-0 w-12 h-12 bg-white text-orange-600 rounded-xl flex items-center justify-center hover:bg-orange-50 transition-colors shadow-lg"
                        >
                            {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                    </div>
                </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 mb-8 px-4 md:px-0">
                {/* Share */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white border-2 border-slate-300 rounded-3xl p-8 shadow-sm"
                >
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Share2 className="w-6 h-6 text-indigo-500" /> Share your code
                    </h3>
                    <div className="space-y-4">
                        <button
                            onClick={handleWhatsAppShare}
                            className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-black py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all hover:-translate-y-0.5"
                        >
                            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            Share on WhatsApp <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleCopy}
                            className="w-full bg-slate-100 text-slate-900 hover:bg-slate-200 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                        >
                            {copied ? <><CheckCircle className="w-4 h-4 text-emerald-500" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy invite link</>}
                        </button>
                    </div>
                </motion.div>

                {/* Progress */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white border-2 border-slate-300 rounded-3xl p-8 shadow-sm flex flex-col justify-between"
                >
                    <div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Users className="w-6 h-6 text-emerald-500" /> Your progress
                        </h3>
                        <p className="text-slate-500 text-sm mb-6">
                            Friends who joined using your code.
                        </p>
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-5xl font-black text-slate-900 leading-none">{referralCount}</span>
                            <span className="text-lg font-bold text-slate-400 mb-1">friends joined</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-1">
                            <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                        </div>
                        <p className="text-xs font-bold text-emerald-600 text-right">
                            {referralCount} / {nextTier.friends} to unlock {nextTier.icon} {nextTier.reward}
                        </p>
                    </div>

                    <div className="mt-6 space-y-2">
                        {rewardTiers.map(tier => (
                            <div
                                key={tier.friends}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${referralCount >= tier.friends ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
                            >
                                <span className="text-xl">{referralCount >= tier.friends ? '✅' : tier.icon}</span>
                                <div className="flex-1">
                                    <p className="text-xs font-black text-slate-700">{tier.friends} friend{tier.friends > 1 ? 's' : ''} → {tier.reward}</p>
                                </div>
                                {referralCount >= tier.friends && (
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Earned</span>
                                )}
                            </div>
                        ))}
                        <p className="text-[10px] text-slate-400 font-bold text-center pt-2">
                            Rewards credited automatically within 24 hours of friend signup
                        </p>
                    </div>
                </motion.div>
            </div>

            {/* How it works */}
            <div className="px-4 md:px-0">
                <div className="bg-white border-2 border-slate-200 rounded-3xl p-6">
                    <h3 className="text-base font-black text-slate-700 uppercase tracking-widest mb-4">How it works</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { step: '1', text: 'Share your code on WhatsApp or copy the link' },
                            { step: '2', text: 'Friend signs up and enters your code' },
                            { step: '3', text: 'You both get rewarded automatically' },
                        ].map(item => (
                            <div key={item.step} className="text-center">
                                <div className="w-8 h-8 bg-indigo-600 rounded-full text-white font-black text-sm flex items-center justify-center mx-auto mb-2">{item.step}</div>
                                <p className="text-xs font-bold text-slate-500 leading-snug">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

