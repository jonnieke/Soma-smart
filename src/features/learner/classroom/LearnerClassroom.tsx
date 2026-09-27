import React, { useId, useRef, useState } from 'react';
import {
  BookOpen,
  Camera,
  CheckCircle,
  ChevronDown,
  Leaf,
  Lightbulb,
  Mic,
  PlayCircle,
  Send,
  Upload,
  Volume2,
} from 'lucide-react';
import logo from '../../../assets/images/main_logo.png';
import { MarkdownText } from '../../../components/Shared';
import type { ExplanationResult } from '../../../types';
import { findLessonIllustration } from '../answer/lessonIllustrations';
import { PhotosynthesisDiagram, FractionDiagram } from '../answer/LessonVisual';
import { buildLearnerNotes } from '../answer/LearnerAnswerNotes';
import './LearnerClassroom.css';

export type LearnerClassroomProps = {
  answer: ExplanationResult;
  name: string;
  grade: string;
  subject?: string;
  busy: boolean;
  listening: boolean;
  recording: boolean;
  examplesUsed: number;
  saved?: boolean;
  nextTopic?: string;
  onHome: () => void;
  onSubjects: () => void;
  onNotes: () => void;
  onPapers: () => void;
  onProfile: () => void;
  onHomepage: () => void;
  onAsk: (question: string) => void;
  onScan: () => void;
  onUpload: () => void;
  onSpeak: () => void;
  onSimplify: () => void;
  onExample: () => void;
  onListen: () => void;
  onPractise: () => void;
  onSave: () => void;
  onNext: () => void;
  onVideos: () => void;
  media?: React.ReactNode;
  children?: React.ReactNode;
};

