import React, { useId, useState } from 'react';
import type { LessonIllustration } from './lessonIllustrations';

export function PhotosynthesisDiagram() {
  return (
    <div
      className="space-y-3 rounded-xl bg-emerald-50 p-4 text-center"
      role="img"
      aria-label="Carbon dioxide and water, using light energy absorbed by chlorophyll, form glucose and oxygen."
    >
      <p className="font-semibold text-amber-800">Light energy from the sun</p>
      <p aria-hidden="true" className="text-2xl text-amber-700">
        ↓
      </p>
      <div className="rounded-xl border border-emerald-200 bg-white p-4">
        <p className="font-bold text-emerald-900">In the green parts of the plant</p>
        <p className="mt-1 text-sm text-slate-600">Chlorophyll absorbs light energy</p>
        <div
          aria-hidden="true"
          className="mt-4 flex flex-wrap items-center justify-center gap-3 text-base font-semibold"
        >
          <span>
            Carbon dioxide
            <br />+ water
          </span>
          <span className="text-2xl">→</span>
          <span>
            Glucose
            <br />+ oxygen
          </span>
        </div>
      </div>
    </div>
  );
}

export function FractionDiagram() {
  return (
    <div
      className="space-y-5 rounded-xl bg-indigo-50 p-4 sm:p-6"
      role="img"
      aria-label="Two bars of equal length. The first has one of two equal parts shaded. The second has two of four equal parts shaded. Both show half of the whole."
    >
      {[
        { parts: 2, shaded: 1, label: '1/2 — one half' },
        { parts: 4, shaded: 2, label: '2/4 — two quarters' },
      ].map((bar) => (
        <div key={bar.parts} aria-hidden="true">
          <p className="mb-2 font-semibold text-indigo-950">{bar.label}</p>
          <div className="flex h-14 overflow-hidden rounded-lg border-2 border-indigo-800">
            {Array.from({ length: bar.parts }, (_, index) => (
              <span
                key={index}
                className={`flex-1 ${index ? 'border-l-2 border-indigo-800' : ''} ${index < bar.shaded ? 'bg-indigo-600' : 'bg-white'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function LessonVisual({ visual }: { visual: LessonIllustration }) {
  const titleId = useId();
  const radioName = useId();
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <section aria-labelledby={titleId} className="mt-8 border-t border-stone-200 pt-6">
      <h2 id={titleId} className="mb-4 text-lg font-bold">
        {visual.title}
      </h2>
      <figure>
        {visual.id === 'soil-erosion' && (
          <>
            {!imageFailed && (
              <img
                src="/lesson-illustrations/soil-erosion.webp"
                alt="Rain washes soil down a bare slope on the left; grass and roots protect the slope on the right."
                width={1200}
                height={800}
                loading="lazy"
                decoding="async"
                onError={() => setImageFailed(true)}
                className="h-auto w-full rounded-xl"
              />
            )}
            {!imageFailed && (
              <div
                aria-hidden="true"
                className="mt-2 grid grid-cols-2 gap-3 text-center text-sm font-semibold"
              >
                <span>Bare hillside</span>
                <span>Hillside with grass</span>
              </div>
            )}
            {imageFailed && (
              <p className="rounded-xl bg-stone-50 p-4 text-sm text-slate-600">
                The picture could not load. You can still read the comparison below.
              </p>
            )}
          </>
        )}
        {visual.id === 'photosynthesis' && <PhotosynthesisDiagram />}
        {visual.id === 'fractions' && <FractionDiagram />}
        <figcaption className="mt-3 text-sm leading-6 text-slate-600">{visual.caption}</figcaption>
      </figure>
      <p className="mt-4 rounded-xl bg-emerald-50 p-4 leading-7 text-emerald-950">
        <strong>Remember: </strong>
        {visual.takeaway}
      </p>
      <form
        className="mt-5 rounded-xl border border-indigo-100 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (choice !== null) setChecked(true);
        }}
      >
        <fieldset>
          <legend className="font-semibold">Try this picture</legend>
          <p className="my-3 leading-7">{visual.question}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {visual.options.map((option, index) => (
              <label
                key={option}
                className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border p-3 ${choice === index ? 'border-indigo-600 bg-indigo-50' : 'border-stone-200'}`}
              >
                <input
                  type="radio"
                  name={radioName}
                  value={index}
                  checked={choice === index}
                  onChange={() => {
                    setChoice(index);
                    setChecked(false);
                  }}
                  className="h-4 w-4 accent-indigo-700"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          disabled={choice === null}
          className="mt-4 min-h-12 rounded-xl bg-indigo-700 px-5 py-3 font-semibold text-white focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:opacity-50"
        >
          Check this answer
        </button>
        <div role="status" aria-live="polite">
          {checked && (
            <p className="mt-4 leading-7 text-slate-800">
              <strong>
                {choice === visual.correctIndex ? 'Yes, you’ve got it! ' : 'Let’s look together. '}
              </strong>
              {visual.feedback}
            </p>
          )}
        </div>
      </form>
      <a
        href={visual.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-block py-2 text-xs text-slate-500 underline"
      >
        {visual.sourceLabel}
      </a>
    </section>
  );
}
