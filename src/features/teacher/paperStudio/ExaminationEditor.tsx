import React, { useState, useEffect } from 'react';
import {
  Save,
  Printer,
  FileText,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  ChevronRight,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { ExamPaper, Question, QuestionType, DifficultyLevel } from '../../../types/paperStudio';
import { paperStudioService } from '../../../services/paperStudioService';
import { assessmentAIProvider } from '../../../services/assessmentEngine/assessmentAIProvider';
import { PrintablePaperView } from './PrintablePaperView';
import { PaperImages } from './PaperImages';
import { PaperText } from './PaperText';

interface EditorProps {
  paperId: string;
  onBackToWorkspace: () => void;
}

export const ExaminationEditor: React.FC<EditorProps> = ({ paperId, onBackToWorkspace }) => {
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [saveNotice, setSaveNotice] = useState('');
  const [mobilePanel, setMobilePanel] = useState<'questions' | 'paper' | 'edit'>('paper');
  const saveSequence = React.useRef(0);

  useEffect(() => {
    loadPaper();
  }, [paperId]);

  const loadPaper = async () => {
    setLoadError('');
    try {
    const loaded = await paperStudioService.getPaperById(paperId);
    if (loaded) {
      setPaper(loaded);
      setSaveNotice(paperStudioService.getPaperStorageNotice());
      if (loaded.sections[0]?.questions[0]) {
        setSelectedQuestionId(loaded.sections[0].questions[0].id);
      }
    } else setLoadError('This paper was not found for your account. Return to your papers or retry loading.');
    } catch (error) { setLoadError(error instanceof Error ? error.message : 'Could not load this paper. Please retry.'); }
  };

  const persistPaper = async (draft: ExamPaper) => {
    const sequence = ++saveSequence.current;
    setIsSaving(true);
    setSaveNotice('Saving recovery copy and syncing…');
    try {
      await paperStudioService.savePaper(draft);
      if (sequence === saveSequence.current) setSaveNotice('Saved to your account.');
    } catch (error) {
      if (sequence === saveSequence.current) setSaveNotice(error instanceof Error ? error.message : 'Sync failed. Keep this draft open and retry Save Draft.');
    } finally {
      if (sequence === saveSequence.current) setIsSaving(false);
    }
  };

  if (!paper) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        {loadError ? <div role="alert" className="space-y-4 p-6"><p>{loadError}</p><button onClick={loadPaper} className="underline mr-4">Retry</button><button onClick={onBackToWorkspace} className="underline">Back to my papers</button></div> : <p className="text-slate-400 font-medium">Loading examination paper...</p>}
      </div>
    );
  }

  // Find currently selected question across all sections
  let selectedQuestion: Question | null = null;
  let selectedSectionIdx = -1;
  let selectedQuestionIdx = -1;

  paper.sections.forEach((sec, sIdx) => {
    sec.questions.forEach((q, qIdx) => {
      if (q.id === selectedQuestionId) {
        selectedQuestion = q;
        selectedSectionIdx = sIdx;
        selectedQuestionIdx = qIdx;
      }
    });
  });

  const handleSave = async () => {
    if (!paper) return;
    await persistPaper(paper);
  };

  const handleUpdateQuestion = (updatedQ: Question) => {
    if (!paper || selectedSectionIdx < 0 || selectedQuestionIdx < 0) return;
    const updatedSections = [...paper.sections];
    updatedSections[selectedSectionIdx].questions[selectedQuestionIdx] = updatedQ;

    // Recalculate section total marks
    updatedSections[selectedSectionIdx].totalMarks = updatedSections[selectedSectionIdx].questions.reduce(
      (sum, q) => sum + q.marks,
      0
    );

    const newTotalMarks = updatedSections.reduce((sum, s) => sum + s.totalMarks, 0);

    const updatedPaper = {
      ...paper,
      sections: updatedSections,
      totalMarks: newTotalMarks,
    };

    setPaper(updatedPaper);
    void persistPaper(updatedPaper);
  };

  const handleRegenerateQuestionVariation = async () => {
    if (!selectedQuestion) return;
    setIsRegenerating(true);
    try {
      const variation = await assessmentAIProvider.generateVariation({
        originalQuestion: selectedQuestion,
        instruction: 'Create an equivalent variation with different numbers or scenario.',
      });
      paperStudioService.deductCredits(1);
      handleUpdateQuestion(variation);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddQuestionToSection = (sectionIndex: number) => {
    if (!paper) return;
    const newQ: Question = {
      id: `q_manual_${Date.now()}`,
      visibility: 'PRIVATE',
      status: 'DRAFT',
      questionType: paper.sections[sectionIndex]?.questions[0]?.questionType || 'SHORT_ANSWER',
      questionText: 'New question text. Edit prompt in inspector panel.',
      correctAnswer: 'Expected answer',
      markingScheme: [{ criterion: 'Correct response', marks: 2, code: 'M1' }],
      marks: 2,
      grade: paper.grade,
      subject: paper.subject,
      curriculum: 'CBC_CBE',
      cognitiveLevel: 'APPLICATION',
      difficulty: 'MEDIUM',
      sourceType: 'MANUAL',
    };

    const updatedSections = [...paper.sections];
    updatedSections[sectionIndex].questions.push(newQ);
    updatedSections[sectionIndex].totalMarks += newQ.marks;

    const newTotalMarks = updatedSections.reduce((sum, s) => sum + s.totalMarks, 0);
    const updatedPaper = { ...paper, sections: updatedSections, totalMarks: newTotalMarks };

    setPaper(updatedPaper);
    setSelectedQuestionId(newQ.id);
    setMobilePanel('edit');
    void persistPaper(updatedPaper);
  };

  const handleDeleteQuestion = (sectionIdx: number, questionIdx: number) => {
    if (!paper) return;
    const updatedSections = [...paper.sections];
    updatedSections[sectionIdx].questions.splice(questionIdx, 1);
    updatedSections[sectionIdx].totalMarks = updatedSections[sectionIdx].questions.reduce(
      (sum, q) => sum + q.marks,
      0
    );

    const newTotalMarks = updatedSections.reduce((sum, s) => sum + s.totalMarks, 0);
    const updatedPaper = { ...paper, sections: updatedSections, totalMarks: newTotalMarks };

    setPaper(updatedPaper);
    void persistPaper(updatedPaper);
  };

  if (showPrintPreview) {
    return (
      <PrintablePaperView
        paper={paper}
        onClose={() => setShowPrintPreview(false)}
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] min-h-[420px] min-w-0 bg-slate-100 overflow-hidden">
      {saveNotice && <p role="status" className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-slate-800">{saveNotice}</p>}
      {/* ── TOP TOOLBAR ── */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex flex-wrap gap-3 items-center justify-between z-10 shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onBackToWorkspace}
            aria-label="Back to my papers"
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-900 truncate max-w-md">{paper.title}</h1>
            <p className="text-[10px] text-slate-500 font-semibold">
              {paper.grade} · {paper.subject} · {paper.totalMarks} Marks · {paper.durationMinutes}m
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Save className="w-3.5 h-3.5 text-indigo-600" />
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={() => setShowPrintPreview(true)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Preview & Export
          </button>
        </div>
      </header>
      <nav aria-label="Paper editor views" className="lg:hidden grid grid-cols-3 shrink-0 border-b bg-white p-2 gap-1">
        {(['questions', 'paper', 'edit'] as const).map(panel => (
          <button key={panel} aria-pressed={mobilePanel === panel} onClick={() => setMobilePanel(panel)}
            className={`min-h-11 rounded-lg text-sm font-bold ${mobilePanel === panel ? 'bg-indigo-600 text-white' : 'text-slate-700 bg-slate-50'}`}>
            {panel === 'questions' ? 'Questions' : panel === 'paper' ? 'Paper' : 'Edit question'}
          </button>
        ))}
      </nav>

      {/* ── EDITOR BODY 3-COLUMN WORKSPACE ── */}
      <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
        {/* Left Sidebar: Section & Question Tree */}
        <aside aria-label="Question list" className={`${mobilePanel === 'questions' ? 'block' : 'hidden'} lg:block w-full lg:w-56 bg-white border-r border-slate-200 overflow-y-auto p-4 pb-24 space-y-4 shrink-0`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Sections</span>
            <span className="text-xs font-extrabold text-indigo-600">{paper.totalMarks} Marks</span>
          </div>

          <div className="space-y-4">
            {paper.sections.map((sec, sIdx) => (
              <div key={sec.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
                  <span className="truncate">{sec.title}</span>
                  <span className="text-[10px] text-indigo-600 font-extrabold">{sec.totalMarks}M</span>
                </div>

                <div className="pl-2 space-y-1">
                  {sec.questions.map((q, qIdx) => (
                    <button
                      key={q.id}
                      onClick={() => { setSelectedQuestionId(q.id); setMobilePanel('edit'); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-between ${
                        q.id === selectedQuestionId
                          ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200'
                          : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <span className="truncate">
                        Q{qIdx + 1}. {q.questionText.substring(0, 24)}...
                      </span>
                      <span className="text-[10px] text-slate-400">{q.marks}m</span>
                    </button>
                  ))}

                  <button
                    onClick={() => handleAddQuestionToSection(sIdx)}
                    className="w-full text-left px-2 py-1 rounded-lg text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Question
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Canvas: Formatted Examination View */}
        <main aria-label="Paper canvas" className={`${mobilePanel === 'paper' ? 'flex' : 'hidden'} lg:flex flex-1 min-w-0 overflow-y-auto p-2 sm:p-6 pb-24 justify-center`}>
          <div className="w-full min-w-0 break-words max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-8 space-y-6 self-start text-slate-900 font-serif">
            {/* Exam Header */}
            <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
              <h2 className="text-xl font-bold uppercase tracking-wide">{paper.schoolBranding.schoolName || 'Examination paper'}</h2>
              <h3 className="text-base font-bold text-slate-700">{paper.title}</h3>
              <div className="flex flex-wrap gap-2 justify-between text-xs font-sans font-bold pt-2 text-slate-600 border-t border-slate-200 mt-2">
                <span>Subject: {paper.subject} ({paper.grade})</span>
                <span>Time: {paper.durationMinutes} Minutes</span>
                <span>Total Marks: {paper.totalMarks}</span>
              </div>
            </div>

            {/* General Instructions */}
            {paper.instructions.length > 0 && (
              <div className="font-sans text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold uppercase text-[10px] text-slate-500">Instructions to Candidates:</span>
                <ul className="list-disc pl-4 space-y-0.5 font-medium text-slate-700">
                  {paper.instructions.map((inst, i) => (
                    <li key={i}>{inst}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Sections & Questions */}
            <div className="space-y-8">
              {paper.sections.map((sec, sIdx) => (
                <div key={sec.id} className="space-y-4">
                  <div className="font-sans font-black text-sm uppercase tracking-wide border-b border-slate-300 pb-1 text-slate-800 flex justify-between">
                    <span>{sec.title}</span>
                    <span>[{sec.totalMarks} Marks]</span>
                  </div>

                  <div className="space-y-6">
                    {sec.questions.map((q, qIdx) => {
                      const isSelected = q.id === selectedQuestionId;
                      return (
                        <div
                          key={q.id}
                          onClick={() => { setSelectedQuestionId(q.id); setMobilePanel('edit'); }}
                          className={`p-4 rounded-xl transition cursor-pointer font-sans ${
                            isSelected
                              ? 'ring-2 ring-indigo-500 bg-indigo-50/20'
                              : 'hover:bg-slate-50/80 border border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <p className="text-sm font-semibold leading-relaxed">
                                <span className="font-bold mr-1">{qIdx + 1}.</span> <PaperText text={q.questionText} />
                              </p>
                              <PaperImages sources={q.imageUrls} required={q.hasDiagram} description={`Question ${qIdx + 1} diagram`} />
                              <button onClick={() => { setSelectedQuestionId(q.id); setMobilePanel('edit'); }} className="min-h-11 text-xs font-bold text-indigo-700 underline">Edit question {qIdx + 1}</button>

                              {/* MCQ Options */}
                              {q.questionType === 'MULTIPLE_CHOICE' && q.options && (
                                <div className="grid grid-cols-2 gap-2 pl-4 pt-1">
                                  {q.options.map((opt) => (
                                    <div key={opt.id} className="text-xs font-medium text-slate-700">
                                      <span className="font-bold mr-1">{opt.id}.</span> <PaperText text={opt.text} />
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Working Lines / Answer Box */}
                              {q.questionType !== 'MULTIPLE_CHOICE' && (
                                <div className="pt-2 space-y-1">
                                  <div className="w-full border-b border-dotted border-slate-300 h-6" />
                                  <div className="w-full border-b border-dotted border-slate-300 h-6" />
                                </div>
                              )}
                            </div>

                            <span className="text-xs font-bold text-slate-500 shrink-0">
                              [{q.marks} Marks]
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Right Sidebar: Selected Question Inspector */}
        <aside aria-label="Question editor" className={`${mobilePanel === 'edit' ? 'block' : 'hidden'} lg:block w-full lg:w-72 bg-white border-l border-slate-200 overflow-y-auto p-4 pb-24 space-y-6 shrink-0`}>
          {selectedQuestion ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Question Properties
                </span>
                <button
                  onClick={handleRegenerateQuestionVariation}
                  disabled={isRegenerating}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 hover:bg-indigo-100"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  {isRegenerating ? 'Varying...' : 'AI Variation'}
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700">Question Text</label>
                  <p className="text-xs text-slate-500">Equations: wrap formulas in $...$. Fractions, roots, powers, subscripts and common Greek symbols are supported.</p>
                  <textarea
                    aria-label="Question text"
                    rows={4}
                    value={selectedQuestion.questionText}
                    onChange={(e) =>
                      handleUpdateQuestion({ ...selectedQuestion!, questionText: e.target.value })
                    }
                    className="w-full mt-1 p-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Marks</label>
                    <input
                      aria-label="Marks"
                      type="number"
                      value={selectedQuestion.marks}
                      onChange={(e) =>
                        handleUpdateQuestion({
                          ...selectedQuestion!,
                          marks: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Difficulty</label>
                    <select
                      aria-label="Difficulty"
                      value={selectedQuestion.difficulty}
                      onChange={(e) =>
                        handleUpdateQuestion({
                          ...selectedQuestion!,
                          difficulty: e.target.value as DifficultyLevel,
                        })
                      }
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="CHALLENGING">Challenging</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700">Expected Answer / Solution</label>
                  <textarea
                    aria-label="Expected answer or solution"
                    rows={2}
                    value={selectedQuestion.correctAnswer}
                    onChange={(e) =>
                      handleUpdateQuestion({ ...selectedQuestion!, correctAnswer: e.target.value })
                    }
                    className="w-full mt-1 p-2.5 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              Select a question to inspect and edit properties.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
