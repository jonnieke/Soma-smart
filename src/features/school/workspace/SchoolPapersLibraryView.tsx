import { Filter, Lock, Unlock, Plus, History, Search, ArrowRightLeft } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { paperStudioService } from '../../../services/paperStudioService';
import { schoolReviewService } from '../../../services/schoolReviewService';
import { schoolWorkspaceService } from '../../../services/schoolWorkspaceService';
import { ExamPaper } from '../../../types/paperStudio';
import { PaperVisibility, PaperWorkflowStatus, SchoolDepartment } from '../../../types/schoolWorkspace';
import { PaperVersionHistoryModal } from './PaperVersionHistoryModal';

interface SchoolPapersLibraryViewProps {
  onCreatePaper: () => void;
  onOpenPaper: (id: string) => void;
}

export const SchoolPapersLibraryView: React.FC<SchoolPapersLibraryViewProps> = ({
  onCreatePaper,
  onOpenPaper,
}) => {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [departments, setDepartments] = useState<SchoolDepartment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');

  // Version modal state
  const [selectedPaperForVersion, setSelectedPaperForVersion] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const paperList = await paperStudioService.getAllPapers();
    setPapers(paperList);

    const deptList = await schoolWorkspaceService.getDepartments();
    setDepartments(deptList);
  };

  const handleDuplicate = async (paperId: string) => {
    const copy = await paperStudioService.duplicatePaper(paperId);
    if (copy) {
      alert(`Created new draft copy: "${copy.title}"`);
      await loadData();
    }
  };

  const handleLock = async (paper: ExamPaper) => {
    if (paper.workflowStatus === 'LOCKED') {
      const reason = prompt('Enter a detailed reason for unlocking this examination paper:');
      if (!reason) return;
      try {
        await schoolReviewService.unlockPaper({
          paperId: paper.id,
          schoolId: paper.schoolId || 'default_school',
          userId: 'user_principal',
          userName: 'Principal Dr. Otieno',
          userRole: 'ADMIN',
          reason,
        });
        alert('Paper unlocked and returned to draft mode.');
        await loadData();
      } catch (err: any) {
        alert(err.message);
      }
    } else {
      if (confirm('Lock this approved examination paper to prevent further edits?')) {
        try {
          await schoolReviewService.lockPaper({
            paperId: paper.id,
            schoolId: paper.schoolId || 'default_school',
            userId: 'user_principal',
            userName: 'Principal Dr. Otieno',
            userRole: 'ADMIN',
          });
          alert('Examination paper is now locked.');
          await loadData();
        } catch (err: any) {
          alert(err.message);
        }
      }
    }
  };

  const handleMoveVisibility = async (paper: ExamPaper, newVisibility: PaperVisibility) => {
    if (confirm(`Move visibility of "${paper.title}" to ${newVisibility.toUpperCase()}? Original author attribution will be preserved.`)) {
      paper.visibility = newVisibility;
      if (newVisibility === 'SCHOOL' || newVisibility === 'DEPARTMENT') {
        paper.schoolId = paper.schoolId || 'default_school';
      }
      await paperStudioService.savePaper(paper);
      await loadData();
    }
  };

  const filteredPapers = papers.filter((p) => {
    if (searchQuery && !p.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (statusFilter !== 'ALL' && (p.workflowStatus || p.status) !== statusFilter) return false;
    if (gradeFilter !== 'ALL' && p.grade !== gradeFilter) return false;
    if (subjectFilter !== 'ALL' && p.subject !== subjectFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Shared School Paper Library</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Access, review, lock, and manage examination papers across all departments.
          </p>
        </div>

        <button
          onClick={onCreatePaper}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Create School Paper
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search papers by title or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED_FOR_REVIEW">Submitted for Review</option>
              <option value="CHANGES_REQUESTED">Changes Requested</option>
              <option value="APPROVED">Approved</option>
              <option value="LOCKED">Locked</option>
            </select>
          </div>

          {/* Grade Filter */}
          <div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Grades / Forms</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Form 1">Form 1</option>
              <option value="Form 2">Form 2</option>
              <option value="Form 3">Form 3</option>
              <option value="Form 4">Form 4</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Integrated Science">Integrated Science</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Physics">Physics</option>
              <option value="Biology">Biology</option>
              <option value="English">English</option>
              <option value="Kiswahili">Kiswahili</option>
            </select>
          </div>
        </div>
      </div>

      {/* Papers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-black uppercase text-slate-400 tracking-wider">
                <th className="py-4 px-6">Paper Title &amp; Details</th>
                <th className="py-4 px-4">Subject / Grade</th>
                <th className="py-4 px-4">Exam Type</th>
                <th className="py-4 px-4">Status</th>
                <th className="py-4 px-4">Visibility</th>
                <th className="py-4 px-4">Version</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredPapers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No examination papers found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPapers.map((paper) => {
                  const isLocked = paper.workflowStatus === 'LOCKED';
                  return (
                    <tr
                      key={paper.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Title */}
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <button
                            onClick={() => onOpenPaper(paper.id)}
                            className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 text-left line-clamp-1"
                          >
                            {paper.title}
                          </button>
                          <div className="text-[11px] text-slate-400">
                            Created by Mwalimu Peterson • Updated {new Date(paper.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>

                      {/* Subject */}
                      <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                        {paper.subject}
                        <div className="text-[10px] text-slate-400">{paper.grade}</div>
                      </td>

                      {/* Exam Type */}
                      <td className="py-4 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                        {paper.examType}
                        <div className="text-[10px] text-slate-400">{paper.totalMarks} Marks • {paper.durationMinutes} min</div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide inline-flex items-center gap-1 ${
                          isLocked
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : paper.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : paper.workflowStatus === 'SUBMITTED_FOR_REVIEW'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {isLocked && <Lock className="w-3 h-3" />}
                          {paper.workflowStatus || paper.status}
                        </span>
                      </td>

                      {/* Visibility */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <span className="capitalize font-bold text-slate-600 dark:text-slate-400">
                            {paper.visibility || 'school'}
                          </span>
                          <button
                            title="Change visibility"
                            onClick={() =>
                              handleMoveVisibility(
                                paper,
                                paper.visibility === 'SCHOOL' ? 'DEPARTMENT' : 'SCHOOL'
                              )
                            }
                            className="p-1 text-slate-400 hover:text-indigo-600"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Version */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => setSelectedPaperForVersion(paper.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-black text-slate-700 dark:text-slate-300 text-[11px] hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <History className="w-3 h-3" />
                          v{paper.version || 1}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenPaper(paper.id)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 font-bold text-slate-700 dark:text-slate-200"
                          >
                            Open
                          </button>

                          <button
                            onClick={() => handleDuplicate(paper.id)}
                            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 font-bold text-slate-700 dark:text-slate-200"
                          >
                            Duplicate
                          </button>

                          <button
                            onClick={() => handleLock(paper)}
                            className={`p-1.5 rounded-xl border transition ${
                              isLocked
                                ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title={isLocked ? 'Unlock Paper' : 'Lock Paper'}
                          >
                            {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Version History Modal */}
      {selectedPaperForVersion && (
        <PaperVersionHistoryModal
          paperId={selectedPaperForVersion}
          isOpen={Boolean(selectedPaperForVersion)}
          onClose={() => setSelectedPaperForVersion(null)}
          onPaperRestored={() => loadData()}
        />
      )}
    </div>
  );
};
