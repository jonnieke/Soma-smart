import { curriculumSources } from '../data/curriculumSources';
import { curriculumPilot } from '../data/curriculumPilot';

export function CurriculumSources({ grade }: { grade?: string }) {
  const sources = curriculumSources.filter(source => !grade || source.grade === grade);
  return (
    <section aria-label="Official curriculum sources" className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-slate-900 space-y-3">
      <h2 className="font-bold">Official curriculum sources</h2>
      <p className="text-sm">KICD regular curriculum designs. These are curriculum references, not KNEC marking schemes or a guarantee of examination marks.</p>
      {sources.map(source => (
        <article key={source.id} className="rounded-xl bg-white border border-slate-200 p-4 space-y-2">
          <h3 className="font-semibold">{source.grade} · {source.subject}</h3>
          <p className="text-sm">{source.edition}</p>
          <p className="text-sm">Source link verified {source.verifiedOn}. Outcome mapping awaiting review.</p>
          <div className="flex flex-wrap gap-4 text-sm text-indigo-700 underline">
            <a href={source.documentUrl} target="_blank" rel="noopener noreferrer">Open KICD document (new tab)</a>
            <a href={source.sourcePage} target="_blank" rel="noopener noreferrer">Verify on KICD website (new tab)</a>
          </div>
          {curriculumPilot.filter(pilot => pilot.sourceId === source.id).map(pilot => (
            <details key={pilot.id} className="border-t border-slate-200 pt-3 text-sm">
              <summary className="cursor-pointer font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600">Preview mapping: {pilot.topic} · awaiting teacher review</summary>
              <p className="mt-3">{pilot.strand} / {pilot.sourceCode} {pilot.topic}. PDF viewer page {pilot.viewerPage} of {source.pageCount}; printed page {pilot.printedPage}.</p>
              <p className="mt-2">Partial pilot only. These are Soma-written summaries, not official wording or a complete list of outcomes.</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {pilot.outcomes.map(outcome => <li key={outcome.id}>{outcome.summary}</li>)}
              </ul>
            </details>
          ))}
        </article>
      ))}
      {!sources.length && <p className="text-sm">No verified source registered for this grade yet.</p>}
      <p className="text-xs">Documents remain hosted by KICD. Full-document ingestion requires permission; downloading is disabled by the owner. Pilot summaries still require teacher review before use in published learning materials.</p>
    </section>
  );
}
