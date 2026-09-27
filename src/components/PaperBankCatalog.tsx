import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, FileText, Search, Tag, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/images/main_logo.png';
import type { ExamPaperBankItem } from '../services/examPaperBankService';
import { EXAM_PAPER_PRICE_KES } from '../services/examPaperBankService';
import './PaperBankCatalog.css';

const clean = (value?: string | null) => (value || '').trim().replace(/\s+/g, ' ');
export const paperLevel = (value: string) => {
  const level = clean(value);
  if (/^(kcse(?: level)?|form\s*4)$/i.test(level)) return 'Form 4';
  if (/^kpsea$/i.test(level)) return 'Grade 6';
  return level.replace(
    /^(grade|form)\s*(\d+)$/i,
    (_, label: string, number: string) =>
      `${label[0].toUpperCase()}${label.slice(1).toLowerCase()} ${number}`
  );
};
export const paperSubject = (value: string) => {
  const subject = clean(value);
  if (/^english language$/i.test(subject)) return 'English';
  if (/^(CRE|IRE|HRE)$/i.test(subject)) return subject.toUpperCase();
  return subject.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
};
export const paperCategory = (paper: ExamPaperBankItem) => {
  const level = paperLevel(paper.grade);
  if (level === 'Form 4' || /kcse/i.test(`${paper.exam_body || ''} ${paper.exam_type || ''}`))
    return 'KCSE';
  if (level === 'Grade 6' || /kpsea/i.test(`${paper.exam_body || ''} ${paper.exam_type || ''}`))
    return 'KPSEA';
  return /^Grade /i.test(level) ? 'CBC assessments' : 'Other';
};
type Props = {
  papers: ExamPaperBankItem[];
  loading: boolean;
  loadError: string;
  restoringPurchases: boolean;
  purchaseRestoreError: string;
  onRestorePurchases: () => void;
  initialGrade?: string;
  initialSubject?: string;
  isUnlocked: (id: string | number) => boolean;
  onOpen: (paper: ExamPaperBankItem) => void;
  onRevision: (paper: ExamPaperBankItem) => void;
  onRetry: () => void;
  onClearFilters: () => void;
};

function PaperCover({ paper }: { paper?: ExamPaperBankItem }) {
  return (
    <div className="pb-sheet" aria-hidden="true">
      <strong>{paper ? paperSubject(paper.subject) : 'SOMA AI'}</strong>
      <span>{paper ? paperLevel(paper.grade) : 'Better practice.'}</span>
      <hr />
      <b>{paper ? 'Question paper' : 'Brighter futures.'}</b>
      <div className="pb-sheet-lines" />
      <small>{paper ? 'Paper details' : 'Learn one step at a time.'}</small>
    </div>
  );
}

