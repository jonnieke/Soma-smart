import React, { useEffect, useState } from 'react';
import { School, FolderOpen, CheckCircle2, Clock, ShieldCheck, FileText, ArrowLeft, Building2, UserCheck } from 'lucide-react';
import { schoolWorkspaceService, DepartmentInfo, SchoolReviewItem } from '../../../services/schoolWorkspaceService';
import { SchoolBranding } from '../../../types/paperStudio';

interface SchoolWorkspaceProps {
  onBack: () => void;
  onOpenPaper: (paperId: string) => void;
}

export const SchoolWorkspace: React.FC<SchoolWorkspaceProps> = ({ onBack, onOpenPaper }) => {
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);
  const [branding, setBranding] = useState<SchoolBranding>({
    schoolName: 'Nairobi Academy High School',
    teacherName: 'Mwalimu Peterson',
    candidateNameField: true,
    admissionNoField: true,
  });
  const [reviews, setReviews] = useState<SchoolReviewItem[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  useEffect(() => {
    setDepartments(schoolWorkspaceService.getDepartments());
    setBranding(schoolWorkspaceService.getSchoolBranding());
    setReviews(schoolWorkspaceService.getReviewQueue());
  }, []);

  const handleApprove = async (id: string) => {
    await schoolWorkspaceService.approveSchoolPaper(id);
    setReviews(schoolWorkspaceService.getReviewQueue());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{branding.schoolName} Workspace</h1>
            <p className="text-xs text-slate-500 font-medium">
              Shared department folders, exam archives, and HOD approval workflow.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          School Verified Workspace
        </div>
      </div>

      {/* Departments Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-500">Department Libraries</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition cursor-pointer space-y-3"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 truncate">{dept.name}</h3>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">HOD: {dept.hodName}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                <span>{dept.paperCount} Papers</span>
                <span>Open &rarr;</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Review & Approval Queue */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            HOD Approval &amp; Review Queue
          </h2>
          <span className="text-xs font-bold text-slate-500">{reviews.length} Pending Review(s)</span>
        </div>

        <div className="space-y-3">
          {reviews.map((rev) => (
            <div
              key={rev.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-slate-50"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-100 text-amber-800">
                    {rev.status}
                  </span>
                  <span className="text-xs font-bold text-slate-500">• {rev.departmentId}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{rev.paperTitle}</h3>
                <p className="text-xs text-slate-500 font-medium">Submitted by {rev.teacherName}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenPaper(rev.paperId)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50"
                >
                  Preview Paper
                </button>
                {rev.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleApprove(rev.id)}
                    className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm"
                  >
                    Approve for School Archive
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
