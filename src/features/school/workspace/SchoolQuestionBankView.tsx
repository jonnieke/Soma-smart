import React, { useEffect, useState } from 'react';
import { Database, Filter, Plus, Search, CheckCircle2, ShieldCheck, Copy, Share2, Tag, BookOpen } from 'lucide-react';
import { Question } from '../../../types/paperStudio';
import { QuestionVisibility } from '../../../types/schoolWorkspace';
import { paperStudioService } from '../../../services/paperStudioService';

export const SchoolQuestionBankView: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [visibilityFilter, setVisibilityFilter] = useState<string>('ALL');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('ALL');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const data = await paperStudioService.getQuestionBank();
    setQuestions(data);
  };

  const handleUpdateVisibility = async (q: Question, newVis: QuestionVisibility) => {
    const updated: Question = {
      ...q,
      visibility: newVis === 'school' ? 'SCHOOL' : newVis === 'private' ? 'PRIVATE' : 'PUBLIC',
    };
    await paperStudioService.saveQuestionToBank(updated);
    await loadQuestions();
  };

  const filtered = questions.filter((q) => {
    if (searchQuery && !q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) && !q.topic?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (subjectFilter !== 'ALL' && q.subject !== subjectFilter) return false;
    if (gradeFilter !== 'ALL' && q.grade !== gradeFilter) return false;
    if (difficultyFilter !== 'ALL' && q.difficulty !== difficultyFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Shared School Question Repository
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Centralized bank of verified, CBC curriculum-mapped examination questions.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search question text, topic, or strand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Subjects</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Integrated Science">Integrated Science</option>
              <option value="Chemistry">Chemistry</option>
              <option value="English">English</option>
            </select>
          </div>

          <div>
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Grades</option>
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Form 4">Form 4</option>
            </select>
          </div>

          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white font-medium"
            >
              <option value="ALL">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="CHALLENGING">Challenging</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((q) => (
          <div
            key={q.id}
            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  {q.subject} • {q.grade}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {q.questionType}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  {q.difficulty}
                </span>
              </div>

              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                {q.marks} Mark(s)
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Topic: {q.topic || 'General'}
              </div>
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-relaxed">
                {q.questionText}
              </p>
            </div>

            {q.options && q.options.length > 0 && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                {q.options.map((opt) => (
                  <div key={opt.id} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-indigo-600 mr-1">{opt.id}.</span>
                    <span className="text-slate-700 dark:text-slate-300">{opt.text}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">Reusable (0 Credits)</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateVisibility(q, 'school')}
                  className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 text-[11px] font-bold text-slate-700 dark:text-slate-300"
                >
                  Share to School
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
