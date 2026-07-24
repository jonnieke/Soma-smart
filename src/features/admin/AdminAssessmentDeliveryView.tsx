import React, { useState } from 'react';
import { Shield, Layers, Upload, DollarSign, Activity, CheckCircle, Clock } from 'lucide-react';

export const AdminAssessmentDeliveryView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DELIVERY' | 'JOBS' | 'SCANNING' | 'COSTS'>('DELIVERY');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-600" /> System Assessment Admin &amp; Delivery Monitoring
        </h1>
        <p className="text-xs text-slate-500 mt-1">Platform administration for assessment delivery jobs, OMR scanning queues, and AI cost tracking.</p>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {[
          { id: 'DELIVERY', label: 'Assessment Delivery' },
          { id: 'JOBS', label: 'Background Jobs' },
          { id: 'SCANNING', label: 'OMR & Scan Queue' },
          { id: 'COSTS', label: 'AI Cost Tracking' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Delivery Jobs', value: '18', sub: 'Online & Hybrid', icon: Activity, color: 'text-indigo-600' },
          { label: 'Scan Jobs Processed', value: '142', sub: 'OMR Bubble Grids', icon: Upload, color: 'text-emerald-600' },
          { label: 'AI Marking Cost', value: '$4.20', sub: 'Last 30 Days', icon: DollarSign, color: 'text-violet-600' },
          { label: 'Avg Cost / Response', value: '$0.002', sub: 'Efficient Batching', icon: Layers, color: 'text-amber-600' },
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

      {activeTab === 'SCANNING' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-black text-slate-900 dark:text-white text-sm">OMR Answer Sheet Scan Processing Queue</h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[
              { id: 'job_101', teacher: 'Mwalimu Kamau', pages: 35, status: 'COMPLETED', confidence: '96%' },
              { id: 'job_102', teacher: 'Teacher Wanjiku', pages: 20, status: 'REVIEW_REQUIRED', confidence: '68%' },
            ].map((job) => (
              <div key={job.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{job.id} · {job.teacher}</p>
                  <p className="text-slate-500">{job.pages} pages scanned · Confidence: {job.confidence}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-bold ${job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
