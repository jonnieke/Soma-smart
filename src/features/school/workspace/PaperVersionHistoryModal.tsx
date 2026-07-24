import React, { useEffect, useState } from 'react';
import { History, X, Calendar, User, FileText, CheckCircle2, RotateCcw, Copy } from 'lucide-react';
import { PaperVersion } from '../../../types/schoolWorkspace';
import { schoolReviewService } from '../../../services/schoolReviewService';
import { paperStudioService } from '../../../services/paperStudioService';

interface PaperVersionHistoryModalProps {
  paperId: string;
  isOpen: boolean;
  onClose: () => void;
  onPaperRestored?: (paperId: string) => void;
}

export const PaperVersionHistoryModal: React.FC<PaperVersionHistoryModalProps> = ({
  paperId,
  isOpen,
  onClose,
  onPaperRestored,
}) => {
  const [versions, setVersions] = useState<PaperVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PaperVersion | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && paperId) {
      loadVersions();
    }
  }, [isOpen, paperId]);

  const loadVersions = async () => {
    setIsLoading(true);
    const data = await schoolReviewService.getPaperVersions(paperId);
    setVersions(data);
    if (data.length > 0) setSelectedVersion(data[0]);
    setIsLoading(false);
  };

  const handleDuplicateVersion = async (version: PaperVersion) => {
    if (!version.snapshot) return;
    const copy = {
      ...version.snapshot,
      id: `paper_ver_copy_${Date.now()}`,
      title: `${version.snapshot.title} (From v${version.versionNumber})`,
      status: 'DRAFT' as const,
      workflowStatus: 'DRAFT' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await paperStudioService.savePaper(copy);
    alert(`Created new draft copy from Version ${version.versionNumber}!`);
    if (onPaperRestored) onPaperRestored(copy.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Paper Version History</h2>
              <p className="text-xs text-slate-500 font-medium">
                Track change snapshots, audit edits, and restore draft versions.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Timeline */}
          <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto space-y-3">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading history...</div>
            ) : versions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No previous version snapshots saved.</div>
            ) : (
              versions.map((ver) => (
                <div
                  key={ver.id}
                  onClick={() => setSelectedVersion(ver)}
                  className={`p-3 rounded-2xl border transition cursor-pointer space-y-2 ${
                    selectedVersion?.id === ver.id
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-indigo-600 dark:text-indigo-400">Version {ver.versionNumber}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-black bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {ver.newStatus}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-1">{ver.changeSummary}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500">
                    <User className="w-3 h-3" />
                    <span>{ver.editorName}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(ver.timestamp).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right Version Detail */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {selectedVersion ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Version {selectedVersion.versionNumber} Snapshot
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Edited by <span className="font-bold text-slate-700 dark:text-slate-300">{selectedVersion.editorName}</span> on{' '}
                      {new Date(selectedVersion.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDuplicateVersion(selectedVersion)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate into New Draft
                  </button>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-400">Change Summary</h4>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {selectedVersion.changeSummary}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Total Questions</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      {selectedVersion.questionsCount} Questions
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Total Marks</span>
                    <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                      {selectedVersion.totalMarks} Marks
                    </div>
                  </div>
                </div>

                {selectedVersion.snapshot && selectedVersion.snapshot.sections && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-400">Section Structure</h4>
                    <div className="space-y-2">
                      {selectedVersion.snapshot.sections.map((sec: any) => (
                        <div key={sec.id} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex justify-between">
                          <span>{sec.title}</span>
                          <span className="text-slate-400">{sec.questions.length} questions ({sec.totalMarks} marks)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Select a version from the left timeline to view snapshot details.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