export function LearnerClassroom(props: LearnerClassroomProps) {
  const { answer } = props;
  const visual = findLessonIllustration(answer.topic);
  const starter = answer.topic === 'Soil erosion';
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [savedLocally, setSaved] = useState(false);
  const saved = props.saved ?? savedLocally;
  const [question, setQuestion] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const practiceRef = useRef<HTMLDivElement>(null);
  const radioName = useId();
  const headingId = useId();
  const notes = buildLearnerNotes(answer);
  const firstName = props.name.trim().split(/\s+/)[0] || 'Learner';
  const checkAnswer = () => {
    if (choice !== null) {
      setChecked(true);
      setStep(2);
    }
  };
  const moveStep = (next: number) => {
    setStep(next);
    if (next === 2 && choice !== null) setChecked(true);
    if (next > 0) practiceRef.current?.scrollIntoView({ block: 'center' });
  };
  return (
    <div className="learner-classroom">
      <header className="classroom-header">
        <button
          className="classroom-brand"
          onClick={props.onHomepage}
          aria-label="Soma AI homepage"
        >
          <img src={logo} alt="" /> <span>Soma AI</span>
        </button>
        <nav aria-label="Learning navigation">
          <button className="active" aria-current="page" onClick={props.onHome}>
            My classroom
          </button>
          <button onClick={props.onSubjects}>Subjects</button>
          <button onClick={props.onNotes}>My notes</button>
          <button onClick={props.onPapers}>Past papers</button>
        </nav>
        <div className="classroom-account">
          <button
            className="classroom-grade"
            onClick={props.onProfile}
            aria-label="Choose your grade"
          >
            {props.grade || 'Choose grade'}
            <ChevronDown size={16} />
          </button>
          <button
            className="classroom-avatar"
            onClick={props.onProfile}
            aria-label="Open your profile"
          >
            {firstName.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>
      <div className="classroom-content">
        <div className="classroom-welcome">
          <div>
            <h1>Welcome back, {firstName}.</h1>
            <p>Let’s understand something new, together.</p>
          </div>
          <button className="classroom-outline" onClick={props.onSubjects}>
            <BookOpen size={20} />
            Choose another topic
          </button>
        </div>
        <div className="classroom-columns">
          <article className="classroom-lesson" aria-labelledby={headingId}>
            <p className="classroom-breadcrumb">
              {props.subject ||
                (visual?.id === 'fractions'
                  ? 'Mathematics'
                  : visual
                    ? 'Science'
                    : 'My learning')}{' '}
              <span>/</span> {visual?.id === 'soil-erosion' ? 'Our environment' : answer.topic}
            </p>
            <h2 id={headingId}>{starter ? 'Why does soil wash away?' : answer.topic}</h2>
            <nav className="classroom-steps" aria-label="Lesson steps">
              {['Understand', 'Try it', 'Check together'].map((label, index) => (
                <button
                  key={label}
                  onClick={() => moveStep(index)}
                  aria-current={step === index ? 'step' : undefined}
                  className={step === index ? 'active' : ''}
                >
                  <span>{index + 1}</span>
                  {label}
                </button>
              ))}
            </nav>
            <p className="classroom-eyebrow">
              {answer.topic}
              {starter ? ' · A 5-minute lesson' : ' · Learn at your own pace'}
            </p>
            {starter && <h3>When rain carries soil away</h3>}
            <div className="classroom-explanation">
              <MarkdownText content={answer.explanation} />
            </div>
            {props.media && (
              <details className="classroom-details">
                <summary>Your scanned or recorded question</summary>
                {props.media}
              </details>
            )}
            {visual && (
              <figure className="classroom-figure">
                {visual.id === 'soil-erosion' &&
                  (imageFailed ? (
                    <p>{visual.caption}</p>
                  ) : (
                    <>
                      <img
                        className="classroom-erosion"
                        src="/lesson-illustrations/classroom-soil-erosion.webp"
                        width={1536}
                        height={480}
                        alt="Rain carries soil down the bare hillside on the left. Grass and roots help hold soil on the right."
                        onError={() => setImageFailed(true)}
                      />
                      <figcaption className="classroom-image-labels">
                        <span>Bare soil washes away</span>
                        <span>Roots help hold soil</span>
                      </figcaption>
                    </>
                  ))}
                {visual.id === 'photosynthesis' && <PhotosynthesisDiagram />}
                {visual.id === 'fractions' && <FractionDiagram />}
              </figure>
            )}
            {(visual || answer.summaryPoints.length > 0) && (
              <p className="classroom-takeaway">
                <Leaf size={23} />
                <span>
                  <strong>Remember: </strong>
                  {starter
                    ? 'Plant roots help keep soil in place.'
                    : visual?.takeaway || answer.summaryPoints[0]}
                </span>
              </p>
            )}
            {!starter && notes.length > 0 && (
              <details className="classroom-details">
                <summary>Key learning notes</summary>
                {notes.map((note, index) => (
                  <div key={index}>
                    <h3>{note.title}</h3>
                    <MarkdownText content={note.content} />
                  </div>
                ))}
              </details>
            )}
            <div ref={practiceRef} className="classroom-practice">
              <h3>Your turn</h3>
              {answer.practice?.isProblem ? (
                <>
                  <MarkdownText content={answer.practice.originalQuestion} />
                  <p>Now it’s your turn to try the question. You can do it!</p>
                  <details>
                    <summary>Review the similar worked example</summary>
                    <MarkdownText content={answer.practice.workedExample} />
                  </details>
                  <button
                    className="classroom-primary"
                    disabled={props.busy}
                    onClick={props.onPractise}
                  >
                    Practise this topic
                  </button>
                </>
              ) : visual ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    checkAnswer();
                  }}
                >
                  <p>
                    {starter
                      ? 'Which hillside will lose more soil during heavy rain?'
                      : visual.question}
                  </p>
                  <div className="classroom-answer-options">
                    {visual.options.map((option, index) => (
                      <label key={option} className={choice === index ? 'selected' : ''}>
                        <input
                          type="radio"
                          name={radioName}
                          value={index}
                          checked={choice === index}
                          onChange={() => {
                            setChoice(index);
                            setChecked(false);
                            setStep(1);
                          }}
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                    <button className="classroom-primary" type="submit" disabled={choice === null}>
                      Check my answer
                    </button>
                  </div>
                  <div role="status" aria-live="polite">
                    {checked && (
                      <p className="classroom-feedback">
                        <strong>
                          {choice === visual.correctIndex
                            ? 'Yes, you’ve got it! '
                            : 'Let’s look together. '}
                        </strong>
                        {visual.feedback}
                      </p>
                    )}
                  </div>
                </form>
              ) : (
                <>
                  <p>Try three short questions about this topic. We’ll check them together.</p>
                  <button
                    className="classroom-primary"
                    onClick={props.onPractise}
                    disabled={props.busy}
                  >
                    Start a quick quiz
                  </button>
                </>
              )}
            </div>
            <footer className="classroom-lesson-footer">
              <button
                onClick={() => {
                  props.onSave();
                  setSaved(true);
                }}
                disabled={saved}
              >
                <CheckCircle size={23} />
                {saved ? 'Saved in My notes' : 'Save in My notes'}
              </button>
              <button onClick={props.onNext} disabled={props.busy}>
                {starter ? 'Next: Protecting our soil' : props.nextTopic ? `Next: ${props.nextTopic}` : 'Continue this lesson'} →
              </button>
            </footer>
            {props.children && (
              <details className="classroom-details">
                <summary>More learning tools</summary>
                {props.children}
              </details>
            )}
          </article>
          <aside className="classroom-tutor" aria-label="Learn with Akili">
            <div className="classroom-tutor-heading">
              <img src={logo} alt="Akili" />
              <div>
                <h2>Learn with Akili</h2>
                <p>Your study companion</p>
              </div>
            </div>
            <p className="classroom-tutor-message">
              {starter
                ? 'Look at the two hillsides. What do you notice about the soil after the rain?'
                : `Let’s work through ${answer.topic.toLowerCase()} together. Tell me which part you’d like help with.`}
            </p>
            <div className="classroom-tutor-actions">
              <button disabled={props.busy} onClick={props.onSimplify}>
                <Lightbulb />
                Explain more simply
              </button>
              <button
                disabled={props.busy || (!!answer.practice?.isProblem && props.examplesUsed >= 3)}
                onClick={props.onExample}
              >
                <BookOpen />
                {answer.practice?.isProblem && props.examplesUsed >= 3
                  ? 'Three examples explored — your turn'
                  : 'Show me an example'}
              </button>
              <button disabled={props.busy && !props.listening} onClick={props.onListen}>
                <Volume2 />
                {props.listening ? 'Stop reading aloud' : 'Read this aloud'}
              </button>
            </div>
            <form
              className="classroom-question"
              onSubmit={(event) => {
                event.preventDefault();
                if (question.trim() && !props.busy) {
                  props.onAsk(question.trim());
                  setQuestion('');
                }
              }}
            >
              <h3>Bring a question from your book</h3>
              <p>Type it, scan it or tell me.</p>
              <textarea
                aria-label="Ask Akili a question"
                placeholder="What would you like help with?"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={3}
              />
              <div className="classroom-input-actions">
                <button type="button" onClick={props.onScan} disabled={props.busy}>
                  <Camera />
                  Scan
                </button>
                <button type="button" onClick={props.onUpload} disabled={props.busy}>
                  <Upload />
                  Upload
                </button>
                <button
                  type="button"
                  onClick={props.onSpeak}
                  disabled={props.busy && !props.recording}
                >
                  <Mic />
                  {props.recording ? 'Stop' : 'Speak'}
                </button>
                <button
                  className="classroom-send"
                  type="submit"
                  aria-label="Send question"
                  disabled={!question.trim() || props.busy}
                >
                  <Send />
                </button>
              </div>
            </form>
            <p className="classroom-encouragement" role="status">
              {props.busy
                ? 'Akili is working on that…'
                : 'We’ll work through it one step at a time.'}
            </p>
            <button className="classroom-video" onClick={props.onVideos}>
              <PlayCircle />
              Explore learning videos ↗
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
