import React, { useState } from 'react';
import { Building, Layers, Shield, Activity, Users } from 'lucide-react';
import { tenantService } from '../../services/tenantService';

export const InstitutionDashboardView: React.FC = () => {
  const tenant = tenantService.getTenant();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building className="w-6 h-6 text-indigo-600" /> Multi-Campus &amp; Network Institution Portal
        </h1>
        <p className="text-xs text-slate-500 mt-1">Multi-campus oversight, shared institutional licences, and cross-branch analytics governance.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Campus Branches', value: '3 Campuses', sub: 'Main, North & West Branches', icon: Building, color: 'text-indigo-600' },
          { label: 'Enrolled Learners', value: '3,840 Total', sub: 'Across 3 Campuses', icon: Users, color: 'text-emerald-600' },
          { label: 'Institutional Licence', value: 'Active Enterprise', sub: 'Shared Content & AI', icon: Shield, color: 'text-violet-600' },
          { label: 'Network Uptime', value: '99.98%', sub: 'Zero Isolation Failures', icon: Activity, color: 'text-amber-600' },
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
