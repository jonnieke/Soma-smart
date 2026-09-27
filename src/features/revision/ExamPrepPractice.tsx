import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { remainingSeconds, type PrepSession } from './examPrepState';

export function ExamPrepPractice({
  session,
  onChange,
  onClose,
  onExplain,
  online,
}: {
  session: PrepSession;
  onChange: (s: PrepSession) => void;
  onClose: () => void;
  onExplain: (prompt: string) => void;
  online: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [seconds, setSeconds] = useState(() => remainingSeconds(session.deadline));
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
