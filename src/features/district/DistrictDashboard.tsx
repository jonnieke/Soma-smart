import React, { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Building2, Users, BookOpen, CheckCircle, AlertTriangle, XCircle, TrendingUp, Download, Filter, Search, ChevronDown, ChevronUp, Zap, BarChart3, Globe } from 'lucide-react';
import { districtService } from '../../services/districtService';
import { District, DistrictAnalyticsSummary, DistrictSchoolSnapshot, DistrictComplianceRecord, ComplianceStatus } from '../../types/district';

const DEMO_DISTRICT_ID = 'district_nairobi_central';

const ComplianceBadge: React.FC<{ status: ComplianceStatus; score?: number }> = ({ status, score }) => {
  const map: Record<ComplianceStatus, { cls: string; icon: React.FC<{ className?: string }> }> = {
    GREEN: { cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle },
    AMBER: { cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: AlertTriangle },
    RED: { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
    UNKNOWN: { cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: Filter },
  };
  const { cls, icon: Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>
      <Icon className="w-3 h-3" /> {status} {score != null ? `(${score}%)` : ''}
    </span>
  );
};

const ProgressBar: React.FC<{ value: number; max?: number; color?: string }> = ({ value, max = 100, color = 'bg-indigo-500' }) => (
  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
    <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
  </div>
);

const TrendMiniChart: React.FC<{ data: { papersSubmitted: number; papersApproved: number }[] }> = ({ data }) => {
  const max = Math.max(...data.map((d) => d.papersSubmitted), 1);
  return (
    <div className="flex items-end gap-0.5 h-12">
      {data.slice(-10).map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full bg-indigo-200 dark:bg-indigo-800 rounded-t" style={{ height: `${(d.papersSubmitted / max) * 100}%`, minHeight: '2px' }} />
          <div className="w-full bg-emerald-400 dark:bg-emerald-600 rounded-t" style={{ height: `${(d.papersApproved / max) * 100}%`, minHeight: '2px' }} />
        </div>
      ))}
    </div>
  );
};

