import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  Layers,
  BarChart3,
  Sliders,
  Check,
  ShieldAlert,
} from 'lucide-react';
import {
  ExamBlueprint,
  ExamPaper,
  ExamType,
  CurriculumFramework,
  QuestionType,
  DifficultyLevel,
  CognitiveLevel,
} from '../../../types/paperStudio';
import { paperStudioService } from '../../../services/paperStudioService';
import { questionSelectionEngine } from '../../../services/assessmentEngine/questionSelectionEngine';

interface WizardProps {
  onCancel: () => void;
  onPaperCreated: (paperId: string) => void;
}

export const CreatePaperWizard: React.FC<WizardProps> = ({ onCancel, onPaperCreated }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  // Step 1: Exam Details State
  const [title, setTitle] = useState('Grade 9 Mathematics Continuous Assessment Test 1');
  const [schoolName, setSchoolName] = useState('Nairobi Academy');
  const [teacherName, setTeacherName] = useState('Mwalimu Peterson');
  const [grade, setGrade] = useState('Grade 9');
  const [subject, setSubject] = useState('Mathematics');
  const [curriculum, setCurriculum] = useState<CurriculumFramework>('CBC_CBE');
  const [examType, setExamType] = useState<ExamType>('CAT');
  const [term, setTerm] = useState('Term 1');
  const [year, setYear] = useState<string | number>('2026');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [totalMarks, setTotalMarks] = useState<number>(30);
  const [instructionsText, setInstructionsText] = useState(
    'Answer all questions in the spaces provided.\nShow all your working clearly.\nCalculators are allowed where appropriate.'
  );

  // Step 2: Curriculum Coverage State
  const [selectedTopics, setSelectedTopics] = useState<string[]>([
    'Algebraic Expressions',
    'Pythagoras Theorem',
    'Linear Equations',
  ]);

  // Step 3: Paper Structure (Sections) State
  const [sections, setSections] = useState([
    {
      id: 'sec_a',
      title: 'Section A: Multiple Choice Questions',
      questionType: 'MULTIPLE_CHOICE' as QuestionType,
      questionCount: 5,
      marksPerQuestion: 2,
      totalMarks: 10,
      difficulty: 'MEDIUM' as DifficultyLevel,
    },
    {
      id: 'sec_b',
      title: 'Section B: Structured Calculations & Problem Solving',
      questionType: 'SHORT_ANSWER' as QuestionType,
      questionCount: 4,
      marksPerQuestion: 5,
      totalMarks: 20,
      difficulty: 'MEDIUM' as DifficultyLevel,
    },
  ]);

  // Step 4: Difficulty & Cognitive Balance State
  const [easyPercent, setEasyPercent] = useState(30);
  const [mediumPercent, setMediumPercent] = useState(50);
  const [challengingPercent, setChallengingPercent] = useState(20);

  // Step 5: Question Source
  const [questionSource, setQuestionSource] = useState<'SOMA_BANK' | 'AI_HYBRID' | 'MY_BANK'>('AI_HYBRID');

  // Calculation totals
  const sectionsTotalMarks = sections.reduce((sum, s) => sum + s.questionCount * s.marksPerQuestion, 0);
  const totalQuestionsCount = sections.reduce((sum, s) => sum + s.questionCount, 0);
  const isMarksMismatch = sectionsTotalMarks !== totalMarks;

  const handleAddSection = () => {
    setSections([
      ...sections,
      {
        id: `sec_${Date.now()}`,
        title: `Section ${String.fromCharCode(65 + sections.length)}: New Section`,
        questionType: 'SHORT_ANSWER',
        questionCount: 2,
        marksPerQuestion: 5,
        totalMarks: 10,
        difficulty: 'MEDIUM',
      },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: string, value: any) => {
    const updated = [...sections];
    (updated[index] as any)[field] = value;
    if (field === 'questionCount' || field === 'marksPerQuestion') {
      updated[index].totalMarks = updated[index].questionCount * updated[index].marksPerQuestion;
    }
    setSections(updated);
  };

  const handleAssemblePaper = async () => {
    setIsGenerating(true);
    try {
      // 1. Create Blueprint Model
      const blueprint: ExamBlueprint = {
        id: `bp_${Date.now()}`,
        ownerId: 'teacher_user',
        title,
        grade,
        subject,
        curriculum,
        examType,
        term,
        year,
        durationMinutes,
        totalMarks: sectionsTotalMarks,
        difficultyDistribution: {
          easy: easyPercent,
          medium: mediumPercent,
          challenging: challengingPercent,
        },
        cognitiveDistribution: {
          RECALL: 20,
          UNDERSTANDING: 30,
          APPLICATION: 30,
          ANALYSIS: 10,
          EVALUATION: 5,
          CREATION: 5,
        },
        sections,
        topics: selectedTopics,
      };

      // 2. Fetch available question bank items
      const availableQuestions = await paperStudioService.getQuestionBank(subject, grade);

      // 3. Assemble sections using Question Selection Engine
      const { sections: assembledSections } = questionSelectionEngine.assemblePaperFromBlueprint(
        blueprint,
        availableQuestions
      );

      // 4. Construct Final Exam Paper Model
      const newPaper: ExamPaper = {
        id: `paper_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        ownerId: 'teacher_user',
        blueprintId: blueprint.id,
        title,
        status: 'DRAFT',
        visibility: 'PRIVATE',
        grade,
        subject,
        examType,
        term,
        year,
        durationMinutes,
        totalMarks: sectionsTotalMarks,
        schoolBranding: {
          schoolName,
          teacherName,
          examDate: new Date().toISOString().split('T')[0],
          candidateNameField: true,
          admissionNoField: true,
        },
        instructions: instructionsText.split('\n').filter((i) => i.trim().length > 0),
        sections: assembledSections,
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Deduct 1 credit for blueprint generation
      paperStudioService.deductCredits(1);

      // Save paper to studio repository
      await paperStudioService.savePaper(newPaper);
      onPaperCreated(newPaper.id);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Step Indicator Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-indigo-600">
              Step {currentStep} of 6
            </span>
            <h2 className="text-xl font-black text-slate-900">
              {currentStep === 1 && 'Examination Details & School Header'}
              {currentStep === 2 && 'Curriculum & Topic Coverage'}
              {currentStep === 3 && 'Paper Structure & Section Rules'}
              {currentStep === 4 && 'Difficulty & Cognitive Balance'}
              {currentStep === 5 && 'Question Source Selection'}
              {currentStep === 6 && 'Review Blueprint & Assemble Paper'}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      {/* ── STEP 1: EXAMINATION DETAILS ── */}
      {currentStep === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">Examination Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">School Name</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Teacher / Examiner Name</label>
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Grade / Form Level</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="Grade 6">Grade 6 (KPSEA)</option>
                <option value="Grade 8">Grade 8 (JSS)</option>
                <option value="Grade 9">Grade 9 (KJSEA)</option>
                <option value="Form 1">Form 1</option>
                <option value="Form 2">Form 2</option>
                <option value="Form 3">Form 3</option>
                <option value="Form 4">Form 4 (KCSE)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Subject / Learning Area</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Assessment Type</label>
              <select
                value={examType}
                onChange={(e) => setExamType(e.target.value as ExamType)}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="CAT">Continuous Assessment Test (CAT)</option>
                <option value="QUIZ">Classroom Quiz</option>
                <option value="MID_TERM">Mid-Term Examination</option>
                <option value="END_TERM">End-of-Term Examination</option>
                <option value="MOCK">National Mock Examination</option>
                <option value="REVISION_PAPER">Revision Paper</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                className="w-full px-4 py-2.5 text-sm font-semibold rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-bold text-slate-700">General Candidate Instructions</label>
              <textarea
                rows={3}
                value={instructionsText}
                onChange={(e) => setInstructionsText(e.target.value)}
                className="w-full p-3 text-xs font-medium rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: CURRICULUM & TOPICS ── */}
      {currentStep === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900">Selected Topics for {subject} ({grade})</h3>
            <p className="text-xs text-slate-500">
              Select the curriculum strands and topics to cover in this assessment paper.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedTopics.map((topic, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200"
              >
                {topic}
                <button
                  onClick={() => setSelectedTopics(selectedTopics.filter((_, index) => index !== i))}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              id="new_topic_input"
              placeholder="Add another topic..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) {
                    setSelectedTopics([...selectedTopics, val]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
              className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
            <button
              onClick={() => {
                const el = document.getElementById('new_topic_input') as HTMLInputElement;
                if (el && el.value.trim()) {
                  setSelectedTopics([...selectedTopics, el.value.trim()]);
                  el.value = '';
                }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
            >
              Add Topic
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: PAPER STRUCTURE & SECTIONS ── */}
      {currentStep === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Define Examination Sections</h3>
              <p className="text-xs text-slate-500">
                Total Allocated Marks: <span className="font-bold text-indigo-600">{sectionsTotalMarks} Marks</span> ({totalQuestionsCount} Questions)
              </p>
            </div>
            <button
              onClick={handleAddSection}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 hover:bg-indigo-100"
            >
              <Plus className="w-4 h-4" /> Add Section
            </button>
          </div>

          <div className="space-y-4">
            {sections.map((sec, idx) => (
              <div key={sec.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    value={sec.title}
                    onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 bg-white"
                  />
                  {sections.length > 1 && (
                    <button
                      onClick={() => handleRemoveSection(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Question Type</label>
                    <select
                      value={sec.questionType}
                      onChange={(e) => handleSectionChange(idx, 'questionType', e.target.value)}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                    >
                      <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                      <option value="SHORT_ANSWER">Short Answer</option>
                      <option value="STRUCTURED">Structured</option>
                      <option value="ESSAY">Essay</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Question Count</label>
                    <input
                      type="number"
                      value={sec.questionCount}
                      onChange={(e) => handleSectionChange(idx, 'questionCount', parseInt(e.target.value) || 1)}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Marks Per Question</label>
                    <input
                      type="number"
                      value={sec.marksPerQuestion}
                      onChange={(e) => handleSectionChange(idx, 'marksPerQuestion', parseInt(e.target.value) || 1)}
                      className="w-full mt-1 px-2 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase">Section Total</label>
                    <div className="mt-1 px-2 py-1.5 rounded-lg bg-indigo-100 text-indigo-900 font-black">
                      {sec.questionCount * sec.marksPerQuestion} Marks
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STEP 4: DIFFICULTY BALANCE ── */}
      {currentStep === 4 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900">Difficulty Distribution Target</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Easy Questions</span>
                <span>{easyPercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={easyPercent}
                onChange={(e) => setEasyPercent(parseInt(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Medium Questions</span>
                <span>{mediumPercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={mediumPercent}
                onChange={(e) => setMediumPercent(parseInt(e.target.value))}
                className="w-full accent-indigo-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-slate-700">
                <span>Challenging Questions</span>
                <span>{challengingPercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={challengingPercent}
                onChange={(e) => setChallengingPercent(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 5: QUESTION SOURCE ── */}
      {currentStep === 5 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Select Primary Question Source</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setQuestionSource('AI_HYBRID')}
              className={`p-4 rounded-2xl border text-left transition ${
                questionSource === 'AI_HYBRID' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200'
              }`}
            >
              <Sparkles className="w-5 h-5 text-indigo-600 mb-2" />
              <h4 className="text-xs font-bold text-slate-900">Soma AI Hybrid Engine</h4>
              <p className="text-[11px] text-slate-500 mt-1">Combine Soma Question Bank with fresh AI question variations.</p>
            </button>

            <button
              onClick={() => setQuestionSource('SOMA_BANK')}
              className={`p-4 rounded-2xl border text-left transition ${
                questionSource === 'SOMA_BANK' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200'
              }`}
            >
              <BookOpen className="w-5 h-5 text-amber-500 mb-2" />
              <h4 className="text-xs font-bold text-slate-900">Soma Verified Bank Only</h4>
              <p className="text-[11px] text-slate-500 mt-1">Use strictly pre-reviewed SomaAI question bank items.</p>
            </button>

            <button
              onClick={() => setQuestionSource('MY_BANK')}
              className={`p-4 rounded-2xl border text-left transition ${
                questionSource === 'MY_BANK' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200'
              }`}
            >
              <Layers className="w-5 h-5 text-purple-500 mb-2" />
              <h4 className="text-xs font-bold text-slate-900">My Custom Question Bank</h4>
              <p className="text-[11px] text-slate-500 mt-1">Assemble paper strictly using your own saved questions.</p>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 6: REVIEW BLUEPRINT ── */}
      {currentStep === 6 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="space-y-2">
            <h3 className="text-base font-black text-slate-900">Final Examination Blueprint Review</h3>
            <p className="text-xs text-slate-500">Confirm details before assembling the examination paper.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 p-4 rounded-2xl">
            <div>
              <span className="block font-bold text-slate-400 uppercase text-[10px]">Title</span>
              <span className="font-bold text-slate-900 truncate block">{title}</span>
            </div>
            <div>
              <span className="block font-bold text-slate-400 uppercase text-[10px]">Level &amp; Subject</span>
              <span className="font-bold text-slate-900">{grade} · {subject}</span>
            </div>
            <div>
              <span className="block font-bold text-slate-400 uppercase text-[10px]">Total Marks</span>
              <span className="font-black text-indigo-600">{sectionsTotalMarks} Marks</span>
            </div>
            <div>
              <span className="block font-bold text-slate-400 uppercase text-[10px]">Duration</span>
              <span className="font-bold text-slate-900">{durationMinutes} Minutes</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        {currentStep > 1 ? (
          <button
            onClick={() => setCurrentStep(currentStep - 1)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <div />
        )}

        {currentStep < 6 ? (
          <button
            onClick={() => setCurrentStep(currentStep + 1)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            disabled={isGenerating}
            onClick={handleAssemblePaper}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-lg transition"
          >
            {isGenerating ? (
              <span>Assembling Paper...</span>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300" />
                Assemble Examination Paper
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
