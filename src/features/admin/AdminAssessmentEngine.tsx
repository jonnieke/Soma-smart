import React, { useState } from 'react';
import { ShieldCheck, AlertOctagon, Coins, TrendingUp, CheckCircle2, XCircle, FileText, Search, Activity } from 'lucide-react';

export const AdminAssessmentEngine: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MODERATION' | 'COPYRIGHT' | 'AI_COSTS'>('MODERATION');

  const pendingListings = [
    {
      id: 'mod_01',
      title: '2026 KCSE Chemistry Paper 3 Practical Trial',
      sellerName: 'Teacher Kamau',
      priceKes: 50,
      submittedAt: '2026-03-20',
      copyrightDeclaration: true,
      status: 'PENDING_REVIEW',
    },
    {
      id: 'mod_02',
      title: 'KPSEA Grade 6 Mathematics Practice CAT',
      sellerName: 'Teacher Mary',
      priceKes: 30,
      submittedAt: '2026-03-22',
      copyrightDeclaration: true,
      status: 'PENDING_REVIEW',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Admin Assessment Engine Control Panel</h1>
          <p className="text-xs text-slate-500 font-medium">
            Marketplace paper moderation, copyright reports, and AI token cost monitoring.
          </p>
        </div>

        <div className="flex rounded-xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('MODERATION')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'MODERATION' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Paper Moderation
          </button>
          <button
            onClick={() => setActiveTab('COPYRIGHT')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'COPYRIGHT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Copyright Reports
          </button>
          <button
            onClick={() => setActiveTab('AI_COSTS')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'AI_COSTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            AI Usage &amp; Costs
          </button>
        </div>
      </div>

      {activeTab === 'MODERATION' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900">Pending Marketplace Submissions</h2>
          <div className="space-y-3">
            {pendingListings.map((item) => (
              <div key={item.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    By {item.sellerName} · Price: KES {item.priceKes} · Copyright Declared: Yes
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700">
                    Approve Listing
                  </button>
                  <button className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700">
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'AI_COSTS' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase">AI Token Requests</span>
            <p className="text-3xl font-black text-indigo-600 mt-1">1,420</p>
            <p className="text-[11px] text-slate-400">92% Cache Hit Rate</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase">Est. AI Cost</span>
            <p className="text-3xl font-black text-emerald-600 mt-1">$4.12</p>
            <p className="text-[11px] text-slate-400">Well under daily budget limit</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase">Marketplace Gross GMV</span>
            <p className="text-3xl font-black text-slate-900 mt-1">KES 14,200</p>
            <p className="text-[11px] text-slate-400">Soma 30% Commission: KES 4,260</p>
          </div>
        </div>
      )}
    </div>
  );
};
