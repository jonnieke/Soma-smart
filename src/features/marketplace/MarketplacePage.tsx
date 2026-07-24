import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Star, ShoppingCart, BookOpen, Filter, X, CheckCircle, Clock, TrendingUp, Zap, ChevronRight, Shield, Award } from 'lucide-react';
import { paperBankMarketplaceService, MarketplaceListing } from '../../services/paperBankMarketplaceService';
import { MarketplaceSubmitModal } from './MarketplaceSubmitModal';

const SUBJECTS = ['ALL', 'Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'Business Studies', 'Integrated Science'];
const GRADES = ['ALL', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'];

const StarRating: React.FC<{ rating: number; count?: number; size?: 'sm' | 'md' }> = ({ rating, count, size = 'sm' }) => {
  const starSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`${starSize} ${s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`} />
      ))}
      <span className={`${size === 'sm' ? 'text-[10px]' : 'text-xs'} font-bold text-slate-600`}>
        {rating.toFixed(1)}{count != null ? ` (${count})` : ''}
      </span>
    </div>
  );
};

const ListingCard: React.FC<{ listing: MarketplaceListing; onBuy: (l: MarketplaceListing) => void; purchased?: boolean }> = ({ listing, onBuy, purchased }) => (
  <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 flex flex-col">
    {/* Coloured header band */}
    <div className="h-2 bg-gradient-to-r from-indigo-500 to-violet-500" />

    <div className="p-5 flex flex-col flex-1 gap-3">
      {/* Badge row */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
          {listing.examType}
        </span>
        <div className="flex items-center gap-1">
          {listing.isSellerVerified && <Shield className="w-3 h-3 text-emerald-500" aria-label="Verified seller" />}

          <span className="text-[10px] text-slate-400">{listing.grade}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
        {listing.title}
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{listing.description}</p>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[11px] text-slate-500">
        <span>{listing.subject}</span>
        <span>·</span>
        <span>{listing.term} {listing.year}</span>
        <span>·</span>
        <span>{listing.totalMarks} marks</span>
      </div>

      <StarRating rating={listing.rating} count={listing.ratingCount} />

      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>by {listing.sellerName}</span>
        <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {listing.salesCount} sold</span>
      </div>

      {/* CTA */}
      <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xl font-black text-slate-900 dark:text-white">
          KES {listing.priceKes}
        </span>
        {purchased ? (
          <span className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold">
            <CheckCircle className="w-3.5 h-3.5" /> Purchased
          </span>
        ) : (
          <button
            onClick={() => onBuy(listing)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <ShoppingCart className="w-3.5 h-3.5" /> Buy via M-Pesa
          </button>
        )}
      </div>
    </div>
  </div>
);

const PurchaseModal: React.FC<{
  listing: MarketplaceListing;
  onClose: () => void;
  onSuccess: (listing: MarketplaceListing) => void;
}> = ({ listing, onClose, onSuccess }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePurchase = async () => {
    if (!phone.trim()) { setError('Please enter your M-Pesa phone number.'); return; }
    setLoading(true);
    setError('');
    try {
      await paperBankMarketplaceService.purchasePaper(listing.id, phone.trim());
      onSuccess(listing);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Complete Purchase</h2>
            <p className="text-xs text-slate-500 mt-1">Pay securely via M-Pesa STK Push</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4 space-y-2">
          <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">{listing.title}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">{listing.grade} · {listing.subject}</span>
            <span className="text-lg font-black text-indigo-600">KES {listing.priceKes}</span>
          </div>
          <StarRating rating={listing.rating} count={listing.ratingCount} />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">M-Pesa Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0712345678"
            className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handlePurchase}
            disabled={loading}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing…</> : `Pay KES ${listing.priceKes}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export const MarketplacePage: React.FC = () => {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [featured, setFeatured] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set());
  const [buyingListing, setBuyingListing] = useState<MarketplaceListing | null>(null);
  const [purchaseSuccessId, setPurchaseSuccessId] = useState<string | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [all, feat] = await Promise.all([
      paperBankMarketplaceService.getMarketplaceListings(subjectFilter === 'ALL' ? undefined : subjectFilter, gradeFilter === 'ALL' ? undefined : gradeFilter),
      paperBankMarketplaceService.getFeaturedListings(3),
    ]);
    setListings(all);
    setFeatured(feat);
    // Check purchase status for all listings
    const purchased = new Set(all.filter((l) => paperBankMarketplaceService.hasPurchased(l.id)).map((l) => l.id));
    setPurchasedIds(purchased);
    setLoading(false);
  }, [subjectFilter, gradeFilter]);

  useEffect(() => { void load(); }, [load]);

  const filtered = listings.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return l.title.toLowerCase().includes(q) || l.subject.toLowerCase().includes(q) || l.sellerName.toLowerCase().includes(q);
  });

  const handlePurchaseSuccess = (listing: MarketplaceListing) => {
    setBuyingListing(null);
    setPurchaseSuccessId(listing.id);
    setPurchasedIds((prev) => new Set([...prev, listing.id]));
    setTimeout(() => setPurchaseSuccessId(null), 4000);
  };

  return (
    <>
      <Helmet>
        <title>Soma Paper Bank Marketplace — Exam Papers & Marking Schemes</title>
        <meta name="description" content="Browse, buy, and sell curriculum-aligned KCSE, KPSEA, and CBC examination papers with marking schemes. Verified educator content." />
      </Helmet>

      {/* Purchase modal */}
      {buyingListing && (
        <PurchaseModal
          listing={buyingListing}
          onClose={() => setBuyingListing(null)}
          onSuccess={handlePurchaseSuccess}
        />
      )}

      {showSubmitModal && (
        <MarketplaceSubmitModal onClose={() => setShowSubmitModal(false)} onSubmitted={() => { setShowSubmitModal(false); void load(); }} />
      )}

      {/* Purchase success toast */}
      {purchaseSuccessId && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 animate-fade-in-up">
          <CheckCircle className="w-5 h-5" />
          <span className="font-bold text-sm">Purchase successful! Paper unlocked.</span>
        </div>
      )}

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Hero */}
        <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 text-white px-6 pt-16 pb-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #6366f1 0%, transparent 60%), radial-gradient(circle at 70% 50%, #8b5cf6 0%, transparent 60%)' }} />
          <div className="relative max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
              <BookOpen className="w-3.5 h-3.5 text-indigo-300" /> Soma Paper Bank
            </div>
            <h1 className="text-4xl font-black leading-tight">Kenya&apos;s Largest Exam Paper Marketplace</h1>
            <p className="text-slate-300 text-lg max-w-xl mx-auto">
              KCSE, KPSEA &amp; CBC-aligned papers by verified educators. Instant download after M-Pesa payment.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button onClick={() => setShowSubmitModal(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-bold text-sm transition-colors">
                <Zap className="w-4 h-4" /> Sell Your Paper
              </button>
              <a href="#listings" className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl font-bold text-sm transition-colors">
                Browse Papers <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 space-y-10 pb-20">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: BookOpen, label: 'Papers Available', value: `${listings.length + 3}+` },
              { icon: Award, label: 'Verified Sellers', value: '28' },
              { icon: TrendingUp, label: 'Purchases This Term', value: '1,240+' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-center shadow-sm">
                <Icon className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                <div className="text-xl font-black text-slate-900 dark:text-white">{value}</div>
                <div className="text-xs text-slate-500 font-medium">{label}</div>
              </div>
            ))}
          </div>

          {/* Featured */}
          {featured.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Top Selling Papers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {featured.map((l) => (
                  <ListingCard key={l.id} listing={l} onBuy={setBuyingListing} purchased={purchasedIds.has(l.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Search & Filters */}
          <div id="listings" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, subject, or seller..."
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {SUBJECTS.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All Subjects' : s}</option>)}
              </select>
              <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
                {GRADES.map((g) => <option key={g} value={g}>{g === 'ALL' ? 'All Grades' : g}</option>)}
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 h-72 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <Filter className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No papers match your filters.</p>
                <button onClick={() => { setSubjectFilter('ALL'); setGradeFilter('ALL'); setSearchQuery(''); }} className="mt-3 text-indigo-600 text-sm font-semibold hover:underline">Clear filters</button>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-500 font-medium">{filtered.length} paper{filtered.length !== 1 ? 's' : ''} found</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((l) => (
                    <ListingCard key={l.id} listing={l} onBuy={setBuyingListing} purchased={purchasedIds.has(l.id)} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Seller CTA */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white text-center space-y-4">
            <h3 className="text-2xl font-black">Earn with Your Exam Papers</h3>
            <p className="text-indigo-100 max-w-lg mx-auto text-sm">
              Upload your verified exam papers and marking schemes. Earn 70% of every sale — paid directly to your M-Pesa.
            </p>
            <button onClick={() => setShowSubmitModal(true)} className="inline-flex items-center gap-2 bg-white text-indigo-600 font-black px-8 py-3.5 rounded-2xl hover:bg-indigo-50 transition-colors text-sm">
              <Zap className="w-4 h-4" /> Start Selling Today
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
