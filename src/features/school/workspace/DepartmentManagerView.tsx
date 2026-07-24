import React, { useEffect, useState } from 'react';
import { FolderPlus, Users, BookOpen, Plus, Edit3, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { SchoolDepartment, SchoolMembership } from '../../../types/schoolWorkspace';
import { schoolWorkspaceService } from '../../../services/schoolWorkspaceService';

export const DepartmentManagerView: React.FC = () => {
  const [departments, setDepartments] = useState<SchoolDepartment[]>([]);
  const [members, setMembers] = useState<SchoolMembership[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<SchoolDepartment | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectsText, setSubjectsText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const deptList = await schoolWorkspaceService.getDepartments();
    setDepartments(deptList);

    const memList = await schoolWorkspaceService.getMemberships();
    setMembers(memList);
  };

  const handleOpenModal = (dept?: SchoolDepartment) => {
    if (dept) {
      setEditingDept(dept);
      setName(dept.name);
      setDescription(dept.description || '');
      setSubjectsText((dept.subjectIds || []).join(', '));
    } else {
      setEditingDept(null);
      setName('');
      setDescription('');
      setSubjectsText('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const subjectIds = subjectsText.split(',').map((s) => s.trim()).filter(Boolean);

    const deptToSave: SchoolDepartment = {
      id: editingDept?.id || `dept_${Date.now()}`,
      schoolId: 'default_school',
      name,
      description,
      subjectIds,
      gradeIds: editingDept?.gradeIds || ['Grade 7', 'Grade 8', 'Grade 9', 'Form 1', 'Form 2', 'Form 3', 'Form 4'],
      headUserIds: editingDept?.headUserIds || [],
      memberUserIds: editingDept?.memberUserIds || [],
      isActive: true,
      createdAt: editingDept?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await schoolWorkspaceService.saveDepartment(deptToSave, 'user_principal', 'Principal Dr. Otieno', 'ADMIN');
    setIsModalOpen(false);
    await loadData();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FolderPlus className="w-6 h-6 text-indigo-600" />
            School Academic Departments
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Organize teachers, subjects, examination workflows, and departmental review privileges.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          Add Custom Department
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-indigo-400 transition space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center font-bold">
                <FolderPlus className="w-5 h-5" />
              </div>
              <button
                onClick={() => handleOpenModal(dept)}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 text-slate-500"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 dark:text-white">{dept.name}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{dept.description || 'No description provided.'}</p>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  Head of Department (HOD):
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {dept.headUserIds?.length ? 'Assigned' : 'Unassigned'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Linked Subjects:</span>
                <div className="flex flex-wrap gap-1">
                  {(dept.subjectIds || []).map((sub) => (
                    <span key={sub} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[10px]">
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Department Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {editingDept ? 'Edit Department' : 'Add Custom Department'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Creative Arts &amp; Music"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  placeholder="Brief description of department scope..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 h-20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Linked Subjects (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Art, Music, Theatre"
                  value={subjectsText}
                  onChange={(e) => setSubjectsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm"
                >
                  Save Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
