import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, BookOpen, CheckCircle2, Play, Search } from 'lucide-react';
import logo from '../assets/images/main_logo.png';
import { LearningVideo, learningVideoService } from '../services/learningVideoService';
import VideoLesson from '../components/VideoLesson';
import VideoThumbnail from '../components/VideoThumbnail';
import { VIDEO_CATEGORIES } from '../data/videoCategories';
import '../styles/learning-videos.css';
const Editor = React.lazy(() => import('../components/VideoHubEditor'));
export const LEARNING_VIDEO_URL = 'https://www.youtube.com/watch?v=4oXDoJkprx0&list=PLIjFyZ2La_D0';

export default function LearningVideosPage() {
  const [params, setParams] = useSearchParams();
  const [videos, setVideos] = useState<LearningVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [admin, setAdmin] = useState(false);
  const [manage, setManage] = useState(params.has('generation'));
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('All subjects');
  const [level, setLevel] = useState('All levels');
  const [playVideo, setPlayVideo] = useState('');
  const playerSection = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (playVideo) playerSection.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  }, [playVideo]);
  useEffect(() => {
    let active = true;
    learningVideoService
      .isAdmin()
      .then((v) => {
        if (active) setAdmin(v);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    learningVideoService
      .list(admin && manage)
      .then((v) => {
        if (active) setVideos(v);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, admin, manage]);
  const published = videos.filter((v) => v.published);
  const category = VIDEO_CATEGORIES.find((c) => c.id === params.get('category'));
  const inCategory = published.filter((v) => !category || v.category === category.id);
  const selected =
    published.find((v) => v.id === params.get('video')) ||
    (!params.has('video') ? inCategory[0] : undefined);
  const filtered = inCategory.filter(
    (v) =>
      (subject === 'All subjects' || subject === v.subject) &&
      (level === 'All levels' || level === v.level) &&
      `${v.title} ${v.description} ${v.subject}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="video-hub">
      <Helmet>
        <title>{selected ? `${selected.title} | ` : ''}Learning videos | Soma AI</title>
        <meta
          name="description"
          content="Watch, understand and practise with Soma learning videos, study notes, key terms and revision quizzes."
        />
      </Helmet>
      <header className="video-header">
        <Link to="/" className="video-brand">
          <img src={logo} width="42" height="42" alt="" />
          Soma AI
        </Link>
        <nav aria-label="Video hub navigation">
          <Link to="/learner">My classroom</Link>
          <Link to="/exam-papers">Past papers</Link>
          <Link to="/">
            <ArrowLeft size={16} /> Homepage
          </Link>
          {admin && (
            <button onClick={() => setManage((m) => !m)}>
              {manage ? 'View library' : 'Manage videos'}
            </button>
          )}
        </nav>
      </header>
      <main className="video-main">
        <div className="video-intro">
          <div>
            <p className="video-eyebrow">
              <Play size={15} /> SOMA LEARNING HUB
            </p>
            <h1>
              A little watching.
              <br />
              <em>A lot of understanding.</em>
            </h1>
            <p>Watch a lesson. Unpack the words. Put what you learn into practice.</p>
          </div>
          <div className="video-journey">
            <span>
              <Play size={18} />
              Watch
            </span>
            <span>
              <BookOpen size={18} />
              Understand
            </span>
            <span>
              <CheckCircle2 size={18} />
              Practise
            </span>
          </div>
        </div>
        <nav className="video-categories" aria-label="Video categories">
          <button
            aria-pressed={!category}
            onClick={() => {
              setParams({});
              setPlayVideo('');
              setSearch('');
              setSubject('All subjects');
              setLevel('All levels');
            }}
          >
            All videos
          </button>
          {VIDEO_CATEGORIES.map((c) => (
            <button
              key={c.id}
              aria-label={c.label}
              aria-pressed={category?.id === c.id}
              onClick={() => {
                setParams({ category: c.id });
                setPlayVideo('');
                setSearch('');
                setSubject('All subjects');
                setLevel('All levels');
              }}
            >
              <strong>{c.label}</strong>
              <small>{c.description}</small>
            </button>
          ))}
        </nav>
        {category && (
          <p className="video-collection-source">
            {category.label} collection ·{' '}
            <a
              href={`https://www.youtube.com/playlist?list=${category.playlist}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View full playlist on YouTube ↗
            </a>
          </p>
        )}
        {admin && manage && (
          <Suspense fallback={<p>Loading publishing desk…</p>}>
            <Editor
              videos={videos}
              generationId={params.get('generation')}
              onSaved={() => setAttempt((a) => a + 1)}
            />
          </Suspense>
        )}
        {loading ? (
          <p role="status">Loading your video library…</p>
        ) : error ? (
          <div role="alert" className="video-panel">
            <p>{error}</p>
            <button onClick={() => setAttempt((a) => a + 1)}>Retry library</button>
          </div>
        ) : (
          <div className="video-layout">
            <aside className="video-library video-panel">
              <div className="video-library-heading">
                <h2>Find your next lesson</h2>
                <span>{inCategory.length} videos</span>
              </div>
              <label className="video-search">
                <Search size={18} />
                <input
                  aria-label="Search videos"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search a topic…"
                />
              </label>
              <div className="video-filters">
                <select
                  aria-label="Filter by subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {['All subjects', ...new Set(inCategory.map((v) => v.subject))].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <select
                  aria-label="Filter by level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  {['All levels', ...new Set(inCategory.map((v) => v.level))].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="video-list">
                {filtered.map((v) => (
                  <button
                    className={`video-card ${selected?.id === v.id ? 'is-active' : ''}`}
                    key={v.id}
                    aria-pressed={selected?.id === v.id}
                    onClick={() => {
                      setPlayVideo(v.id);
                      setParams(
                        category ? { video: v.id, category: category.id } : { video: v.id }
                      );
                      playerSection.current?.scrollIntoView?.({
                        block: 'start',
                        behavior: 'smooth',
                      });
                    }}
                  >
                    <div className={`video-card-art subject-${v.subject.toLowerCase()}`}>
                      <VideoThumbnail key={v.id} id={v.id} />
                      <Play size={19} />
                      <small>{v.duration}</small>
                    </div>
                    <div>
                      <small>{v.level}</small>
                      <h3>{v.title}</h3>
                      <p>
                        {v.terms.length} key terms · {v.quiz.length} practice questions
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              {!filtered.length && (
                <div className="video-notice">
                  <p>
                    {published.length
                      ? 'No lessons match these filters.'
                      : 'The first lessons are being prepared.'}
                  </p>
                  {!!published.length && (
                    <button
                      onClick={() => {
                        setSearch('');
                        setSubject('All subjects');
                        setLevel('All levels');
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              )}
              <Link className="video-classroom-link" to="/learner">
                Bring a question to Akili →
              </Link>
            </aside>
            {selected ? (
              <div ref={playerSection} className="video-player-section">
                <VideoLesson
                  key={selected.id}
                  video={selected}
                  playRequested={playVideo === selected.id}
                />
              </div>
            ) : (
              <section className="video-panel">
                <h2>{params.has('video') ? 'This lesson is not available' : 'Choose a lesson'}</h2>
                <p>Choose a published lesson from the library to start learning.</p>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
