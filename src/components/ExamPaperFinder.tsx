import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, X } from 'lucide-react';
import { ExamPaperBankItem, EXAM_PAPER_PRICE_KES } from '../services/examPaperBankService';

export function ExamPaperFinder({
  papers,
  loading,
  onChoose,
  isUnlocked,
}: {
  papers: ExamPaperBankItem[];
  loading: boolean;
  onChoose: (paper: ExamPaperBankItem) => void;
  isUnlocked: (id: string | number) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  const grades = [...new Set(papers.map((p) => p.grade).filter(Boolean))].sort();
  const subjects = [
    ...new Set(
      papers
        .filter((p) => p.grade === grade)
        .map((p) => p.subject)
        .filter(Boolean)
    ),
  ].sort();
  const matches = papers.filter(
    (p) =>
      p.grade === grade &&
      p.subject === subject &&
      `${p.title} ${p.exam_year || ''} ${p.exam_body || ''}`
        .toLowerCase()
        .includes(query.toLowerCase().trim())
  );
  const selected = matches.find((p) => String(p.id) === selectedId);
  const ready = step === 0 ? !!grade : step === 1 ? !!subject : !!selected;
  const field = 'mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-slate-900';
  return (
    <>
      <button
        className="fixed bottom-6 left-4 z-40 inline-flex items-center gap-2 rounded-full bg-indigo-700 px-4 py-3 text-sm font-semibold text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={() => setOpen(true)}
      >
        <BookOpen size={18} />
        Help me find a paper
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl p-0 text-slate-900 shadow-xl backdrop:bg-slate-900/40"
        aria-labelledby="paper-finder-title"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-indigo-700">Step {step + 1} of 4</p>
              <h2 id="paper-finder-title" className="mt-1 text-xl font-bold">
                {
                  [
                    'Choose your grade',
                    'Choose your subject',
                    'Choose a paper',
                    'Ready to practise?',
                  ][step]
                }
              </h2>
            </div>
            <button
              aria-label="Close paper finder"
              className="rounded-full p-2 hover:bg-slate-100"
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          {loading ? (
            <p role="status" className="my-5">
              Loading available papers…
            </p>
          ) : !papers.length ? (
            <p className="my-5">
              We couldn’t find available papers. Close this guide and refresh the page to try again.
            </p>
          ) : (
            <div className="my-5">
              {step === 0 && (
                <label>
                  What grade or class are you revising?
                  <select
                    autoFocus
                    className={field}
                    value={grade}
                    onChange={(e) => {
                      setGrade(e.target.value);
                      setSubject('');
                      setSelectedId('');
                      setQuery('');
                    }}
                  >
                    <option value="">Select your grade</option>
                    {grades.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
              )}
              {step === 1 && (
                <label>
                  Which subject in {grade}?
                  <select
                    className={field}
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setSelectedId('');
                      setQuery('');
                    }}
                  >
                    <option value="">Select a subject</option>
                    {subjects.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
              )}
              {step === 2 && (
                <>
                  <p className="text-sm">
                    {grade} · {subject}
                  </p>
                  <input
                    className={field}
                    aria-label="Search matching papers"
                    placeholder="Search by title, year or exam body"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelectedId('');
                    }}
                  />
                  <fieldset className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                    <legend className="text-sm text-slate-600">
                      {matches.length} available papers
                    </legend>
                    {matches.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-start gap-3 rounded-xl border p-3"
                      >
                        <input
                          type="radio"
                          name="finder-paper"
                          className="mt-1"
                          checked={selectedId === String(p.id)}
                          onChange={() => setSelectedId(String(p.id))}
                        />
                        <span>
                          <strong className="block text-sm">{p.title}</strong>
                          <span className="text-xs text-slate-600">
                            {p.exam_year} ·{' '}
                            {isUnlocked(p.id) ? 'Open paper' : `KES ${EXAM_PAPER_PRICE_KES}`}
                          </span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                  {!matches.length && (
                    <p className="mt-3">
                      No matching papers. Clear your search or go back to choose another subject.
                    </p>
                  )}
                </>
              )}
              {step === 3 && selected && (
                <>
                  <h3 className="font-bold">{selected.title}</h3>
                  <p className="mt-2">
                    {grade} · {subject}
                  </p>
                  <p className="mt-3">
                    {isUnlocked(selected.id)
                      ? 'Your account or purchase already gives you access.'
                      : `KES ${EXAM_PAPER_PRICE_KES} for this paper and its marking scheme. This is a one-off paper purchase.`}
                  </p>
                  <p className="mt-3 text-sm text-slate-600">
                    {isUnlocked(selected.id)
                      ? 'Continue to open the paper.'
                      : 'Next, enter your contact details and complete payment. Your paper will open after payment is confirmed.'}
                  </p>
                </>
              )}
            </div>
          )}
          <div className="flex justify-between gap-3">
            <button
              className="rounded-xl border px-4 py-2 disabled:opacity-40"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
            <button
              className="rounded-xl bg-indigo-700 px-5 py-2 font-semibold text-white disabled:opacity-40"
              disabled={loading || !ready}
              onClick={() => {
                if (step < 3) setStep((s) => s + 1);
                else if (selected) {
                  setOpen(false);
                  onChoose(selected);
                }
              }}
            >
              {step < 3
                ? 'Next'
                : selected && isUnlocked(selected.id)
                  ? 'Open paper'
                  : 'Continue to checkout'}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
