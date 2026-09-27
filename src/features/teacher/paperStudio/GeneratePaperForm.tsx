import React, { useRef, useState } from 'react';
import type { CurriculumFramework } from '../../../types/paperStudio';
import { getAiAllowance, type AiAllowance } from '../../../services/aiAllowance';

export function GeneratePaperForm({ onCancel, onPaperCreated, onUseBank }: {
  onCancel: () => void; onPaperCreated: (id: string) => void; onUseBank: () => void;
}) {
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [topics, setTopics] = useState('');
  const [count, setCount] = useState(10);
  const [marks, setMarks] = useState(20);
  const [minutes, setMinutes] = useState(40);
  const [school, setSchool] = useState('');
  const [curriculum, setCurriculum] = useState<CurriculumFramework>('CBC_CBE');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [allowance, setAllowance] = useState<AiAllowance>();
  const locked = useRef(false);
  const limitReached = Boolean(allowance) || /(?:teacher[ _-]?ai|teacher AI tools).*limit reached|limit reached.*(?:free trial|plan)/i.test(error);
  const paidPlan = ['DAILY', 'WEEKLY', 'MONTHLY', 'TERMLY', 'ANNUAL', 'PRO'].includes(allowance?.plan || '');
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setAllowance(undefined);
    try {
      const { generatePaperDraft } = await import('../../../services/assessmentEngine/paperGeneration');
      const paper = await generatePaperDraft({ grade, subject, topics, questionCount: count, totalMarks: marks, durationMinutes: minutes, schoolName: school, curriculum }, setProgress);
      onPaperCreated(paper.id);
    } catch (reason) { setAllowance(getAiAllowance(reason)); setError(reason instanceof Error ? reason.message : 'Generation failed. Please try again.'); }
    finally { locked.current = false; setBusy(false); setProgress(''); }
  };
  const field = 'block w-full rounded-xl border border-slate-300 p-3 mt-1 bg-white text-slate-900';
  return <main className="max-w-3xl mx-auto p-4 sm:p-8 text-slate-900">
    <button disabled={busy} onClick={onCancel} className="py-3 text-indigo-700">← My papers</button>
    <h1 className="text-2xl font-bold">Generate a paper</h1>
    <p className="mt-2 text-slate-600">Tell Soma what you have taught. Get an editable paper with answers, a marking guide and writing space.</p>
    <form onSubmit={submit} className="mt-6 space-y-5">
      <fieldset disabled={busy} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <label>Class<input required maxLength={80} className={field} value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. Grade 6" /></label>
          <label>Subject<input required maxLength={100} className={field} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Science and Technology" /></label>
        </div>
        <label className="block">What should the paper cover?<textarea required maxLength={2000} rows={4} className={field} value={topics} onChange={e => setTopics(e.target.value)} placeholder="Soil erosion: causes, effects and prevention. Include everyday examples and a few application questions." /></label>
        <div className="grid grid-cols-2 gap-4">
          <label>Questions<input type="number" required min={1} max={20} className={field} value={count} onChange={e => setCount(Number(e.target.value))} /></label>
          <label>Total marks<input type="number" required min={count} max={100} className={field} value={marks} onChange={e => setMarks(Number(e.target.value))} /></label>
        </div>
        <details><summary className="cursor-pointer text-indigo-700 py-2">More options</summary>
          <label className="block mt-3">Curriculum<select className={field} value={curriculum} onChange={e => setCurriculum(e.target.value as CurriculumFramework)}><option value="CBC_CBE">CBC / CBE</option><option value="8_4_4">8-4-4 / KCSE</option><option value="IGCSE">IGCSE</option></select></label>
          <label className="block mt-3">Duration in minutes<input type="number" min={5} max={180} className={field} value={minutes} onChange={e => setMinutes(Number(e.target.value))} /></label>
          <label className="block mt-3">School name (optional)<input maxLength={150} className={field} value={school} onChange={e => setSchool(e.target.value)} /></label>
        </details>
      </fieldset>
      <p className="text-sm text-slate-600">Saved privately to your account. Review every answer before using the paper in class. Your account’s AI usage limits apply.</p>
      {progress && <p role="status">{progress} Keep this page open.</p>}
      {error && <div role="alert" className={`p-4 rounded-xl ${limitReached ? 'bg-indigo-50 text-indigo-950 border border-indigo-200' : 'bg-red-50 text-red-800'}`}>
        {limitReached ? <>
          <h2 className="font-bold text-lg">Need more AI access for your teaching?</h2>
          {allowance?.limit !== undefined && allowance?.usageCount !== undefined && <p className="mt-2 font-semibold">{allowance.usageCount} of {allowance.limit} daily AI requests used · {Math.max(0, allowance.limit - allowance.usageCount)} remaining</p>}
          <p className="mt-2">{paidPlan ? 'Your paid plan has reached its daily AI allowance. You do not need to buy the same subscription again. Return after the daily reset; your saved papers remain available.' : 'You’ve reached your current AI allowance. Explore Teacher Pro subscriptions for more access, or return after your daily allowance resets.'}</p>
          <p className="mt-2 text-sm">The server has not provided an exact reset time. This allowance counts AI requests, not tokens.</p>
          {!paidPlan && <>
          <a href="/pricing?segment=TEACHER" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center rounded-xl bg-indigo-700 text-white font-bold px-4 py-3 mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">View teacher plans <span className="sr-only">(opens in a new tab)</span></a>
          <p className="mt-3 text-sm">Choose a plan and follow the payment steps. Plans open in a new tab so your question stays here. After purchase, return here and select Generate my paper again. Plan usage limits still apply.</p>
          </>}
          {paidPlan && <p className="mt-2 text-sm">Teacher credit top-ups are not available here yet. No additional payment is required to reopen or edit saved papers.</p>}
          <p className="mt-2 text-sm">Your request is also saved in My papers. No answer has been generated for this attempt.</p>
        </> : error}
        <button type="button" onClick={onCancel} className="block underline mt-3 min-h-11">Open My papers</button>
      </div>}
      <button disabled={busy} className="w-full sm:w-auto rounded-xl bg-indigo-600 text-white font-bold px-6 py-3 disabled:opacity-50">{busy ? 'Preparing your paper…' : 'Generate my paper'}</button>
    </form>
    <button disabled={busy} onClick={onUseBank} className="mt-6 underline text-indigo-700 py-3">Or build from a question bank</button>
  </main>;
}
