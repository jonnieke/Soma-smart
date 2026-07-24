import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, Edit3, Shield, CheckCircle, ArrowRight } from 'lucide-react';
import { paperBankMarketplaceService, MarketplacePurchase, MarketplaceListing } from '../../services/paperBankMarketplaceService';

export const PurchasedLibraryView: React.FC = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<MarketplacePurchase[]>([]);
  const [creatingCopyId, setCreatingCopyId] = useState<string | null>(null);

  useEffect(() => {
    const list = paperBankMarketplaceService.getUserPurchases('teacher_user');
    setPurchases(list);
  }, []);



  const handleCreateEditableCopy = async (purchaseId: string) => {
    setCreatingCopyId(purchaseId);
    try {
      const result = await paperBankMarketplaceService.createEditableCopyFromPurchase(purchaseId, 'teacher_user');
      navigate(`/teacher/paper-studio/editor/${result.paperId}`);
    } catch {
      /* Fallback */
    } finally {
      setCreatingCopyId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" /> Purchased Resource Library
        </h1>
        <p className="text-xs text-slate-500 mt-1">Access all your purchased Soma Paper Bank examinations, download PDFs, or create private editable copies.</p>
      </div>

      {purchases.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">You haven't purchased any marketplace papers yet.</p>
          <button onClick={() => navigate('/marketplace')} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">
            Browse Soma Paper Bank
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {purchases.map((p) => (
            <div key={p.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Purchased &amp; Verified
                  </span>
                  <span className="text-xs text-slate-400">Ref: {p.reference}</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">KCSE Form 4 Mathematics Trial Paper 1</h3>
                <p className="text-xs text-slate-500">Purchased on {new Date(p.purchasedAt).toLocaleDateString()} · Price KES {p.amountKes}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => handleCreateEditableCopy(p.id)}
                  disabled={creatingCopyId === p.id}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  {creatingCopyId === p.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Edit3 className="w-4 h-4" />}
                  Create Editable Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
