import React, { useEffect, useState } from 'react';
import { TrendingUp, BookOpen, Star, Wallet, ArrowUpRight, Download, Plus, History, CheckCircle, Clock, XCircle } from 'lucide-react';
import { paperBankMarketplaceService, MarketplaceListing, SellerWalletSummary, SellerStats, WithdrawalRequest } from '../../services/paperBankMarketplaceService';

const SELLER_ID = 'teacher_user';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    APPROVED: 'bg-emerald-50 text-emerald-700',
    PENDING: 'bg-amber-50 text-amber-700',
    REJECTED: 'bg-red-50 text-red-700',
    PROCESSED: 'bg-blue-50 text-blue-700',
    FAILED: 'bg-red-50 text-red-700',
  };
  const Icon = status === 'APPROVED' || status === 'PROCESSED' ? CheckCircle : status === 'PENDING' ? Clock : XCircle;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      <Icon className="w-2.5 h-2.5" /> {status}
    </span>
  );
};

export const SellerDashboard: React.FC = () => {
  const [wallet, setWallet] = useState<SellerWalletSummary | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [myListings, setMyListings] = useState<MarketplaceListing[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalPhone, setWithdrawalPhone] = useState('');
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [withdrawalError, setWithdrawalError] = useState('');
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);

  useEffect(() => {
    const w = paperBankMarketplaceService.getSellerWallet(SELLER_ID);
    const s = paperBankMarketplaceService.getSellerStats(SELLER_ID);
    const h = paperBankMarketplaceService.getWithdrawalHistory(SELLER_ID);
    setWallet(w);
    setStats(s);
    setWithdrawalHistory(h);
    setWithdrawalPhone(w.withdrawalPhone);

    paperBankMarketplaceService.getMarketplaceListings().then((all) => {
      setMyListings(all.filter((l) => l.sellerId === SELLER_ID));
    });
  }, []);

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (!amount || amount <= 0) { setWithdrawalError('Enter a valid amount.'); return; }
    if (!withdrawalPhone.trim()) { setWithdrawalError('Enter your M-Pesa phone number.'); return; }
    setWithdrawalLoading(true);
    setWithdrawalError('');
    try {
      const req = await paperBankMarketplaceService.requestWithdrawal(amount, withdrawalPhone.trim(), SELLER_ID);
      setWithdrawalHistory((prev) => [req, ...prev]);
      const updatedWallet = paperBankMarketplaceService.getSellerWallet(SELLER_ID);
      setWallet(updatedWallet);
      setWithdrawalAmount('');
      setWithdrawalSuccess(true);
      setTimeout(() => setWithdrawalSuccess(false), 3000);
    } catch (e: unknown) {
      setWithdrawalError(e instanceof Error ? e.message : 'Withdrawal failed.');
    } finally {
      setWithdrawalLoading(false);
    }
  };

  if (!wallet || !stats) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-500" /> Seller Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Track your marketplace earnings and manage your paper listings.</p>
      </div>

      {/* Wallet Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Papers', value: stats.totalListings, icon: BookOpen, color: 'text-indigo-600' },
          { label: 'Total Sales', value: stats.totalSales, icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Avg Rating', value: `${stats.avgRating}/5`, icon: Star, color: 'text-amber-500' },
          { label: 'Available (KES)', value: `${wallet.availableBalanceKes.toLocaleString()}`, icon: Wallet, color: 'text-violet-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Listings */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-500" /> My Listings
            </h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors">
              <Plus className="w-3 h-3" /> Submit New Paper
            </button>
          </div>

          {myListings.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No published papers yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {myListings.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{l.title}</p>
                    <p className="text-xs text-slate-500">{l.grade} · {l.subject} · KES {l.priceKes}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900 dark:text-white">{l.salesCount}</p>
                      <p className="text-[10px] text-slate-400">sales</p>
                    </div>
                    <StatusBadge status={l.moderationStatus} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wallet & Withdrawal */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between">
              <Wallet className="w-6 h-6 text-white/70" />
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">Seller Wallet</span>
            </div>
            <div>
              <p className="text-xs text-white/70">Available Balance</p>
              <p className="text-3xl font-black">KES {wallet.availableBalanceKes.toLocaleString()}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/20 text-xs">
              <div>
                <p className="text-white/70">Gross Sales</p>
                <p className="font-black">KES {wallet.grossSalesKes.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/70">Total Sales</p>
                <p className="font-black">{wallet.totalSalesCount}</p>
              </div>
            </div>
          </div>

          {/* Withdrawal form */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" /> Request Withdrawal
            </h3>
            <div className="space-y-2">
              <input type="number" value={withdrawalAmount} onChange={(e) => setWithdrawalAmount(e.target.value)} placeholder="Amount (KES)" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="tel" value={withdrawalPhone} onChange={(e) => setWithdrawalPhone(e.target.value)} placeholder="M-Pesa Number" className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            {withdrawalError && <p className="text-xs text-red-600">{withdrawalError}</p>}
            {withdrawalSuccess && <p className="text-xs text-emerald-600 font-bold">✓ Withdrawal requested successfully!</p>}
            <button onClick={handleWithdrawal} disabled={withdrawalLoading} className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
              {withdrawalLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              Withdraw to M-Pesa
            </button>
          </div>

          {/* Withdrawal history */}
          {withdrawalHistory.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-500" /> Recent Withdrawals
              </h3>
              {withdrawalHistory.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">KES {r.amountKes.toLocaleString()}</p>
                    <p className="text-slate-400">{new Date(r.requestedAt).toLocaleDateString()}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
