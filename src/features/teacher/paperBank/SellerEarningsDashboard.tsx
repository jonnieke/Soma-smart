import React, { useEffect, useState } from 'react';
import { TrendingUp, Wallet, ArrowDownRight, CheckCircle2, ArrowLeft, Send, ShieldCheck, Coins } from 'lucide-react';
import { paperBankMarketplaceService, SellerWalletSummary } from '../../../services/paperBankMarketplaceService';

interface EarningsProps {
  onBack?: () => void;
}

export const SellerEarningsDashboard: React.FC<EarningsProps> = ({ onBack }) => {
  const [wallet, setWallet] = useState<SellerWalletSummary>({
    sellerId: 'teacher_user',
    totalPublishedPapers: 3,
    totalSalesCount: 18,
    grossSalesKes: 900,
    availableBalanceKes: 630,
    pendingBalanceKes: 0,
    withdrawalPhone: '0722763760',
  });
  const [withdrawAmount, setWithdrawAmount] = useState<string>('500');
  const [withdrawPhone, setWithdrawPhone] = useState<string>('0722763760');
  const [isRequesting, setIsRequesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    setWallet(paperBankMarketplaceService.getSellerWallet());
  }, []);

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmount, 10);
    if (!amt || amt <= 0) return;
    setIsRequesting(true);
    try {
      await paperBankMarketplaceService.requestWithdrawal(amt, withdrawPhone);
      setWallet(paperBankMarketplaceService.getSellerWallet());
      setSuccessMsg(`Withdrawal request of KES ${amt} sent to ${withdrawPhone} via M-Pesa.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Withdrawal failed.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-black text-slate-900">Seller Earnings &amp; Wallet</h1>
            <p className="text-xs text-slate-500 font-medium">
              Track marketplace paper sales, revenue splits (70% seller share), and instant M-Pesa payouts.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Verified Seller (70% Share)
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Available Balance</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600">KES {wallet.availableBalanceKes}</p>
          <p className="text-[11px] text-slate-400 font-medium">Ready for M-Pesa withdrawal</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Gross Marketplace Sales</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900">KES {wallet.grossSalesKes}</p>
          <p className="text-[11px] text-slate-400 font-medium">{wallet.totalSalesCount} total purchases</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Seller Revenue Share</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-600">70%</p>
          <p className="text-[11px] text-slate-400 font-medium">SomaAI 30% platform fee</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500">
            <span>Published Papers</span>
            <Coins className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-3xl font-black text-slate-900">{wallet.totalPublishedPapers}</p>
          <p className="text-[11px] text-slate-400 font-medium">Active marketplace listings</p>
        </div>
      </div>

      {/* M-Pesa Payout Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm max-w-xl space-y-4">
        <h2 className="text-base font-bold text-slate-900">Instant M-Pesa Withdrawal</h2>

        {successMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700">Withdrawal Amount (KES)</label>
            <input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700">M-Pesa Phone Number</label>
            <input
              type="text"
              value={withdrawPhone}
              onChange={(e) => setWithdrawPhone(e.target.value)}
              className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200"
            />
          </div>

          <button
            disabled={isRequesting || wallet.availableBalanceKes < 10}
            onClick={handleWithdraw}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isRequesting ? 'Sending M-Pesa Payout...' : 'Withdraw to M-Pesa Now'}
          </button>
        </div>
      </div>
    </div>
  );
};