export const DistrictDashboard: React.FC = () => {
  const [district, setDistrict] = useState<District | null>(null);
  const [summary, setSummary] = useState<DistrictAnalyticsSummary | null>(null);
  const [schools, setSchools] = useState<DistrictSchoolSnapshot[]>([]);
  const [compliance, setCompliance] = useState<DistrictComplianceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSchoolId, setExpandedSchoolId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'ALL'>('ALL');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [d, s, sc, comp] = await Promise.all([
      districtService.getDistrict(DEMO_DISTRICT_ID),
      districtService.getDistrictAnalyticsSummary(DEMO_DISTRICT_ID),
      districtService.getDistrictSchools(DEMO_DISTRICT_ID),
      districtService.getDistrictComplianceReport(DEMO_DISTRICT_ID),
    ]);
    setDistrict(d);
    setSummary(s);
    setSchools(sc);
    setCompliance(comp);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    await new Promise((r) => setTimeout(r, 800));
    const csv = districtService.exportDistrictReportCsv(schools, compliance);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `district_report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  };

  const filteredSchools = schools.filter((s) => {
    const comp = compliance.find((c) => c.schoolId === s.schoolId);
    if (statusFilter !== 'ALL' && comp?.complianceStatus !== statusFilter) return false;
    if (searchQuery && !s.schoolName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading district data…</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{district?.name ?? 'District Dashboard'} — Soma AI</title>
        <meta name="description" content="Multi-school district oversight dashboard for county directors and ministry inspectors." />
      </Helmet>

      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-950 to-indigo-950 text-white px-6 py-10">
          <div className="max-w-7xl mx-auto flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5 text-indigo-300" />
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">{district?.county} County</span>
              </div>
              <h1 className="text-3xl font-black leading-tight">{district?.name}</h1>
              <p className="text-slate-400 text-sm mt-1">District Assessment Oversight · {district?.adminName}</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-2xl text-sm font-bold transition-colors border border-white/20"
            >
              {exporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              Export CSV
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-20 space-y-8">
          {/* Summary stat cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Schools', value: summary.totalSchools, sub: `${summary.activeSchools} active`, icon: Building2, color: 'text-indigo-600' },
                { label: 'Total Teachers', value: summary.totalTeachers, sub: `across ${summary.totalDepartments} depts`, icon: Users, color: 'text-violet-600' },
                { label: 'Papers This Term', value: summary.totalPapers, sub: `${summary.approvedPapers} approved`, icon: BookOpen, color: 'text-emerald-600' },
                { label: 'Avg Compliance', value: `${summary.avgComplianceScore}%`, sub: `${summary.avgApprovalRate}% approval rate`, icon: BarChart3, color: 'text-amber-600' },
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
          )}

          {/* Compliance breakdown + trend chart */}
          {summary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Compliance RAG */}
              <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" /> Compliance Breakdown
                </h3>
                {summary.complianceBreakdown.map(({ status, count }) => (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <ComplianceBadge status={status as ComplianceStatus} />
                      <span className="font-black text-slate-900 dark:text-white">{count} school{count !== 1 ? 's' : ''}</span>
                    </div>
                    <ProgressBar value={count} max={summary.totalSchools} color={status === 'GREEN' ? 'bg-emerald-500' : status === 'AMBER' ? 'bg-amber-500' : status === 'RED' ? 'bg-red-500' : 'bg-slate-300'} />
                  </div>
                ))}
              </div>

              {/* Trend chart */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" /> Paper Submission Trend (This Term)
                  </h3>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-indigo-300 dark:bg-indigo-700 rounded-sm inline-block" /> Submitted</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-400 dark:bg-emerald-600 rounded-sm inline-block" /> Approved</span>
                  </div>
                </div>
                <TrendMiniChart data={summary.termlyPaperTrend} />
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  {summary.termlyPaperTrend.slice(0, 5).map((d) => <span key={d.week}>{d.week}</span>)}
                </div>
              </div>
            </div>
          )}

          {/* School comparison table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
              <h3 className="font-black text-slate-900 dark:text-white flex items-center gap-2 flex-1">
                <Building2 className="w-4 h-4 text-indigo-500" /> School Compliance Report
              </h3>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search school..."
                    className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-44"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ComplianceStatus | 'ALL')}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="GREEN">Green</option>
                  <option value="AMBER">Amber</option>
                  <option value="RED">Red</option>
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSchools.map((school) => {
                const comp = compliance.find((c) => c.schoolId === school.schoolId);
                const isExpanded = expandedSchoolId === school.schoolId;
                return (
                  <div key={school.schoolId}>
                    <button
                      onClick={() => setExpandedSchoolId(isExpanded ? null : school.schoolId)}
                      className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{school.schoolName}</p>
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${school.subscriptionTier === 'NONE' ? 'bg-slate-100 dark:bg-slate-700 text-slate-500' : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                              {school.subscriptionTier === 'NONE' ? 'No Sub' : school.subscriptionTier.replace('SCHOOL_', '')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{school.totalTeachers} teachers · {school.totalDepartments} departments · {school.totalPapers} papers</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <ComplianceBadge status={comp?.complianceStatus ?? 'UNKNOWN'} score={comp?.compliancePercent} />
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 bg-slate-50/50 dark:bg-slate-800/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { label: 'Draft Papers', value: school.draftPapers, color: 'text-slate-600' },
                            { label: 'Pending Review', value: school.pendingReviewPapers, color: 'text-amber-600' },
                            { label: 'Approved', value: school.approvedPapers, color: 'text-emerald-600' },
                            { label: 'Locked', value: school.lockedPapers, color: 'text-indigo-600' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="bg-white dark:bg-slate-800 rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
                              <p className="text-[11px] text-slate-500">{label}</p>
                              <p className={`text-xl font-black ${color}`}>{value}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 flex items-center gap-1"><Zap className="w-3 h-3 text-violet-500" /> AI Credits</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{school.aiCreditsUsed.toLocaleString()} / {school.aiCreditsTotal > 0 ? school.aiCreditsTotal.toLocaleString() : '—'}</span>
                          </div>
                          {school.aiCreditsTotal > 0 && (
                            <ProgressBar value={school.aiCreditsUsed} max={school.aiCreditsTotal} color={school.aiCreditsUsed / school.aiCreditsTotal > 0.85 ? 'bg-red-500' : 'bg-violet-500'} />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <span>Last Active: {school.lastActiveAt ? new Date(school.lastActiveAt).toLocaleDateString() : 'Never'}</span>
                          <span>Expires: {school.subscriptionExpiresAt ? new Date(school.subscriptionExpiresAt).toLocaleDateString() : 'No subscription'}</span>
                        </div>

                        {comp && comp.complianceStatus !== 'GREEN' && (
                          <button
                            onClick={async () => {
                              const reason = prompt(`Reason for flagging ${school.schoolName} for inspection:`);
                              if (!reason) return;
                              await districtService.flagSchoolForInspection(DEMO_DISTRICT_ID, school.schoolId, 'district_admin_001', district?.adminName ?? 'District Admin', reason);
                              alert(`${school.schoolName} has been flagged for inspection.`);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold transition-colors border border-red-200 dark:border-red-800"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" /> Flag for Inspection
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
