import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ExternalLink, Play } from 'lucide-react';
import logo from '../assets/images/main_logo.png';

export const LEARNING_VIDEO_URL = 'https://www.youtube.com/watch?v=4oXDoJkprx0&list=PLIjFyZ2La_D0';
export default function LearningVideosPage() {
  const [loaded, setLoaded] = React.useState(false);
  return (
    <div className="min-h-screen bg-[#faf8f3] text-[#0b1740]">
      <Helmet>
        <title>Learning videos | Soma AI</title>
        <meta
          name="description"
          content="Watch learning videos with Soma AI. Pause, revisit and learn at your own pace."
        />
      </Helmet>
      <header className="border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 text-2xl font-bold">
          <img src={logo} alt="" width="44" height="44" />
          Soma AI
        </Link>
        <Link to="/" className="flex items-center gap-2 py-3">
          <ArrowLeft size={18} /> Homepage
        </Link>
      </header>
      <section className="max-w-6xl mx-auto px-5 py-10 sm:py-16">
        <p className="text-green-800 mb-3">Watch. Pause. Understand.</p>
        <h1 className="font-serif text-4xl sm:text-6xl mb-5">Learning videos</h1>
        <p className="text-slate-600 text-lg mb-8">
          Learn at your own pace. Use the player’s playlist menu to explore more videos.
        </p>
        <div className="aspect-video overflow-hidden rounded-2xl bg-[#0b1740] flex items-center justify-center">
          {loaded ? (
            <iframe
              title="Soma learning video playlist"
              src="https://www.youtube-nocookie.com/embed/4oXDoJkprx0?list=PLIjFyZ2La_D0&rel=0"
              className="w-full h-full border-0"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <button
              onClick={() => setLoaded(true)}
              className="text-white flex flex-col items-center gap-4 rounded-xl p-8 focus-visible:ring-4 focus-visible:ring-indigo-300"
            >
              <Play size={48} />
              <span className="text-xl">Load learning videos</span>
              <span className="text-sm text-slate-300">
                Connects to YouTube only when you choose
              </span>
            </button>
          )}
        </div>
        <div className="mt-6 flex flex-wrap gap-5 justify-between items-center">
          <p className="text-sm text-slate-600">
            If a video or playlist is unavailable here, open it on YouTube.
          </p>
          <a
            href={LEARNING_VIDEO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex gap-2 items-center border border-indigo-900 rounded-xl px-5 py-3"
          >
            Open on YouTube <ExternalLink size={16} />
          </a>
        </div>
        <Link to="/learner" className="inline-block text-indigo-800 mt-10 underline py-3">
          Continue learning with Akili →
        </Link>
      </section>
    </div>
  );
}
