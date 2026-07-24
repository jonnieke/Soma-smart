import React, { useState } from 'react';
import { X, Calendar, Clock, Lock, Users, Zap, CheckCircle } from 'lucide-react';
import { assessmentAssignmentService } from '../../services/assessmentAssignmentService';
import { DeliveryMode, ResultReleasePolicy, FeedbackReleasePolicy } from '../../types/assessmentDelivery';

interface Props {
  paperId: string;
  onClose: () => void;
  onAssigned: () => void;
}

export const AssessmentAssignmentModal: React.FC<Props> = ({ paperId, onClose, onAssigned }) => {
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('online');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [accessCode, setAccessCode] = useState('MATH2026');
  const [resultReleasePolicy, setResultReleasePolicy] = useState<ResultReleasePolicy>('AFTER_MARKING');
  const [feedbackReleasePolicy, setFeedbackReleasePolicy] = useState<FeedbackReleasePolicy>('SCORES_AND_FEEDBACK');
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['class_form4_east']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAssign = async () => {
    if (selectedClasses.length === 0) {
      setError('Please select at least one class or stream.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await assessmentAssignmentService.createAssignment({
        paperId,
        teacherId: 'teacher_kamau',
        teacherName: 'Mwalimu Kamau',
        classIds: selectedClasses,
        streamNames: selectedClasses.map((c) => (c.includes('east') ? 'Form 4 East' : 'Form 4 West')),
        deliveryMode,
        durationMinutes,
        accessCode: accessCode.trim() || undefined,
        resultReleasePolicy,
        feedbackReleasePolicy,
      });
      onAssigned();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Assignment failed.');
    } finally {
      setLoading(false);
    }
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

        {/* Target class selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-500" /> Target Classes / Streams
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'class_form4_east', name: 'Form 4 East' },
              { id: 'class_form4_west', name: 'Form 4 West' },
              { id: 'class_form3_north', name: 'Form 3 North' },
            ].map((cls) => {
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
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Access Code (Optional)</label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value)}
              placeholder="e.g. EXAM123"
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
      </div>
    </div>
  );
};
