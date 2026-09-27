import React, { Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import VideoThumbnail from './VideoThumbnail';
import {
  BookOpen,
  Copy,
  ExternalLink,
  MessageCircle,
  Play,
  Send,
  Share2,
  Star,
} from 'lucide-react';
import {
  LearningVideo,
  learningVideoService,
  videoLessonUrl,
} from '../services/learningVideoService';
const Markdown = React.lazy(() => import('./LearnerMarkdown'));
const tabs = ['Notes', 'Key terms', 'Transcript', 'Practice'] as const;
export default function VideoLesson({
  video,
  playRequested = false,
}: {
  video: LearningVideo;
  playRequested?: boolean;
}) {
  const [loaded, setLoaded] = useState(playRequested);
  const [frameReady, setFrameReady] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!loaded || frameReady) return;
    const timer = window.setTimeout(() => setFrameFailed(true), 12000);
    return () => window.clearTimeout(timer);
  }, [loaded, frameReady, retry]);
  useEffect(() => {
    if (playRequested) setLoaded(true);
  }, [playRequested]);
  const [tab, setTab] = useState<(typeof tabs)[number]>('Notes');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<{ average: number | null; count: number } | null>(null);
  const [ratingError, setRatingError] = useState('');
  const [stars, setStars] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const url = videoLessonUrl(video.id);
  const youtube = `https://www.youtube.com/watch?v=${video.id}`;
  useEffect(() => {
    let active = true;
    learningVideoService
      .rating(video.id)
      .then((r) => {
        if (active) setRating(r);
      })
      .catch(() => {
        if (active) setRatingError('Ratings unavailable right now.');
      });
    return () => {
      active = false;
    };
  }, [video.id]);
  const total = video.quiz.reduce((n, q) => n + q.marks, 0);
  const score = video.quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? q.marks : 0), 0);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage('Lesson link copied.');
    } catch {
      setMessage(`Copy this lesson link: ${url}`);
    }
  }
  async function share() {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title: video.title, url });
    } catch (e) {
      if (!(e instanceof Error && e.name === 'AbortError'))
        setMessage('Sharing did not open. Use Copy link instead.');
    }
  }
  async function rate() {
    setRatingBusy(true);
    setRatingError('');
    try {
      await learningVideoService.rate(video.id, stars);
      setMessage('Your rating has been saved. A new rating replaces your previous one.');
      setRating(await learningVideoService.rating(video.id));
    } catch (e) {
      setRatingError(e instanceof Error ? e.message : 'Rating was not saved. Please retry.');
    } finally {
      setRatingBusy(false);
    }
  }
  return (
    <article className="video-lesson">
      <div className="video-player">
        {loaded ? (
          <>
            {!frameFailed && (
              <iframe
                key={retry}
                title={video.title}
                src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&playsinline=1&rel=0&cc_load_policy=1`}
                allow="autoplay; accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={(event) => {
                  // Some embedded browsers leave the frame on its initial blank document.
                  // A cross-origin access error means it has navigated away from about:blank.
                  try {
                    if (
                      !event.currentTarget.contentWindow ||
                      event.currentTarget.contentWindow.location.href === 'about:blank'
                    )
                      return;
                  } catch {
                    /* Expected for the loaded YouTube document. */
                  }
                  setFrameReady(true);
                }}
                onError={() => setFrameFailed(true)}
              />
            )}
            {!frameReady && (
              <div className="video-player-recovery" role="status">
                <VideoThumbnail id={video.id} eager />
                <div>
                  <strong>
                    {frameFailed ? 'The video player could not open here' : 'Opening your video…'}
                  </strong>
                  <p>
                    {frameFailed
                      ? 'This browser may be blocking the embedded player. Your lesson is still available on YouTube.'
                      : 'You can also watch directly on YouTube.'}
                  </p>
                  <a href={youtube} target="_blank" rel="noopener noreferrer">
                    Watch on YouTube ↗
                  </a>
                  {frameFailed && (
                    <button
                      onClick={() => {
                        setFrameFailed(false);
                        setFrameReady(false);
                        setRetry((n) => n + 1);
                      }}
                    >
                      Retry player
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <button type="button" onClick={() => setLoaded(true)} aria-label={`Watch ${video.title}`}>
            <VideoThumbnail key={video.id} id={video.id} eager />
            <span className="video-play-icon">
              <Play size={32} fill="currentColor" />
            </span>
            <strong>{video.title}</strong>
            <span>{video.duration} · Watch the lesson</span>
            <small>Somo Smart · Play video</small>
          </button>
        )}
      </div>
      <div className="video-panel video-lesson-heading">
        <p className="video-playback-help">
          If playback does not start, press play inside the player or{' '}
          <a href={youtube} target="_blank" rel="noopener noreferrer">
            watch this video on YouTube ↗
          </a>
          .
        </p>
        <div className="video-eyebrow">
          {video.subject} / {video.level}
        </div>
        <h2>{video.title}</h2>
        <p>{video.description}</p>
        <div className="video-share" aria-label="Share this video lesson">
          <span>Learn together</span>
          <a
            aria-label="Share on WhatsApp"
            href={`https://wa.me/?text=${encodeURIComponent(`${video.title}\n${url}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={18} /> WhatsApp
          </a>
          <a
            aria-label="Share on Telegram"
            href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(video.title)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Send size={18} /> Telegram
          </a>
          <button onClick={() => void copy()}>
            <Copy size={17} /> Copy link
          </button>
          <button onClick={() => void share()}>
            <Share2 size={17} /> More
          </button>
        </div>
        <a className="video-source-link" href={youtube} target="_blank" rel="noopener noreferrer">
          Open on YouTube <ExternalLink size={14} />
        </a>
      </div>
      <section className="video-panel video-study">
        <div className="video-tabs" aria-label="Lesson resources">
          {tabs.map((t) => (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}>
              {t}
              {t === 'Practice' ? ` (${video.quiz.length})` : ''}
            </button>
          ))}
        </div>
        <div className="video-study-body">
          {tab === 'Notes' && (
            <>
              <p className="video-eyebrow">Understand it. Explain it. Remember it.</p>
              <h3>Your study notes</h3>
              {video.notes ? (
                <Suspense fallback={<p>Loading notes…</p>}>
                  <Markdown content={video.notes} />
                </Suspense>
              ) : (
                <p>Study notes have not been published yet.</p>
              )}
            </>
          )}
          {tab === 'Key terms' && (
            <>
              <h3>Words that unlock the topic</h3>
              <p>Learn the meaning, then use each word in your own sentence.</p>
              <dl className="video-terms">
                {video.terms.map((t, i) => (
                  <div key={i}>
                    <dt>{t.term}</dt>
                    <dd>
                      {t.definition}
                      <small>Example: {t.example}</small>
                    </dd>
                  </div>
                ))}
              </dl>
              {!video.terms.length && <p>Key terms are awaiting review.</p>}
            </>
          )}
          {tab === 'Transcript' && (
            <>
              <h3>Read along</h3>
              {video.transcript ? (
                <p className="video-transcript">{video.transcript}</p>
              ) : (
                <div className="video-notice">
                  <BookOpen />
                  <h4>Transcript not published yet</h4>
                  <p>
                    Use the player’s CC control if captions are available. These study notes are
                    supplementary teaching material—not a verbatim transcript.
                  </p>
                  <a href={youtube} target="_blank" rel="noopener noreferrer">
                    Check captions on YouTube <ExternalLink size={14} />
                  </a>
                </div>
              )}
            </>
          )}
          {tab === 'Practice' && (
            <>
              <h3>Put your understanding to work</h3>
              <p>
                Original practice questions, not official exam predictions. Choose your answers,
                then check the explanations.
              </p>
              {!video.quiz.length && <p>Practice questions are awaiting review.</p>}
              {video.quiz.map((q, i) => (
                <fieldset className="video-question" key={i} disabled={checked}>
                  <legend>
                    {i + 1}. {q.question}{' '}
                    <small>
                      ({q.marks} {q.marks === 1 ? 'mark' : 'marks'})
                    </small>
                  </legend>
                  {q.options.map((o, j) => (
                    <label key={j}>
                      <input
                        type="radio"
                        name={`question-${i}`}
                        checked={answers[i] === j}
                        onChange={() => setAnswers((a) => ({ ...a, [i]: j }))}
                      />
                      {o}
                    </label>
                  ))}
                  {checked && (
                    <p className={answers[i] === q.answer ? 'video-correct' : 'video-correction'}>
                      {answers[i] === q.answer
                        ? 'Correct. '
                        : `Correct answer: ${q.options[q.answer]}. `}
                      {q.explanation}
                    </p>
                  )}
                </fieldset>
              ))}
              {!!video.quiz.length && (
                <div className="video-actions">
                  {checked ? (
                    <>
                      <strong role="status">
                        Your score: {score}/{total} marks
                      </strong>
                      <button
                        onClick={() => {
                          setChecked(false);
                          setAnswers({});
                        }}
                      >
                        Try again
                      </button>
                    </>
                  ) : (
                    <button
                      className="video-primary"
                      disabled={Object.keys(answers).length !== video.quiz.length}
                      onClick={() => setChecked(true)}
                    >
                      Check my answers
                    </button>
                  )}
                </div>
              )}
            </>
          )}
          <details className="video-provenance">
            <summary>About this learning material</summary>
            <p>
              {video.source_note || 'Prepared by Soma. Please report anything unclear to support.'}
            </p>
          </details>
        </div>
      </section>
      <section className="video-panel video-rating">
        <div>
          <h3>Was this video helpful?</h3>
          <p>
            {rating
              ? rating.count
                ? `${rating.average}/5 · ${rating.count} ratings`
                : 'No ratings yet. Be the first to help other learners.'
              : ratingError
                ? 'Ratings unavailable.'
                : 'Loading ratings…'}
          </p>
        </div>
        <div>
          <div className="video-stars" aria-label="Choose a rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                aria-label={`Rate ${n} out of 5`}
                aria-pressed={stars === n}
                disabled={ratingBusy}
                onClick={() => setStars(n)}
              >
                <Star size={25} fill={n <= stars ? 'currentColor' : 'none'} />
              </button>
            ))}
          </div>
          <button disabled={!stars || ratingBusy} onClick={() => void rate()}>
            {ratingBusy ? 'Saving…' : 'Submit rating'}
          </button>
        </div>
        {ratingError && (
          <p role="alert">
            {ratingError} <Link to="/learner">Go to sign in</Link>
          </p>
        )}
        <small>
          One rating per signed-in email account. SOMA-code-only sessions can watch and practise
          without an email login.
        </small>
      </section>
      <p role="status" className="video-status">
        {message}
      </p>
    </article>
  );
}
