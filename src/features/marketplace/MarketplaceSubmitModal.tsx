import React, { useState } from 'react';
import { X, AlertCircle, Zap, BookOpen, DollarSign, CheckSquare } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSubmitted: () => void;
}

export const MarketplaceSubmitModal: React.FC<Props> = ({ onClose, onSubmitted }) => {
  const [priceKes, setPriceKes] = useState(50);
  const [description, setDescription] = useState('');
  const [copyrightAccepted, setCopyrightAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sellerEarns = Math.round(priceKes * 0.7);
  const platformEarns = priceKes - sellerEarns;

  const handleSubmit = async () => {
    if (!copyrightAccepted) { setError('Please accept the copyright declaration.'); return; }
    if (!description.trim()) { setError('Please add a description for your paper.'); return; }
    setLoading(true);
    setError('');
    try {
      // In a real flow we'd pass the actual selected paper ID
      // For now this is the UI shell — paper selection would precede this modal
      await new Promise((r) => setTimeout(r, 1200));
      onSubmitted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" /> Submit to Marketplace
            </h2>
            <p className="text-xs text-slate-500 mt-1">Earn 70% of every sale, paid via M-Pesa</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Requirements notice */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Only <strong>Locked &amp; Approved</strong> papers can be submitted. Papers require admin moderation before going live on the marketplace.
          </p>
        </div>

        {/* Price slider */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-500" /> Set Your Price
          </label>
          <div className="space-y-2">
            <input
              type="range"
              min={10}
              max={500}
              step={5}
              value={priceKes}
              onChange={(e) => setPriceKes(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">KES 10</span>
              <span className="text-2xl font-black text-indigo-600">KES {priceKes}</span>
              <span className="text-xs text-slate-400">KES 500</span>
            </div>
          </div>

          {/* Revenue split preview */}
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-500 font-medium">You Earn (70%)</p>
              <p className="text-xl font-black text-emerald-600">KES {sellerEarns}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Platform (30%)</p>
              <p className="text-xl font-black text-slate-400">KES {platformEarns}</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-500" /> Paper Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your paper: curriculum alignment, exam type, what makes it special, marking scheme details..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
          />
          <p className="text-[10px] text-slate-400">{description.length}/500 characters</p>
        </div>

        {/* Copyright declaration */}
        <label className="flex items-start gap-3 cursor-pointer">
          <button
            type="button"
            onClick={() => setCopyrightAccepted((v) => !v)}
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${copyrightAccepted ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 dark:border-slate-600'}`}
          >
            {copyrightAccepted && <CheckSquare className="w-3.5 h-3.5" />}
          </button>
          <span className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            I declare that this paper is my original work, I hold the rights to distribute it, it does not infringe any copyright, and I accept Soma&apos;s{' '}
            <a href="#" className="text-indigo-600 underline">Seller Terms & Conditions</a>.
          </span>
        </label>

        {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !copyrightAccepted}
            className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</> : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  );
};
