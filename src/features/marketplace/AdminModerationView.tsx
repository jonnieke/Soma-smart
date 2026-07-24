import React, { useEffect, useState } from 'react';
import { Shield, CheckCircle, XCircle, Clock, Eye, AlertTriangle, BookOpen, User } from 'lucide-react';
import { paperBankMarketplaceService, MarketplaceListing } from '../../services/paperBankMarketplaceService';

const MODERATOR_ID = 'platform_admin';

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    APPROVED: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>{status}</span>;
};

export const AdminModerationView: React.FC = () => {
  const [pendingListings, setPendingListings] = useState<MarketplaceListing[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({});
  const [actionLog, setActionLog] = useState<{ id: string; action: string; at: string }[]>([]);

  useEffect(() => {
    setPendingListings(paperBankMarketplaceService.getPendingModerationListings());
  }, []);

  const handleModerate = async (listingId: string, decision: 'APPROVED' | 'REJECTED') => {
    const reason = rejectReason[listingId];
    if (decision === 'REJECTED' && !reason?.trim()) {
      setShowRejectInput((prev) => ({ ...prev, [listingId]: true }));
      return;
    }
    setProcessingId(listingId);
    try {
      paperBankMarketplaceService.moderateListing(listingId, decision, MODERATOR_ID, reason);
      setPendingListings((prev) => prev.filter((l) => l.id !== listingId));
      setActionLog((prev) => [{ id: listingId, action: decision, at: new Date().toLocaleTimeString() }, ...prev]);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" /> Marketplace Moderation Queue
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Review and approve or reject paper submissions before they go live.</p>
      </div>

      {pendingListings.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <p className="font-bold text-slate-600 dark:text-slate-400">All clear! No pending submissions.</p>
          {actionLog.length > 0 && (
            <div className="mt-6 text-left px-8 space-y-2">
              <p className="text-xs font-bold text-slate-400 uppercase">Recent Actions</p>
              {actionLog.map((log) => (
                <div key={`${log.id}_${log.at}`} className="flex items-center justify-between text-xs text-slate-500">
                  <span>Listing {log.id}: <strong>{log.action}</strong></span>
                  <span>{log.at}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
            <span className="font-black text-amber-600">{pendingListings.length}</span> submission{pendingListings.length !== 1 ? 's' : ''} awaiting review
          </p>

          {pendingListings.map((listing) => (
            <div key={listing.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={listing.moderationStatus} />
                    <span className="text-[10px] text-slate-400">{new Date(listing.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug">{listing.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {listing.grade} · {listing.subject}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> {listing.sellerName}</span>
                    <span>KES {listing.priceKes}</span>
                  </div>
                </div>
                <Eye className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                {listing.description}
              </p>

              <div className="grid grid-cols-3 gap-3 text-center text-xs bg-slate-50 dark:bg-slate-800 rounded-xl p-3">
                <div><p className="text-slate-400">Type</p><p className="font-bold text-slate-900 dark:text-white">{listing.examType}</p></div>
                <div><p className="text-slate-400">Marks</p><p className="font-bold text-slate-900 dark:text-white">{listing.totalMarks}</p></div>
                <div><p className="text-slate-400">Duration</p><p className="font-bold text-slate-900 dark:text-white">{listing.durationMinutes} min</p></div>
              </div>

              {/* Reject reason */}
              {showRejectInput[listing.id] && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5" /> Please provide a rejection reason before confirming.
                  </div>
                  <textarea
                    rows={2}
                    value={rejectReason[listing.id] ?? ''}
                    onChange={(e) => setRejectReason((prev) => ({ ...prev, [listing.id]: e.target.value }))}
                    placeholder="Enter rejection reason for the seller..."
                    className="w-full px-3 py-2 rounded-xl border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => handleModerate(listing.id, 'APPROVED')}
                  disabled={processingId === listing.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  {processingId === listing.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Approve Listing
                </button>
                <button
                  onClick={() => {
                    setShowRejectInput((prev) => ({ ...prev, [listing.id]: true }));
                    if (rejectReason[listing.id]?.trim()) handleModerate(listing.id, 'REJECTED');
                  }}
                  disabled={processingId === listing.id}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 disabled:opacity-60 text-xs font-bold rounded-xl transition-colors border border-red-200 dark:border-red-800"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
