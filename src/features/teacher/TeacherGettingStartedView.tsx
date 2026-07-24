import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Share2, Award, Sparkles, CheckCircle2, Copy, ArrowRight, Zap, Trophy, ShieldCheck } from 'lucide-react';
import { referralService } from '../../services/referralService';
import { ambassadorCreatorService } from '../../services/ambassadorCreatorService';

export const TeacherGettingStartedView: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [referralCode] = useState(referralService.generateReferralCode('usr_teacher_001'));
  const [referrals] = useState(referralService.getReferrals('usr_teacher_001'));
  const [ambassadors] = useState(ambassadorCreatorService.getAmbassadors());
  const [briefs] = useState(ambassadorCreatorService.getCreatorBriefs());

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="px-3 py-1 bg-amber-400/20 text-amber-300 font-extrabold text-xs rounded-full uppercase border border-amber-400/30">
            Teacher Growth Hub &amp; Rewards
          </span>
          <h1 className="text-3xl font-black">Earn AI Credits, Cash &amp; Become a Soma Champion</h1>
          <p className="text-xs text-indigo-200">Invite teachers, create quality CBC/KCSE resources, and unlock premium features for your classroom.</p>
        </div>
      </div>

      {/* Referral Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Gift className="w-5 h-5 text-indigo-600" /> Invite Teachers &amp; Earn 500 AI Credits
        </h3>
        <p className="text-xs text-slate-500">Share your personal invite link with fellow teachers. When they export their first paper, you both get 500 bonus AI credits.</p>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-mono text-xs text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <span>{window.location.origin}/join?ref={referralCode}</span>
            <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Active Code</span>
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shrink-0"
          >
            <Copy className="w-4 h-4" /> {copied ? 'Link Copied!' : 'Copy Referral Link'}
          </button>
        </div>

        {/* History */}
        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Your Attributed Referrals ({referrals.length})</h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {referrals.map((r) => (
              <div key={r.id} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Referred User: {r.referredUserId}</p>
                  <p className="text-slate-400 text-[10px]">Code: {r.referralCode} · {r.createdAt.slice(0, 10)}</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">+{r.rewardValue} Credits Credited</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ambassador & Creator Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" /> Teacher Ambassador Programme
          </h3>
          <p className="text-xs text-slate-500">Lead county teacher workshops, introduce SomaAI to schools, and earn ambassador stipends.</p>
          {ambassadors.map((a) => (
            <div key={a.id} className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs space-y-1">
              <p className="font-bold text-amber-900 dark:text-amber-300">{a.roleTitle} — {a.county} County</p>
              <p className="text-slate-600 dark:text-slate-400">Total Referrals: {a.referralsCount} · Total Earnings: KES {a.totalEarningsKes.toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-violet-600" /> Content Creator Briefs
          </h3>
          <p className="text-xs text-slate-500">Write model exam papers, scheme of work units, or revision notes to earn paid commissions.</p>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {briefs.map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{b.title}</p>
                  <p className="text-slate-400 text-[10px]">{b.grade} · {b.subject} · {b.curriculumOutcome}</p>
                </div>
                <span className="font-black text-indigo-600">KES {b.payoutAmountKes.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
