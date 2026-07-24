import React, { useEffect, useState } from 'react';
import { LayoutTemplate, Plus, CheckCircle2, Edit3, Copy, ShieldCheck, X } from 'lucide-react';
import { SchoolTemplate } from '../../../types/schoolWorkspace';
import { schoolWorkspaceService } from '../../../services/schoolWorkspaceService';

export const SchoolTemplatesView: React.FC = () => {
  const [templates, setTemplates] = useState<SchoolTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<SchoolTemplate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [schoolName, setSchoolName] = useState('NAIROBI ACADEMY HIGH SCHOOL');
  const [mottoText, setMottoText] = useState('Strive for Excellence in Knowledge & Character');
  const [defaultDuration, setDefaultDuration] = useState(90);
  const [defaultMarks, setDefaultMarks] = useState(50);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const data = await schoolWorkspaceService.getTemplates();
    setTemplates(data);
    if (data.length > 0) setSelectedTemplate(data[0]);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tplToSave: SchoolTemplate = {
      id: selectedTemplate?.id || `tpl_${Date.now()}`,
      schoolId: 'default_school',
      name,
      description: 'Custom examination header and template formatting.',
      headerConfiguration: {
        schoolName,
        showMotto: true,
        mottoText,
      },
      candidateFields: {
        studentName: true,
        admissionNo: true,
        streamClass: true,
        date: true,
        signature: true,
      },
      instructions: [
        'Write your name and admission number clearly in the spaces provided.',
        'Answer all questions in Section A and Section B.',
      ],
      sectionLayouts: [],
      defaultDurationMinutes: defaultDuration,
      defaultTotalMarks: defaultMarks,
      isDefault: false,
      createdBy: 'user_principal',
      createdByName: 'Principal Dr. Otieno',
      createdAt: selectedTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await schoolWorkspaceService.saveTemplate(tplToSave, 'user_principal', 'Principal Dr. Otieno', 'ADMIN');
    setIsModalOpen(false);
    await loadTemplates();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-indigo-600" />
            School Examination Templates &amp; Header Formatting
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Standardized examination layouts, candidate details, headers, and watermark presets.
          </p>
        </div>

        <button
          onClick={() => {
            setName('');
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Create New Template
        </button>
      </div>

      {/* Templates List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-indigo-400 transition space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                {tpl.isDefault ? 'School Default Preset' : 'Custom Template'}
              </span>
              <span className="text-xs font-bold text-slate-400">
                {tpl.defaultTotalMarks} Marks • {tpl.defaultDurationMinutes} min
              </span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">{tpl.name}</h3>
              <p className="text-xs text-slate-500 font-medium">{tpl.description}</p>
            </div>

            {/* Header Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center space-y-1">
              <div className="text-xs font-black text-slate-900 dark:text-white tracking-wider">
                {tpl.headerConfiguration.schoolName}
              </div>
              {tpl.headerConfiguration.mottoText && (
                <div className="text-[10px] text-slate-500 italic">
                  &ldquo;{tpl.headerConfiguration.mottoText}&rdquo;
                </div>
              )}
              <div className="pt-2 flex justify-center gap-2 text-[9px] font-bold text-slate-400 uppercase">
                <span>[Name Field]</span>
                <span>[Adm No]</span>
                <span>[Stream]</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-indigo-600">
              <span>Ready for Exam Editor</span>
              <span>Use Template &rarr;</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-slate-900 dark:text-white">Create Exam Template</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End-Term Mock Examination Preset"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">School Name Heading</label>
                <input
                  type="text"
                  required
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">School Motto / Subheading</label>
                <input
                  type="text"
                  value={mottoText}
                  onChange={(e) => setMottoText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Default Duration (Mins)</label>
                  <input
                    type="number"
                    value={defaultDuration}
                    onChange={(e) => setDefaultDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Default Total Marks</label>
                  <input
                    type="number"
                    value={defaultMarks}
                    onChange={(e) => setDefaultMarks(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
