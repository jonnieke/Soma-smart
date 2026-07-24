import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  Users,
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Shield,
  Sparkles,
  ArrowRight,
  Plus,
  CheckCircle,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { educationIntelligenceService } from '../../services/educationIntelligenceService';
import { interventionService } from '../../services/interventionService';
import { LearnerProgressSignal, MisconceptionSignal, QuestionQualityProfile } from '../../types/educationIntelligence';
import { InterventionGroup } from '../../types/educationIntelligence';

export const TeacherIntelligenceDashboardView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'LEARNERS' | 'TOPICS' | 'INTERVENTIONS' | 'QUALITY' | 'IMPACT'>('LEARNERS');
  const [signals, setSignals] = useState<LearnerProgressSignal[]>([]);
  const [misconceptions, setMisconceptions] = useState<MisconceptionSignal[]>([]);
  const [interventions, setInterventions] = useState<InterventionGroup[]>([]);
  const [questions, setQuestions] = useState<QuestionQualityProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      educationIntelligenceService.getLearnerProgressSignals(),
      Promise.resolve(educationIntelligenceService.getMisconceptionSignals()),
      interventionService.getInterventionGroups(),
      Promise.resolve(educationIntelligenceService.getQuestionQualityProfiles()),
    ]).then(([sigRes, miscRes, intRes, qRes]) => {
      setSignals(sigRes);
      setMisconceptions(miscRes);
      setInterventions(intRes);
      setQuestions(qRes);
      setLoading(false);
    });
  }, []);

  const urgentLearners = signals.filter((s) => s.priorityLevel === 'urgent_review' || s.priorityLevel === 'intervention');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" /> Soma Education Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">Transforming assessment evidence into explainable teaching decisions and intervention targets.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/intelligence/interventions')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Intervention Group
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'LEARNERS', label: `Learners Needing Support (${urgentLearners.length})` },
          { id: 'TOPICS', label: `Topic Diagnosis (${misconceptions.length})` },
          { id: 'INTERVENTIONS', label: `Intervention Groups (${interventions.length})` },
          { id: 'QUALITY', label: `Assessment Quality (${questions.length})` },
          { id: 'IMPACT', label: 'Revision Impact' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {activeTab === 'LEARNERS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {signals.map((sig) => (
                  <div key={sig.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          sig.priorityLevel === 'urgent_review' ? 'bg-red-100 text-red-800' : sig.priorityLevel === 'intervention' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {sig.priorityLevel.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">Confidence: {sig.evidenceConfidence}</span>
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{sig.learnerName}</h3>
                        <p className="text-xs text-slate-500">{sig.subject} · {sig.topic}</p>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{sig.currentMasteryScore}%</span>
                        <span className={`text-xs font-bold ${sig.growthScore && sig.growthScore > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {sig.growthScore && sig.growthScore > 0 ? `+${sig.growthScore}%` : `${sig.growthScore}%`} trend
                        </span>
                      </div>

                      {/* Evidence factors */}
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-1 border border-slate-100 dark:border-slate-700 text-xs">
                        <p className="font-bold text-slate-700 dark:text-slate-300">Evidence Factors:</p>
                        {sig.factors.map((f) => (
                          <p key={f.code} className="text-slate-500 leading-tight">• {f.description}</p>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Based on {sig.evidenceCount} assessments</span>
                      <button
                        onClick={() => navigate('/teacher/intelligence/interventions')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                      >
                        Target Intervention <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'TOPICS' && (
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Detected Misconceptions &amp; Outcome Gaps
                </h3>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {misconceptions.map((m) => (
                    <div key={m.id} className="py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{m.subject} · {m.topic}</span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">{m.affectedLearnerCount} of {m.sampleSize} learners affected</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{m.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'INTERVENTIONS' && (
            <div className="space-y-4">
              {interventions.map((grp) => (
                <div key={grp.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{grp.name}</h3>
                      <p className="text-xs text-slate-500">{grp.description} · {grp.learnerIds.length} learners assigned</p>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full uppercase">{grp.status}</span>
                  </div>

                  {/* Success criteria */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Measurable Success Criteria:</p>
                    {grp.successCriteria.map((sc) => (
                      <div key={sc.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-600 dark:text-slate-400">{sc.metric.replace('_', ' ')}: Target {sc.targetValue}%</span>
                        <span className={`font-bold ${sc.isMet ? 'text-emerald-600' : 'text-amber-600'}`}>
                          Actual: {sc.actualValue ?? '—'}% {sc.isMet ? '(Met)' : '(In Progress)'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'QUALITY' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="font-black text-slate-900 dark:text-white text-sm">Question Quality Intelligence</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {questions.map((q) => (
                  <div key={q.questionId} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">{q.questionText}</p>
                      <p className="text-slate-500">{q.subject} · {q.attemptCount} attempts · Ease: {Math.round(q.facilityIndex * 100)}%</p>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-lg">{q.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'IMPACT' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-violet-600 mx-auto" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">Revision Activity Impact Analysis</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Correlating completed SomaAI revision modules with score gains on follow-up examinations.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};
