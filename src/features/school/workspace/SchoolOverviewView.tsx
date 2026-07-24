import React, { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Database,
  Users,
  Zap,
  Plus,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  FolderPlus,
  LayoutTemplate,
  History,
} from 'lucide-react';
import { ExamPaper } from '../../../types/paperStudio';
import { SchoolActivityLog, AssessmentDeadline } from '../../../types/schoolWorkspace';
import { paperStudioService } from '../../../services/paperStudioService';
import { schoolWorkspaceService } from '../../../services/schoolWorkspaceService';
import { schoolCreditService } from '../../../services/schoolCreditService';
import { schoolAuditService } from '../../../services/schoolAuditService';

interface SchoolOverviewViewProps {
  onNavigateTab: (tab: string) => void;
  onCreatePaper: () => void;
  onOpenPaper: (id: string) => void;
}

export const SchoolOverviewView: React.FC<SchoolOverviewViewProps> = ({
  onNavigateTab,
  onCreatePaper,
  onOpenPaper,
}) => {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [activities, setActivities] = useState<SchoolActivityLog[]>([]);
  const [deadlines, setDeadlines] = useState<AssessmentDeadline[]>([]);
  const [creditsRemaining, setCreditsRemaining] = useState<number>(5000);
  const [questionsCount, setQuestionsCount] = useState<number>(0);
  const [teachersCount, setTeachersCount] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const paperList = await paperStudioService.getAllPapers();
    setPapers(paperList);

    const questions = await paperStudioService.getQuestionBank();
    setQuestionsCount(questions.length);

    const members = await schoolWorkspaceService.getMemberships();
    setTeachersCount(members.filter((m) => m.status === 'active').length);

    const alloc = await schoolCreditService.getSchoolCreditAllocation('default_school');
    setCreditsRemaining(alloc.remainingCredits);

    const logs = await schoolAuditService.getAuditLogs('default_school');
    setActivities(logs.slice(0, 8));

    const dl = await schoolWorkspaceService.getAssessmentDeadlines();
    setDeadlines(dl);
  };

  const draftCount = papers.filter((p) => p.status === 'DRAFT' || p.workflowStatus === 'IN_PROGRESS').length;
  const reviewCount = papers.filter((p) => p.status === 'REVIEWED' || p.workflowStatus === 'SUBMITTED_FOR_REVIEW').length;
  const changesCount = papers.filter((p) => p.workflowStatus === 'CHANGES_REQUESTED').length;
  const approvedCount = papers.filter((p) => p.status === 'APPROVED' || p.workflowStatus === 'APPROVED' || p.workflowStatus === 'LOCKED').length;

  return (
    <div className="space-y-8">
      {/* Primary Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Official Examination Board Workspace
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              School Assessment &amp; Examination Portal
            </h1>
            <p className="text-sm text-indigo-100/80 font-medium">
              Collaborative exam paper production, department review workflow, and secure archiving.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onCreatePaper}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-indigo-900 font-black text-sm hover:bg-indigo-50 transition shadow-lg"
            >
              <Plus className="w-5 h-5 text-indigo-600" />
              Create School Paper
            </button>

            <button
              onClick={() => onNavigateTab('reviews')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600/60 hover:bg-indigo-600 text-white font-bold text-sm border border-indigo-400/30 backdrop-blur transition"
            >
              <Clock className="w-5 h-5" />
              Review Queue ({reviewCount})
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div
          onClick={() => onNavigateTab('papers')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition cursor-pointer space-y-2"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{draftCount}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Draft Papers</div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('reviews')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition cursor-pointer space-y-2"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{reviewCount}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Awaiting Review</div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('papers')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition cursor-pointer space-y-2"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{changesCount}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Changes Req.</div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('papers')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition cursor-pointer space-y-2"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{approvedCount}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Approved Papers</div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('questions')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition cursor-pointer space-y-2"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{questionsCount}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">School Questions</div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('teachers')}
          className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition cursor-pointer space-y-2"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{teachersCount}</div>
            <div className="text-[11px] font-bold text-slate-500 uppercase">Active Teachers</div>
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('usage')}
          className="col-span-2 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/50 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">Term Balance</span>
          </div>
          <div>
            <div className="text-xl font-black text-slate-900 dark:text-white">{creditsRemaining.toLocaleString()} AI Credits</div>
            <div className="text-[11px] font-semibold text-slate-500">School Shared Allocation</div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab('teachers')}
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              Invite Teachers <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Onboard new teachers and assign department roles.
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('departments')}
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
            <FolderPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              Departments <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Organize subjects, grades, and HOD reviewers.
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('templates')}
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              Exam Templates <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Configure school headers, logos, and formatting rules.
            </p>
          </div>
        </button>

        <button
          onClick={() => onNavigateTab('reviews')}
          className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-500 text-left transition space-y-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
              Review &amp; Approve <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Validate question quality, mark schemes, and approve papers.
            </p>
          </div>
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upcoming Deadlines & Recent Papers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming Exam Deadlines */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Upcoming Examination Deadlines
              </h2>
              <span className="text-xs font-bold text-slate-500">{deadlines.length} Scheduled</span>
            </div>

            <div className="space-y-3">
              {deadlines.map((dl) => (
                <div
                  key={dl.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                        {dl.grade} • {dl.subject}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{dl.term}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{dl.title}</h3>
                    <p className="text-xs text-slate-500">Owner: {dl.paperOwnerName || 'Unassigned'}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Draft Due</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{dl.draftDueDate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px] font-bold uppercase">Exam Date</div>
                      <div className="font-bold text-indigo-600 dark:text-indigo-400">{dl.examDate}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent School Papers */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Recent School Examination Papers
              </h2>
              <button
                onClick={() => onNavigateTab('papers')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                View All Library &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {papers.slice(0, 4).map((paper) => (
                <div
                  key={paper.id}
                  onClick={() => onOpenPaper(paper.id)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl cursor-pointer transition"
                >
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white hover:text-indigo-600">
                      {paper.title}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span>{paper.grade}</span>
                      <span>•</span>
                      <span>{paper.subject}</span>
                      <span>•</span>
                      <span>{paper.totalMarks} Marks</span>
                    </div>
                  </div>

                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                    paper.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {paper.workflowStatus || paper.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: School Activity Log */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Recent Activity Log
              </h2>
            </div>

            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No school activity logged yet.</div>
              ) : (
                activities.map((log) => (
                  <div key={log.id} className="p-3 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-bold text-slate-900 dark:text-slate-200">{log.actorName}</span>
                      <span className="text-[10px]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase text-[10px] mr-1">
                        [{log.action}]
                      </span>
                      {log.targetTitle || log.targetId}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
