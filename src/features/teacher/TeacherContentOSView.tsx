import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  FolderPlus,
  Layers,
  Sparkles,
  Search,
  Plus,
  Calendar,
  CheckCircle,
  FileText,
  Clock,
  ArrowRight,
  Send,
} from 'lucide-react';
import { curriculumOSService } from '../../services/curriculumOSService';
import { resourceStudioService } from '../../services/resourceStudioService';
import { teacherPlanningService } from '../../services/teacherPlanningService';
import { schoolContentLibraryService } from '../../services/schoolContentLibraryService';
import { CurriculumNode, EducationalResource, SchemeOfWork, ContentRequest } from '../../types/contentOS';

export const TeacherContentOSView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'EXPLORER' | 'STUDIO' | 'LESSONS' | 'SCHEMES' | 'REQUESTS'>('EXPLORER');
  const [nodes, setNodes] = useState<CurriculumNode[]>([]);
  const [resources, setResources] = useState<EducationalResource[]>([]);
  const [schemes, setSchemes] = useState<SchemeOfWork[]>([]);
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Lesson Builder State
  const [lessonTitle, setLessonTitle] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('Grade 9');
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');

  useEffect(() => {
    setNodes(curriculumOSService.getNodesForFramework());
    setResources(resourceStudioService.getResources());
    setSchemes(teacherPlanningService.getSchemesOfWork());
    setRequests(schoolContentLibraryService.getContentRequests());
    setLoading(false);
  }, []);

  const handleGenerateScheme = () => {
    const newScheme = teacherPlanningService.generateSchemeOfWork({
      teacherId: 'teacher_kamau',
      teacherName: 'Mwalimu Kamau',
      grade: selectedGrade,
      subject: selectedSubject,
      term: 'Term 1',
    });
    setSchemes([newScheme, ...schemes]);
    setActiveTab('SCHEMES');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-600" /> Soma Content &amp; Curriculum OS
          </h1>
          <p className="text-xs text-slate-500 mt-1">Structured curriculum outcomes, block-based resources, CBC lesson planning &amp; schemes of work.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('STUDIO')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Lesson Resource
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: 'EXPLORER', label: 'Curriculum Explorer' },
          { id: 'STUDIO', label: 'Resource Studio' },
          { id: 'LESSONS', label: 'Lesson Builder' },
          { id: 'SCHEMES', label: `Schemes of Work (${schemes.length})` },
          { id: 'REQUESTS', label: `Content Requests (${requests.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {activeTab === 'EXPLORER' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" /> KICD CBC Curriculum Tree &amp; Learning Outcomes
                </h3>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-full">KICD v2026.1 Active</span>
              </div>

              <div className="space-y-3">
                {nodes.map((n) => (
                  <div key={n.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {n.type.replace('_', ' ')} · {n.code}
                      </span>
                      <span className="text-[11px] text-slate-400">Status: {n.status}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{n.title}</h4>
                    {n.description && <p className="text-xs text-slate-500">{n.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'STUDIO' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {resources.map((res) => (
                  <div key={res.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {res.resourceType.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400">{res.grade} · {res.subject}</span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{res.title}</h3>
                      <p className="text-xs text-slate-500">{res.description}</p>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {res.contentBlocks.length} Reusable Content Blocks
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Visibility: {res.visibility}</span>
                      <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">
                        Edit in Studio
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'LESSONS' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 max-w-2xl mx-auto shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" /> CBC Lesson Builder &amp; AI Assistant
              </h3>
              <p className="text-xs text-slate-500">Construct a lesson plan from structured KICD outcomes with differentiation and assessment for learning.</p>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lesson Title</label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="e.g. Surface Area of Closed Cylinders"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Grade</label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Grade 9">Grade 9</option>
                      <option value="Form 4">Form 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-xs text-slate-900 dark:text-white"
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="Integrated Science">Integrated Science</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateScheme}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" /> Build Lesson Plan &amp; Generate Scheme of Work
                </button>
              </div>
            </div>
          )}

          {activeTab === 'SCHEMES' && (
            <div className="space-y-4">
              {schemes.map((sch) => (
                <div key={sch.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">{sch.grade} {sch.subject} Scheme of Work</h3>
                      <p className="text-xs text-slate-500">{sch.term} · Year {sch.year} · Prepared by {sch.teacherName}</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full uppercase">{sch.status}</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sch.weeks.map((w) => (
                      <div key={w.lessonNumber} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">Week {w.weekNumber}, Lesson {w.lessonNumber}: {w.subStrand}</p>
                          <p className="text-slate-500">{w.learningOutcome}</p>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-600">{w.assessmentMethod}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'REQUESTS' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-black text-slate-900 dark:text-white text-sm">Teacher Resource Requests</h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {requests.map((r) => (
                  <div key={r.id} className="py-4 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{r.grade} {r.subject} · {r.curriculumOutcome}</span>
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md uppercase text-[10px]">{r.urgency} urgency</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">{r.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
