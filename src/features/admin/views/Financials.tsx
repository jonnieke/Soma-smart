import React, { useEffect, useState } from 'react';
import { fetchFinanceSummary, FinanceSummary } from '../../../services/adminService';
import { PurchaseReport } from './PurchaseReport';

export const FinancialsView: React.FC = () => {
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  useEffect(() => {
    let active = true;
    fetchFinanceSummary()
      .then((data) => {
        if (active) setFinance(data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className="space-y-6">
      <PurchaseReport />
      <details className="rounded-2xl border border-slate-200 bg-white p-5">
        <summary className="cursor-pointer font-bold text-slate-800">
          AI usage costs · last 30 days
        </summary>
        <p className="my-3 text-sm text-slate-600">
          Estimated AI cost:{' '}
          {finance
            ? `KES ${finance.aiCostKes.toLocaleString()} across ${finance.aiCalls} tracked calls`
            : 'Unavailable'}
          . This is separate from purchase totals.
        </p>
        {(finance?.topFeatures || []).map((f) => (
          <p key={f.feature} className="py-1 text-sm">
            {f.feature.replace(/_/g, ' ')}: KES {f.estimatedCostKes.toLocaleString()} ({f.calls}{' '}
            calls)
          </p>
        ))}
      </details>
    </div>
  );
};
