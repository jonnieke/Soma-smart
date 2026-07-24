import React, { useEffect, useState } from 'react';
import { UserCheck, CheckCircle2, AlertCircle, MessageSquare, Lock, X, Send, Eye, ShieldAlert } from 'lucide-react';
import { ExamPaper, Question } from '../../../types/paperStudio';
import { ReviewComment } from '../../../types/schoolWorkspace';
import { paperStudioService } from '../../../services/paperStudioService';
import { schoolReviewService } from '../../../services/schoolReviewService';

interface ReviewQueueViewProps {
  onOpenPaper: (id: string) => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({ onOpenPaper }) => {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<ExamPaper | null>(null);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [changesReason, setChangesReason] = useState('');
  const [isChangesModalOpen, setIsChangesModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadPendingPapers();
  }, []);

  const loadPendingPapers = async () => {
    const all = await paperStudioService.getAllPapers();
    const reviewList = all.filter(
      (p) =>
        p.status === 'REVIEWED' ||
        p.workflowStatus === 'SUBMITTED_FOR_REVIEW' ||
        p.workflowStatus === 'UNDER_REVIEW' ||
        p.workflowStatus === 'CHANGES_REQUESTED'
    );
    setPapers(reviewList);
    if (reviewList.length > 0) handleSelectPaper(reviewList[0]);
  };

  const handleSelectPaper = async (paper: ExamPaper) => {
    setSelectedPaper(paper);
    setErrorMsg(null);
    const comms = await schoolReviewService.getComments(paper.id);
    setComments(comms);
  };

  const handleApprove = async () => {
    if (!selectedPaper) return;
    setErrorMsg(null);

    try {
      await schoolReviewService.approvePaper({
        paperId: selectedPaper.id,
        schoolId: selectedPaper.schoolId || 'default_school',
        approverId: 'user_hod_math', // Current HOD/Reviewer session
        approverName: 'Mr. Kamau (HOD)',
        approverRole: 'HOD',
        requireIndependentReviewer: true,
        approvalNotes: 'Approved for official school examination production.',
      });

      alert(`Paper "${selectedPaper.title}" successfully approved!`);
      await loadPendingPapers();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaper || !changesReason.trim()) return;

    try {
      await schoolReviewService.requestChanges({
        paperId: selectedPaper.id,
        schoolId: selectedPaper.schoolId || 'default_school',
        reviewerId: 'user_hod_math',
        reviewerName: 'Mr. Kamau (HOD)',
        reviewerRole: 'HOD',
        feedback: changesReason,
      });

      setIsChangesModalOpen(false);
      setChangesReason('');
      alert('Requested changes sent back to paper creator.');
      await loadPendingPapers();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaper || !newCommentText.trim()) return;

    const comm = await schoolReviewService.addComment({
      schoolId: selectedPaper.schoolId || 'default_school',
      paperId: selectedPaper.id,
      authorId: 'user_hod_math',
      authorName: 'Mr. Kamau (HOD)',
      authorRole: 'HOD',
      comment: newCommentText,
    });

    setComments((prev) => [...prev, comm]);
    setNewCommentText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-indigo-600" />
          Departmental Examination Review Queue
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Quality assurance, question-level comments, mark scheme verification, and HOD approvals.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Review Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Paper List */}
        <div className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Pending Papers ({papers.length})
          </h2>

          <div className="space-y-2">
            {papers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                No examination papers currently pending review.
              </div>
            ) : (
              papers.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectPaper(p)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                    selectedPaper?.id === p.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                      {p.workflowStatus || p.status}
                    </span>
                    <span className="font-bold text-slate-400">{p.grade}</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                    {p.title}
                  </h3>

                  <div className="text-[11px] text-slate-500 font-medium">
                    {p.subject} • {p.totalMarks} Marks • Submitted by Mwalimu Peterson
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Selected Paper Detail & Comments */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPaper ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
              {/* Paper Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                      {selectedPaper.grade} • {selectedPaper.subject}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      Duration: {selectedPaper.durationMinutes} mins
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {selectedPaper.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpenPaper(selectedPaper.id)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-50"
                  >
                    <Eye className="w-4 h-4" />
                    Full Preview
                  </button>

                  <button
                    onClick={() => setIsChangesModalOpen(true)}
                    className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black"
                  >
                    Request Changes
                  </button>

                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm"
                  >
                    Approve Paper
                  </button>
                </div>
              </div>

              {/* Question Sections Preview */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Paper Section Breakdown
                </h3>

                {selectedPaper.sections.map((sec, sIdx) => (
                  <div key={sec.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white flex justify-between">
                      <span>{sec.title}</span>
                      <span className="text-slate-400">{sec.totalMarks} Marks</span>
                    </h4>

                    <div className="space-y-2">
                      {sec.questions.map((q, qIdx) => (
                        <div key={q.id || qIdx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                          <div className="font-semibold text-slate-900 dark:text-slate-200 flex justify-between">
                            <span>Q{qIdx + 1}. {q.questionText}</span>
                            <span className="text-indigo-600 font-bold ml-2">({q.marks}m)</span>
                          </div>
                          {q.markingScheme && (
                            <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                              Marking Scheme: {q.markingScheme.map(m => `${m.criterion} (${m.marks}m)`).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Review Comments Thread */}
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Review Comments &amp; Feedback ({comments.length})
                </h3>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <div className="text-xs text-slate-400 italic">No review comments yet.</div>
                  ) : (
                    comments.map((c) => (
                      <div key={c.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500 font-bold">
                          <span>{c.authorName} ({c.authorRole})</span>
                          <span className="text-[10px]">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">{c.comment}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input */}
                <form onSubmit={handleAddComment} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Leave a review comment or question suggestion..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                  >
                    Post Comment
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-400">
              Select a paper from the pending queue to begin review.
            </div>
          )}
        </div>
      </div>

      {/* Request Changes Modal */}
      {isChangesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Request Changes</h2>
              <button onClick={() => setIsChangesModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestChanges} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                  Required Changes &amp; Feedback
                </label>
                <textarea
                  required
                  placeholder="Specify question revisions or mark adjustments required..."
                  value={changesReason}
                  onChange={(e) => setChangesReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 h-28"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsChangesModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black"
                >
                  Send Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
