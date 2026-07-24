import React, { useState } from 'react';
import { Building2, Shield, Lock, FileText, Activity, Key, CheckCircle2, UserCheck } from 'lucide-react';
import { securityPrivacyService } from '../../services/securityPrivacyService';

export const OrganizationEnterpriseView: React.FC = () => {
  const [requests] = useState(securityPrivacyService.getPrivacyRequests());
  const [retention] = useState(securityPrivacyService.getRetentionPolicies());

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-600" /> Enterprise Organization &amp; Data Governance
        </h1>
        <p className="text-xs text-slate-500 mt-1">Institutional security settings, identity enforcement, privacy requests, and statutory data retention policies.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Privacy Requests */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-600" /> Learner &amp; Staff Privacy Requests ({requests.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {requests.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Type: {r.requestType.toUpperCase()} Request</p>
                  <p className="text-slate-500">{r.details}</p>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Retention Policies */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" /> Statutory Data Retention Policies ({retention.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {retention.map((pol) => (
              <div key={pol.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{pol.dataType}</p>
                  <p className="text-slate-500">Method: {pol.deletionMethod} · Legal Hold Supported: Yes</p>
                </div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded uppercase">{pol.retentionDays} Days</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
