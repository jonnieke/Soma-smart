import React, { useState } from 'react';
import { Download, FileText, Printer, CheckCircle, Filter } from 'lucide-react';
import { assessmentAnalyticsService } from '../../services/assessmentAnalyticsService';

export const TeacherReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<'CLASS_SUMMARY' | 'ITEM_ANALYSIS' | 'INTERVENTION_LIST'>('CLASS_SUMMARY');
  const [downloading, setDownloading] = useState(false);

  const handleGenerateReport = async () => {
    setDownloading(true);
    await new Promise((r) => setTimeout(r, 600));
    const summary = await assessmentAnalyticsService.getClassAnalytics('asgn_math_f4_t1_2026');
    const content = `REPORT: ${reportType}\nMean: ${summary.meanScore}\nPass Rate: ${summary.passRatePercentage}%\nGenerated At: ${new Date().toISOString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType.toLowerCase()}_report.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-600" /> Assessment Reports
        </h1>
        <p className="text-xs text-slate-500 mt-1">Generate official class summary, item analysis, and learner intervention reports.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Select Report Type</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'CLASS_SUMMARY', title: 'Class Summary Report', desc: 'Overall mean, pass rate, grade breakdown, and student rank.' },
              { id: 'ITEM_ANALYSIS', title: 'Item & Question Analysis', desc: 'Question difficulty index, distractor stats, and miskeyed flags.' },
              { id: 'INTERVENTION_LIST', title: 'Intervention Target List', desc: 'Identifies learners needing targeted topic remediation.' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReportType(r.id as typeof reportType)}
                className={`p-4 rounded-xl border text-left transition-colors flex flex-col justify-between space-y-2 ${
                  reportType === r.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{r.title}</h4>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={handleGenerateReport}
            disabled={downloading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
          >
            {downloading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            Generate Report File
          </button>
        </div>
      </div>
    </div>
  );
};
