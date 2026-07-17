import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { examService } from '../../services/examService';

type PublishedExam = {
  id: string | number;
  title?: string;
  subject?: string;
  grade?: string;
  duration_minutes?: number;
  file_url?: string;
};

interface PublishedExamShelfProps {
  selectedClass?: string;
  selectedSubject?: string;
}

const normalize = (value: unknown) =>
  String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();

export const PublishedExamShelf: React.FC<PublishedExamShelfProps> = ({
  selectedClass,
  selectedSubject,
}) => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<PublishedExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadFailed(false);

    examService
      .listPublishedExams()
      .then((items) => {
        if (active) setPapers(items as unknown as PublishedExam[]);
      })
      .catch(() => {
        if (active) setLoadFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const visiblePapers = useMemo(() => {
    const classKey = normalize(selectedClass);
    const subjectKey = normalize(selectedSubject);
    const exact = papers.filter((paper) => {
      const classMatches = !classKey || normalize(paper.grade) === classKey;
      const subjectMatches = !subjectKey || normalize(paper.subject) === subjectKey;
      return classMatches && subjectMatches;
    });

    return (exact.length > 0 ? exact : papers).slice(0, 6);
  }, [papers, selectedClass, selectedSubject]);

  return (
    <section className="mb-8 rounded-[2rem] border border-indigo-100 bg-indigo-50/60 p-5 md:p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">
            Published exam papers
          </p>
          <h4 className="mt-1 text-xl font-black text-slate-900">
            Open the same papers your learners are revising
          </h4>
          <p className="mt-1 text-sm font-medium text-slate-600">
            Preview or share a question paper without exposing its private marking rubric.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/revision')}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-black text-white hover:bg-indigo-700"
        >
          Full exam library
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading published papers...
        </div>
      ) : loadFailed ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          Papers could not be loaded. Your own resources remain available below.
        </div>
      ) : visiblePapers.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-indigo-200 bg-white p-5 text-sm font-bold text-slate-500">
          No published papers match this class yet.
        </div>
      ) : (
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visiblePapers.map((paper) => (
            <article key={paper.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h5 className="line-clamp-2 text-sm font-black leading-snug text-slate-900">
                    {paper.title || 'Published exam paper'}
                  </h5>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {[paper.subject, paper.grade, paper.duration_minutes ? `${paper.duration_minutes} min` : '']
                      .filter(Boolean)
                      .join(' / ')}
                  </p>
                </div>
              </div>
              {paper.file_url ? (
                <a
                  href={paper.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 text-xs font-black text-indigo-700 hover:bg-indigo-50"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open question paper
                </a>
              ) : (
                <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs font-bold text-slate-400">
                  Interactive version ready; PDF pending
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
