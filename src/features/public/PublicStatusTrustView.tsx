import React from 'react';
import { ShieldCheck, Activity, CheckCircle2, Lock, FileCheck, Server, Globe } from 'lucide-react';

export const PublicStatusTrustView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl space-y-3">
        <span className="px-3 py-1 bg-emerald-400/20 text-emerald-300 font-extrabold text-xs rounded-full uppercase border border-emerald-400/30 flex items-center gap-1.5 w-fit">
          <CheckCircle2 className="w-3.5 h-3.5" /> All SomaAI Systems Operational
        </span>
        <h1 className="text-3xl font-black">SomaAI Trust Center &amp; Platform Status</h1>
        <p className="text-xs text-indigo-200">Real-time operational status, service level metrics, data protection controls, and SOC2/ISO compliance commitments.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        {[
          { label: 'Platform Uptime', value: '99.98%', sub: 'Last 90 Days', color: 'text-emerald-600' },
          { label: 'Autosave Latency', value: '180ms', sub: 'P99 Average', color: 'text-indigo-600' },
          { label: 'Security Audits', value: 'Verified', sub: 'Q3 2026 Audit', color: 'text-violet-600' },
          { label: 'Data Residency', value: 'Multi-Region', sub: 'Encrypted at Rest', color: 'text-amber-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-1 shadow-sm">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">{item.label}</p>
            <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
            <p className="text-[10px] text-slate-500">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
