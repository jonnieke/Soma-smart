import React, { useEffect, useState } from 'react';
import {
  Search,
  BookOpen,
  Filter,
  Plus,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  Tag,
  Award,
} from 'lucide-react';
import { Question, QuestionType, DifficultyLevel } from '../../../types/paperStudio';
import { paperStudioService } from '../../../services/paperStudioService';

interface BankBrowserProps {
  onBack: () => void;
  onSelectQuestion?: (question: Question) => void;
}

export const QuestionBankBrowser: React.FC<BankBrowserProps> = ({ onBack, onSelectQuestion }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New question form state
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newGrade, setNewGrade] = useState('Grade 9');
  const [newMarks, setNewMarks] = useState(2);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const data = await paperStudioService.getQuestionBank();
    setQuestions(data);
  };

  const handleCreateCustomQuestion = async () => {
    if (!newQuestionText.trim()) return;
    const q: Question = {
      id: `q_custom_${Date.now()}`,
      visibility: 'PRIVATE',
      status: 'VERIFIED',
      questionType: 'SHORT_ANSWER',
      questionText: newQuestionText,
      correctAnswer: newCorrectAnswer || 'Expected answer',
      markingScheme: [{ criterion: 'Correct response', marks: newMarks, code: 'M1' }],
      marks: newMarks,
      grade: newGrade,
      subject: newSubject,
      curriculum: 'CBC_CBE',
      cognitiveLevel: 'APPLICATION',
      difficulty: 'MEDIUM',
      sourceType: 'MY_BANK',
      qualityScore: 90,
    };

    await paperStudioService.saveQuestionToBank(q);
    setShowAddModal(false);
    setNewQuestionText('');
    setNewCorrectAnswer('');
    loadQuestions();
  };

  const filteredQuestions = questions.filter((q) => {
    if (subjectFilter !== 'ALL' && q.subject.toLowerCase() !== subjectFilter.toLowerCase()) return false;
    if (gradeFilter !== 'ALL' && q.grade.toLowerCase() !== gradeFilter.toLowerCase()) return false;
    if (!searchQuery) return true;
    return (
      q.questionText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Soma Question Bank</h1>
            <p className="text-xs text-slate-500 font-medium">
              Browse and add curriculum-aligned questions for Kenyan CBC, KPSEA &amp; KCSE assessments.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition"
        >
          <Plus className="w-4 h-4" /> Add Custom Question
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions by topic, keyword or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Integrated Science">Integrated Science</option>
            <option value="Chemistry">Chemistry</option>
            <option value="English">English</option>
          </select>

          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white"
          >
            <option value="ALL">All Grades</option>
            <option value="Grade 6">Grade 6</option>
            <option value="Grade 9">Grade 9</option>
            <option value="Form 4">Form 4</option>
          </select>
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {filteredQuestions.map((q) => (
          <div
            key={q.id}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-indigo-300 transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {q.grade}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-slate-100 text-slate-700">
                    {q.subject}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-purple-50 text-purple-700">
                    {q.questionType}
                  </span>
                  {q.topic && (
                    <span className="text-[11px] font-bold text-slate-500">
                      • {q.topic}
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-900 pt-1">
                  {q.questionText}
                </p>
              </div>

              <span className="text-xs font-black text-indigo-600 shrink-0">
                [{q.marks} Marks]
              </span>
            </div>

            {/* Answer & Explanation */}
            <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 font-medium text-slate-700">
              <span className="font-bold text-slate-900">Correct Answer:</span> {q.correctAnswer}
            </div>

            {onSelectQuestion && (
              <button
                onClick={() => onSelectQuestion(q)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 transition"
              >
                Add to Current Paper
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Custom Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-black text-slate-900">Add Custom Question to Bank</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700">Question Text</label>
                <textarea
                  rows={3}
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Enter full question text..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Subject</label>
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700">Grade</label>
                  <input
                    type="text"
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700">Expected Answer</label>
                <input
                  type="text"
                  value={newCorrectAnswer}
                  onChange={(e) => setNewCorrectAnswer(e.target.value)}
                  className="w-full mt-1 px-3 py-2 text-xs font-medium rounded-xl border border-slate-200"
                  placeholder="Enter expected answer..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomQuestion}
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700"
              >
                Save Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
