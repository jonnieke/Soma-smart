import React, { useState } from 'react';
import { TrendingUp, Users, Target, Shield, Award, DollarSign, Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import { growthAnalyticsService } from '../../services/growthAnalyticsService';
import { schoolSalesCRMService } from '../../services/schoolSalesCRMService';
import { customerSuccessService } from '../../services/customerSuccessService';

export const AdminGrowthOSView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SALES' | 'HEALTH' | 'ECONOMICS'>('OVERVIEW');
  const [northStar] = useState(growthAnalyticsService.getNorthStarMetric());
  const [unitEcon] = useState(growthAnalyticsService.getUnitEconomicsSnapshot());
  const [leads] = useState(schoolSalesCRMService.getLeads());
  const [healthScores] = useState(customerSuccessService.getHealthScores());

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" /> Soma Growth OS Overview
          </h1>
          <p className="text-xs text-slate-500 mt-1">Growth overview, acquisition, activation, school sales CRM, customer success &amp; unit economics.</p>
        </div>
        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full uppercase">
          Growth Engine Active
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Growth Overview & North Star' },
          { id: 'SALES', label: `School Sales CRM (${leads.length})` },
          { id: 'HEALTH', label: 'Customer Success & Health' },
          { id: 'ECONOMICS', label: 'Unit Economics & Margins' },
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

      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* North Star Card */}
          <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-purple-950 rounded-3xl p-6 text-white shadow-xl space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 bg-amber-400/20 text-amber-300 rounded-full border border-amber-400/30">
              North-Star Metric
            </span>
            <h2 className="text-3xl font-black">{northStar.currentValue.toLocaleString()} {northStar.metricName}</h2>
            <p className="text-xs text-indigo-200">
              +{northStar.weeklyGrowthPct}% WoW Growth · Target: {northStar.targetValue.toLocaleString()} weekly cycles
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Weekly Active Teachers', value: '1,420', sub: '+8.4% WoW', icon: Users, color: 'text-indigo-600' },
              { label: 'Weekly Active Learners', value: '42,800', sub: '+14.2% WoW', icon: Activity, color: 'text-emerald-600' },
              { label: 'Product Qualified Leads', value: '38 Schools', sub: 'High Intent Signals', icon: Target, color: 'text-amber-600' },
              { label: 'Gross Margin', value: `${unitEcon.grossMarginPercentage}%`, sub: 'AI Cost Controlled', icon: DollarSign, color: 'text-violet-600' },
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
      )}

      {activeTab === 'SALES' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-600" /> School Sales CRM Pipeline
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {leads.map((l) => (
              <div key={l.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{l.schoolName} ({l.county})</p>
                  <p className="text-slate-500">Contact: {l.contactPerson} ({l.role}) · {l.estimatedLearners} Learners · {l.estimatedTeachers} Teachers</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded-md uppercase text-[10px]">{l.stage}</span>
                  <p className="font-black text-slate-900 dark:text-white">KES {l.estimatedContractValueKes.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'HEALTH' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-600" /> School Customer Health Scores
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {healthScores.map((hs) => (
              <div key={hs.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{hs.schoolName}</p>
                  <p className="text-slate-500">{hs.factors.join(' · ')}</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md uppercase text-[10px]">{hs.healthBand} ({hs.score}/100)</span>
                  <p className="text-slate-400 text-[10px]">Renewal Date: {hs.renewalDate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ECONOMICS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-indigo-600" /> Unit Economics &amp; Contribution Margins ({unitEcon.period})
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-slate-500">Gross Margin</p>
              <p className="font-black text-indigo-600 text-xl">{unitEcon.grossMarginPercentage}%</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-slate-500">Teacher CAC</p>
              <p className="font-black text-slate-900 dark:text-white text-xl">KES {unitEcon.cacTeacherKes}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-slate-500">School CAC</p>
              <p className="font-black text-slate-900 dark:text-white text-xl">KES {unitEcon.cacSchoolKes.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <p className="text-slate-500">School ARPU</p>
              <p className="font-black text-emerald-600 text-xl">KES {unitEcon.arpuSchoolKes.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
