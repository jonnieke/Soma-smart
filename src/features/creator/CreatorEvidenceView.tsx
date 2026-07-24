import React, { useState } from 'react';
import { Award, DollarSign, Star, TrendingUp, CheckCircle2 } from 'lucide-react';
import { contributorRoyaltyService } from '../../services/contributorRoyaltyService';
import { misconceptionContentImpactService } from '../../services/misconceptionContentImpactService';

export const CreatorEvidenceView: React.FC = () => {
  const [reputations] = useState(contributorRoyaltyService.getReputations());
  const [royalties] = useState(contributorRoyaltyService.getRoyaltyAllocations());
  const [impacts] = useState(misconceptionContentImpactService.getContentImpactProfiles());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-6 h-6 text-amber-500" /> Contributor Reputation &amp; Content Performance
        </h1>
        <p className="text-xs text-slate-500 mt-1">Track content impact, verified contributor reputation, and item-level seller royalties.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contributor Reputation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" /> Your Verified Reputation Profile
          </h3>
          {reputations.map((r) => (
            <div key={r.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white">Reputation Band</span>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-extrabold rounded uppercase text-[10px]">{r.reputationBand}</span>
              </div>
              <p className="text-slate-500">Verified Roles: {r.verifiedRoles.join(', ')}</p>
              <p className="text-slate-500">Approved Contributions: {r.approvedContributionCount} · Buyer Rating: {r.buyerRating}/5.0</p>
            </div>
          ))}
        </div>

        {/* Content Impact */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" /> Resource Learning Impact ({impacts.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {impacts.map((imp) => (
              <div key={imp.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Resource: {imp.resourceId}</p>
                  <p className="text-slate-500">Pre/Post Mastery Delta: +{imp.observedChange}%</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">{imp.interpretation}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
