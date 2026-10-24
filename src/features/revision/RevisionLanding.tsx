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
  Sparkles,
  CalendarDays,
  Upload,
  MessageCircle,
  Share2,
  Smartphone,
  Users,
  Search,
  X,
  Lock,
  ThumbsUp,
  ShieldCheck,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useApp } from '../../context/AppContext';
import { RevisionMode, TeacherActivity, ViewState, UserRole } from '../../types';
import {
  generatePracticeQuestions,
  RateLimitError,
  SystemQuotaError,
} from '../../services/geminiService';
import { PlanLimitError } from '../../services/planLimitService';
import { examService } from '../../services/examService';
import {
  examPaperBankService,
  type PhoneRestoreSession,
} from '../../services/examPaperBankService';
import {
  learnerPoolService,
  type LearnerPoolItem,
  type PoolItemType,
} from '../../services/learnerPoolService';
import {
  formatCandidateRevisionProgressForWhatsApp,
  formatPooledMaterialForWhatsApp,
  openWhatsAppShare,
} from '../../services/whatsappService';
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
import {
  daysUntil,
  mergeProgress,
  phaseFor,
  PHASE_LABEL,
  planFor,
  readProgress,
  recordPractice,
  sameProgress,
  saveProgress,
  setExamDate,
  streak,
  todayKey,
  weakTopics,
  type CandidateProgress,
} from './candidatePlan';
import { candidateProgressService, canSync } from './candidateProgressService';
import { formatDay, officialExam, paperDates } from './knecTimetable';
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
  const { studentProfile, studentCode, userId, isOnline, role, isPro } = useApp();
  const recoveryOwner = studentCode || studentProfile?.id || userId || 'guest';
  const [unfinished] = useState(() => listTimedExams(recoveryOwner));
  const [purchasedPaperIds, setPurchasedPaperIds] = useState<string[]>([]);
  const [phoneSession, setPhoneSession] = useState<PhoneRestoreSession | null>(() =>
    typeof examPaperBankService?.readPhoneSession === 'function'
      ? examPaperBankService.readPhoneSession()
      : null
  );
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneLoginOpen, setPhoneLoginOpen] = useState(false);
  const [phoneRestoring, setPhoneRestoring] = useState(false);
  const [phoneMessage, setPhoneMessage] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [poolFilter, setPoolFilter] = useState<PoolItemType | 'ALL'>('ALL');
  const [poolSearch, setPoolSearch] = useState('');
  const [selectedPoolNote, setSelectedPoolNote] = useState<LearnerPoolItem | null>(null);
  const [poolVersion, setPoolVersion] = useState(0);
  const [poolAskTopic, setPoolAskTopic] = useState('');
  const [poolAskQuery, setPoolAskQuery] = useState('');
  const [poolAskLoading, setPoolAskLoading] = useState(false);
  const [poolAskResult, setPoolAskResult] = useState<{
    question: string;
    topic?: string;
    fullAnswer: string;
    visiblePart: string;
    coveredPart: string;
    fromPool: boolean;
  } | null>(null);
  const [passCheckoutOpen, setPassCheckoutOpen] = useState(false);
  const [passBuyer, setPassBuyer] = useState(() => ({
    name: studentProfile?.name || phoneSession?.buyerName || '',
    phone: phoneSession?.normalizedPhone || '',
    email: '',
  }));
  const [passBuying, setPassBuying] = useState(false);
  const [passCheckoutUrl, setPassCheckoutUrl] = useState('');
  const [passCheckoutRef, setPassCheckoutRef] = useState('');
  const [passCheckoutExamId, setPassCheckoutExamId] = useState('');
  const [passCheckoutError, setPassCheckoutError] = useState('');
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
  const [progress, setProgress] = useState(() => readProgress(owner));
  const progressRef = useRef(progress);
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'synced' | 'local'>('idle');
  const [dateDraft, setDateDraft] = useState('');
  const [editingDate, setEditingDate] = useState(false);
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
  useEffect(() => {
    let active = true;
    examPaperBankService.listPurchasedPaperIds()
      .then((ids) => {
        if (active && Array.isArray(ids)) setPurchasedPaperIds(ids.map(String));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (phoneSession?.found && phoneSession.paperIds?.length) {
      setPurchasedPaperIds((prev) =>
        Array.from(new Set([...prev, ...phoneSession.paperIds.map(String)]))
      );
    }
  }, [phoneSession]);

  const poolItems = React.useMemo(
    () =>
      learnerPoolService.listLocalPool({
        grade,
        subject,
        itemType: poolFilter,
        search: poolSearch,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [grade, subject, poolFilter, poolSearch, poolVersion]
  );

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = phoneInput.trim();
    if (!raw) return;
    setPhoneError('');
    setPhoneMessage('');
    setPhoneRestoring(true);
    try {
      let restored: PhoneRestoreSession | null = null;
      if (typeof examPaperBankService?.restoreByPhone === 'function') {
        restored = await examPaperBankService.restoreByPhone(raw);
      } else {
        const digits = raw.replace(/\D/g, '');
        const last9 =
          digits.length === 9
            ? digits
            : digits.length === 10 && digits.startsWith('0')
              ? digits.slice(1)
              : digits.length >= 12 && digits.startsWith('254')
                ? digits.slice(-9)
                : null;
        if (!last9) {
          throw new Error('Enter a valid phone number (+254..., 07..., or last 9 digits).');
        }
        restored = {
          found: purchasedPaperIds.length > 0,
          normalizedPhone: `254${last9}`,
          last9,
          paperIds: purchasedPaperIds,
          passActive: true,
          hoursRemaining: 24,
        };
      }
      if (restored && restored.found && restored.paperIds.length > 0) {
        setPhoneSession(restored);
        setPurchasedPaperIds((prev) =>
          Array.from(new Set([...prev, ...restored!.paperIds.map(String)]))
        );
        setPhoneLoginOpen(false);
        setPhoneInput('');
        setPhoneMessage(
          restored.passActive
            ? `Welcome back${restored.buyerName ? `, ${restored.buyerName}` : ''}! Your ${restored.paperIds.length} past ${restored.paperIds.length === 1 ? 'paper is' : 'papers are'} unlocked and your 24h AI Revision Pass is active (${restored.hoursRemaining}h left).`
            : `Welcome back! Your ${restored.paperIds.length} past ${restored.paperIds.length === 1 ? 'paper is' : 'papers are'} restored. Your 24-hour free AI revision window has ended — pay KES 20 to continue or buy another paper for free 24h access.`
        );
      } else {
        setPhoneError(
          'No past paper purchase was found for that number. Enter the M-Pesa number used when buying your paper (+254..., 07..., or last 9 digits).'
        );
      }
    } catch (err: any) {
      setPhoneError(
        err instanceof Error ? err.message : 'Could not verify your phone number. Please try again.'
      );
    } finally {
      setPhoneRestoring(false);
    }
  };

  const startPracticeFromPoolItem = (item: LearnerPoolItem) => {
    if (item.itemType !== 'PRACTICE_DRILL' || !Array.isArray(item.contentJson) || !item.contentJson.length) {
      setSelectedPoolNote(item);
      return;
    }
    const questions = item.contentJson;
    updateSession({
      version: 1,
      grade: item.grade && item.grade !== 'All Grades' ? item.grade : grade,
      exam,
      subject: item.subject || subject,
      topic: item.topic || subject,
      questions,
      answers: questions.map(() => ''),
      reviewed: questions.map(() => false),
      needsHelp: questions.map(() => false),
      deadline: Date.now() + 600000,
      completed: false,
    });
    setPracticeOpen(true);
  };

  const hasFullExplanationAccess = Boolean(
    isPro || (purchasedPaperIds.length > 0 && (!phoneSession || phoneSession.passActive))
  );

  const handleMarkPoolHelpful = async (item: LearnerPoolItem) => {
    await learnerPoolService.markItemHelpful(item.id);
    if (mounted.current) setPoolVersion((v) => v + 1);
  };

  const handleSharePoolItemWhatsApp = (item: LearnerPoolItem) => {
    const message = formatPooledMaterialForWhatsApp({
      topic: item.topic,
      subject: item.subject,
      grade: item.grade,
      itemType: item.itemType,
      summaryPreview: item.summaryPreview,
      reuseCount: item.reuseCount,
    });
    openWhatsAppShare(message);
  };

  const openInlinePassCheckout = () => {
    setPassCheckoutError('');
    setPassCheckoutUrl('');
    setPassCheckoutRef('');
    setPassBuyer((prev) => ({
      ...prev,
      name: prev.name || studentProfile?.name || phoneSession?.buyerName || '',
      phone: prev.phone || phoneSession?.normalizedPhone || '',
    }));
    setPassCheckoutOpen(true);
  };

  const startInlinePassCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passBuying) return;
    setPassBuying(true);
    setPassCheckoutError('');
    try {
      let targetId =
        phoneSession?.paperIds?.[0] ||
        purchasedPaperIds[0] ||
        (papers[0]?.id ? String(papers[0].id) : '');

      if (!targetId && typeof examPaperBankService?.listPapers === 'function') {
        const list = await examPaperBankService.listPapers();
        const match =
          list.find((p) => p.subject?.toLowerCase() === subject.toLowerCase()) || list[0];
        if (match?.id) targetId = String(match.id);
      }
      if (!targetId) {
        navigate(`/exam-papers?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`);
        return;
      }
      setPassCheckoutExamId(targetId);

      if (typeof examPaperBankService?.initiatePurchase !== 'function') {
        navigate(`/exam-papers?renew=1&paper=${encodeURIComponent(targetId)}&phone=${encodeURIComponent(passBuyer.phone)}`);
        return;
      }

      const result = await examPaperBankService.initiatePurchase(targetId, passBuyer, {
        renewPass: true,
      });

      if (result.already_paid) {
        const activeSess = examPaperBankService.recordPurchaseSession?.(targetId, passBuyer);
        if (activeSess) setPhoneSession(activeSess);
        setPurchasedPaperIds((prev) => Array.from(new Set([...prev, String(targetId)])));
        setPassCheckoutOpen(false);
        setPhoneMessage('Your 24-Hour AI Revision Pass is now active! Full Akili explanations are unlocked.');
        return;
      }
      if (!result?.redirect_url) throw new Error('Checkout unavailable');
      setPassCheckoutUrl(result.redirect_url);
      setPassCheckoutRef(result.reference);
    } catch {
      setPassCheckoutError(
        'Could not start M-Pesa checkout right now. Check your phone number or open the Paper Bank.'
      );
    } finally {
      if (mounted.current) setPassBuying(false);
    }
  };

  useEffect(() => {
    if (!passCheckoutOpen || !passCheckoutRef || !passCheckoutExamId) return;
    if (typeof examPaperBankService?.getAccess !== 'function') return;
    let cancelled = false;
    const interval = window.setInterval(async () => {
      try {
        const access = await examPaperBankService.getAccess(passCheckoutExamId, passCheckoutRef);
        if (!cancelled && access.paid) {
          window.clearInterval(interval);
          const activeSess = examPaperBankService.recordPurchaseSession?.(
            passCheckoutExamId,
            passBuyer
          );
          if (activeSess) setPhoneSession(activeSess);
          setPurchasedPaperIds((prev) =>
            Array.from(new Set([...prev, String(passCheckoutExamId)]))
          );
          setPassCheckoutOpen(false);
          setPassCheckoutUrl('');
          setPassCheckoutRef('');
          setPhoneMessage(
            'Payment confirmed! Your 24-Hour AI Revision Pass is active and Akili’s full answer is unlocked.'
          );
        }
      } catch {
        // Keep polling while Pesapal checkout is open
      }
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [passCheckoutOpen, passCheckoutRef, passCheckoutExamId, passBuyer]);

  const handlePoolAskAkili = async (
    e?: React.FormEvent,
    overrideQuestion?: string,
    overrideTopic?: string,
    contextPreview?: string
  ) => {
    if (e) e.preventDefault();
    const q = (overrideQuestion ?? poolAskQuery).trim();
    if (!q || poolAskLoading) return;
    const activeTopic = overrideTopic ?? (poolAskTopic || selectedPoolNote?.topic || topic || subject);
    setPoolAskLoading(true);
    try {
      const res = await learnerPoolService.askAkiliDeeperExplanation({
        grade,
        subject,
        examPathway: exam,
        topic: activeTopic,
        question: q,
        contextPreview: contextPreview || selectedPoolNote?.summaryPreview,
      });
      if (!mounted.current) return;
      setPoolAskResult({
        question: q,
        topic: activeTopic,
        ...res,
      });
      setPoolVersion((v) => v + 1);
    } finally {
      if (mounted.current) setPoolAskLoading(false);
    }
  };
  const adopt = (next: CandidateProgress) => {
    progressRef.current = next;
    setProgress(next);
    return saveProgress(owner, next);
  };
  const pushProgress = async (next: CandidateProgress) => {
    if (!canSync(recoveryOwner) || !isOnline) {
      setSyncState('local');
      return;
    }
    setSyncState('syncing');
    try {
      const saved = await candidateProgressService.save(recoveryOwner, next);
      if (!mounted.current) return;
      if (saved) {
        const merged = mergeProgress(progressRef.current, saved);
        if (!sameProgress(merged, progressRef.current)) adopt(merged);
      }
      setSyncState('synced');
    } catch {
      if (mounted.current) setSyncState('local');
    }
  };
  const commitProgress = (next: CandidateProgress) => {
    setStorageError(!adopt(next));
    void pushProgress(next);
  };
  useEffect(() => {
    if (!canSync(recoveryOwner) || !isOnline) return;
    let active = true;
    (async () => {
      try {
        const remote = await candidateProgressService.fetch(recoveryOwner);
        if (!active) return;
        const merged = mergeProgress(progressRef.current, remote);
        if (!sameProgress(merged, progressRef.current)) adopt(merged);
        if (!remote || !sameProgress(merged, remote)) await pushProgress(merged);
        else setSyncState('synced');
      } catch {
        if (active) setSyncState('local');
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recoveryOwner, isOnline]);
  const updateSession = (next: PrepSession) => {
    if (next.completed && !session?.completed) {
      commitProgress(recordPractice(progressRef.current, next));
    }
    setSession(next);
    setStorageError(!savePrepSession(owner, next));
  };
  const saveExamDate = (iso: string) => {
    commitProgress(setExamDate(progressRef.current, iso));
    setEditingDate(false);
    setDateDraft('');
  };
  const useOfficialDate = () => {
    commitProgress(setExamDate(progressRef.current, null));
    setEditingDate(false);
  };
  const back = () => (onBack ? onBack() : navigate('/learner'));
  const openGuru = (prompt: string, mode: PanelMode = 'chat') => {
    setGuru({
      mode,
      prompt: `Context: ${grade}, ${exam}, ${subject}${topic ? `, ${topic}` : ''}. ${prompt}`,
    });
  };
  const startPractice = async (topicOverride?: string) => {
    const chosenTopic = (topicOverride ?? topic).trim();
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
        chosenTopic,
        exam === 'KJSEA' ? 'JSS' : exam,
        3,
        grade
      );
      if (!mounted.current) return;
      if (!questions.length) throw new Error('No questions returned');
      void learnerPoolService
        .savePooledPractice(
          {
            subject,
            topic: chosenTopic || subject,
            examType: exam,
            grade,
          },
          questions
        )
        .then(() => {
          if (mounted.current) setPoolVersion((v) => v + 1);
        })
        .catch(() => {});
      updateSession({
        version: 1,
        grade,
        exam,
        subject,
        topic: chosenTopic || subject,
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
  const handleFile = (file?: File) => {
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
  const today = todayKey();
  const official = officialExam(exam);
  const usingOfficial = !progress.examDate && !!official;
  const target = progress.examDate || official?.start || null;
  const daysLeft = target ? daysUntil(target) : null;
  const inExamWindow =
    usingOfficial && !!official && daysLeft !== null && daysLeft < 0 && daysUntil(official.end) >= 0;
  const phase = daysLeft !== null && daysLeft >= 0 ? phaseFor(daysLeft) : null;
  const planPhase = inExamWindow ? 'final' : phase;
  const myPapers = paperDates(exam, subject);
  const weak = weakTopics(progress, subject);
  const plan = planFor(planPhase, exam, weak[0]?.topic);
  const streakDays = streak(progress.practisedDays, today);

  const shareProgressWithParent = () => {
    const parentPhone = (studentProfile as any)?.parentPhone || (studentProfile as any)?.parent_phone || null;
    const message = formatCandidateRevisionProgressForWhatsApp({
      learnerName: studentProfile?.name,
      exam,
      grade,
      subject,
      daysLeft,
      streakDays,
      practisedCount: progress.practisedCount,
      weakTopics: weak.map((w) => w.topic),
      recentTopic: topic || session?.topic,
    });
    openWhatsAppShare(message, parentPhone);
  };

  const shareTeacherClassRevision = () => {
    const message = [
      `*Soma AI Classroom Revision Assignment*`,
      `Grade & Subject: *${grade} · ${subject}*`,
      `Exam Focus: *${exam}*`,
      `Today's Practice: *${topic || `${subject} Core Concepts`}*`,
      daysLeft !== null && daysLeft >= 0 ? `Days remaining: *${daysLeft} days*` : '',
      '',
      `Candidates, please complete today's 10-minute revision practice and review your marking feedback:`,
      `https://www.somaai.co.ke/revision`,
    ].filter(Boolean).join('\n');
    openWhatsAppShare(message);
  };

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
        {purchasedPaperIds.length > 0 ? (
          phoneSession && !phoneSession.passActive ? (
            <section
              className="ep-card ep-pass-banner ep-pass-expired"
              style={{ gridColumn: '1 / -1' }}
              aria-label="Purchased papers revision pass expired"
            >
              <div className="ep-pass-badge ep-pass-badge-expired">
                <Clock3 size={16} />
                <span>24-Hour Free AI Revision Window Ended</span>
              </div>
              <h2>Continue your revision from where you left off</h2>
              <p>
                Your 24-hour complimentary AI revision session for your past paper purchase has elapsed. Pay{' '}
                <strong>KES 20</strong> to unlock another 24 hours of full AI revision, or buy another past paper for free 24-hour access.
              </p>
              {phoneMessage && <p role="status" className="ep-phone-msg">{phoneMessage}</p>}
              <div className="ep-actions">
                <button
                  className="ep-primary"
                  onClick={openInlinePassCheckout}
                >
                  Pay KES 20 to continue revision (24h Pass)
                </button>
                <button
                  className="ep-outline"
                  onClick={() => navigate('/exam-papers')}
                >
                  Buy another paper for free 24h access
                </button>
                <button
                  className="ep-link"
                  onClick={() => navigate('/exam-papers')}
                >
                  Open unlocked papers ({purchasedPaperIds.length})
                </button>
              </div>
            </section>
          ) : (
            <section className="ep-card ep-pass-banner" style={{ gridColumn: '1 / -1' }} aria-label="Purchased papers free revision">
              <div className="ep-pass-badge">
                <Sparkles size={16} />
                <span>24-Hour Free AI Revision Pass Active</span>
                {phoneSession?.hoursRemaining ? (
                  <small className="ep-pass-hours">· {phoneSession.hoursRemaining}h left</small>
                ) : null}
              </div>
              <h2>Practise with your unlocked past papers</h2>
              <p>
                Your past paper purchases include full online mock practice with Akili AI step-by-step scoring.
              </p>
              {phoneMessage && <p role="status" className="ep-phone-msg">{phoneMessage}</p>}
              <div className="ep-actions">
                <button
                  className="ep-primary"
                  onClick={() => navigate('/exam-papers')}
                >
                  Open unlocked papers ({purchasedPaperIds.length})
                </button>
                {!phoneSession?.found && (
                  <button
                    type="button"
                    className="ep-outline"
                    onClick={() => setPhoneLoginOpen((prev) => !prev)}
                  >
                    <Smartphone size={16} /> Link phone number for 24h return login
                  </button>
                )}
              </div>
            </section>
          )
        ) : (
          <section className="ep-card ep-phone-restore-bar" style={{ gridColumn: '1 / -1' }} aria-label="Return with phone number">
            <div className="ep-phone-restore-head">
              <div>
                <strong>Bought a past paper earlier?</strong>
                <span> Enter your M-Pesa phone number (`+254...`, `07...`, or last 9 digits) to log in and continue your revision.</span>
              </div>
              <button
                type="button"
                className="ep-outline"
                onClick={() => setPhoneLoginOpen((prev) => !prev)}
              >
                <Smartphone size={16} />
                {phoneLoginOpen ? 'Hide phone login' : 'Login with phone number'}
              </button>
            </div>
            {phoneMessage && <p role="status" className="ep-phone-msg">{phoneMessage}</p>}
          </section>
        )}

        {phoneLoginOpen && (
          <form
            className="ep-card ep-phone-login-form"
            style={{ gridColumn: '1 / -1' }}
            onSubmit={handlePhoneLogin}
            aria-label="Phone number login form"
          >
            <label htmlFor="ep-phone-login-input">
              Enter the phone number used to purchase your past paper
            </label>
            <p className="ep-phone-hint">
              Accepts <code>+2547XXXXXXXX</code>, <code>2547XXXXXXXX</code>, <code>07XXXXXXXX</code>, or <code>7XXXXXXXX</code> (last 9 digits). Within 24 hours your revision continues free; after 24 hours you can renew for KES 20 or buy another paper.
            </p>
            <div className="ep-phone-input-row">
              <input
                id="ep-phone-login-input"
                type="tel"
                inputMode="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="e.g. 0712 345 678 or +254712345678"
                required
              />
              <button type="submit" className="ep-primary" disabled={phoneRestoring || !phoneInput.trim()}>
                {phoneRestoring ? 'Checking…' : 'Continue revision'}
              </button>
              <button type="button" className="ep-outline" onClick={() => setPhoneLoginOpen(false)}>
                Cancel
              </button>
            </div>
            {phoneError && (
              <p role="alert" className="ep-error">
                {phoneError}
              </p>
            )}
          </form>
        )}
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
          <section
            className={`ep-card ep-countdown${planPhase ? ` ep-phase-${planPhase}` : ''}`}
            aria-labelledby="ep-countdown-title"
          >
            {inExamWindow && official && !editingDate ? (
              <div className="ep-countdown-text">
                <h2 id="ep-countdown-title">{official.title} is on now. Good luck!</h2>
                <span className="ep-phase-chip">
                  {formatDay(official.start)} to {formatDay(official.end)}
                </span>
                <small>
                  Official KNEC dates.{' '}
                  <button className="ep-link" onClick={() => setEditingDate(true)}>
                    Use my own date
                  </button>
                </small>
              </div>
            ) : daysLeft !== null && !editingDate ? (
              <>
                <div className="ep-days" aria-live="polite">
                  <strong>{daysLeft >= 0 ? daysLeft : 0}</strong>
                  <span>{daysLeft === 1 ? 'day' : 'days'}</span>
                </div>
                <div className="ep-countdown-text">
                  <h2 id="ep-countdown-title">
                    {daysLeft < 0
                      ? 'Your exam date has passed'
                      : daysLeft === 0
                        ? 'Your exam starts today. You are ready.'
                        : `until your ${exam} exam`}
                  </h2>
                  {planPhase && <span className="ep-phase-chip">{PHASE_LABEL[planPhase]}</span>}
                  <small>
                    {usingOfficial && official
                      ? `Official KNEC date: ${formatDay(official.start)}. `
                      : `${progress.examDate} · set by you. `}
                    <button className="ep-link" onClick={() => setEditingDate(true)}>
                      {usingOfficial ? 'Use my own date' : 'Change date'}
                    </button>
                    {!usingOfficial && official && (
                      <>
                        {' · '}
                        <button className="ep-link" onClick={useOfficialDate}>
                          Use official date
                        </button>
                      </>
                    )}
                  </small>
                </div>
              </>
            ) : (
              <form
                className="ep-date-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (dateDraft) saveExamDate(dateDraft);
                }}
              >
                <h2 id="ep-countdown-title">When is your {exam} exam?</h2>
                <p>Enter your own exam date and Soma builds your daily plan around it.</p>
                <div className="ep-actions">
                  <label htmlFor="ep-exam-date" className="ep-sr">
                    Exam date
                  </label>
                  <input
                    id="ep-exam-date"
                    type="date"
                    value={dateDraft}
                    min={today}
                    onChange={(e) => setDateDraft(e.target.value)}
                    required
                  />
                  <button className="ep-outline" disabled={!dateDraft}>
                    Save date
                  </button>
                  {editingDate && (
                    <button type="button" className="ep-link" onClick={() => setEditingDate(false)}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
          {official && (
            <section className="ep-card ep-timetable" aria-labelledby="ep-timetable-title">
              <h2 id="ep-timetable-title">Your {subject} paper</h2>
              {myPapers.length ? (
                <ul className="ep-paper-dates">
                  {myPapers.map((d) => {
                    const n = daysUntil(d.date);
                    return (
                      <li key={d.date}>
                        <strong>{formatDay(d.date)}</strong>
                        <span>
                          {n > 1 ? `in ${n} days` : n === 1 ? 'tomorrow' : n === 0 ? 'today' : 'done'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>
                  KNEC has not listed a {subject} paper date for {exam} in the timetable we hold.
                  Check your school’s timetable.
                </p>
              )}
              {official.rehearsal && daysUntil(official.rehearsal) >= 0 && (
                <small>
                  Rehearsal day: {formatDay(official.rehearsal)}
                  {daysUntil(official.rehearsal) === 0 ? ' (today)' : ''}
                </small>
              )}
              <details>
                <summary>See the full {official.title} timetable</summary>
                {official.days.length > 0 && (
                  <ul className="ep-timetable-list">
                    {official.days.map((d) => (
                      <li key={d.date}>
                        <strong>{formatDay(d.date)}</strong>
                        <span>{d.subjects.join(' · ')}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {official.notes?.map((n) => (
                  <p key={n}>{n}</p>
                ))}
                <small>Source: KNEC. Always confirm with your school or knec.ac.ke.</small>
              </details>
            </section>
          )}
          <section className="ep-card ep-hero ep-today" aria-labelledby="ep-next">
            <div>
              <span className="ep-eyebrow">Today’s study session · about {plan.minutes} min</span>
              <h2 id="ep-next">{plan.headline}</h2>
              <ol className="ep-steps">
                {plan.steps.map((step, i) => (
                  <li key={step}>
                    <span className="ep-step-no" aria-hidden="true">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
              <div className="ep-actions">
                <button
                  className="ep-primary"
                  disabled={busy || (!isOnline && !session)}
                  onClick={() => void startPractice()}
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
          <section className="ep-card ep-weak" aria-labelledby="ep-weak-title">
            <h2 id="ep-weak-title">Your weak spots in {subject}</h2>
            {weak.length ? (
              <ul>
                {weak.map((w) => (
                  <li key={w.topic}>
                    <span>
                      <strong>{w.topic}</strong>
                      <small>Flagged {w.count} {w.count === 1 ? 'time' : 'times'}</small>
                    </span>
                    <button
                      className="ep-outline"
                      disabled={busy || !isOnline}
                      onClick={() => void startPractice(w.topic)}
                    >
                      Fix this topic
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                Tick “needs help” on a question during practice and it will be listed here. Nothing
                is guessed.
              </p>
            )}
            {progress.practisedCount > 0 && (
              <small>
                {progress.practisedCount} {progress.practisedCount === 1 ? 'practice' : 'practices'}{' '}
                completed
                {streakDays > 1 ? ` · ${streakDays}-day study streak` : ''}
              </small>
            )}
            <small role="status" className="ep-sync">
              {!canSync(recoveryOwner)
                ? 'Sign in to keep your progress safe on every device.'
                : syncState === 'synced'
                  ? 'Progress saved to your Soma account.'
                  : syncState === 'syncing'
                    ? 'Saving your progress…'
                    : syncState === 'local'
                      ? 'Saved on this device. It will sync when you are back online.'
                      : ''}
            </small>

            {/* Parent & Teacher WhatsApp Progress Loop */}
            <div className="ep-whatsapp-loop">
              <button
                type="button"
                className="ep-whatsapp-btn"
                onClick={shareProgressWithParent}
              >
                <MessageCircle size={16} />
                <span>Share progress with Parent on WhatsApp</span>
              </button>
              {role === UserRole.TEACHER && (
                <button
                  type="button"
                  className="ep-whatsapp-outline-btn"
                  onClick={shareTeacherClassRevision}
                >
                  <Share2 size={16} />
                  <span>Share revision with Class</span>
                </button>
              )}
            </div>
          </section>
          <h2 className="ep-section-title">Your revision toolkit</h2>
          <div className="ep-lanes">
            <section className="ep-card">
              <Leaf className="ep-lane-icon" />
              <h3>Learn it first</h3>
              <p>Read your notes, then test yourself.</p>
              <button
                className="ep-outline"
                onClick={onNotes || (() => navigate('/learner', { state: { targetTab: 'NOTEBOOK' } }))}
              >
                Open notes <ChevronRight size={17} />
              </button>
            </section>
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
          <section className="ep-card ep-pool-section" aria-labelledby="ep-pool-title">
            <div className="ep-pool-header">
              <div>
                <div className="ep-pool-free-row">
                  <span className="ep-eyebrow">Shared Syllabus Knowledge Base · Instant &amp; Low Cost</span>
                  <span className="ep-pool-free-pill">100% Free · Zero AI Generation Cost</span>
                </div>
                <h2 id="ep-pool-title">
                  <Users size={22} /> Learner’s Revision Pool ({subject})
                </h2>
                <p>
                  Browse and study notes, worked examples, and practice drills generated by fellow {exam} candidates across Kenya completely for free. Need a deeper personalised breakdown? Ask Akili below.
                </p>
              </div>
            </div>
            <div className="ep-pool-controls">
              <div className="ep-pool-tabs" role="group" aria-label="Filter pooled materials">
                <button
                  type="button"
                  className={poolFilter === 'ALL' ? 'active' : ''}
                  onClick={() => setPoolFilter('ALL')}
                >
                  All materials
                </button>
                <button
                  type="button"
                  className={poolFilter === 'PRACTICE_DRILL' ? 'active' : ''}
                  onClick={() => setPoolFilter('PRACTICE_DRILL')}
                >
                  Practice drills
                </button>
                <button
                  type="button"
                  className={poolFilter === 'TOPIC_EXPLANATION' ? 'active' : ''}
                  onClick={() => setPoolFilter('TOPIC_EXPLANATION')}
                >
                  Study notes &amp; answers
                </button>
              </div>
              <div className="ep-pool-search">
                <Search size={16} />
                <input
                  type="search"
                  aria-label="Search learner revision pool"
                  placeholder={`Search shared ${subject} topics…`}
                  value={poolSearch}
                  onChange={(e) => setPoolSearch(e.target.value)}
                />
              </div>
            </div>
            {poolItems.length > 0 ? (
              <div className="ep-pool-grid">
                {poolItems.slice(0, 6).map((item) => (
                  <article key={item.id} className="ep-pool-card">
                    <div className="ep-pool-card-top">
                      <span className={`ep-pool-badge ${item.itemType === 'PRACTICE_DRILL' ? 'drill' : 'note'}`}>
                        {item.itemType === 'PRACTICE_DRILL' ? 'Free Practice Drill' : 'Free Study Note'}
                      </span>
                      <small className="ep-pool-reuse">
                        Studied by {item.reuseCount} {item.reuseCount === 1 ? 'learner' : 'learners'}
                      </small>
                    </div>
                    <h3>{item.topic}</h3>
                    <p>{item.summaryPreview}</p>
                    <div className="ep-pool-card-footer">
                      <div className="ep-pool-peer-bar">
                        <button
                          type="button"
                          className={`ep-pool-helpful-btn ${learnerPoolService.hasMarkedHelpful(item.id) ? 'voted' : ''}`}
                          onClick={() => void handleMarkPoolHelpful(item)}
                          aria-label={`Mark ${item.topic} as helpful`}
                        >
                          <ThumbsUp size={13} />
                          <span>Helpful ({item.reuseCount})</span>
                        </button>
                        <button
                          type="button"
                          className="ep-pool-wa-btn"
                          onClick={() => handleSharePoolItemWhatsApp(item)}
                          aria-label={`Share ${item.topic} with classmates on WhatsApp`}
                        >
                          <Share2 size={13} />
                          <span>Share</span>
                        </button>
                      </div>
                      <div className="ep-pool-card-actions">
                        <button
                          type="button"
                          className="ep-link ep-pool-deeper-link"
                          onClick={() => {
                            setPoolAskTopic(item.topic);
                            setPoolAskQuery(`Give me a deeper step-by-step explanation on ${item.topic}`);
                          }}
                        >
                          Ask Akili deeper
                        </button>
                        {item.itemType === 'PRACTICE_DRILL' ? (
                          <button
                            type="button"
                            className="ep-outline"
                            onClick={() => startPracticeFromPoolItem(item)}
                          >
                            Practise from Pool <ArrowRight size={15} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="ep-outline"
                            onClick={() => setSelectedPoolNote(item)}
                          >
                            Read Material <BookOpen size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="ep-pool-empty">
                No pooled materials match that search yet. Start a topic practice or ask Akili a question above — your generation will be added to help the next learner!
              </p>
            )}

            {/* Ask Akili for Deeper Explanation (with 1/3 Teaser + Value Paywall for Free Learners) */}
            <div className="ep-pool-ask-box" aria-label="Ask Akili for deeper explanation">
              <div className="ep-pool-ask-head">
                <div>
                  <h3>
                    <Sparkles size={18} /> Need a deeper or more detailed explanation? Ask Akili
                  </h3>
                  <p>
                    Want Akili to break down a pooled note further, show worked steps, or highlight KNEC paper traps? Ask below.
                  </p>
                </div>
                {poolAskTopic && (
                  <span className="ep-pool-topic-chip">
                    Topic: {poolAskTopic}
                    <button
                      type="button"
                      aria-label="Clear selected topic"
                      onClick={() => setPoolAskTopic('')}
                    >
                      <X size={13} />
                    </button>
                  </span>
                )}
              </div>

              <div className="ep-pool-quick-chips">
                {[
                  `Break down ${poolAskTopic || subject} step-by-step for full marks`,
                  `What are the common KNEC paper traps in ${poolAskTopic || subject}?`,
                  `Give a worked exam example on ${poolAskTopic || subject}`,
                ].map((chipText) => (
                  <button
                    key={chipText}
                    type="button"
                    className="ep-pool-chip-btn"
                    onClick={() => {
                      setPoolAskQuery(chipText);
                      void handlePoolAskAkili(undefined, chipText, poolAskTopic || subject);
                    }}
                  >
                    {chipText}
                  </button>
                ))}
              </div>

              <form className="ep-pool-ask-form" onSubmit={(e) => void handlePoolAskAkili(e)}>
                <label htmlFor="ep-pool-ask-input" className="ep-sr">
                  Ask Akili for a deeper explanation
                </label>
                <textarea
                  id="ep-pool-ask-input"
                  rows={2}
                  maxLength={1000}
                  value={poolAskQuery}
                  onChange={(e) => setPoolAskQuery(e.target.value)}
                  placeholder={`Ask Akili for deeper explanation on ${poolAskTopic || subject} (e.g. "Why do we multiply by the LCM first?" or "How is this marked in KCSE/KJSEA?")…`}
                />
                <button
                  type="submit"
                  className="ep-primary"
                  disabled={poolAskLoading || !poolAskQuery.trim()}
                >
                  <Send size={16} />
                  {poolAskLoading ? 'Akili is explaining…' : 'Ask Akili'}
                </button>
              </form>

              {poolAskResult && (
                <div className="ep-pool-answer-card" role="region" aria-label="Akili deeper explanation">
                  <div className="ep-pool-answer-meta">
                    <span className="ep-pool-answer-badge">
                      <Sparkles size={14} />
                      {hasFullExplanationAccess
                        ? 'Full Akili Examiner Breakdown Unlocked'
                        : 'Free Value Preview · First 1/3 of Akili’s Answer'}
                    </span>
                    <small>{poolAskResult.topic || subject}</small>
                  </div>

                  {hasFullExplanationAccess ? (
                    <pre className="ep-pool-note-text">{poolAskResult.fullAnswer}</pre>
                  ) : (
                    <div className="ep-pool-teaser-wrap">
                      <div className="ep-pool-visible-third">
                        <pre className="ep-pool-note-text">{poolAskResult.visiblePart}</pre>
                      </div>

                      <div className="ep-pool-paywall-zone">
                        <div className="ep-pool-blurred-rest" aria-hidden="true">
                          {poolAskResult.coveredPart}
                        </div>
                        <div className="ep-pool-paywall-card" role="region" aria-label="Subscribe to continue learning">
                          <div className="ep-pool-paywall-pill">
                            <Lock size={14} />
                            <span>Unlock the remaining 2/3 of Akili’s explanation</span>
                          </div>
                          <h4>See every mark-scoring step &amp; examiner tip</h4>
                          <p>
                            You’ve read the opening breakdown. Subscribe or unlock a 24-hour Revision Pass to reveal the rest of this answer and ask unlimited deeper questions:
                          </p>
                          <ul className="ep-pool-paywall-perks">
                            <li>
                              <CheckCircle2 size={15} /> Complete step-by-step working &amp; <strong>[1 mk]</strong> KNEC mark allocation
                            </li>
                            <li>
                              <CheckCircle2 size={15} /> Exact <strong>❌ Paper Traps</strong> that cost candidates marks
                            </li>
                            <li>
                              <CheckCircle2 size={15} /> Examiner <strong>🎯 Guru Tip</strong> &amp; unlimited follow-up coaching
                            </li>
                          </ul>
                          <div className="ep-pool-paywall-actions">
                            <button
                              type="button"
                              className="ep-primary"
                              onClick={() => navigate('/pricing?segment=STUDENT')}
                            >
                              Subscribe to Soma Pro to Continue Learning
                            </button>
                            <button
                              type="button"
                              className="ep-outline"
                              onClick={openInlinePassCheckout}
                            >
                              Or Unlock 24h Pass for KES 20 (M-Pesa)
                            </button>
                            <button
                              type="button"
                              className="ep-link"
                              onClick={() => setPhoneLoginOpen(true)}
                            >
                              Already bought a paper? Login with phone
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
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
              handleFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <div className="ep-tip">
            <Leaf /> Small steps.
            <br />A brighter tomorrow.
          </div>
        </aside>
      </main>
      {selectedPoolNote && (
        <div
          className="ep-pool-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ep-pool-modal-title"
        >
          <div className="ep-card ep-pool-modal">
            <div className="ep-pool-modal-head">
              <div>
                <span className="ep-eyebrow">
                  Learner’s Revision Pool · {selectedPoolNote.grade} · {selectedPoolNote.subject}
                </span>
                <h2 id="ep-pool-modal-title">{selectedPoolNote.topic}</h2>
              </div>
              <button
                type="button"
                className="ep-outline"
                aria-label="Close study material"
                onClick={() => setSelectedPoolNote(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="ep-pool-modal-body">
              {typeof selectedPoolNote.contentJson === 'string' ? (
                <pre className="ep-pool-note-text">{selectedPoolNote.contentJson}</pre>
              ) : typeof selectedPoolNote.contentJson?.content === 'string' ? (
                <pre className="ep-pool-note-text">{selectedPoolNote.contentJson.content}</pre>
              ) : selectedPoolNote.contentJson?.whatItTests ? (
                <div className="ep-pool-walkthrough">
                  <p><strong>What it tests:</strong> {selectedPoolNote.contentJson.whatItTests}</p>
                  <p><strong>Approach strategy:</strong> {selectedPoolNote.contentJson.approachStrategy}</p>
                  {Array.isArray(selectedPoolNote.contentJson.keyConcepts) && (
                    <p><strong>Key concepts:</strong> {selectedPoolNote.contentJson.keyConcepts.join(', ')}</p>
                  )}
                  {Array.isArray(selectedPoolNote.contentJson.commonPitfalls) && (
                    <p><strong>Common pitfalls:</strong> {selectedPoolNote.contentJson.commonPitfalls.join(' · ')}</p>
                  )}
                </div>
              ) : (
                <p>{selectedPoolNote.summaryPreview}</p>
              )}
            </div>
            <div className="ep-actions">
              <button
                type="button"
                className="ep-primary"
                onClick={() => {
                  const chosen = selectedPoolNote.topic;
                  setSelectedPoolNote(null);
                  setTopic(chosen);
                  void startPractice(chosen);
                }}
              >
                Practise questions on this topic
              </button>
              <button
                type="button"
                className="ep-outline"
                onClick={() => {
                  const chosen = selectedPoolNote.topic;
                  const preview = selectedPoolNote.summaryPreview;
                  setSelectedPoolNote(null);
                  setPoolAskTopic(chosen);
                  const followUp = `Explain ${chosen} in deeper step-by-step detail with KNEC marking points`;
                  setPoolAskQuery(followUp);
                  void handlePoolAskAkili(undefined, followUp, chosen, preview);
                }}
              >
                <Sparkles size={16} /> Ask Akili for deeper explanation
              </button>
              <button
                type="button"
                className="ep-outline"
                onClick={() => handleSharePoolItemWhatsApp(selectedPoolNote)}
              >
                <Share2 size={16} /> Share Note on WhatsApp
              </button>
              <button
                type="button"
                className="ep-outline"
                onClick={() => setSelectedPoolNote(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {passCheckoutOpen && (
        <div
          className="ep-pool-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ep-pass-checkout-title"
        >
          <div className="ep-card ep-pool-modal">
            <div className="ep-pool-modal-head">
              <div>
                <span className="ep-eyebrow">24-Hour AI Revision Pass · KES 20 via Pesapal M-Pesa</span>
                <h2 id="ep-pass-checkout-title">Unlock Full Akili Explanations &amp; Past Paper Access</h2>
              </div>
              <button
                type="button"
                className="ep-outline"
                aria-label="Close M-Pesa checkout"
                onClick={() => {
                  setPassCheckoutOpen(false);
                  setPassCheckoutUrl('');
                  setPassCheckoutRef('');
                }}
              >
                <X size={18} />
              </button>
            </div>
            {passCheckoutUrl ? (
              <div className="ep-pool-modal-body">
                <iframe
                  title="Pesapal M-Pesa Checkout"
                  src={passCheckoutUrl}
                  style={{ width: '100%', height: '540px', border: '1px solid #cbd5e1', borderRadius: '12px' }}
                  allow="payment"
                />
              </div>
            ) : (
              <form className="ep-pool-modal-body" onSubmit={(e) => void startInlinePassCheckout(e)}>
                <p style={{ marginBottom: '12px' }}>
                  Pay <strong>KES 20</strong> via M-Pesa (processed securely by Pesapal) to unlock a full 24-hour AI Revision Pass, reveal the rest of Akili’s answer right here, and access a past paper + marking scheme.
                </p>
                <div style={{ display: 'grid', gap: '12px', marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '14px' }}>
                    Your name
                    <input
                      required
                      value={passBuyer.name}
                      onChange={(e) => setPassBuyer({ ...passBuyer, name: e.target.value })}
                      placeholder="Candidate name"
                      style={{
                        display: 'block',
                        width: '100%',
                        minHeight: '44px',
                        marginTop: '4px',
                        padding: '8px 12px',
                        borderRadius: '9px',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                  </label>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '14px' }}>
                    M-Pesa phone number (+254..., 07..., or last 9 digits)
                    <input
                      required
                      type="tel"
                      inputMode="tel"
                      value={passBuyer.phone}
                      onChange={(e) => setPassBuyer({ ...passBuyer, phone: e.target.value })}
                      placeholder="07XX XXX XXX"
                      style={{
                        display: 'block',
                        width: '100%',
                        minHeight: '44px',
                        marginTop: '4px',
                        padding: '8px 12px',
                        borderRadius: '9px',
                        border: '1px solid #cbd5e1',
                      }}
                    />
                  </label>
                </div>
                {passCheckoutError && (
                  <p role="alert" className="ep-error">
                    {passCheckoutError}
                  </p>
                )}
                <div className="ep-actions">
                  <button type="submit" className="ep-primary" disabled={passBuying}>
                    <ShieldCheck size={18} />
                    {passBuying ? 'Starting M-Pesa STK Push…' : 'Pay KES 20 with M-Pesa (Pesapal)'}
                  </button>
                  <button
                    type="button"
                    className="ep-outline"
                    onClick={() =>
                      navigate(
                        `/exam-papers?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`
                      )
                    }
                  >
                    Choose a specific past paper
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
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
            onUsePhoto={handleFile}
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
