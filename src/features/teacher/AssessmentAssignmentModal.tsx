import React, { useState } from 'react';
import { X, Calendar, Clock, Lock, Users, Zap, CheckCircle, Copy, MessageCircle, Check, Share2, Plus } from 'lucide-react';
import { assessmentAssignmentService } from '../../services/assessmentAssignmentService';
import { DeliveryMode, ResultReleasePolicy, FeedbackReleasePolicy } from '../../types/assessmentDelivery';
import { useApp } from '../../context/AppContext';

interface Props {
  paperId: string;
  onClose: () => void;
  onAssigned: () => void;
}

export const AssessmentAssignmentModal: React.FC<Props> = ({ paperId, onClose, onAssigned }) => {
  const { teacherProfile, userId } = useApp();
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('online');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [accessCode, setAccessCode] = useState(() => `EXAM-${Math.floor(1000 + Math.random() * 9000)}`);
  const [resultReleasePolicy, setResultReleasePolicy] = useState<ResultReleasePolicy>('AFTER_MARKING');
  const [feedbackReleasePolicy, setFeedbackReleasePolicy] = useState<FeedbackReleasePolicy>('SCORES_AND_FEEDBACK');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['class_form4_east']);
  const [customClassInput, setCustomClassInput] = useState('');
  const [availableClassList, setAvailableClassList] = useState([
    { id: 'class_form4_east', name: 'Form 4 East' },
    { id: 'class_form4_west', name: 'Form 4 West' },
    { id: 'class_form3_north', name: 'Form 3 North' },
    { id: 'class_grade8_a', name: 'Grade 8 Alpha' },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [assignedResult, setAssignedResult] = useState<{ id: string; accessCode?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAddCustomClass = () => {
    if (!customClassInput.trim()) return;
    const newId = `class_custom_${Date.now()}`;
    const newName = customClassInput.trim();
    setAvailableClassList(prev => [...prev, { id: newId, name: newName }]);
    setSelectedClasses(prev => [...prev, newId]);
    setCustomClassInput('');
  };

  const handleAssign = async () => {
    if (selectedClasses.length === 0) {
      setError('Please select at least one class or stream.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const created = await assessmentAssignmentService.createAssignment({
        paperId,
        teacherId: teacherProfile?.id || userId || 'teacher_local',
        teacherName: teacherProfile?.name || 'Mwalimu',
        classIds: selectedClasses,
        streamNames: selectedClasses.map((c) => {
          const found = availableClassList.find(cls => cls.id === c);
          return found ? found.name : c;
        }),
        deliveryMode,
        durationMinutes,
        accessCode: accessCode.trim() || undefined,
        resultReleasePolicy,
        feedbackReleasePolicy,
      });
      setAssignedResult({ id: created.id, accessCode: accessCode.trim() || undefined });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Assignment failed.');
    } finally {
      setLoading(false);
    }
  };

  const examLink = `${window.location.origin}/exam/take/${assignedResult?.id || paperId}${accessCode ? `?code=${accessCode}` : ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(examLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const text = `📝 *Examination Assignment Notice*\n\nTeacher: *${teacherProfile?.name || 'Mwalimu'}*\nExam Link: ${examLink}\n${accessCode ? `Access Code: *${accessCode}*\n` : ''}Duration: *${durationMinutes} Minutes*\n\nPlease complete your examination online on Soma AI before the deadline.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-500" /> Assign Examination
            </h2>
            <p className="text-xs text-slate-500 mt-1">Configure delivery mode, timing, access controls, and release policy.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {assignedResult ? (
          <div className="space-y-5 text-center py-4">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">Exam Assigned Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">Learners in the selected streams can now access and sit this paper.</p>
            </div>

            {assignedResult.accessCode && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Access Code</span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 tracking-wider font-mono">
                  {assignedResult.accessCode}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageCircle className="w-4 h-4" /> Share on Class WhatsApp
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-black text-xs transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied Exam Link!' : 'Copy Direct Exam Link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  onAssigned();
                  onClose();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs transition-colors mt-1"
              >
                Done / Return to Assessments
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Target class selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-500" /> Target Classes / Streams
              </label>
              <div className="grid grid-cols-2 gap-2">
                {availableClassList.map((cls) => {
                  const isSelected = selectedClasses.includes(cls.id);
                  return (
                    <button
                      type="button"
                      key={cls.id}
                      onClick={() =>
                        setSelectedClasses((prev) =>
                          isSelected ? prev.filter((id) => id !== cls.id) : [...prev, cls.id],
                        )
                      }
                      className={`p-3 rounded-xl border text-xs font-bold text-left transition-colors flex items-center justify-between ${
                        isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700' : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <span>{cls.name}</span>
                      {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600" />}
                    </button>
                  );
                })}
              </div>

              {/* Add custom stream */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customClassInput}
                  onChange={(e) => setCustomClassInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomClass()}
                  placeholder="Add custom class (e.g. Form 2 West)..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomClass}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold rounded-xl text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>

            {/* Delivery mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Delivery Mode</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['online', 'paper', 'hybrid'] as DeliveryMode[]).map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setDeliveryMode(mode)}
                    className={`py-2.5 px-3 rounded-xl border font-bold capitalize transition-colors ${
                      deliveryMode === mode ? 'border-indigo-500 bg-indigo-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration & Access code */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Duration (Mins)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Access Code</label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="e.g. EXAM-4021"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Result release policy */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Result Release Policy</label>
              <select
                value={resultReleasePolicy}
                onChange={(e) => setResultReleasePolicy(e.target.value as ResultReleasePolicy)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="IMMEDIATE">Immediate (Right after submit)</option>
                <option value="AFTER_MARKING">After Marking (When all questions marked)</option>
                <option value="AFTER_MODERATION">After Moderation Review</option>
                <option value="MANUAL_RELEASE">Manual Teacher Release</option>
              </select>
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Confirm Assignment'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
