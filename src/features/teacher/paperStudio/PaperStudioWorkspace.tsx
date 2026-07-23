import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  PlusCircle,
  Upload,
  BookOpen,
  FolderOpen,
  Sparkles,
  Clock,
  CheckCircle2,
  Copy,
  Trash2,
  Edit3,
  Coins,
  TrendingUp,
  Award,
  ArrowRight,
  Search,
  School,
  ShoppingBag,
} from 'lucide-react';
import { ExamPaper, PaperStudioMetrics } from '../../../types/paperStudio';
import { paperStudioService } from '../../../services/paperStudioService';
import { launchFeatures } from '../../../config/launchFeatures';
import { UploadPaperModal } from './UploadPaperModal';

interface WorkspaceProps {
  onNavigateToWizard: () => void;
  onOpenPaperEditor: (paperId: string) => void;
  onOpenQuestionBank: () => void;
  onOpenUploadModal?: () => void;
}

export const PaperStudioWorkspace: React.FC<WorkspaceProps> = ({
  onNavigateToWizard,
  onOpenPaperEditor,
  onOpenQuestionBank,
  onOpenUploadModal,
}) => {
  const navigate = useNavigate();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [metrics, setMetrics] = useState<PaperStudioMetrics>({
    draftCount: 0,
    completedCount: 0,
    savedQuestionsCount: 0,
    remainingCredits: 250,
    marketplaceEarningsKes: 0,
  });
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [activeTab, setActiveTab] = useState<'MY_PAPERS' | 'DRAFTS' | 'COMPLETED'>('MY_PAPERS');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  const loadWorkspaceData = async () => {
    setLoading(true);
    try {
      const data = await paperStudioService.getAllPapers();
      const m = await paperStudioService.getMetrics();
      setPapers(data);
      setMetrics(m);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const copy = await paperStudioService.duplicatePaper(id);
    if (copy) {
      loadWorkspaceData();
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this exam paper?')) {
      await paperStudioService.deletePaper(id);
      loadWorkspaceData();
    }
  };

  const filteredPapers = papers.filter((p) => {
    if (activeTab === 'DRAFTS' && p.status !== 'DRAFT') return false;
    if (activeTab === 'COMPLETED' && p.status === 'DRAFT') return false;
    if (!searchQuery) return true;
    return (
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.grade.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ── HERO BANNER ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-10 text-white shadow-xl border border-indigo-800/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-black text-indigo-300 border border-indigo-400/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Soma Paper Studio &amp; Assessment Engine
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Create professional exams in minutes
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-2xl">
            Build curriculum-aligned CATs, quizzes, mocks, revision papers, and end-of-term examinations from SomaAI&apos;s question bank or your own custom materials.
          </p>

          {/* Primary Workspace Quick Actions */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToWizard}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm font-black text-white shadow-lg transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-5 h-5" />
              Create New Paper
            </button>

            {launchFeatures.uploadBlueprintEnabled && (
              <button
                onClick={() => (onOpenUploadModal ? onOpenUploadModal() : setShowUploadModal(true))}
                className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 px-5 py-3 text-sm font-bold text-white transition backdrop-blur"
              >
                <Upload className="w-4 h-4 text-indigo-300" />
                Upload Paper Blueprint
              </button>
            )}

            <button
              onClick={onOpenQuestionBank}
              className="inline-flex items-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 px-5 py-3 text-sm font-bold text-white transition backdrop-blur"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              Browse Question Bank
            </button>
          </div>
        </div>
      </section>

      {/* ── METRICS SUMMARY CARDS ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Draft Papers</span>
            <FolderOpen className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.draftCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.completedCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Question Bank</span>
            <BookOpen className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.savedQuestionsCount}</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">AI Credits</span>
            <Coins className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{metrics.remainingCredits}</p>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Earnings</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600">
            KES {metrics.marketplaceEarningsKes}
          </p>
        </div>
      </section>

      {/* ── MY PAPERS REPOSITORY ── */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">My Examination Papers</h2>
            <p className="text-xs text-slate-500 font-medium">
              Manage your examination drafts, completed test papers, and printing blueprints.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search papers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setActiveTab('MY_PAPERS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'MY_PAPERS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                All ({papers.length})
              </button>
              <button
                onClick={() => setActiveTab('DRAFTS')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'DRAFTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Drafts ({metrics.draftCount})
              </button>
              <button
                onClick={() => setActiveTab('COMPLETED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  activeTab === 'COMPLETED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                }`}
              >
                Completed ({metrics.completedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Papers Grid */}
        {filteredPapers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                onClick={() => onOpenPaperEditor(paper.id)}
                className="group relative rounded-2xl border border-slate-200 bg-white p-5 hover:border-indigo-400 hover:shadow-md transition cursor-pointer space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {paper.grade}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-slate-100 text-slate-700">
                        {paper.examType}
                      </span>
                      {paper.status === 'DRAFT' ? (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                          Draft
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Ready
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2">
                      {paper.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
                  <span>{paper.subject}</span>
                  <span>{paper.totalMarks} Marks · {paper.durationMinutes}m</span>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(paper.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDuplicate(paper.id, e)}
                      title="Duplicate Paper"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(paper.id, e)}
                      title="Delete Paper"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenPaperEditor(paper.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-extrabold text-xs hover:bg-indigo-700 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">No examination papers found</h4>
              <p className="text-xs text-slate-500 mt-1">
                Start by creating a new paper using the step-by-step assembly wizard.
              </p>
            </div>
            <button
              onClick={onNavigateToWizard}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-black text-white hover:bg-indigo-700 transition"
            >
              <PlusCircle className="w-4 h-4" />
              Create Your First Paper
            </button>
          </div>
        )}
      </section>

      {/* Upload Paper Modal */}
      <UploadPaperModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onPaperCreated={(id) => onOpenPaperEditor(id)}
      />
    </div>
  );
};
