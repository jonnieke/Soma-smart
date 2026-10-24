import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileText,
  Layers,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import {
  DigitizationBatch,
  DigitizedQuestion,
  examDigitizerService,
} from '../../../services/examDigitizerService';

export const ExamPaperDigitizerView: React.FC = () => {
  const [batches, setBatches] = useState<DigitizationBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBatch, setActiveBatch] = useState<DigitizationBatch | null>(null);
  const [questions, setQuestions] = useState<DigitizedQuestion[]>([]);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [title, setTitle] = useState('');
  const [grade, setGrade] = useState('Form 4');
  const [subject, setSubject] = useState('Mathematics');
  const [examType, setExamType] = useState('KCSE');
  const [targetBundle, setTargetBundle] = useState('KCSE BDL001');
  const [fileUrl, setFileUrl] = useState('');
  const [creating, setCreating] = useState(false);

  // Question editing state
  const [savingQuestion, setSavingQuestion] = useState(false);
  const [regeneratingSvg, setRegeneratingSvg] = useState(false);
  const [regeneratingScheme, setRegeneratingScheme] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const list = await examDigitizerService.listBatches();
      setBatches(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  const openBatchReview = async (batch: DigitizationBatch) => {
    setLoading(true);
    try {
      let full = await examDigitizerService.getBatchWithQuestions(batch.id);
      if (!full || !full.questions || full.questions.length === 0) {
        // Run initial AI deconstruction if not yet parsed
        const result = await examDigitizerService.runDeconstruction(batch);
        full = result.batch;
        full.questions = result.questions;
      }
      setActiveBatch(full);
      setQuestions(full.questions || []);
      setSelectedQuestionIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAndExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !fileUrl.trim()) return;
    setCreating(true);
    try {
      const created = await examDigitizerService.createBatch({
        title,
        grade,
        subject,
        exam_type: examType,
        raw_file_url: fileUrl,
        target_bundle_code: targetBundle,
      });
      setShowUploadModal(false);
      setTitle('');
      setFileUrl('');
      await loadBatches();
      await openBatchReview(created);
    } catch {
      alert('Failed to initiate paper upload. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const currentQ = questions[selectedQuestionIndex];

  const updateCurrentQuestionField = (field: keyof DigitizedQuestion, value: any) => {
    if (!currentQ) return;
    const updated = { ...currentQ, [field]: value };
    const nextList = [...questions];
    nextList[selectedQuestionIndex] = updated;
    setQuestions(nextList);
  };

  const saveCurrentQuestion = async (autoAdvance = false) => {
    if (!currentQ) return;
    setSavingQuestion(true);
    try {
      await examDigitizerService.updateQuestion(currentQ);
      setFeedbackNotice(`Question ${currentQ.question_number} saved.`);
      setTimeout(() => setFeedbackNotice(null), 2500);
      if (autoAdvance && selectedQuestionIndex < questions.length - 1) {
        setSelectedQuestionIndex((i) => i + 1);
      }
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleRegenerateSvg = async () => {
    if (!currentQ || !activeBatch) return;
    setRegeneratingSvg(true);
    try {
      const prompt = currentQ.diagram_prompt || currentQ.question_text;
      const svg = await examDigitizerService.regenerateSvgDiagram(
        prompt,
        activeBatch.subject,
        currentQ.topic
      );
      updateCurrentQuestionField('diagram_svg', svg);
      updateCurrentQuestionField('diagram_type', 'SVG');
      updateCurrentQuestionField('has_diagram', true);
    } finally {
      setRegeneratingSvg(false);
    }
  };

  const handleRegenerateScheme = async () => {
    if (!currentQ || !activeBatch) return;
    setRegeneratingScheme(true);
    try {
      const scheme = await examDigitizerService.regenerateMarkingScheme(
        currentQ.question_text,
        currentQ.marks,
        activeBatch.subject
      );
      updateCurrentQuestionField('marking_scheme', scheme);
    } finally {
      setRegeneratingScheme(false);
    }
  };

  const handlePublishBatch = async () => {
    if (!activeBatch) return;
    const verifiedCount = questions.filter((q) => q.admin_verified).length;
    if (verifiedCount < questions.length) {
      const confirmProceed = window.confirm(
        `Only ${verifiedCount} of ${questions.length} questions are marked verified. Publish anyway?`
      );
      if (!confirmProceed) return;
    }

    setPublishing(true);
    try {
      const res = await examDigitizerService.publishBatchToPaperBank(
        activeBatch.id,
        activeBatch.target_bundle_code || undefined
      );
      if (res.success) {
        alert(
          `✅ Published successfully! Paper is now available in the Exam Paper Bank and assigned to bundle ${activeBatch.target_bundle_code || 'General'}.`
        );
        setActiveBatch(null);
        await loadBatches();
      } else {
        alert(res.error || 'Failed to publish.');
      }
    } finally {
      setPublishing(false);
    }
  };

  const verifiedTotal = questions.filter((q) => q.admin_verified).length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            AI Exam Repackaging &amp; Visual Synthesis
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600" /> Exam Paper Digitizer Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Deconstruct scanned past papers into structured questions, precision SVG/visual diagrams, and KNEC marking schemes. Every question requires mandatory Admin Verification before publication.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {activeBatch ? (
            <button
              onClick={() => setActiveBatch(null)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-xs text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Upload Batches
            </button>
          ) : (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white shadow-md shadow-indigo-600/20"
            >
              <Upload className="w-4 h-4" /> Upload Raw Scanned Paper
            </button>
          )}
        </div>
      </div>

      {feedbackNotice && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* Main Content: Batches Table or Active Review Studio */}
      {!activeBatch ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-base text-slate-900">Scanned Paper Batches</h2>
            <span className="text-xs font-bold text-slate-500">{batches.length} Batches</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 flex items-center justify-center gap-2 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" /> Loading digitization batches…
            </div>
          ) : batches.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-800 text-sm">No Paper Batches Uploaded Yet</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Upload a scanned past paper (PDF or image URL) to start AI deconstruction and diagram synthesis.
              </p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                <Upload className="w-4 h-4" /> Upload First Paper
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-black text-[10px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Paper Title</th>
                    <th className="p-4">Level &amp; Subject</th>
                    <th className="p-4">Target Bundle</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Questions</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-bold text-slate-900">{batch.title}</td>
                      <td className="p-4">
                        {batch.grade} · {batch.subject}
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-black text-[10px]">
                          {batch.target_bundle_code || 'Standalone'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase ${
                            batch.status === 'PUBLISHED'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : batch.status === 'READY_FOR_REVIEW'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {batch.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-slate-800">
                        {batch.total_questions > 0 ? `${batch.total_questions} Qs (${batch.total_marks} mks)` : 'Pending extraction'}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => openBatchReview(batch)}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs"
                        >
                          Open Review Studio →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Active Side-by-Side Review Studio */
        <div className="space-y-6">
          {/* Review Studio Control Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-black text-[10px]">
                  {activeBatch.target_bundle_code || 'Standard'}
                </span>
                <h2 className="font-black text-lg text-slate-900">{activeBatch.title}</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeBatch.grade} · {activeBatch.subject} · {activeBatch.exam_type}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
                  Admin Verification Progress
                </span>
                <span className="text-sm font-black text-indigo-700">
                  {verifiedTotal} / {questions.length} Questions Verified
                </span>
              </div>

              <button
                onClick={handlePublishBatch}
                disabled={publishing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                <span>Approve &amp; Publish to Paper Bank</span>
              </button>
            </div>
          </div>

          {/* Question Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200">
            {questions.map((q, idx) => (
              <button
                key={q.id || idx}
                onClick={() => setSelectedQuestionIndex(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                  selectedQuestionIndex === idx
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : q.admin_verified
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Q{q.question_number}</span>
                {q.admin_verified && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            ))}
          </div>

          {/* Side-by-Side Review Split */}
          {currentQ && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Left Pane: Raw Document & Diagram Visualizer */}
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-black uppercase text-slate-400">Diagram &amp; Visual Inspector</span>
                    <span className="text-xs font-bold text-slate-600">
                      Type: <strong className="text-indigo-600">{currentQ.diagram_type}</strong>
                    </span>
                  </div>

                  {currentQ.has_diagram && currentQ.diagram_svg ? (
                    <div className="rounded-xl border border-slate-200 p-4 bg-white flex flex-col items-center">
                      <div
                        className="w-full max-w-[420px] aspect-[4/3] flex items-center justify-center overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: currentQ.diagram_svg }}
                      />
                      <span className="text-[10px] text-slate-400 font-bold uppercase mt-2">
                        Precision Programmatic SVG Render
                      </span>
                    </div>
                  ) : currentQ.has_diagram && currentQ.diagram_image_url ? (
                    <div className="rounded-xl border border-slate-200 p-4 bg-white flex flex-col items-center">
                      <img
                        src={currentQ.diagram_image_url}
                        alt="Question diagram"
                        className="max-h-[300px] object-contain rounded-lg"
                      />
                      <span className="text-[10px] text-slate-400 font-bold uppercase mt-2">Enhanced Visual</span>
                    </div>
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                      <p className="text-xs font-bold text-slate-500">No diagram required for this question.</p>
                      <button
                        type="button"
                        onClick={handleRegenerateSvg}
                        disabled={regeneratingSvg}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        {regeneratingSvg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        Generate SVG Diagram
                      </button>
                    </div>
                  )}

                  {/* Diagram Controls */}
                  {currentQ.has_diagram && (
                    <div className="space-y-3 pt-2">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                        Diagram Synthesis Brief (Prompt)
                      </label>
                      <input
                        type="text"
                        value={currentQ.diagram_prompt || ''}
                        onChange={(e) => updateCurrentQuestionField('diagram_prompt', e.target.value)}
                        placeholder="e.g. Electric circuit with 24V DC battery and 12-ohm resistor"
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={handleRegenerateSvg}
                          disabled={regeneratingSvg}
                          className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                        >
                          {regeneratingSvg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Regenerate Precision SVG
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Raw File Link */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-500">Source Scan:</span>
                    <a
                      href={activeBatch.raw_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 font-bold hover:underline"
                    >
                      Open Raw PDF in New Tab ↗
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Pane: Question Editor & Marking Scheme */}
              <div className="space-y-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">
                        Editing Question {currentQ.question_number}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        Marks:
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={currentQ.marks}
                          onChange={(e) => updateCurrentQuestionField('marks', Number(e.target.value))}
                          className="w-14 p-1 rounded-lg border border-slate-200 text-center font-black text-xs"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                      Question Text
                    </label>
                    <textarea
                      rows={3}
                      value={currentQ.question_text}
                      onChange={(e) => updateCurrentQuestionField('question_text', e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Topic
                      </label>
                      <input
                        type="text"
                        value={currentQ.topic || ''}
                        onChange={(e) => updateCurrentQuestionField('topic', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Competency
                      </label>
                      <input
                        type="text"
                        value={currentQ.competency || ''}
                        onChange={(e) => updateCurrentQuestionField('competency', e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Marking Scheme Editor */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500">
                        KNEC Marking Scheme &amp; Step Allocations
                      </label>
                      <button
                        type="button"
                        onClick={handleRegenerateScheme}
                        disabled={regeneratingScheme}
                        className="text-[11px] text-indigo-600 font-bold hover:underline inline-flex items-center gap-1"
                      >
                        {regeneratingScheme ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Auto-Synthesize Scheme
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={currentQ.marking_scheme}
                      onChange={(e) => updateCurrentQuestionField('marking_scheme', e.target.value)}
                      placeholder="e.g. 1. State formula V = IR [1 mk]&#10;2. Substitute 24 / 12 [1 mk]&#10;3. Answer = 2.0 A [1 mk]"
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-slate-50 focus:border-indigo-500 outline-none"
                    />
                  </div>

                  {/* Admin Verification Checkbox */}
                  <div className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={currentQ.admin_verified}
                          onChange={(e) => updateCurrentQuestionField('admin_verified', e.target.checked)}
                          className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                        />
                        <span className="font-black text-xs text-emerald-950">
                          Admin Verified (Text, Visual &amp; Scheme are 100% Accurate)
                        </span>
                      </label>
                      <p className="text-[11px] text-emerald-800 font-medium ml-7 mt-0.5">
                        Guarantees zero diagram confusion and exact mark alignment for the candidate.
                      </p>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={selectedQuestionIndex === 0}
                      onClick={() => setSelectedQuestionIndex((i) => Math.max(0, i - 1))}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      ← Previous Question
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveCurrentQuestion(false)}
                        disabled={savingQuestion}
                        className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
                      >
                        {savingQuestion ? 'Saving…' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => saveCurrentQuestion(true)}
                        disabled={savingQuestion}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-xs"
                      >
                        Save &amp; Next →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Batch Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-base text-slate-900">Upload Raw Scanned Past Paper</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 rounded-lg text-slate-400 hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAndExtract} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Paper Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. KCSE 2024 Mathematics Paper 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class / Level</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    <option>Grade 6</option>
                    <option>Grade 7</option>
                    <option>Grade 8</option>
                    <option>Grade 9</option>
                    <option>Form 1</option>
                    <option>Form 2</option>
                    <option>Form 3</option>
                    <option>Form 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    <option>Mathematics</option>
                    <option>English</option>
                    <option>Kiswahili</option>
                    <option>Integrated Science</option>
                    <option>Biology</option>
                    <option>Chemistry</option>
                    <option>Physics</option>
                    <option>Social Studies</option>
                    <option>CRE</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Exam Type</label>
                  <select
                    value={examType}
                    onChange={(e) => setExamType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  >
                    <option>KPSEA</option>
                    <option>KJSEA</option>
                    <option>KCSE</option>
                    <option>CBC Mock</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target Bundle Set</label>
                  <input
                    type="text"
                    placeholder="e.g. KCSE BDL001"
                    value={targetBundle}
                    onChange={(e) => setTargetBundle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scanned PDF / Document Public URL
                </label>
                <input
                  required
                  type="url"
                  placeholder="https://.../kcse_math_2024.pdf"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Start AI Deconstruction &amp; Repackaging</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
