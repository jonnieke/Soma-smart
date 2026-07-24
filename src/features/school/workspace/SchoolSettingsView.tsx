import React, { useEffect, useState } from 'react';
import { Settings, ShieldCheck, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { SchoolSettings } from '../../../types/schoolWorkspace';
import { schoolWorkspaceService } from '../../../services/schoolWorkspaceService';

export const SchoolSettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const data = await schoolWorkspaceService.getSettings('default_school');
    setSettings(data);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    await schoolWorkspaceService.saveSettings(settings, 'user_principal', 'Principal Dr. Otieno', 'ADMIN');
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 3000);
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          School Assessment Workspace Settings
        </h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure examination rules, separation of duties, grading standards, and paper watermarks.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          School assessment settings updated and audited successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
        {/* Academic Config */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Academic Calendar &amp; Standards
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Default Curriculum</label>
              <select
                value={settings.defaultCurriculum}
                onChange={(e) => setSettings({ ...settings, defaultCurriculum: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
              >
                <option value="CBC_CBE">Kenyan CBC (Competency-Based Education)</option>
                <option value="8_4_4">8-4-4 KCSE System</option>
                <option value="IGCSE">Cambridge IGCSE</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Current Academic Term</label>
              <select
                value={settings.currentTerm}
                onChange={(e) => setSettings({ ...settings, currentTerm: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
              >
                <option value="Term 1">Term 1</option>
                <option value="Term 2">Term 2</option>
                <option value="Term 3">Term 3</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Academic Year</label>
              <input
                type="text"
                value={settings.currentAcademicYear}
                onChange={(e) => setSettings({ ...settings, currentAcademicYear: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>
          </div>
        </div>

        {/* Workflow & Separation of Duties */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Approval Workflow &amp; Separation of Duties
          </h2>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireIndependentReviewer}
                onChange={(e) => setSettings({ ...settings, requireIndependentReviewer: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Require Independent Reviewer (Separation of Duties)
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  When enabled, paper creators cannot give final approval to their own examination papers. An independent HOD or Exam Coordinator must review and approve.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowTeacherPersonalCredits}
                onChange={(e) => setSettings({ ...settings, allowTeacherPersonalCredits: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600"
              />
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Allow Fallback to Personal Teacher AI Credits
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  Allow teachers to use their personal AI credits if school shared credits are exhausted.
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Watermark & Security */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Export Security &amp; Printing Watermark
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Default Paper Watermark Text</label>
            <input
              type="text"
              value={settings.defaultWatermarkText || ''}
              onChange={(e) => setSettings({ ...settings, defaultWatermarkText: e.target.value })}
              placeholder="e.g. NAIROBI ACADEMY - CONFIDENTIAL EXAM"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md"
          >
            <Save className="w-4 h-4" />
            Save Assessment Settings
          </button>
        </div>
      </form>
    </div>
  );
};
