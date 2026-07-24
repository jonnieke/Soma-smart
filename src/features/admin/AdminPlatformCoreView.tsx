import React, { useState } from 'react';
import { Shield, Activity, Cpu, Globe, Server, AlertTriangle, Database, Lock, Key, FileCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { platformHealthService } from '../../services/platformHealthService';
import { incidentManagementService } from '../../services/incidentManagementService';
import { aiGovernanceService } from '../../services/aiGovernanceService';
import { countryManagementService } from '../../services/countryManagementService';
import { securityPrivacyService } from '../../services/securityPrivacyService';

export const AdminPlatformCoreView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'HEALTH' | 'INCIDENTS' | 'AI_GOVERNANCE' | 'COUNTRIES' | 'SECURITY'>('HEALTH');
  const [services] = useState(platformHealthService.getServices());
  const [slos] = useState(platformHealthService.getSLOs());
  const [incidents] = useState(incidentManagementService.getIncidents());
  const [models] = useState(aiGovernanceService.getModels());
  const [prompts] = useState(aiGovernanceService.getPrompts());
  const [countries] = useState(countryManagementService.getCountries());
  const [vulnerabilities] = useState(securityPrivacyService.getVulnerabilities());
  const [compliance] = useState(securityPrivacyService.getComplianceEvidence());

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-600" /> Soma Platform Core &amp; Reliability Administration
          </h1>
          <p className="text-xs text-slate-500 mt-1">Platform reliability, incident response, AI model governance, security, privacy &amp; international expansion.</p>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5" /> All Services Operational
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'HEALTH', label: `Platform Health & SLOs (${services.length})` },
          { id: 'INCIDENTS', label: `Incidents & DR (${incidents.length})` },
          { id: 'AI_GOVERNANCE', label: `AI Governance & Models (${models.length})` },
          { id: 'COUNTRIES', label: `Country Expansion (${countries.length})` },
          { id: 'SECURITY', label: 'Security & Compliance' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === t.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: HEALTH */}
      {activeTab === 'HEALTH' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.map((s) => (
              <div key={s.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase">{s.status}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{s.criticality}</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</h3>
                  <p className="text-slate-500 text-xs mt-1">{s.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Team: {s.ownerTeam}</span>
                  <span>Classification: {s.dataClassification}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" /> Active Service Level Objectives (SLOs)
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {slos.map((slo) => (
                <div key={slo.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{slo.name}</p>
                    <p className="text-slate-500">{slo.indicator} · Window: {slo.measurementWindowDays} days</p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-indigo-600 text-sm">{slo.targetPercentage}% Target</span>
                    <p className="text-[10px] text-emerald-600 font-bold">Error Budget Safe</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: INCIDENTS */}
      {activeTab === 'INCIDENTS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Platform Incidents &amp; Disaster Recovery Timeline
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {incidents.map((inc) => (
              <div key={inc.id} className="py-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black rounded-md uppercase">{inc.severity}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{inc.title}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">{inc.status}</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">Customer Impact: {inc.customerImpact}</p>
                <p className="text-slate-400 text-[11px]">Root Cause: {inc.rootCause}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: AI_GOVERNANCE */}
      {activeTab === 'AI_GOVERNANCE' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" /> AI Model Registry &amp; Versioning
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {models.map((m) => (
                <div key={m.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{m.modelName} ({m.provider})</p>
                    <p className="text-slate-500">Approved for: {m.approvedUseCases.join(', ')} · Risk: {m.riskLevel}</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded uppercase">{m.evaluationStatus} ({m.rolloutPercentage}%)</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-violet-600" /> Approved System Prompts ({prompts.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {prompts.map((p) => (
                <div key={p.id} className="py-3">
                  <p className="font-bold text-slate-900 dark:text-white">{p.name} ({p.version})</p>
                  <p className="text-slate-500 font-mono text-[11px] mt-1 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg">{p.systemPrompt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: COUNTRIES */}
      {activeTab === 'COUNTRIES' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-600" /> International Expansion &amp; Country Configurations
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {countries.map((c) => (
              <div key={c.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{c.name} ({c.countryCode})</p>
                  <p className="text-slate-500">Currency: {c.currencyCode} · Timezone: {c.defaultTimezone} · Frameworks: {c.curriculumFrameworkIds.join(', ')}</p>
                </div>
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded uppercase">{c.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: SECURITY */}
      {activeTab === 'SECURITY' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" /> Security Vulnerability Triage ({vulnerabilities.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {vulnerabilities.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{v.title}</p>
                    <p className="text-slate-500">Service: {v.affectedService} · Severity: {v.severity}</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded uppercase">{v.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" /> Compliance Evidence &amp; Disaster Recovery Audits
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {compliance.map((ev) => (
                <div key={ev.id} className="py-3">
                  <p className="font-bold text-slate-900 dark:text-white">{ev.title}</p>
                  <p className="text-slate-500">{ev.notes}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Verified by: {ev.owner} · {ev.verifiedAt.slice(0, 10)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
