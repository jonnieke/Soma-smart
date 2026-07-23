import React, { useEffect, useState } from 'react';
import { ShoppingBag, Search, Filter, ShieldCheck, Star, ArrowRight, Eye, Download, CheckCircle2, Lock, Flame } from 'lucide-react';
import { paperBankMarketplaceService, MarketplaceListing } from '../../../services/paperBankMarketplaceService';

interface MarketplaceProps {
  onPaperPurchased?: (paperId: string) => void;
}

export const PaperBankMarketplace: React.FC<MarketplaceProps> = ({ onPaperPurchased }) => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [previewListing, setPreviewListing] = useState<MarketplaceListing | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState('0722763760');
  const [purchasedSuccess, setPurchasedSuccess] = useState(false);

  useEffect(() => {
    loadMarketplace();
  }, [subjectFilter, gradeFilter]);

  const loadMarketplace = async () => {
    const data = await paperBankMarketplaceService.getMarketplaceListings(subjectFilter, gradeFilter);
    setListings(data);
  };

  const handleBuy = async (listing: MarketplaceListing) => {
    setIsPurchasing(true);
    try {
      await paperBankMarketplaceService.purchasePaper(listing.id, buyerPhone);
      setPurchasedSuccess(true);
      setTimeout(() => {
        setPurchasedSuccess(false);
        setPreviewListing(null);
        if (onPaperPurchased) onPaperPurchased(listing.examId);
      }, 1500);
    } finally {
      setIsPurchasing(false);
    }
  };

  const filteredListings = listings.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sellerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 sm:p-10 text-white shadow-xl border border-emerald-800/40">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3.5 py-1 text-xs font-black text-emerald-300 border border-emerald-400/30">
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            Soma Paper Bank Marketplace
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
            Buy &amp; Sell Approved Kenyan Exam Papers
          </h1>
          <p className="text-sm text-slate-300 font-medium leading-relaxed">
            Access verified KCSE, KPSEA, and CBC mock assessments created by top Kenyan examiners.
            Sellers earn a 70% revenue share paid directly via M-Pesa.
          </p>
        </div>
      </section>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search papers by subject, grade, title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Integrated Science">Integrated Science</option>
            <option value="Chemistry">Chemistry</option>
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">All Grades</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Form 4">Form 4</option>
          </select>
        </div>
      </div>

      {/* Listing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredListings.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {item.grade}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-slate-100 text-slate-700">
                    {item.examType}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {item.rating} ({item.salesCount})
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">{item.title}</h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-2">{item.description}</p>

              <div className="flex items-center gap-2 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold text-slate-700 truncate">{item.sellerName}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price</span>
                <span className="text-lg font-black text-emerald-600">KES {item.priceKes}</span>
              </div>

              <button
                onClick={() => setPreviewListing(item)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition"
              >
                <Eye className="w-4 h-4" /> Preview &amp; Buy
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Watermarked Preview Modal */}
      {previewListing && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-6 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setPreviewListing(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
            >
              &times;
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-900">
                Watermarked Preview
              </span>
              <h2 className="text-lg font-black text-slate-900">{previewListing.title}</h2>
              <p className="text-xs text-slate-500 font-medium">By {previewListing.sellerName}</p>
            </div>

            {/* Watermarked Canvas Box */}
            <div className="relative bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-800 space-y-3 font-serif select-none overflow-hidden min-h-[180px]">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10 font-black text-4xl text-slate-900 rotate-[-25deg]">
                SOMA PAPER BANK PREVIEW
              </div>
              <p className="text-xs font-bold text-slate-900">Sample Question 1 (Watermarked):</p>
              <p className="text-xs font-normal">
                1. Calculate the value of x in the given quadratic expression under standard curriculum conditions...
              </p>
              <p className="text-[11px] text-slate-400 font-sans italic pt-4">
                Full downloadable paper &amp; marking scheme unlocked immediately after purchase.
              </p>
            </div>

            {purchasedSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-900 rounded-2xl border border-emerald-200 flex items-center gap-2 text-xs font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Payment successful! Importing paper to your Paper Studio...
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">M-Pesa Buyer Phone Number</label>
                  <input
                    type="text"
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    className="w-full mt-1 px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <button
                  disabled={isPurchasing}
                  onClick={() => handleBuy(previewListing)}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {isPurchasing ? 'Processing M-Pesa STK...' : `Buy Paper for KES ${previewListing.priceKes}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
