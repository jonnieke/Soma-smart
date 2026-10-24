import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Printer,
  RefreshCw,
  Search,
  Share2,
  Sparkles,
  ThumbsUp,
  X,
} from 'lucide-react';
import logoImg from '../assets/images/main_logo.png';
import {
  learnerPoolService,
  type DeeperExplanationResult,
  type LearnerPoolItem,
  type PoolItemType,
} from '../services/learnerPoolService';
import { examPaperBankService, type PhoneRestoreSession } from '../services/examPaperBankService';
import { formatPooledMaterialForWhatsApp, openWhatsAppShare } from '../services/whatsappService';

const GRADE_FILTERS = [
  'All',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Form 3',
  'Form 4',
] as const;

const SUBJECT_FILTERS = [
  'All',
  'Mathematics',
  'Biology',
  'Chemistry',
  'Physics',
  'Integrated Science',
  'English',
  'Kiswahili',
] as const;

export const FreeRevisionPoolPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialGrade = searchParams.get('grade') || 'All';
  const initialSubject = searchParams.get('subject') || 'All';
  const requestedPoolId = searchParams.get('pool') || '';

  const [grade, setGrade] = useState<string>(initialGrade);
  const [subject, setSubject] = useState<string>(initialSubject);
  const [typeFilter, setTypeFilter] = useState<PoolItemType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [poolVersion, setPoolVersion] = useState(0);

  const [phoneSession, setPhoneSession] = useState<PhoneRestoreSession | null>(() =>
    examPaperBankService.readPhoneSession()
  );
  const [restorePhone, setRestorePhone] = useState(
    () => examPaperBankService.readPhoneSession()?.last9 || ''
  );
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<{
    tone: 'ok' | 'err';
    text: string;
  } | null>(null);

  const [activeItem, setActiveItem] = useState<LearnerPoolItem | null>(null);
  const [drillIndex, setDrillIndex] = useState(0);
  const [drillAnswers, setDrillAnswers] = useState<Record<number, string>>({});
  const [drillChecked, setDrillChecked] = useState<Record<number, boolean>>({});
  const [deeperLoading, setDeeperLoading] = useState(false);
  const [deeperBreakdowns, setDeeperBreakdowns] = useState<
    Record<number, DeeperExplanationResult>
  >({});

  const hasFullAccess = Boolean(phoneSession?.found && phoneSession?.passActive);
  const learnerKey = phoneSession?.last9 ? `phone:${phoneSession.last9}` : 'guest-pool-learner';

  // Fetch both local + remote pool items
  const [remoteItems, setRemoteItems] = useState<LearnerPoolItem[]>([]);
  useEffect(() => {
    let mounted = true;
    learnerPoolService
      .listPool({
        grade: grade === 'All' ? undefined : grade,
        subject: subject === 'All' ? undefined : subject,
        itemType: typeFilter,
        search: searchQuery,
        limit: 40,
      })
      .then((list) => {
        if (mounted) setRemoteItems(list);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [grade, subject, typeFilter, searchQuery, poolVersion]);

  const items = useMemo(() => {
    const local = learnerPoolService.listLocalPool({
      grade: grade === 'All' ? undefined : grade,
      subject: subject === 'All' ? undefined : subject,
      itemType: typeFilter,
      search: searchQuery,
      limit: 40,
    });
    const byId = new Map<string, LearnerPoolItem>();
    for (const item of [...local, ...remoteItems]) {
      byId.set(item.id, item);
    }
    return Array.from(byId.values()).sort((a, b) => b.reuseCount - a.reuseCount);
  }, [grade, subject, typeFilter, searchQuery, remoteItems, poolVersion]);

  // Open requested ?pool=<id> item on mount or change
  useEffect(() => {
    if (!requestedPoolId) return;
    const allLocal = learnerPoolService.listLocalPool({ limit: 100 });
    const found =
      allLocal.find((i) => i.id === requestedPoolId) ||
      remoteItems.find((i) => i.id === requestedPoolId);
    if (found) {
      openPoolItem(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedPoolId, remoteItems.length]);

  const openPoolItem = (item: LearnerPoolItem) => {
    setActiveItem(item);
    setDrillIndex(0);
    setDrillAnswers({});
    setDrillChecked({});
    setDeeperBreakdowns({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePhoneRestore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restorePhone.trim() || restoreLoading) return;
    setRestoreLoading(true);
    setRestoreNotice(null);
    try {
      const res = await examPaperBankService.restoreByPhone(restorePhone.trim());
      if (res.found && res.passActive) {
        setPhoneSession(res);
        setRestoreNotice({
          tone: 'ok',
          text: `24h Pass active (+254${res.last9} · ${res.hoursRemaining}h remaining) — Full Akili marking breakdowns unlocked!`,
        });
      } else if (res.found) {
        setPhoneSession(res);
        setRestoreNotice({
          tone: 'err',
          text: `Past papers found for +254${res.last9}, but your 24h AI Pass has expired. Renew for KES 20 to unlock full breakdowns.`,
        });
      } else {
        setRestoreNotice({
          tone: 'err',
          text: 'No pass found for that phone number yet.',
        });
      }
    } catch {
      setRestoreNotice({
        tone: 'err',
        text: 'Could not verify phone number right now.',
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleNextRotationalDrill = async () => {
    const next = await learnerPoolService.getNextRotationalPoolDrill(learnerKey, {
      grade: grade === 'All' ? undefined : grade,
      subject: subject === 'All' ? undefined : subject,
    });
    if (next) {
      learnerPoolService.markDrillCompletedByLearner(learnerKey, next.id);
      openPoolItem(next);
      setPoolVersion((v) => v + 1);
    }
  };

  const handleHelpfulVote = async (item: LearnerPoolItem) => {
    const updated = await learnerPoolService.markItemHelpful(item.id);
    if (updated && activeItem?.id === item.id) {
      setActiveItem(updated);
    }
    setPoolVersion((v) => v + 1);
  };

  const handleShareWhatsApp = (item: LearnerPoolItem) => {
    const text = formatPooledMaterialForWhatsApp({
      id: item.id,
      topic: item.topic,
      subject: item.subject,
      grade: item.grade,
      itemType: item.itemType,
      summaryPreview: item.summaryPreview,
      reuseCount: item.reuseCount,
    });
    openWhatsAppShare(text);
  };

  const handleAskDeeper = async (questionIdx: number, questionObj: any) => {
    if (!activeItem || deeperLoading) return;
    setDeeperLoading(true);
    try {
      const result = await learnerPoolService.askAkiliDeeperExplanation({
        grade: activeItem.grade,
        subject: activeItem.subject,
        examPathway: activeItem.examPathway,
        topic: questionObj.topic || activeItem.topic,
        question: questionObj.text || activeItem.topic,
        contextPreview: questionObj.modelAnswerOutline || activeItem.summaryPreview,
      });
      setDeeperBreakdowns((prev) => ({ ...prev, [questionIdx]: result }));
      setPoolVersion((v) => v + 1);
    } finally {
      setDeeperLoading(false);
    }
  };

  const drillQuestions: any[] =
    activeItem?.itemType === 'PRACTICE_DRILL' && Array.isArray(activeItem.contentJson)
      ? activeItem.contentJson
      : activeItem?.itemType === 'REVISION_PAPER' &&
          Array.isArray(activeItem.contentJson?.questions)
        ? activeItem.contentJson.questions
        : [];

  const currentQuestion = drillQuestions[drillIndex];

  const extractNoteBody = (item: LearnerPoolItem): string => {
    if (typeof item.contentJson === 'string') return item.contentJson;
    if (item.contentJson?.content) return String(item.contentJson.content);
    if (item.contentJson?.explanation) return String(item.contentJson.explanation);
    return item.summaryPreview;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fbf9f4', color: '#0f172a', fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <header
        style={{
          minHeight: '78px',
          padding: '12px 5%',
          borderBottom: '1px solid #e7e2d8',
          background: '#fbf9f4',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: '#0f172a',
              font: 'bold 26px Georgia, serif',
            }}
          >
            <img src={logoImg} alt="" width={42} height={42} style={{ objectFit: 'contain' }} />
            <span>Soma AI</span>
          </Link>
          <span
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            Learner’s Revision Pool · 100% Free
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
          <form
            onSubmit={handlePhoneRestore}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              border: '1px solid #d6d1c4',
              borderRadius: '999px',
              padding: '4px 6px 4px 12px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              Have a 24h Pass?
            </span>
            <input
              type="tel"
              value={restorePhone}
              onChange={(e) => setRestorePhone(e.target.value)}
              placeholder="Enter phone (07...)"
              aria-label="Enter phone number to restore 24h pass"
              style={{
                border: 'none',
                outline: 'none',
                fontSize: '12px',
                width: '130px',
                background: 'transparent',
                color: '#0f172a',
              }}
            />
            <button
              type="submit"
              disabled={restoreLoading || !restorePhone.trim()}
              style={{
                background: '#065f46',
                color: '#ffffff',
                border: 'none',
                borderRadius: '999px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {restoreLoading ? '...' : 'Restore'}
            </button>
          </form>

          <Link
            to="/exam-papers"
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#065f46',
              textDecoration: 'none',
              padding: '8px 14px',
              borderRadius: '10px',
              border: '1px solid #a7f3d0',
              background: '#ecfdf5',
            }}
          >
            Past Papers (KES 20)
          </Link>
          <Link
            to="/revision"
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#334155',
              textDecoration: 'none',
              padding: '8px 12px',
            }}
          >
            Candidates Hub →
          </Link>
        </div>
      </header>

      {restoreNotice && (
        <div
          role="status"
          style={{
            background: restoreNotice.tone === 'ok' ? '#ecfdf5' : '#fffbeb',
            color: restoreNotice.tone === 'ok' ? '#065f46' : '#92400e',
            borderBottom: '1px solid #d1fae5',
            padding: '8px 5%',
            fontSize: '13px',
            fontWeight: 700,
            textAlign: 'center',
          }}
        >
          {restoreNotice.text}
        </div>
      )}

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 5% 60px' }}>
        {/* Hero Banner */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: 700,
                color: '#047857',
                textDecoration: 'none',
                marginBottom: '8px',
              }}
            >
              <ArrowLeft size={15} /> Back to Homepage
            </Link>
            <h1
              style={{
                font: 'bold clamp(28px, 3.4vw, 42px)/1.12 Georgia, serif',
                margin: '0 0 8px',
                color: '#0f172a',
              }}
            >
              🔥 Learner’s Revision Pool · 100% Free to Practise
            </h1>
            <p style={{ fontSize: '15px', color: '#475569', margin: 0, maxWidth: '720px' }}>
              Practise KNEC-aligned drills, read step-by-step Akili breakdowns, and print 1-page revision sheets generated by fellow candidates across Kenya — at zero AI cost.
            </p>
          </div>

          <button
            type="button"
            onClick={handleNextRotationalDrill}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#065f46',
              color: '#ffffff',
              border: 'none',
              borderRadius: '14px',
              padding: '13px 20px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 8px 20px rgba(6, 95, 70, 0.18)',
            }}
          >
            <RefreshCw size={17} /> Practise Next Unseen Drill (Free)
          </button>
        </div>

        {/* Active Item Interactive Viewer (opens at top when a card is clicked or via ?pool=<id>) */}
        {activeItem && (
          <section
            aria-label="Active pooled revision material"
            style={{
              background: '#ffffff',
              border: '2px solid #065f46',
              borderRadius: '20px',
              padding: '24px',
              marginBottom: '28px',
              boxShadow: '0 16px 36px rgba(15, 23, 42, 0.08)',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '12px',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '14px',
                marginBottom: '18px',
              }}
            >
              <div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '6px' }}>
                  <span
                    style={{
                      background: '#ecfdf5',
                      color: '#065f46',
                      border: '1px solid #a7f3d0',
                      borderRadius: '999px',
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                    }}
                  >
                    {activeItem.itemType === 'PRACTICE_DRILL'
                      ? 'Interactive Practice Drill'
                      : activeItem.itemType === 'REVISION_PAPER'
                        ? 'Captured Past Paper'
                        : 'Akili Step-by-Step Breakdown'}{' '}
                    · {activeItem.grade} · {activeItem.subject}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                    Studied by {activeItem.reuseCount} learners
                  </span>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 900, margin: 0, color: '#0f172a' }}>
                  {activeItem.topic}
                </h2>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => learnerPoolService.printPooledRevisionSheet(activeItem)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '7px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={14} /> Print 1-Page Sheet
                </button>
                <button
                  type="button"
                  onClick={() => handleHelpfulVote(activeItem)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: learnerPoolService.hasMarkedHelpful(activeItem.id)
                      ? '#ecfdf5'
                      : '#f8fafc',
                    border: '1px solid #a7f3d0',
                    borderRadius: '10px',
                    padding: '7px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#065f46',
                    cursor: 'pointer',
                  }}
                >
                  <ThumbsUp size={14} /> Helpful ({activeItem.reuseCount})
                </button>
                <button
                  type="button"
                  onClick={() => handleShareWhatsApp(activeItem)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '7px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#0f172a',
                    cursor: 'pointer',
                  }}
                >
                  <Share2 size={14} /> Share on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveItem(null);
                    searchParams.delete('pool');
                    setSearchParams(searchParams);
                  }}
                  aria-label="Close active pool item"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {drillQuestions.length > 0 && currentQuestion ? (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#047857' }}>
                    Question {drillIndex + 1} of {drillQuestions.length} ·{' '}
                    {currentQuestion.marks || 2} marks
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {drillQuestions.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setDrillIndex(idx)}
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '8px',
                          border:
                            idx === drillIndex ? '2px solid #065f46' : '1px solid #cbd5e1',
                          background: drillChecked[idx]
                            ? '#ecfdf5'
                            : idx === drillIndex
                              ? '#065f46'
                              : '#ffffff',
                          color:
                            idx === drillIndex && !drillChecked[idx] ? '#ffffff' : '#0f172a',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '14px',
                    padding: '16px',
                    marginBottom: '14px',
                  }}
                >
                  <p style={{ fontSize: '16px', fontWeight: 700, margin: 0, lineHeight: 1.5 }}>
                    {currentQuestion.text}
                  </p>
                </div>

                <textarea
                  value={drillAnswers[drillIndex] || ''}
                  onChange={(e) =>
                    setDrillAnswers((prev) => ({ ...prev, [drillIndex]: e.target.value }))
                  }
                  placeholder="Write your working and answer here before checking the KNEC marking scheme..."
                  rows={3}
                  style={{
                    width: '100%',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    padding: '12px',
                    fontSize: '14px',
                    marginBottom: '12px',
                    boxSizing: 'border-box',
                  }}
                />

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <button
                    type="button"
                    onClick={() =>
                      setDrillChecked((prev) => ({ ...prev, [drillIndex]: true }))
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#065f46',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <CheckCircle2 size={16} /> Check Marking Scheme
                  </button>

                  <button
                    type="button"
                    disabled={deeperLoading}
                    onClick={() => handleAskDeeper(drillIndex, currentQuestion)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #bfdbfe',
                      borderRadius: '10px',
                      padding: '10px 16px',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <Sparkles size={16} />{' '}
                    {deeperLoading ? 'Akili is breaking it down...' : 'Instant Akili Breakdown (Here)'}
                  </button>

                  {drillIndex + 1 < drillQuestions.length ? (
                    <button
                      type="button"
                      onClick={() => setDrillIndex((i) => i + 1)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ffffff',
                        color: '#0f172a',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Next Question <ArrowRight size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextRotationalDrill}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#ecfdf5',
                        color: '#065f46',
                        border: '1px solid #a7f3d0',
                        borderRadius: '10px',
                        padding: '10px 16px',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <RefreshCw size={15} /> Load Next Free Drill
                    </button>
                  )}
                </div>

                {drillChecked[drillIndex] && (
                  <div
                    style={{
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '12px',
                      padding: '14px',
                      marginBottom: '12px',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '13px', color: '#065f46', marginBottom: '6px' }}>
                      ✅ Official KNEC Marking Scheme Points:
                    </strong>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '13.5px', lineHeight: 1.55, color: '#064e3b' }}>
                      {currentQuestion.modelAnswerOutline ||
                        (Array.isArray(currentQuestion.markingScheme)
                          ? currentQuestion.markingScheme.join('\n')
                          : 'Award 1 mark for each correct step and final answer.')}
                    </div>
                  </div>
                )}

                {deeperBreakdowns[drillIndex] && (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '16px',
                    }}
                  >
                    <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>
                      ✨ Akili Step-by-Step Examiner Breakdown:
                    </strong>
                    <div style={{ whiteSpace: 'pre-wrap', fontSize: '13.5px', lineHeight: 1.6, color: '#1e293b' }}>
                      {hasFullAccess
                        ? deeperBreakdowns[drillIndex].fullAnswer
                        : deeperBreakdowns[drillIndex].visiblePart}
                    </div>
                    {!hasFullAccess && deeperBreakdowns[drillIndex].coveredPart && (
                      <div
                        style={{
                          marginTop: '12px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '12px',
                          padding: '14px',
                          textAlign: 'center',
                        }}
                      >
                        <p style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px', color: '#0f172a' }}>
                          Unlock the remaining 2/3 examiner working + <strong>24h Unlimited AI Revision</strong> by buying any Past Paper (<strong>KES 20 via M-Pesa</strong>)
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('/exam-papers')}
                          style={{
                            background: '#065f46',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '9px 16px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          Buy Past Paper (KES 20) & Unlock 24h Pass →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '18px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '14.5px',
                  lineHeight: 1.65,
                  color: '#1e293b',
                }}
              >
                {extractNoteBody(activeItem)}
              </div>
            )}
          </section>
        )}

        {/* Filter Bar */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e4e0d6',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '22px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '8px 12px',
              flex: '1 1 220px',
            }}
          >
            <Search size={16} color="#64748b" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topic, e.g. Photosynthesis, Linear Equations, Gas Laws..."
              aria-label="Search free revision pool"
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '13px',
                color: '#0f172a',
              }}
            />
          </div>

          <select
            aria-label="Filter by grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {GRADE_FILTERS.map((g) => (
              <option key={g} value={g}>
                {g === 'All' ? 'All Grades' : g}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            style={{
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            {SUBJECT_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s === 'All' ? 'All Subjects' : s}
              </option>
            ))}
          </select>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(
              [
                ['ALL', 'All Free Items'],
                ['PRACTICE_DRILL', 'Practice Drills'],
                ['TOPIC_EXPLANATION', 'Akili Breakdowns'],
                ['REVISION_PAPER', 'Scanned Papers'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTypeFilter(key as PoolItemType | 'ALL')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '999px',
                  border:
                    typeFilter === key ? '1px solid #065f46' : '1px solid #cbd5e1',
                  background: typeFilter === key ? '#065f46' : '#ffffff',
                  color: typeFilter === key ? '#ffffff' : '#334155',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Pooled Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))',
            gap: '18px',
          }}
        >
          {items.map((item) => {
            const isDrill = item.itemType === 'PRACTICE_DRILL';
            const isPaper = item.itemType === 'REVISION_PAPER';
            return (
              <article
                key={item.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#ffffff',
                  border:
                    activeItem?.id === item.id
                      ? '2px solid #065f46'
                      : '1px solid #e4e0d6',
                  borderRadius: '18px',
                  padding: '20px',
                  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.04)',
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: '#047857',
                      }}
                    >
                      {isDrill
                        ? 'Practice Drill'
                        : isPaper
                          ? 'Scanned Paper'
                          : 'Akili Breakdown'}{' '}
                      · {item.grade} {item.subject}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                      {item.reuseCount} revised · Free
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 800,
                      color: '#0f172a',
                      margin: '0 0 8px',
                      lineHeight: 1.35,
                    }}
                  >
                    {item.topic}
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: '#475569',
                      margin: 0,
                      lineHeight: 1.5,
                    }}
                  >
                    {item.summaryPreview}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => openPoolItem(item)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#065f46',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 14px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {isDrill ? (
                      <>
                        <BookOpen size={14} /> Practise Free Drill
                      </>
                    ) : (
                      <>
                        <FileText size={14} /> Read Free Breakdown
                      </>
                    )}
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => learnerPoolService.printPooledRevisionSheet(item)}
                      title="Print 1-Page Sheet"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '7px',
                        cursor: 'pointer',
                        color: '#334155',
                      }}
                    >
                      <Printer size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleHelpfulVote(item)}
                      title="Mark Helpful"
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '7px',
                        cursor: 'pointer',
                        color: '#065f46',
                      }}
                    >
                      <ThumbsUp size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FreeRevisionPoolPage;
