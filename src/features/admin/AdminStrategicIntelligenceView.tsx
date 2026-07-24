import React, { useState } from 'react';
import { Layers, DollarSign, Activity, HelpCircle, Award, CheckCircle2, TrendingUp, ShieldCheck } from 'lucide-react';
import { platformEconomicsService } from '../../services/platformEconomicsService';
import { curriculumKnowledgeGraphService } from '../../services/curriculumKnowledgeGraphService';
import { questionPaperEvidenceService } from '../../services/questionPaperEvidenceService';
import { misconceptionContentImpactService } from '../../services/misconceptionContentImpactService';

export const AdminStrategicIntelligenceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GRAPH' | 'ECONOMICS' | 'EVIDENCE' | 'ASSETS'>('GRAPH');
  const [nodes] = useState(curriculumKnowledgeGraphService.getNodes());
  const [relationships] = useState(curriculumKnowledgeGraphService.getRelationships());
  const [margin] = useState(platformEconomicsService.getGrossMarginSnapshot());
  const [paperEconomics] = useState(platformEconomicsService.getPaperEconomics());
  const [strategicAssets] = useState(platformEconomicsService.getStrategicAssets());
  const [questionProfiles] = useState(questionPaperEvidenceService.getQuestionProfiles());
  const [misconceptions] = useState(misconceptionContentImpactService.getMisconceptions());

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-600" /> Soma Strategic Intelligence &amp; Defensibility Moat
          </h1>
          <p className="text-xs text-slate-500 mt-1">Curriculum knowledge graph, question quality network, platform economics &amp; contribution margins.</p>
        </div>
        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-bold text-xs rounded-full uppercase flex items-center gap-1.5 shadow-sm">
          <ShieldCheck className="w-3.5 h-3.5" /> Defensibility Engine Active
        </span>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'GRAPH', label: `Knowledge Graph (${nodes.length} nodes)` },
          { id: 'ECONOMICS', label: `Platform Economics (${margin.grossMarginPercentage}% Margin)` },
          { id: 'EVIDENCE', label: `Evidence Network (${questionProfiles.length} questions)` },
          { id: 'ASSETS', label: `Strategic Assets (${strategicAssets.length})` },
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

      {/* Tab: GRAPH */}
      {activeTab === 'GRAPH' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> Knowledge Graph Nodes ({nodes.length})
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {nodes.map((n) => (
                  <div key={n.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{n.title}</p>
                      <p className="text-slate-500">Type: {n.type} · Country: {n.countryCode}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-bold rounded uppercase">{n.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" /> Graph Relationships ({relationships.length})
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {relationships.map((r) => (
                  <div key={r.id} className="py-3">
                    <p className="font-bold text-slate-900 dark:text-white">Relationship: {r.relationshipType.toUpperCase()}</p>
                    <p className="text-slate-500">From {r.fromNodeId} $\rightarrow$ To {r.toNodeId}</p>
                    <p className="text-slate-400 text-[10px]">Confidence: {r.confidence} · Source: {r.sourceType}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: ECONOMICS */}
      {activeTab === 'ECONOMICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
              <p className="text-slate-400 font-bold uppercase">Gross Margin %</p>
              <p className="text-2xl font-black text-indigo-600">{margin.grossMarginPercentage}%</p>
              <p className="text-[11px] text-slate-500">{margin.period}</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
              <p className="text-slate-400 font-bold uppercase">Total Revenue</p>
              <p className="text-2xl font-black text-emerald-600">KES {margin.totalRevenueKes.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500">Gross Platform Receipts</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
              <p className="text-slate-400 font-bold uppercase">Total AI Inference Cost</p>
              <p className="text-2xl font-black text-amber-600">KES {margin.totalAiCostKes.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500">Direct Gemini API</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1 shadow-sm">
              <p className="text-slate-400 font-bold uppercase">Gross Margin (KES)</p>
              <p className="text-2xl font-black text-violet-600">KES {margin.grossMarginKes.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500">Net Profit after Direct Costs</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" /> Paper-Level Unit Economics &amp; Reuse Metrics
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paperEconomics.map((pe) => (
                <div key={pe.paperId} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{pe.title}</p>
                    <p className="text-slate-500">AI Cost: KES {pe.aiGenerationCostKes} · OCR: KES {pe.ocrCostKes} · Question Reuse: {pe.questionReuseRatePct}%</p>
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded uppercase text-[10px]">{pe.grossMarginPercentage}% Margin</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: EVIDENCE */}
      {activeTab === 'EVIDENCE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> Question Quality Profiles ({questionProfiles.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {questionProfiles.map((q) => (
                <div key={q.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">QID: {q.questionId}</p>
                    <p className="text-slate-500">Sample: {q.learnerSampleSize} learners · Confidence: {q.evidenceConfidence}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-bold rounded uppercase text-[10px]">{q.qualityStatus}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-500" /> Verified Misconception Library ({misconceptions.length})
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {misconceptions.map((m) => (
                <div key={m.id} className="py-3">
                  <p className="font-bold text-slate-900 dark:text-white">{m.title}</p>
                  <p className="text-slate-500">{m.description}</p>
                  <p className="text-[10px] text-slate-400 mt-1">Status: {m.status} · Sample: {m.learnerSampleSize}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: ASSETS */}
      {activeTab === 'ASSETS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Defensible Strategic Assets Registry ({strategicAssets.length})
          </h3>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {strategicAssets.map((ast) => (
              <div key={ast.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{ast.name}</p>
                  <p className="text-slate-500">{ast.description}</p>
                  <p className="text-slate-400 text-[10px]">Uniqueness score: {ast.uniquenessMetric}% · Reuse rate: {ast.reuseMetric}%</p>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded uppercase text-[10px]">{ast.assetHealth}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
