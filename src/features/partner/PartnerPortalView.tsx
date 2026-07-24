import React, { useState } from 'react';
import { Building, Shield, Activity, Users, Award } from 'lucide-react';

export const PartnerPortalView: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building className="w-6 h-6 text-indigo-600" /> Education Partner &amp; Sponsor Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">Partner distribution channels, school sponsorship tracking, and aggregate educational impact reporting.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sponsored Schools', value: '18 Schools', sub: 'Active Sponsor Licences', icon: Building, color: 'text-indigo-600' },
          { label: 'Beneficiary Learners', value: '14,200', sub: 'Under Partner Grants', icon: Users, color: 'text-emerald-600' },
          { label: 'Active Campaigns', value: '3 Active', sub: 'County Education Projects', icon: Shield, color: 'text-violet-600' },
          { label: 'Partner Commissions', value: 'KES 145,000', sub: 'Total Earned', icon: Award, color: 'text-amber-600' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
            <p className="text-[11px] text-slate-500">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
