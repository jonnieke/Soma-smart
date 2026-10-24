import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Lock, Sparkles, X } from 'lucide-react';
import { remainingSeconds, type PrepSession } from './examPrepState';
import {
  learnerPoolService,
  type DeeperExplanationResult,
} from '../../services/learnerPoolService';

export function ExamPrepPractice({
  session,
  onChange,
  onClose,
  onExplain,
  online,
  hasFullAccess = true,
  onSubscribe,
  onUnlockPass,
}: {
  session: PrepSession;
  onChange: (s: PrepSession) => void;
  onClose: () => void;
  onExplain: (prompt: string) => void;
  online: boolean;
  hasFullAccess?: boolean;
  onSubscribe?: () => void;
  onUnlockPass?: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [seconds, setSeconds] = useState(() => remainingSeconds(session.deadline));
  const [inlineExplanations, setInlineExplanations] = useState<
    Record<number, DeeperExplanationResult>
  >({});
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null);

  const loadInlineBreakdown = async (idx: number, questionText: string, guidance: string) => {
    if (loadingIdx !== null) return;
    setLoadingIdx(idx);
    try {
      const result = await learnerPoolService.askAkiliDeeperExplanation({
        grade: session.grade,
        subject: session.subject,
        examPathway: session.exam,
        topic: session.topic,
        question: `Break down this exam question step-by-step with marking points: ${questionText}`,
        contextPreview: guidance,
      });
      setInlineExplanations((prev) => ({ ...prev, [idx]: result }));
    } finally {
      setLoadingIdx(null);
    }
  };
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    dialog?.showModal();
    return () => {
      dialog?.close();
      previous?.focus();
    };
  }, []);
  useEffect(() => {
    if (session.completed) return;
    const timer = window.setInterval(() => setSeconds(remainingSeconds(session.deadline)), 1000);
    return () => window.clearInterval(timer);
  }, [session.deadline, session.completed]);
  return (
    <dialog
      ref={ref}
      className="ep-practice"
      aria-labelledby="ep-practice-title"
      onCancel={onClose}
    >
      <header>
        <div>
          <h2 id="ep-practice-title">{session.topic}</h2>
          <p>
            {session.grade} · {session.subject} · AI practice
          </p>
        </div>
        <button aria-label="Save and close practice" className="ep-outline" onClick={onClose}>
          <X />
        </button>
      </header>
      <p className="ep-notice">
        {session.completed
          ? 'Practice reviewed. These are your self-assessments, not an exam score.'
          : seconds > 0
            ? `Practice timer: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}. You can continue untimed when it ends.`
            : 'Your 10 minutes are up. Your answers are safe; continue untimed or review them now.'}
      </p>
      {session.questions.map((q, i) => (
        <section className="ep-practice-question" key={i}>
          <h3>
            {i + 1}. {q.text} <small>({q.marks} marks)</small>
          </h3>
          <label htmlFor={`ep-answer-${i}`}>Your answer</label>
          <textarea
            id={`ep-answer-${i}`}
            rows={3}
            maxLength={5000}
            value={session.answers[i]}
            onChange={(e) => {
              const answers = [...session.answers];
              answers[i] = e.target.value;
              const reviewed = [...session.reviewed];
              reviewed[i] = false;
              onChange({ ...session, answers, reviewed, completed: false });
            }}
          />
          <details>
            <summary>Compare with answer guidance</summary>
            <p className="ep-guidance">{q.modelAnswerOutline}</p>
            <p>How did you do? This is a self-check, not automated marking.</p>
            <label>
              <input
                type="checkbox"
                checked={session.needsHelp[i]}
                onChange={(e) => {
                  const needsHelp = [...session.needsHelp];
                  needsHelp[i] = e.target.checked;
                  onChange({ ...session, needsHelp });
                }}
              />{' '}
              I need more help with this question
            </label>
            <label>
              <input
                type="checkbox"
                checked={session.reviewed[i]}
                onChange={(e) => {
                  const reviewed = [...session.reviewed];
                  reviewed[i] = e.target.checked;
                  onChange({ ...session, reviewed, completed: reviewed.every(Boolean) });
                }}
              />{' '}
              I have reviewed my answer
            </label>
            <div className="ep-actions" style={{ marginTop: '10px' }}>
              <button
                type="button"
                className="ep-primary"
                disabled={loadingIdx === i}
                onClick={() => void loadInlineBreakdown(i, q.text, q.modelAnswerOutline)}
              >
                <Sparkles size={16} />
                {loadingIdx === i
                  ? 'Akili is breaking this down…'
                  : inlineExplanations[i]
                    ? 'Refresh Akili Breakdown'
                    : 'Instant Akili Breakdown (Here)'}
              </button>
              <button
                className="ep-outline"
                disabled={!online}
                onClick={() =>
                  onExplain(
                    `Help me understand this ${session.grade} ${session.subject} question: ${q.text}\nMy answer: ${session.answers[i] || 'I have not answered yet'}. Give constructive feedback; do not claim an official grade.`
                  )
                }
              >
                Explain with Akili
              </button>
            </div>
            {inlineExplanations[i] && (
              <div
                className="ep-pool-answer-card"
                role="region"
                aria-label={`Akili inline breakdown for question ${i + 1}`}
                style={{ marginTop: '12px' }}
              >
                <div className="ep-pool-answer-meta">
                  <span className="ep-pool-answer-badge">
                    <Sparkles size={14} />
                    {hasFullAccess
                      ? 'Full Akili Step-by-Step Breakdown Unlocked'
                      : 'Free Value Preview · First 1/3 of Akili’s Breakdown'}
                  </span>
                  <small>{session.topic}</small>
                </div>
                {hasFullAccess ? (
                  <pre className="ep-pool-note-text">{inlineExplanations[i].fullAnswer}</pre>
                ) : (
                  <div className="ep-pool-teaser-wrap">
                    <div className="ep-pool-visible-third">
                      <pre className="ep-pool-note-text">{inlineExplanations[i].visiblePart}</pre>
                    </div>
                    <div className="ep-pool-paywall-zone">
                      <div className="ep-pool-blurred-rest" aria-hidden="true">
                        {inlineExplanations[i].coveredPart}
                      </div>
                      <div
                        className="ep-pool-paywall-card"
                        role="region"
                        aria-label="Unlock full question breakdown"
                      >
                        <div className="ep-pool-paywall-pill">
                          <Lock size={13} />
                          <span>Unlock the remaining 2/3 of Akili’s working</span>
                        </div>
                        <h4>See every mark-scoring step &amp; paper trap</h4>
                        <ul className="ep-pool-paywall-perks">
                          <li>
                            <CheckCircle2 size={14} /> Complete working &amp; <strong>[1 mk]</strong> KNEC mark scheme
                          </li>
                          <li>
                            <CheckCircle2 size={14} /> Common <strong>❌ Paper Traps</strong> &amp; <strong>🎯 Guru Tip</strong>
                          </li>
                        </ul>
                        <div className="ep-pool-paywall-actions">
                          {onSubscribe && (
                            <button type="button" className="ep-primary" onClick={onSubscribe}>
                              Subscribe to Soma Pro to Continue Learning
                            </button>
                          )}
                          {onUnlockPass && (
                            <button type="button" className="ep-outline" onClick={onUnlockPass}>
                              Or Unlock 24h Pass for KES 20 (M-Pesa)
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </details>
        </section>
      ))}
      <button className="ep-primary" onClick={onClose}>
        Save and return to Exam Prep
      </button>
      <p>Saved in this browser tab only. Closing the tab may remove this practice.</p>
    </dialog>
  );
}
