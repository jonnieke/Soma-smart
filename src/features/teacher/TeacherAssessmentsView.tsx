import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Clock,
  CheckCircle,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  Search,
  Zap,
} from 'lucide-react';
import { assessmentAssignmentService } from '../../services/assessmentAssignmentService';
import { AssessmentAssignment, AssignmentStatus } from '../../types/assessmentDelivery';
import { AssessmentAssignmentModal } from './AssessmentAssignmentModal';

const StatusBadge: React.FC<{ status: AssignmentStatus }> = ({ status }) => {
  const map: Record<AssignmentStatus, { cls: string; label: string }> = {
    draft: { cls: 'bg-slate-100 text-slate-600', label: 'Draft' },
    scheduled: { cls: 'bg-blue-50 text-blue-700', label: 'Scheduled' },
    open: { cls: 'bg-emerald-50 text-emerald-700', label: 'Open' },
    closed: { cls: 'bg-slate-100 text-slate-600', label: 'Closed' },
    marking: { cls: 'bg-amber-50 text-amber-700', label: 'Marking' },
    moderation: { cls: 'bg-violet-50 text-violet-700', label: 'Moderation' },
    results_ready: { cls: 'bg-indigo-50 text-indigo-700', label: 'Results Ready' },
    released: { cls: 'bg-emerald-100 text-emerald-800', label: 'Released' },
    archived: { cls: 'bg-slate-100 text-slate-400', label: 'Archived' },
  };
  const { cls, label } = map[status] ?? { cls: 'bg-slate-100 text-slate-600', label: status };
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${cls}`}>{label}</span>;
};

export const TeacherAssessmentsView: React.FC = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<AssessmentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

  useEffect(() => {
    assessmentAssignmentService.getAssignments().then((res) => {
      setAssignments(res);
      setLoading(false);
    });
  }, []);

  const filtered = assignments.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (searchQuery && !a.assessmentTitle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {selectedPaperId && (
        <AssessmentAssignmentModal
          paperId={selectedPaperId}
          onClose={() => setSelectedPaperId(null)}
          onAssigned={() => {
            setSelectedPaperId(null);
            assessmentAssignmentService.getAssignments().then(setAssignments);
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600" /> Soma Assessment Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-1">Manage assessment delivery, assignments, online testing, and marking pipelines.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/teacher/marking')}
            className="px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" /> Marking Centre
          </button>
          <button
            onClick={() => setSelectedPaperId('paper_kcse_math_2026')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Assign New Assessment
          </button>
        </div>
      </div>

      {/* Search & Filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search assessment title..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="open">Open</option>
          <option value="marking">Marking</option>
          <option value="results_ready">Results Ready</option>
          <option value="released">Released</option>
        </select>
      </div>

      {/* Assignments list */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-600 dark:text-slate-400">No assessment assignments found.</p>
          <button onClick={() => setSelectedPaperId('paper_kcse_math_2026')} className="mt-3 text-xs text-indigo-600 font-bold hover:underline">
            Assign your first examination
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((asgn) => (
            <div key={asgn.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30">
                    {asgn.deliveryMode} Mode
                  </span>
                  <StatusBadge status={asgn.status} />
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">{asgn.assessmentTitle}</h3>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-indigo-500" /> {asgn.streamNames?.join(', ') || 'Assigned Class'}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-slate-400" /> {asgn.durationMinutes} mins</div>
                  <div className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-violet-500" /> {asgn.totalMarks} Marks</div>
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-emerald-500" /> Closes: {asgn.closesAt ? new Date(asgn.closesAt).toLocaleDateString() : 'No limit'}</div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => navigate(`/teacher/results/${asgn.id}`)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  View Analytics <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => navigate('/teacher/marking')}
                  className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Marking Workspace
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
