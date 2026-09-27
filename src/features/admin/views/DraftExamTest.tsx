import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase';

type TestQuestion = { id: string; number: string; text: string; marks: number };
type TestState = {
  attempt: { id: string; learner_id: string; status: string; score?: number; maximum_marks?: number };
  questions: TestQuestion[];
  responses: { question_id: string; answer_text: string; marking_breakdown: { marksAwarded: number; marksAvailable: number; feedback: string } }[];
};
export function DraftExamTest({ examId, title, onBack }: { examId: string; title: string; onBack: () => void }) {
  const [test, setTest] = useState<TestState | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resumeId, setResumeId] = useState('');
  async function invoke(body: Record<string, unknown>) {
    const { data, error } = await supabase.functions.invoke('mark-exam-response', { body: { examId, ...body } });
    if (error) {
      const detail = await error.context?.json?.().catch(() => null);
      throw new Error(detail?.error || error.message);
    }
    if (data?.error) throw new Error(data.error);
    return data;
  }
  async function run(action: () => Promise<void>) {
    if (busy) return;
    setBusy(true); setError('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Test request failed'); }
    finally { setBusy(false); }
  }
  function load(result: TestState) {
    setTest(result);
    setResumeId(result.attempt.id);
    setAnswers(Object.fromEntries((result.responses || []).map(r => [r.question_id, r.answer_text])));
  }
  const button = 'rounded-xl bg-indigo-600 px-4 py-2 text-white font-bold disabled:opacity-50';
  return <section className="mx-auto max-w-3xl space-y-5 p-5">
    <button onClick={onBack} disabled={busy} className="text-indigo-700 font-bold">← Back to past papers</button>
    <h1 className="text-2xl font-bold">Private marking test</h1>
    <p>{title}</p>
    <p className="rounded-xl bg-amber-50 p-4">Admin-only test. This does not publish the paper or approve it for teaching. AI marking uses your platform’s AI allowance/costs. Saved test attempts are separate from learner attempts.</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {!test ? <div className="space-y-4">
      <button className={button} disabled={busy} onClick={() => void run(async () => load(await invoke({ action: 'start-test', examId })))}>Start private test</button>
      <label className="block">Resume a saved test ID<input className="block w-full rounded border p-3" value={resumeId} onChange={e => setResumeId(e.target.value)} /></label>
      <button className={button} disabled={busy || !resumeId.trim()} onClick={() => void run(async () => load(await invoke({ action: 'get-test', attemptId: resumeId.trim() })))}>Load saved test</button>
    </div> : <>
      <p className="break-all">Saved test ID: <code>{test.attempt.id}</code>. Keep this ID to resume after closing the page.</p>
      <p role="status">{busy ? 'Working…' : test.attempt.status === 'SUBMITTED' ? `Saved total: ${test.attempt.score}/${test.attempt.maximum_marks}` : 'Test in progress'}</p>
      {test.questions.map(q => {
        const result = test.responses.find(r => r.question_id === String(q.id));
        return <article key={q.id} className="space-y-3 rounded-xl border bg-white p-4">
          <h2 className="font-bold">Question {q.number} · {q.marks} marks</h2><p>{q.text}</p>
          <label className="block">Test answer for question {q.number}<textarea className="block w-full rounded border p-3" maxLength={20000} value={answers[q.id] || ''} disabled={busy || test.attempt.status === 'SUBMITTED'} onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} /></label>
          <button className={button} disabled={busy || !answers[q.id]?.trim() || test.attempt.status === 'SUBMITTED'} onClick={() => void run(async () => {
            await invoke({ examId, questionId: q.id, learnerAnswer: answers[q.id], learnerId: test.attempt.learner_id, attemptId: test.attempt.id });
            const saved = await invoke({ action: 'get-test', attemptId: test.attempt.id });
            setTest(saved);
          })}>Mark and save Q{q.number}</button>
          {result && <p>Saved marking: {result.marking_breakdown.marksAwarded}/{result.marking_breakdown.marksAvailable} — {result.marking_breakdown.feedback}{result.answer_text !== answers[q.id] ? ' (For the previously saved answer.)' : ''}</p>}
        </article>;
      })}
      <button className={button} disabled={busy || test.attempt.status === 'SUBMITTED' || test.questions.some(q => !test.responses.some(r => r.question_id === String(q.id) && r.answer_text === answers[q.id]))} onClick={() => void run(async () => {
        await invoke({ action: 'submit-test', attemptId: test.attempt.id });
        setTest(await invoke({ action: 'get-test', attemptId: test.attempt.id }));
      })}>Finish test and verify saved total</button>
      <p>Use separate tests for fully correct, partially correct and incorrect answers. Only saved answers count toward the total. This is not teacher approval.</p>
    </>}
  </section>;
}
