import React, { useState } from 'react';
import { Shield, Activity, Users, Database, HelpCircle } from 'lucide-react';
import { institutionManagementService } from '../../services/institutionManagementService';

export const AdminInstitutionsView: React.FC = () => {
  const [health] = useState(institutionManagementService.getPlatformHealthMetrics());
  const [requests] = useState(institutionManagementService.getSupportRequests());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" /> Platform Tenants, Subscriptions &amp; Health Overview
        </h1>
        <p className="text-xs text-slate-500 mt-1">Platform administration overview for school tenants, subscriptions, support requests, and platform health.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active School Tenants', value: `${health.activeTenantsCount}`, sub: 'Multi-Tenant Workspaces', icon: Shield, color: 'text-indigo-600' },
          { label: 'Active Learners', value: `${health.activeLearnersCount.toLocaleString()}`, sub: 'System-Wide Enrolments', icon: Users, color: 'text-emerald-600' },
          { label: 'System Uptime', value: `${health.systemUptimePercentage}%`, sub: 'Zero System Outages', icon: Activity, color: 'text-violet-600' },
          { label: 'AI Credit Consumption', value: `${health.aiCreditUsageMonthly.toLocaleString()}`, sub: 'Monthly Platform Usage', icon: Database, color: 'text-amber-600' },
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

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-indigo-600" /> Platform Support Requests
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {requests.map((r) => (
            <div key={r.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{r.subject}</p>
                <p className="text-slate-500">From {r.requesterName} · Category: {r.category}</p>
              </div>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md uppercase text-[10px]">{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
