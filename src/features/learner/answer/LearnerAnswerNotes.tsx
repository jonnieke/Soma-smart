import React from 'react';
import { MarkdownText } from '../../../components/Shared';
import type { ExplanationResult } from '../../../types';

type Props = {
  answer: ExplanationResult;
  onBack: () => void;
  onListen: () => void;
  listening: boolean;
  onPractise: () => void;
  onExample: () => void;
  examplesUsed: number;
  busy: boolean;
  media?: React.ReactNode;
  children?: React.ReactNode;
};
const key = (text: string) =>
  text
    .replace(/[#*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
export function buildLearnerNotes(answer: ExplanationResult) {
  const seen = new Set([key(answer.explanation)]);
  const notes: { title: string; content: string }[] = [];
  const add = (title: string, content: string) => {
    const normalized = key(content);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    notes.push({ title, content });
  };
  for (const topic of answer.subtopics || []) {
    const content =
      topic.blocks
        ?.map((block) =>
          block.type === 'list'
            ? (block.items || []).map((item) => `- ${item}`).join('\n')
            : block.text || ''
        )
        .filter(Boolean)
        .join('\n\n') ||
      topic.content ||
      '';
    add(topic.title, content);
  }
  if (!notes.length) for (const recap of answer.recapNodes || []) add(recap.point, recap.details);
  if (!notes.length) for (const point of answer.summaryPoints || []) add('', point);
  return notes;
}

export function LearnerAnswerNotes({
  answer,
  onBack,
  onListen,
  listening,
  onPractise,
  onExample,
  examplesUsed,
  busy,
  media,
  children,
}: Props) {
  const notes = buildLearnerNotes(answer);
  const paragraphs = answer.explanation.trim().split(/\n\s*\n/);
  const introduction = paragraphs[0] || '';
  const remainder = paragraphs.slice(1).join('\n\n');
  const action =
    'min-h-12 rounded-xl px-5 py-3 text-sm font-semibold focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:opacity-50';
  return (
    <main className="min-h-screen bg-[#faf9f6] px-4 pb-24 text-slate-900">
      <div className="mx-auto max-w-2xl">
        <button className={`${action} my-3 text-indigo-700`} onClick={onBack}>
          ← Back to learning
        </button>
        <article className="rounded-2xl border border-stone-200 bg-white px-5 py-7 sm:px-10 sm:py-10">
          <p className="text-sm font-medium text-indigo-700">My learning notes</p>
          <h1 className="mt-2 break-words text-2xl font-bold leading-tight sm:text-3xl">
            {answer.topic}
          </h1>
          <div className="my-6 flex flex-wrap gap-3" aria-label="Learning actions">
            <button
              className={`${action} bg-indigo-700 text-white`}
              disabled={busy && !listening}
              onClick={onListen}
            >
              {listening ? 'Stop listening' : 'Listen'}
            </button>
          </div>
          {media && (
            <details className="mb-6 rounded-xl border border-stone-200 p-3">
              <summary className="cursor-pointer py-2 font-medium">
                Your scanned or recorded question
              </summary>
              {media}
            </details>
          )}
          {introduction && (
            <section aria-labelledby="simple-explanation">
              <h2 id="simple-explanation" className="mb-3 text-lg font-bold">
                In simple words
              </h2>
              <div className="prose max-w-none text-base leading-8">
                <MarkdownText content={introduction} />
              </div>
            </section>
          )}
          {notes.length > 0 && (
            <section aria-labelledby="key-notes" className="mt-8">
              <h2 id="key-notes" className="text-lg font-bold">
                Key notes
              </h2>
              <ol className="mt-4 list-decimal space-y-5 pl-5 marker:font-semibold marker:text-indigo-700">
                {notes.map((note, index) => (
                  <li key={index} className="pl-2 leading-8">
                    {note.title && <h3 className="font-semibold">{note.title}</h3>}
                    <div className="prose max-w-none text-base leading-8">
                      <MarkdownText content={note.content} />
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
          {remainder && (
            <details className="mt-6 border-t border-stone-200 pt-3">
              <summary className="cursor-pointer py-3 font-medium text-indigo-700">
                Read the full explanation
              </summary>
              <div className="prose max-w-none leading-8">
                <MarkdownText content={remainder} />
              </div>
            </details>
          )}
          {answer.practice?.isProblem && (
            <>
              <section
                aria-labelledby="worked-example"
                className="mt-8 border-t border-stone-200 pt-6"
              >
                <h2 id="worked-example" className="text-lg font-bold">
                  Worked example
                </h2>
                <p className="my-3 text-sm text-slate-600">
                  A similar question to help you learn the method.
                </p>
                <div className="prose max-w-none leading-8">
                  <MarkdownText content={answer.practice.workedExample} />
                </div>
              </section>
              <section
                id="your-turn"
                aria-labelledby="your-turn-title"
                className="mt-8 rounded-xl bg-emerald-50 p-5"
              >
                <h2 id="your-turn-title" className="text-lg font-bold">
                  Your turn
                </h2>
                <div className="prose my-3 max-w-none leading-8">
                  <MarkdownText content={answer.practice.originalQuestion} />
                </div>
                <p className="font-medium text-emerald-900">
                  Now it’s your turn to try the question. You can do it!
                </p>
              </section>
              <p className="mt-4 text-sm text-slate-500">{examplesUsed} of 3 examples used</p>
              <button
                className={`${action} mt-2 text-indigo-700`}
                onClick={onExample}
                disabled={busy || examplesUsed >= 3}
              >
                {examplesUsed >= 3 ? 'Try the question using your notes' : 'Show another example'}
              </button>
            </>
          )}
          {answer.grounding?.used && (
            <details className="mt-8 border-t border-stone-200 pt-3">
              <summary className="cursor-pointer py-3 text-sm text-slate-600">
                Sources from Soma library
              </summary>
              <ul className="list-disc space-y-2 pl-5 text-sm">
                {Array.from(new Set(answer.grounding.sources)).map((source) => (
                  <li key={source}>{source}</li>
                ))}
              </ul>
            </details>
          )}
          <section
            aria-labelledby="quick-quiz-title"
            className="mt-8 border-t border-stone-200 pt-6"
          >
            <h2 id="quick-quiz-title" className="text-lg font-bold">
              Check your understanding
            </h2>
            <p id="quick-quiz-description" className="mt-2 text-sm leading-6 text-slate-600">
              Three short questions, when you feel ready. You can return to your notes at any time.
            </p>
            <button
              className={`${action} mt-3 border border-indigo-200 text-indigo-800`}
              aria-describedby="quick-quiz-description"
              disabled={busy}
              onClick={onPractise}
            >
              Quick quiz · 3 questions
            </button>
          </section>
        </article>
        <details className="mt-5 rounded-xl border border-stone-200 bg-white p-4">
          <summary className="cursor-pointer py-2 font-semibold text-indigo-700">More</summary>
          <div className="mt-4 space-y-5">{children}</div>
        </details>
      </div>
    </main>
  );
}
