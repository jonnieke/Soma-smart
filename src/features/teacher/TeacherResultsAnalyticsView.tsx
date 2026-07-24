import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Users,
  CheckCircle,
  Download,
  Filter,
  Layers,
  BookOpen,
} from 'lucide-react';
import { assessmentAnalyticsService, ClassAnalyticsSummary } from '../../services/assessmentAnalyticsService';
import { assessmentAttemptService } from '../../services/assessmentAttemptService';

export const TeacherResultsAnalyticsView: React.FC = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [summary, setSummary] = useState<ClassAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = assessmentId || 'asgn_math_f4_t1_2026';
    assessmentAnalyticsService.getClassAnalytics(id).then((res) => {
      setSummary(res);
      setLoading(false);
    });
  }, [assessmentId]);

  const handleExportCSV = async () => {
    if (!summary) return;
    const id = assessmentId || 'asgn_math_f4_t1_2026';
    const attempts = await assessmentAttemptService.getAssignmentAttempts(id);
    const csv = assessmentAnalyticsService.exportClassResultsCSV(summary, attempts);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class_analytics_${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !summary) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" /> Class Assessment Insights
          </h1>
          <p className="text-xs text-slate-500 mt-1">{summary.assessmentTitle} · Item analysis, grade distribution, and intervention tracking.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Class Mean', value: `${summary.meanScore}`, sub: `StdDev: ${summary.standardDeviation}`, icon: TrendingUp, color: 'text-indigo-600' },
          { label: 'Pass Rate', value: `${summary.passRatePercentage}%`, sub: `${summary.totalCompleted}/${summary.totalAssigned} Completed`, icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Top Performers', value: summary.topPerformersCount, sub: 'Grade A & B', icon: Users, color: 'text-violet-600' },
          { label: 'Needs Intervention', value: summary.needsInterventionCount, sub: 'Grade D & E', icon: AlertTriangle, color: 'text-amber-600' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
            <p className="text-[11px] text-slate-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* Grade distribution */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-black text-slate-900 dark:text-white text-sm">Grade Distribution</h3>
        <div className="grid grid-cols-5 gap-3 text-center">
          {Object.entries(summary.gradeDistribution).map(([grade, count]) => (
            <div key={grade} className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3 space-y-1">
              <span className="text-xs font-bold text-slate-500">Grade {grade}</span>
              <p className="text-xl font-black text-slate-900 dark:text-white">{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Item Analysis Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden space-y-4 p-6">
        <h3 className="font-black text-slate-900 dark:text-white text-sm">Item Analysis &amp; Question Performance</h3>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {summary.itemAnalyses.map((item) => (
            <div key={item.questionId} className="py-3 flex items-center justify-between gap-4 text-xs">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 dark:text-white truncate">{item.questionText}</p>
                <p className="text-slate-500">Avg: {item.averageMarks}/{item.maxMarks} Marks · Ease: {Math.round(item.facilityIndex * 100)}%</p>
              </div>
              {item.flaggedIssue && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {item.flaggedIssue.replace('_', ' ')}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
