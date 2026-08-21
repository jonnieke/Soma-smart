import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  FastForward,
  Download,
  CheckCircle2,
  X,
  Sparkles,
} from 'lucide-react';
import { StudyNote } from '../types';
import { speak, stopSpeech } from '../services/elevenLabsService';

interface NotebookAudioPlayerProps {
  note: StudyNote | null;
  onClose: () => void;
  onMasteryChange?: (mastery: 'understood' | 'revise_again') => void;
}

export const NotebookAudioPlayer: React.FC<NotebookAudioPlayerProps> = ({
  note,
  onClose,
  onMasteryChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'SW'>('EN');
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);

  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!note) {
      stopSpeech();
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    // Check offline cache status
    const cachedNotes = localStorage.getItem('soma_offline_audio_notes') || '{}';
    try {
      const parsed = JSON.parse(cachedNotes);
      setIsOfflineCached(Boolean(parsed[note.id]));
    } catch {
      setIsOfflineCached(false);
    }

    // Auto-start playback on note selection
    void handleStartSpeech();

    return () => {
      stopSpeech();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [note, language]);

  const handleStartSpeech = async () => {
    if (!note) return;
    stopSpeech();
    setIsPlaying(true);
    setProgress(0);

    // Approximate duration progress simulation
    const estimatedDuration = Math.max(5, Math.ceil(note.content.length / 15));
    let elapsed = 0;
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = window.setInterval(() => {
      elapsed += 1;
      const pct = Math.min(100, Math.round((elapsed / estimatedDuration) * 100));
      setProgress(pct);
      if (pct >= 100 && progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }, 1000 / playbackSpeed);

    try {
      await speak(note.content, language);
    } catch (err) {
      console.warn('Audio playback finished or interrupted:', err);
    } finally {
      setIsPlaying(false);
      setProgress(100);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    } else {
      void handleStartSpeech();
    }
  };

  const handleStop = () => {
    stopSpeech();
    setIsPlaying(false);
    setProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleCacheOffline = () => {
    if (!note) return;
    try {
      const cached = JSON.parse(localStorage.getItem('soma_offline_audio_notes') || '{}');
      cached[note.id] = {
        title: note.title,
        content: note.content,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem('soma_offline_audio_notes', JSON.stringify(cached));
      setIsOfflineCached(true);
    } catch {
      // Ignore cache storage error
    }
  };

  const cycleSpeed = () => {
    const speeds = [0.8, 1.0, 1.25, 1.5];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    setPlaybackSpeed(speeds[nextIdx]);
  };

  if (!note) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-indigo-200 bg-slate-950 text-white shadow-2xl backdrop-blur-lg">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Note Info */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-md">
            <Volume2 className="h-5 w-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-indigo-300 border border-indigo-400/30">
                {note.subject || 'General'}
              </span>
              {isOfflineCached && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Offline Ready
                </span>
              )}
            </div>
            <h4 className="truncate text-sm font-black text-white mt-0.5">{note.title}</h4>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Language voice switcher */}
          <div className="flex rounded-lg border border-slate-700 bg-slate-900 p-0.5">
            <button
              type="button"
              onClick={() => setLanguage('EN')}
              className={`rounded px-2 py-1 text-xs font-black transition ${language === 'EN' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              EN (Alice)
            </button>
            <button
              type="button"
              onClick={() => setLanguage('SW')}
              className={`rounded px-2 py-1 text-xs font-black transition ${language === 'SW' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              SW (Brian)
            </button>
          </div>

          {/* Speed switcher */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-black text-slate-300 hover:bg-slate-800 transition"
            title="Cycle playback speed"
          >
            {playbackSpeed}x
          </button>

          {/* Play / Pause button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500 transition active:scale-95"
            aria-label={isPlaying ? 'Pause narration' : 'Play narration'}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>

          {/* Stop button */}
          <button
            type="button"
            onClick={handleStop}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Stop playback"
          >
            <Square className="h-4 w-4" />
          </button>

          {/* Offline Save button */}
          {!isOfflineCached && (
            <button
              type="button"
              onClick={handleCacheOffline}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-600/40 bg-emerald-950/40 px-2.5 py-1 text-xs font-black text-emerald-400 hover:bg-emerald-900/60 transition"
              title="Download for offline listening"
            >
              <Download className="h-3.5 w-3.5" /> Offline
            </button>
          )}

          {/* Close player */}
          <button
            type="button"
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            aria-label="Close audio player"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div className="h-1 w-full bg-slate-800">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default NotebookAudioPlayer;
