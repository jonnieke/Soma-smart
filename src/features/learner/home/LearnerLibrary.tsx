import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Search,
  Camera,
  Info,
  Calculator,
  FlaskConical,
  Globe2,
  Sprout,
  MessagesSquare,
  LibraryBig,
} from 'lucide-react';
import mascot from '../../../assets/images/somo_mascot.png';
import './LearnerLibrary.css';

export const SUBJECT_GRADES = [
  ...Array.from({ length: 12 }, (_, i) => `Grade ${i + 1}`),
  ...Array.from({ length: 4 }, (_, i) => `Form ${i + 1}`),
];
export type LibraryEntry = {
  id: string;
  title: string;
  subject?: string;
  grade?: string;
  category: string;
  access: 'OWNED' | 'FREE' | 'PRO_INCLUDED' | 'PRO_LOCKED' | 'PURCHASE';
};
export const libraryKey = (value = '') => value.trim().toLowerCase().replace(/\s+/g, ' ');
const gradeKey = (value = '') => libraryKey(value).replace(/\s*\(jss\)/g, '');
const subjectName = (value?: string) =>
  !value || libraryKey(value) === 'all' ? 'General reading' : value.trim();
export function recentStudyIds(history: { type: string; details?: string }[]): string[] {
  const ids: string[] = [];
  for (const item of history) {
    if (item.type !== 'STUDY' || !item.details) continue;
    try {
      const id = JSON.parse(item.details).materialId;
      if (id != null && !ids.includes(String(id))) ids.push(String(id));
    } catch {
      /* Legacy history. */
    }
  }
  return ids;
}
export function libraryContents(
  entries: LibraryEntry[],
  grade: string,
  subject: string,
  query: string
) {
  return entries
    .filter(
      (e) =>
        (!grade || gradeKey(e.grade) === gradeKey(grade)) &&
        (subject === 'ALL' || libraryKey(subjectName(e.subject)) === libraryKey(subject)) &&
        libraryKey(`${e.title} ${subjectName(e.subject)}`).includes(libraryKey(query))
    )
    .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }));
}
type Props = {
  entries: LibraryEntry[];
  grade: string;
  subject: string;
  onGrade: (grade: string) => void;
  onSubject: (subject: string) => void;
  onOpen: (id: string) => void;
  onHome: () => void;
  onPractice: () => void;
  recentIds?: string[];
  onLearnTopic?: (topic: string, subject: string, grade: string) => void;
  onNotes?: () => void;
  onVideos?: () => void;
  onScan?: () => void;
  onProfile?: () => void;
  onHomepage?: () => void;
  name?: string;
  busy?: boolean;
  online?: boolean;
};
function SubjectIcon({ name }: { name: string }) {
  const key = libraryKey(name);
  const [Icon, tone] = /math/.test(key)
    ? ([Calculator, 'blue'] as const)
    : /kiswahili|language/.test(key)
      ? ([MessagesSquare, 'green'] as const)
      : /agric/.test(key)
        ? ([Sprout, 'green'] as const)
        : /science|biology|chemistry|physics/.test(key)
          ? ([FlaskConical, 'green'] as const)
          : /social|history|geography/.test(key)
            ? ([Globe2, 'peach'] as const)
            : ([BookOpen, 'gold'] as const);
  return (
    <span className={`subjects-icon subjects-icon--${tone}`}>
      <Icon aria-hidden="true" strokeWidth={1.6} />
    </span>
  );
}
function AkiliMark({ className = '' }: { className?: string }) {
  return (
    <span className={`subjects-mascot ${className}`} aria-hidden="true">
      <img src={mascot} alt="" />
    </span>
  );
}
export function LearnerLibrary({
  entries,
  grade,
  subject,
  onGrade,
  onSubject,
  onOpen,
  onHome,
  onPractice,
  recentIds = [],
  onLearnTopic,
  busy = false,
  online = true,
  onNotes,
  onVideos,
  onScan,
  onProfile,
  onHomepage,
  name = 'Learner',
}: Props) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const [otherSubject, setOtherSubject] = useState('');
  const [ownedOnly, setOwnedOnly] = useState(false);
  const grades = Array.from(
    new Set([
      ...SUBJECT_GRADES,
      ...entries
        .map((e) => e.grade?.trim())
        .filter((g): g is string => Boolean(g) && libraryKey(g) !== 'all'),
      ...(grade ? [grade] : []),
    ])
  );
  const available = ownedOnly ? entries.filter((e) => e.access === 'OWNED') : entries;
  const scoped = libraryContents(available, grade, 'ALL', '');
  const subjects = Array.from(
    new Map(
      scoped.map((e) => [libraryKey(subjectName(e.subject)), subjectName(e.subject)])
    ).values()
  ).sort();
  const visible = libraryContents(available, grade, subject, query);
  const reading = visible.filter((e) => e.category !== 'PAST_PAPER');
  const papers = visible.filter((e) => e.category === 'PAST_PAPER');
  const chooseSubject = (value: string) => {
    setQuery('');
    setTopic('');
    onSubject(value);
  };
  const recent = recentIds
    .map((id) => visible.find((e) => e.id === id && e.category !== 'PAST_PAPER'))
    .find(Boolean);
  const requestedSubject =
    subject !== 'ALL'
      ? subject
      : customSubject === '__other'
        ? otherSubject.trim()
        : customSubject.trim();
  const renderEntries = (items: LibraryEntry[]) => (
    <ul className="subjects-lessons">
      {items.map((e) => {
        const action =
          e.access === 'PRO_LOCKED'
            ? 'View plan'
            : e.access === 'PURCHASE'
              ? 'View access'
              : e.category === 'PAST_PAPER'
                ? 'Open paper'
                : recentIds.includes(e.id)
                  ? 'Continue learning'
                  : 'Start learning';
        return (
          <li key={e.id}>
            <button type="button" onClick={() => onOpen(e.id)}>
              <BookOpen aria-hidden="true" />
              <span>
                <strong>{e.title}</strong>
                <small>
                  {e.grade || 'Grade not specified'} ·{' '}
                  {e.category === 'PAST_PAPER'
                    ? 'Practice paper'
                    : e.category === 'SYLLABUS'
                      ? 'Subject outline'
                      : 'Reading material'}
                  {e.access === 'OWNED' ? ' · Purchased' : ''}
                </small>
                <em>{action}</em>
              </span>
              <ArrowRight aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
  return (
    <div className="subjects-page">
      <a className="subjects-skip" href="#subjects-content">
        Skip to subjects
      </a>
      <header className="subjects-header">
        <button
          className="subjects-brand"
          type="button"
          onClick={onHomepage || onHome}
          aria-label="Soma AI homepage"
        >
          <AkiliMark />
          Soma AI
        </button>
        <nav aria-label="Learning navigation">
          <button type="button" onClick={onHome}>
            My classroom
          </button>
          <button type="button" aria-current="page" onClick={() => chooseSubject('ALL')}>
            Subjects
          </button>
          {onNotes && (
            <button type="button" onClick={onNotes}>
              My notes
            </button>
          )}
          <button type="button" onClick={onPractice}>
            Past papers
          </button>
          {onVideos && (
            <button type="button" onClick={onVideos}>
              Learning videos
            </button>
          )}
        </nav>
        <div className="subjects-account">
          <div className="subjects-grade">
            <label className="sr-only" htmlFor="subjects-grade">
              Grade or level
            </label>
            <select
              id="subjects-grade"
              value={grade}
              onChange={(e) => {
                onGrade(e.target.value);
                chooseSubject('ALL');
                setCustomSubject('');
                setOtherSubject('');
              }}
            >
              <option value="">Choose grade</option>
              {grades.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
            <small>Grade 1–12 · Form 1–4</small>
          </div>
          {onProfile && (
            <button
              className="subjects-avatar"
              type="button"
              aria-label="Open your profile"
              onClick={onProfile}
            >
              {name.trim().charAt(0).toUpperCase() || 'L'}
            </button>
          )}
        </div>
      </header>
      <main id="subjects-content" className="subjects-main">
        <div className="subjects-intro">
          <div>
            {subject !== 'ALL' && (
              <button type="button" className="subjects-back" onClick={() => chooseSubject('ALL')}>
                <ArrowLeft />
                All subjects
              </button>
            )}
            <h1>{subject === 'ALL' ? 'What shall we learn today?' : `Let’s learn ${subject}`}</h1>
            <p>Choose a subject. Understand a topic. Practise with Akili.</p>
          </div>
          <label className="subjects-search">
            <Search aria-hidden="true" />
            <span className="sr-only">Find a title or subject</span>
            <input
              type="search"
              placeholder="Find a subject or topic"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="subjects-layout">
          <div className="subjects-learning">
            {recent && !query.trim() && (
              <section className="subjects-continue" aria-label="Continue learning">
                <div>
                  <p className="subjects-eyebrow">Continue learning</p>
                  <h2>{recent.title}</h2>
                  <p>
                    {recent.subject} · {recent.grade} · Previously opened
                  </p>
                  <button
                    className="subjects-primary"
                    type="button"
                    onClick={() => onOpen(recent.id)}
                  >
                    {recent.access === 'PRO_LOCKED' || recent.access === 'PURCHASE'
                      ? 'Check access to continue'
                      : 'Continue this lesson'}
                    <ArrowRight />
                  </button>
                </div>
                <div className="subjects-banner-art" aria-hidden="true">
                  {/fraction/i.test(recent.title) ? (
                    <>
                      <span className="subjects-fraction quarter" />
                      <span className="subjects-fraction thirds" />
                    </>
                  ) : (
                    <BookOpen className="subjects-banner-book" />
                  )}
                  <span className="subjects-notebook">
                    One topic.
                    <br />
                    One step
                    <br />
                    at a time.
                  </span>
                </div>
              </section>
            )}
            <div className="subjects-section-title">
              <div>
                <h2>{subject === 'ALL' ? 'Your subjects' : 'Choose a lesson or study guide'}</h2>
                <p>
                  {subject === 'ALL'
                    ? 'Choose where you want to begin.'
                    : 'Explore the available materials at your own pace.'}
                </p>
              </div>
              <label className="subjects-owned">
                <input
                  type="checkbox"
                  checked={ownedOnly}
                  onChange={(e) => setOwnedOnly(e.target.checked)}
                />
                Only materials I have purchased
              </label>
            </div>
            {subject === 'ALL' && !query.trim() && subjects.length > 0 ? (
              <section className="subjects-grid" aria-label="Subjects">
                {subjects.map((s) => (
                  <button
                    className="subjects-card"
                    key={libraryKey(s)}
                    type="button"
                    onClick={() => chooseSubject(s)}
                  >
                    <SubjectIcon name={s} />
                    <span>
                      <strong>{s}</strong>
                      <em>
                        Explore topics <ArrowRight aria-hidden="true" />
                      </em>
                    </span>
                  </button>
                ))}
              </section>
            ) : !visible.length ? (
              <section className="subjects-empty" role="status">
                <BookOpen />
                <h3>{query.trim() ? 'No matching titles' : 'No materials here yet'}</h3>
                <p>
                  {query.trim()
                    ? 'Try a shorter search or clear it to see the available titles.'
                    : `No published materials match ${grade || 'these grades'}${subject !== 'ALL' ? ` / ${subject}` : ''}${ownedOnly ? ' in your purchases' : ''}. You can still bring a topic to Akili.`}
                </p>
                {query && (
                  <button type="button" className="subjects-outline" onClick={() => setQuery('')}>
                    Clear search
                  </button>
                )}
              </section>
            ) : (
              <div className="subjects-resource-groups">
                {reading.length > 0 && (
                  <section aria-label="Learning resources">
                    <p className="subjects-resource-note">
                      {reading.length} available resources · Not a complete syllabus sequence
                    </p>
                    {renderEntries(reading)}
                  </section>
                )}
                {papers.length > 0 && (
                  <details open={reading.length === 0 || undefined}>
                    <summary>Practice papers ({papers.length})</summary>
                    {renderEntries(papers)}
                  </details>
                )}
              </div>
            )}
          </div>
          <aside className="subjects-akili" aria-labelledby="subjects-akili-heading">
            <div className="subjects-akili-welcome">
              <div>
                <h2 id="subjects-akili-heading">Learn with Akili</h2>
                <p>Your study companion</p>
                <div className="subjects-speech">
                  Not sure where to start?
                  <br />
                  Tell me what you are learning at school.
                </div>
              </div>
              <AkiliMark className="subjects-akili-mascot" />
            </div>
            {onLearnTopic && (
              <>
                <h3>Bring a topic from your book</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (grade && requestedSubject && topic.trim() && !busy && online)
                      onLearnTopic(topic.trim(), requestedSubject, grade);
                  }}
                >
                  <label>
                    Subject
                    <select
                      value={subject === 'ALL' ? customSubject : subject}
                      onChange={(e) => {
                        if (subject !== 'ALL') chooseSubject('ALL');
                        setCustomSubject(e.target.value);
                      }}
                      required
                    >
                      <option value="">Choose a subject</option>
                      {Array.from(
                        new Set([...subjects, ...(subject !== 'ALL' ? [subject] : [])])
                      ).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                      <option value="__other">Another subject</option>
                    </select>
                  </label>
                  {customSubject === '__other' && subject === 'ALL' && (
                    <label>
                      Subject name
                      <input
                        value={otherSubject}
                        onChange={(e) => setOtherSubject(e.target.value)}
                        maxLength={100}
                        required
                        placeholder="Type your subject"
                      />
                    </label>
                  )}
                  <label>
                    Topic
                    <input
                      aria-label="What topic shall we learn?"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What would you like to understand?"
                      required
                      maxLength={500}
                    />
                  </label>
                  {!grade && (
                    <p className="subjects-warning">
                      Choose your grade above so Akili can explain at the right level.
                    </p>
                  )}
                  {!online && (
                    <p className="subjects-warning" role="status">
                      Reconnect to start a new AI lesson.
                    </p>
                  )}
                  <button
                    className="subjects-primary"
                    disabled={!grade || !requestedSubject || !topic.trim() || busy || !online}
                  >
                    {busy ? 'Preparing your lesson…' : 'Start learning with Akili'}
                    <ArrowRight />
                  </button>
                </form>
                <p className="subjects-explainer">
                  An explanation, a worked example and a question to try.
                </p>
                <p className="subjects-allowance">
                  <Info aria-hidden="true" />
                  AI lessons use your learning allowance.
                </p>
              </>
            )}
            {onScan && (
              <div className="subjects-scan">
                <button className="subjects-outline" type="button" onClick={onScan}>
                  <Camera />
                  Scan a question
                </button>
              </div>
            )}
          </aside>
        </div>
        <section className="subjects-practice">
          <span className="subjects-book-stack" aria-hidden="true">
            <LibraryBig />
          </span>
          <h2>Ready to put it into practice?</h2>
          <button type="button" onClick={onPractice}>
            Explore practice papers <ArrowRight />
          </button>
        </section>
      </main>
    </div>
  );
}
