import React, { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  HelpCircle,
  Leaf,
  Play,
  Send,
  CalendarDays,
  Upload,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useApp } from '../../context/AppContext';
import { RevisionMode, TeacherActivity, ViewState } from '../../types';
import {
  generatePracticeQuestions,
  RateLimitError,
  SystemQuotaError,
} from '../../services/geminiService';
import { PlanLimitError } from '../../services/planLimitService';
import { examService } from '../../services/examService';
import type { PanelMode } from './ExamGuruPanel';
import {
  GRADES,
  pathwayForGrade,
  subjectsFor,
  readPrepSession,
  savePrepSession,
  type ExamPathway,
  type PrepSession,
} from './examPrepState';
import { ExamPrepPractice } from './ExamPrepPractice';
import { listTimedExams } from './timedExamRecovery';
import logo from '../../assets/images/main_logo.png';
import './RevisionLanding.css';

const Guru = lazy(() => import('./ExamGuruPanel').then((m) => ({ default: m.ExamGuruPanel })));
const CameraView = lazy(() =>
  import('../learner/camera/QuestionCamera').then((m) => ({ default: m.QuestionCamera }))
);
interface Props {
  onStartSession: (data: File | TeacherActivity, mode: RevisionMode) => void;
  onNavigate: (view: ViewState) => void;
  onBack?: () => void;
  onNotes?: () => void;
  onProfile?: () => void;
  onAudio?: () => void;
  initialSubject?: string;
  initialSearchQuery?: string;
}
export function RevisionLanding(props: Props) {
  const { userId, studentCode, studentProfile } = useApp();
  const owner = userId || studentCode || 'guest';
  return <ExamPrepWorkspace key={`${owner}:${studentCode || studentProfile?.id || ''}`} {...props} owner={owner} />;
}
function ExamPrepWorkspace({
  onStartSession,
  onNavigate,
  onBack,
  onNotes,
  onProfile,
  onAudio,
  initialSubject,
  initialSearchQuery,
  owner,
}: Props & { owner: string }) {
  const navigate = useNavigate();
  const { studentProfile, studentCode, userId, isOnline } = useApp();
  const recoveryOwner = studentCode || studentProfile?.id || userId || 'guest';
  const [unfinished] = useState(() => listTimedExams(recoveryOwner));
  const [papers, setPapers] = useState<
    Array<{ id: string | number; title: string; subject?: string; grade?: string }>
  >([]);
  const [grade, setGrade] = useState(
    GRADES.includes(studentProfile?.grade || '') ? studentProfile!.grade : 'Grade 9'
  );
  const [exam, setExam] = useState<ExamPathway>(() => pathwayForGrade(grade));
  const [subject, setSubject] = useState(
    initialSubject && initialSubject !== 'All' ? initialSubject : 'Mathematics'
  );
  const [topic, setTopic] = useState(initialSearchQuery || '');
  const [question, setQuestion] = useState('');
  const [session, setSession] = useState<PrepSession | null>(() => readPrepSession(owner));
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [topicOpen, setTopicOpen] = useState(false);
  const [papersOpen, setPapersOpen] = useState(false);
  const [guru, setGuru] = useState<{ mode: PanelMode; prompt: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [limited, setLimited] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [loadingPapers, setLoadingPapers] = useState(false);
  const [paperError, setPaperError] = useState('');
  const [paperAttempt, setPaperAttempt] = useState(0);
  const request = useRef(false);
  const mounted = useRef(true);
  const uploadRef = useRef<HTMLInputElement>(null);
  const topicRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    if (topicOpen) topicRef.current?.focus();
  }, [topicOpen]);
  const updateSession = (next: PrepSession) => {
    setSession(next);
    setStorageError(!savePrepSession(owner, next));
  };
  const back = () => (onBack ? onBack() : navigate('/learner'));
  const openGuru = (prompt: string, mode: PanelMode = 'chat') => {
    setGuru({
      mode,
      prompt: `Context: ${grade}, ${exam}, ${subject}${topic ? `, ${topic}` : ''}. ${prompt}`,
    });
  };
  const startPractice = async () => {
    if (request.current) return;
    if (session && !session.completed) {
      setPracticeOpen(true);
      return;
    }
    if (!isOnline) return;
    request.current = true;
    setBusy(true);
    setError('');
    setLimited(false);
    try {
      const questions = await generatePracticeQuestions(
        subject,
        topic.trim(),
        exam === 'KJSEA' ? 'JSS' : exam,
        3,
        grade
      );
      if (!mounted.current) return;
      if (!questions.length) throw new Error('No questions returned');
      updateSession({
        version: 1,
        grade,
        exam,
        subject,
        topic: topic.trim() || subject,
        questions,
        answers: questions.map(() => ''),
        reviewed: questions.map(() => false),
        needsHelp: questions.map(() => false),
        deadline: Date.now() + 600000,
        completed: false,
      });
      setPracticeOpen(true);
      setTopicOpen(false);
    } catch (e) {
      if (!mounted.current) return;
      const limit = e instanceof RateLimitError || e instanceof PlanLimitError;
      setLimited(limit);
      setError(
        limit
          ? 'Your practice allowance has been reached. Your topic is retained; view plans or try again when your allowance resets.'
          : e instanceof SystemQuotaError
            ? 'Akili is temporarily at capacity. Please try again later.'
            : 'We could not create your practice. Your topic is still here. Please try again.'
      );
    } finally {
      request.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  useEffect(() => {
    if (!papersOpen) return;
    let active = true;
    setLoadingPapers(true);
    setPaperError('');
    void examService.listPublishedExams(grade, subject)
      .then(result => { if (active) setPapers(result as unknown as typeof papers); })
      .catch(() => { if (active) setPaperError('Could not load papers. Please try again.'); })
      .finally(() => { if (active) setLoadingPapers(false); });
    return () => { active = false; };
  }, [papersOpen, grade, subject, paperAttempt]);
  const openPapers = () => {
    setPapersOpen(true);
    setPaperAttempt(previous => previous + 1);
  };
  const eligiblePapers = papers.filter(
    (p) => p.subject === subject && String(p.grade).toLowerCase() === grade.toLowerCase()
  );
  const useFile = (file?: File) => {
    if (!file) return;
    if (
      !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError('Choose a JPG, PNG, WebP or PDF smaller than 10 MB.');
      return;
    }
    setCameraOpen(false);
    onStartSession(file, RevisionMode.LEARN);
  };
  const reviewed = session?.reviewed.filter(Boolean).length || 0;
  const choices = Array.from(new Set([...subjectsFor(exam), subject]));
  return (
    <div className="exam-prep">
      <Helmet>
        <title>SomaAI Exam Prep — Practise with Akili</title>
      </Helmet>
      <a href="#exam-prep-main" className="ep-skip">
        Skip to exam preparation
      </a>
      <header className="ep-header">
        <button className="ep-brand" onClick={() => navigate('/')} aria-label="Soma AI homepage">
          <img src={logo} alt="" />
          <span>
            Soma AI<small>Learning today. A brighter tomorrow.</small>
          </span>
        </button>
        <nav aria-label="Learning navigation">
          <button onClick={back}>My classroom</button>
          <button aria-current="page">Exam prep</button>
          <button
            onClick={onNotes || (() => navigate('/learner', { state: { targetTab: 'NOTEBOOK' } }))}
          >
            My notes
          </button>
          <button onClick={() => navigate('/learning-videos')}>Learning videos</button>
        </nav>
        <button
          className="ep-avatar"
          aria-label="Open your profile"
          onClick={onProfile || (() => onNavigate(ViewState.PROFILE))}
        >
          {(studentProfile?.name || 'Candidate').charAt(0)}
        </button>
      </header>
      <main id="exam-prep-main" className="ep-layout">
        {unfinished.length > 0 && <section className="ep-card" style={{ gridColumn: '1 / -1' }} aria-label="Unfinished papers">
          <h2>Continue your unfinished paper</h2>
          <p>Your answers are saved in this browser. The original timer continues while you are away.</p>
          {unfinished.map(item => <button key={item.attemptId} className="ep-primary" onClick={() => navigate(`/revision/dashboard?paper=${encodeURIComponent(item.examId)}`)}>
            Unfinished paper #{item.examId} — {item.submitting || item.deadline <= Date.now() ? 'Finish submission' : 'Resume exam'}
          </button>)}
        </section>}
        <div className="ep-main">
          <button className="ep-back" onClick={back}>
            <ArrowLeft size={18} /> Back to classroom
          </button>
          <h1>SomaAI Exam Prep</h1>
          <p className="ep-identity">
            {studentProfile?.name?.split(' ')[0] || 'Candidate'} ·{' '}
            {studentProfile?.grade || 'All Grades'}
          </p>
          <p className="ep-tagline">Practise with purpose. Walk into your exam prepared.</p>
          <div className="ep-filters">
            <label>
              Grade
              <select
                value={grade}
                disabled={busy}
                onChange={(e) => {
                  const g = e.target.value;
                  const p = pathwayForGrade(g);
                  setGrade(g);
                  setExam(p);
                  if (!subjectsFor(p).includes(subject)) setSubject('Mathematics');
                }}
              >
                {GRADES.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </label>
            <label>
              Subject
              <select value={subject} disabled={busy} onChange={(e) => setSubject(e.target.value)}>
                {choices.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Exam
              <select
                value={exam}
                disabled={busy}
                onChange={(e) => {
                  const p = e.target.value as ExamPathway;
                  setExam(p);
                  setGrade(p === 'KPSEA' ? 'Grade 6' : p === 'KJSEA' ? 'Grade 9' : p === 'CBC' ? 'Grade 10' : 'Form 4');
                  if (!subjectsFor(p).includes(subject)) setSubject('Mathematics');
                }}
              >
                <option>KPSEA</option>
                <option>KJSEA</option>
                <option>KCSE</option>
                <option value="CBC">CBC school assessment</option>
              </select>
            </label>
          </div>
          {!isOnline && (
            <p role="status" className="ep-notice">
              You’re offline. Saved practice can still be continued; new questions need a
              connection.
            </p>
          )}
          {error && (
            <div role="alert" className="ep-error">
              {error}{' '}
              {limited && (
                <button onClick={() => navigate('/pricing?segment=STUDENT')}>View plans</button>
              )}
            </div>
          )}
          {storageError && (
            <p role="status" className="ep-notice">
              This browser could not save your progress. Keep this page open until you finish.
            </p>
          )}
          <section className="ep-hero ep-card" aria-labelledby="ep-next">
            <div>
              <span className="ep-eyebrow">Your next step</span>
              <h2 id="ep-next">Let’s get you exam-ready</h2>
              <p>Start with a short practice. Akili will help you understand every mistake.</p>
              <div className="ep-actions">
                <button
                  className="ep-primary"
                  disabled={busy || (!isOnline && !session)}
                  onClick={startPractice}
                >
                  <Play size={19} />
                  {busy
                    ? 'Preparing your questions…'
                    : session && !session.completed
                      ? 'Continue your practice'
                      : 'Start 10-minute practice'}
                </button>
                <button className="ep-outline" onClick={() => setTopicOpen(true)}>
                  <BookOpen size={19} /> Choose a topic
                </button>
              </div>
              <small>Three AI-generated questions · self-review · not an official exam</small>
            </div>
            <div className="ep-illustration" aria-hidden="true">
              <div className="ep-book">
                <BookOpen size={60} strokeWidth={1.3} />
                <strong>{exam}</strong>
                <span>{subject}</span>
                <i />
                <i />
                <i />
              </div>
              <span className="ep-clock">
                <Clock3 size={68} strokeWidth={1.5} />
              </span>
            </div>
          </section>
          {topicOpen && (
            <form
              className="ep-card ep-topic"
              onSubmit={(e) => {
                e.preventDefault();
                void startPractice();
              }}
            >
              <label htmlFor="ep-topic">What would you like to practise in {subject}?</label>
              <input
                id="ep-topic"
                ref={topicRef}
                value={topic}
                maxLength={200}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="For example, fractions and decimals"
                required
              />
              <button className="ep-primary" disabled={busy || !isOnline || !topic.trim()}>
                Start topic practice
              </button>
              <button type="button" className="ep-outline" onClick={() => setTopicOpen(false)}>
                Cancel
              </button>
              {session && !session.completed && (
                <p>Finish your current practice first. Your answers won’t be replaced.</p>
              )}
            </form>
          )}
          <h2 className="ep-section-title">How would you like to practise?</h2>
          <div className="ep-lanes">
            <section className="ep-card">
              <FileText className="ep-lane-icon" />
              <h3>Past papers</h3>
              <p>Find papers and marking guides.</p>
              <button
                className="ep-outline"
                onClick={() =>
                  navigate(
                    `/exam-papers?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`
                  )
                }
              >
                Browse papers <ChevronRight size={17} />
              </button>
            </section>
            <section className="ep-card">
              <Clock3 className="ep-lane-icon green" />
              <h3>Timed mock exam</h3>
              <p>Practise under exam conditions.</p>
              <button className="ep-outline" onClick={openPapers} disabled={!isOnline}>
                Start a mock <ChevronRight size={17} />
              </button>
            </section>
            <section className="ep-card">
              <BookOpen className="ep-lane-icon purple" />
              <h3>Topic practice</h3>
              <p>Focus on one skill at a time.</p>
              <button className="ep-outline" onClick={() => setTopicOpen(true)}>
                Choose a topic <ChevronRight size={17} />
              </button>
            </section>
          </div>
          {papersOpen && (
            <section className="ep-card ep-paper-list" aria-labelledby="ep-papers">
              <h2 id="ep-papers">Choose a timed paper</h2>
              <p>
                {grade} · {subject}. Set up the timer before you begin.
              </p>
              <button className="ep-back" onClick={() => setPapersOpen(false)}>
                Close paper list
              </button>
              {loadingPapers ? (
                <p role="status">Loading papers…</p>
              ) : paperError ? (
                <p role="alert">
                  {paperError} <button onClick={openPapers}>Retry</button>
                </p>
              ) : eligiblePapers.length ? (
                eligiblePapers.map((p) => (
                  <button
                    className="ep-outline"
                    key={p.id}
                    onClick={() =>
                      onStartSession(p as unknown as TeacherActivity, RevisionMode.EXAM)
                    }
                  >
                    {p.title}
                    <ArrowRight size={18} />
                  </button>
                ))
              ) : (
                <p>
                  No ready timed papers match these selections yet. Try another grade or subject, or
                  start a topic practice above.
                </p>
              )}
            </section>
          )}
          <section className="ep-card ep-resume">
            <CheckCircle2 className="ep-progress-icon" />
            <div>
              <h3>
                {session
                  ? session.completed
                    ? 'Your last practice'
                    : 'Continue your practice'
                  : 'Your practice starts here'}
              </h3>
              <p>
                {session
                  ? `${session.topic} · ${session.grade} · ${session.subject}`
                  : 'Your questions and answers will stay in this browser tab while you practise.'}
              </p>
              {session && (
                <>
                  <progress
                    value={reviewed}
                    max={session.questions.length}
                    aria-label="Questions reviewed"
                  />
                  <small>
                    {reviewed} of {session.questions.length} questions reviewed · saved in this tab
                  </small>
                </>
              )}
            </div>
            {session && (
              <button className="ep-primary" onClick={() => setPracticeOpen(true)}>
                {session.completed ? 'Review' : 'Continue'} <ChevronRight size={18} />
              </button>
            )}
          </section>
          <div className="ep-tip">
            <Leaf size={24} /> Understanding your mistakes is part of getting better.
          </div>
        </div>
        <aside className="ep-card ep-coach" aria-labelledby="ep-akili">
          <h2 id="ep-akili">Prepare with Akili</h2>
          <div className="ep-coach-intro">
            <img src={logo} alt="Akili, your study companion" />
            <p>Which topic feels difficult? Let’s work through it together.</p>
          </div>
          <button
            className="ep-coach-action"
            disabled={!isOnline}
            onClick={() =>
              openGuru('Help me understand an exam question. Ask me to paste the question first.')
            }
          >
            <HelpCircle /> Explain a question <ChevronRight />
          </button>
          <button
            className="ep-coach-action"
            disabled={!isOnline && !session}
            onClick={() => {
              if (session) setPracticeOpen(true);
              else
                openGuru(
                  'Help me review a mistake. Ask for the question and my attempted answer. Do not invent my performance.',
                  'mark'
                );
            }}
          >
            <FileText /> Review my mistakes <ChevronRight />
          </button>
          <button
            className="ep-coach-action"
            disabled={!isOnline}
            onClick={() =>
              openGuru(
                'Help me make a realistic revision plan. First ask my exam date, available study time and difficult topics. Do not guess my exam date.'
              )
            }
          >
            <CalendarDays /> Make a revision plan <ChevronRight />
          </button>
          <form
            className="ep-ask"
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) openGuru(question.trim());
            }}
          >
            <label htmlFor="ep-question">Ask a question</label>
            <textarea
              id="ep-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask or scan a question…"
              maxLength={2000}
              rows={3}
            />
            <div className="ep-actions">
              <button
                type="button"
                className="ep-outline"
                onClick={() => setCameraOpen(true)}
                disabled={!isOnline}
              >
                <Camera size={19} /> Scan
              </button>
              <button
                type="button"
                className="ep-outline"
                disabled={!isOnline}
                onClick={() => uploadRef.current?.click()}
              >
                <Upload size={18} /> Upload
              </button>
              <button
                className="ep-primary"
                aria-label="Send question"
                disabled={!question.trim() || !isOnline}
              >
                <Send size={20} />
              </button>
            </div>
            <small>
              Type a question or scan a photo from your exercise book. AI guidance can make
              mistakes; check it against your class notes.
            </small>
          </form>
          <input
            hidden
            ref={uploadRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(e) => {
              useFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="ep-tip">
            <Leaf /> Small steps.
            <br />A brighter tomorrow.
          </div>
        </aside>
      </main>
      {practiceOpen && session && (
        <ExamPrepPractice
          session={session}
          onChange={updateSession}
          onClose={() => setPracticeOpen(false)}
          online={isOnline}
          onExplain={(prompt) => {
            setPracticeOpen(false);
            setGuru({ mode: 'chat', prompt });
          }}
        />
      )}
      <Suspense
        fallback={
          <p className="ep-loading" role="status">
            Opening your study tool…
          </p>
        }
      >
        {guru && (
          <Guru
            initialMode={guru.mode}
            initialPrompt={guru.prompt}
            syllabusContext={{ grade, subject, topic }}
            onClose={() => setGuru(null)}
            onLogin={() => navigate('/pricing?segment=STUDENT')}
          />
        )}
        {cameraOpen && (
          <CameraView
            onClose={() => setCameraOpen(false)}
            onUsePhoto={useFile}
            onAudio={() => {
              setCameraOpen(false);
              if (onAudio) onAudio();
              else back();
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