export function PaperBankCatalog({
  papers,
  loading,
  loadError,
  restoringPurchases,
  purchaseRestoreError,
  onRestorePurchases,
  initialGrade,
  initialSubject,
  isUnlocked,
  onOpen,
  onRevision,
  onRetry,
  onClearFilters,
}: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [grade, setGrade] = useState(initialGrade ? paperLevel(initialGrade) : '');
  const [subject, setSubject] = useState(initialSubject ? paperSubject(initialSubject) : '');
  const [category, setCategory] = useState('All papers');
  const [examType, setExamType] = useState('');
  const [sort, setSort] = useState('featured');
  const [visibleCount, setVisibleCount] = useState(12);
  const [helperGrade, setHelperGrade] = useState('');
  const [helperSubject, setHelperSubject] = useState('');
  const [preview, setPreview] = useState<ExamPaperBankItem | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const results = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (preview) dialog.current?.showModal();
  }, [preview]);
  const grades = Array.from(
    new Set([grade, ...papers.map((paper) => paperLevel(paper.grade))].filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const subjects = Array.from(
    new Set([subject, ...papers.map((paper) => paperSubject(paper.subject))].filter(Boolean))
  ).sort();
  const examTypes = Array.from(
    new Set(papers.map((paper) => clean(paper.exam_type)).filter(Boolean))
  ).sort();
  const filtered = papers.filter(
    (paper) =>
      (!grade || paperLevel(paper.grade) === grade) &&
      (!subject || paperSubject(paper.subject) === subject) &&
      (!examType || clean(paper.exam_type) === examType) &&
      (category === 'All papers' ||
        (category === 'My papers' ? isUnlocked(paper.id) : paperCategory(paper) === category)) &&
      `${paper.title} ${paperSubject(paper.subject)} ${paperLevel(paper.grade)} ${paperCategory(paper)} ${paper.exam_year || ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
  );
  if (sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === 'year') filtered.sort((a, b) => Number(b.exam_year || 0) - Number(a.exam_year || 0));
  const clear = () => {
    setGrade('');
    setSubject('');
    setCategory('All papers');
    setExamType('');
    setQuery('');
    onClearFilters();
  };
  const jumpToResults = () => {
    results.current?.focus();
    results.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="paper-bank">
      <header className="pb-header">
        <div className="pb-header-inner">
          <a className="pb-brand" href="/">
            <img src={logo} alt="" />
            <span>
              Soma AI<small>Learn today. A brighter tomorrow.</small>
            </span>
          </a>
          <nav aria-label="Main navigation">
            <a href="/">Home</a>
            <a href="/learner">My classroom</a>
            <button onClick={() => navigate('/learner', { state: { targetTab: 'LIBRARY' } })}>
              Subjects
            </button>
            <a href="/exam-papers" aria-current="page">
              Past papers
            </a>
            <a href="/learning-videos">Learning videos</a>
          </nav>
          <button
            className="pb-my-papers"
            onClick={() => {
              clear();
              setCategory('My papers');
              jumpToResults();
            }}
          >
            <FileText size={19} />
            My papers
          </button>
        </div>
      </header>
      <main className="pb-main">
        <section className="pb-hero" aria-labelledby="paper-bank-title">
          <div>
            <p className="pb-eyebrow">SOMA AI · EXAM PAPER BANK</p>
            <h1 id="paper-bank-title">Your next exam starts here.</h1>
            <p className="pb-subtitle">
              Find a paper. Practise at your pace. Learn from every answer.
            </p>
            <form
              className="pb-search"
              role="search"
              onSubmit={(event) => {
                event.preventDefault();
                jumpToResults();
              }}
            >
              <Search size={23} />
              <input
                aria-label="Search papers"
                placeholder="Search a subject, paper or topic…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="pb-primary">Search</button>
            </form>
            <div className="pb-filters">
              <label>
                Level
                <select value={grade} onChange={(event) => setGrade(event.target.value)}>
                  <option value="">All levels</option>
                  {grades.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Subject
                <select value={subject} onChange={(event) => setSubject(event.target.value)}>
                  <option value="">All subjects</option>
                  {subjects.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <label>
                Exam type
                <select value={examType} onChange={(event) => setExamType(event.target.value)}>
                  <option value="">All types</option>
                  {examTypes.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
              <button className="pb-text-button" onClick={clear}>
                Clear filters
              </button>
            </div>
          </div>
          <div className="pb-hero-art" aria-hidden="true">
            <div className="pb-paper-stack">
              <PaperCover />
              <span className="pb-pen" />
            </div>
            <span className="pb-art-note">
              Past papers today.
              <br />
              Greater possibilities tomorrow.
            </span>
          </div>
        </section>
        <div className="pb-tabs" role="group" aria-label="Paper collections">
          {['All papers', 'KPSEA', 'KCSE', 'CBC assessments', 'My papers'].map((value) => (
            <button
              key={value}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="pb-content">
          <section aria-labelledby="pb-results">
            <div className="pb-results-heading">
              <h2 ref={results} tabIndex={-1} id="pb-results">
                {category === 'My papers' ? 'Your available papers' : 'Explore available papers'}
              </h2>
              <span role="status">
                {loading || (category === 'My papers' && restoringPurchases)
                  ? 'Loading…'
                  : category === 'My papers' && purchaseRestoreError
                    ? 'Restoration unavailable'
                  : `${filtered.length} ${filtered.length === 1 ? 'paper' : 'papers'}`}
              </span>
              <select
                aria-label="Sort papers"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="featured">Featured first</option>
                <option value="year">Latest exam year</option>
                <option value="title">Title A–Z</option>
              </select>
            </div>
            {category === 'My papers' && (
              <div className="pb-notice">
                <p>
                  Paid papers are restored securely for this browser. Active Pro access is also
                  shown. Purchases made on another device or before clearing browser data need
                  support to recover.
                </p>
                <button
                  className="pb-text-button"
                  disabled={restoringPurchases}
                  onClick={onRestorePurchases}
                >
                  {restoringPurchases ? 'Restoring purchases…' : 'Refresh purchases'}
                </button>
                {' · '}
                <a href="/contact">Purchase help</a>
              </div>
            )}
            {loading ? (
              <div className="pb-empty" role="status">
                Loading available papers…
              </div>
            ) : loadError ? (
              <div className="pb-empty" role="alert">
                <h3>We couldn’t load the paper bank</h3>
                <p>Your filters aren’t the problem. Please try again.</p>
                <button className="pb-primary" onClick={onRetry}>
                  Try again
                </button>
              </div>
            ) : category === 'My papers' && restoringPurchases ? (
              <div className="pb-empty">Checking your previous purchases…</div>
            ) : category === 'My papers' && purchaseRestoreError ? (
              <div className="pb-empty" role="alert">
                <h3>Purchase restoration unavailable</h3>
                <p>{purchaseRestoreError}</p>
                <button className="pb-primary" onClick={onRestorePurchases}>
                  Retry restoration
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="pb-empty">
                <FileText size={32} />
                <h3>
                  {category === 'My papers' && !papers.some((paper) => isUnlocked(paper.id))
                    ? 'No purchased papers found on this browser'
                    : papers.length
                      ? 'No papers match these filters yet'
                      : 'Papers are being prepared'}
                </h3>
                <p>
                  {category === 'My papers' && !papers.some((paper) => isUnlocked(paper.id))
                    ? 'If you paid on another browser or device, contact support with your receipt. Please don’t pay again just to recover access.'
                    : papers.length
                      ? `${[grade, subject, query.trim() && `“${query.trim()}”`].filter(Boolean).join(' · ') || category}: try another level or browse all available papers.`
                      : 'Please check back soon for published papers and marking schemes.'}
                </p>
                {papers.length > 0 && (
                  <button className="pb-outline" onClick={clear}>
                    Show all papers
                  </button>
                )}
              </div>
            ) : (
              <div className="pb-grid">
                {filtered.slice(0, visibleCount).map((paper) => (
                  <article className="pb-card" key={paper.id}>
                    <span className="pb-badge">
                      <FileText size={14} />
                      {isUnlocked(paper.id)
                        ? 'Access available'
                        : paper.exam_body === 'SomaAI'
                          ? 'Soma AI original'
                          : paper.exam_body || 'Practice paper'}
                    </span>
                    <h3>{paper.title}</h3>
                    <p className="pb-card-meta">
                      {paperLevel(paper.grade)} · {paperSubject(paper.subject)}
                    </p>
                    <div className="pb-card-body">
                      <PaperCover paper={paper} />
                      <div className="pb-card-facts">
                        {paper.duration_minutes ? (
                          <p>
                            <Clock />
                            <span>{paper.duration_minutes} minutes</span>
                          </p>
                        ) : null}
                        <p>
                          <CheckCircle2 className="pb-green" />
                          <span>Marking scheme included</span>
                        </p>
                        <p>
                          <Tag />
                          <strong>
                            {isUnlocked(paper.id) ? 'Unlocked' : `KES ${EXAM_PAPER_PRICE_KES}`}
                          </strong>
                        </p>
                      </div>
                    </div>
                    <button
                      className="pb-primary"
                      onClick={() => (isUnlocked(paper.id) ? onOpen(paper) : setPreview(paper))}
                    >
                      {isUnlocked(paper.id) ? 'Read paper' : 'Preview paper details'}
                    </button>
                    <button className="pb-card-link" onClick={() => onRevision(paper)}>
                      {isUnlocked(paper.id) ? 'Practise now' : 'Unlock & practise'}
                      <ArrowRight size={16} />
                    </button>
                  </article>
                ))}
              </div>
            )}
            {!loading &&
              !loadError &&
              !(category === 'My papers' && (restoringPurchases || purchaseRestoreError)) &&
              filtered.length > visibleCount && (
                <button
                  className="pb-outline pb-show-more"
                  onClick={() => setVisibleCount((count) => count + 12)}
                >
                  Show more papers ({filtered.length - visibleCount} remaining)
                </button>
              )}
          </section>
          <aside className="pb-sidebar">
            <section className="pb-helper">
              <img src={logo} alt="Akili study companion" />
              <h2>Not sure where to start?</h2>
              <p>Choose your class and subject.</p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  setGrade(helperGrade);
                  setSubject(helperSubject);
                  setCategory('All papers');
                  setQuery('');
                  setExamType('');
                  jumpToResults();
                }}
              >
                <label className="pb-sr-only" htmlFor="pb-helper-grade">
                  Choose your class
                </label>
                <select
                  id="pb-helper-grade"
                  value={helperGrade}
                  onChange={(event) => setHelperGrade(event.target.value)}
                >
                  <option value="">All classes</option>
                  {grades.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <label className="pb-sr-only" htmlFor="pb-helper-subject">
                  Choose your subject
                </label>
                <select
                  id="pb-helper-subject"
                  value={helperSubject}
                  onChange={(event) => setHelperSubject(event.target.value)}
                >
                  <option value="">All subjects</option>
                  {subjects.map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <button className="pb-primary">Find my paper</button>
              </form>
            </section>
            <section className="pb-reassurance">
              <h2>One purchase. Keep learning.</h2>
              {[
                'Question paper + marking scheme',
                'Read on phone or computer',
                'Return on this device',
              ].map((text) => (
                <p key={text}>
                  <CheckCircle2 />
                  {text}
                </p>
              ))}
              <a href="/contact">Need help with a purchase?</a>
            </section>
          </aside>
        </div>
      </main>
      {preview && (
        <dialog
          className="pb-preview"
          ref={dialog}
          onCancel={() => setPreview(null)}
          onClose={() => setPreview(null)}
          aria-labelledby="pb-preview-title"
        >
          <button
            className="pb-preview-close"
            aria-label="Close preview"
            onClick={() => setPreview(null)}
          >
            <X />
          </button>
          <span className="pb-eyebrow">PAPER DETAILS</span>
          <h2 id="pb-preview-title">{preview.title}</h2>
          <p>
            {paperLevel(preview.grade)} · {paperSubject(preview.subject)}
          </p>
          <div className="pb-preview-details">
            <PaperCover paper={preview} />
            <div>
              <p>
                <CheckCircle2 /> Question paper and marking scheme
              </p>
              {preview.duration_minutes ? (
                <p>
                  <Clock /> {preview.duration_minutes} minutes
                </p>
              ) : null}
              {preview.total_marks ? <p>{preview.total_marks} marks</p> : null}
              <strong>
                {isUnlocked(preview.id) ? 'Access available' : `KES ${EXAM_PAPER_PRICE_KES}`}
              </strong>
            </div>
          </div>
          <p className="pb-notice">
            This is a details preview, not a sample of the questions. The full paper opens after
            access is verified or purchased.
          </p>
          <button
            className="pb-primary"
            onClick={() => {
              const paper = preview;
              setPreview(null);
              onOpen(paper);
            }}
          >
            Read / restore access <ArrowRight size={18} />
          </button>
          <button
            className="pb-card-link"
            onClick={() => {
              const paper = preview;
              setPreview(null);
              onRevision(paper);
            }}
          >
            Continue to practice <ArrowRight size={16} />
          </button>
        </dialog>
      )}
    </div>
  );
}
