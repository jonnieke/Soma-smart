import React, { useEffect, useRef, useState } from 'react';

type Props = { onClose: () => void; onTranscribe: (audio: Blob) => Promise<string>; onSubmit: (text: string) => void };
const button = 'min-h-12 rounded-xl px-4 py-3 font-semibold focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:opacity-50';

export function VoiceQuestionRecorder({ onClose, onTranscribe, onSubmit }: Props) {
  const [phase, setPhase] = useState<'idle' | 'requesting' | 'recording' | 'recorded' | 'transcribing' | 'review'>('idle');
  const [audio, setAudio] = useState<Blob | null>(null);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const alive = useRef(true);
  const busy = useRef(false);
  const close = useRef<HTMLButtonElement>(null);
  const stop = () => { if (recorder.current?.state === 'recording') recorder.current.stop(); };

  useEffect(() => {
    alive.current = true;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; close.current?.focus();
    return () => {
      alive.current = false;
      if (recorder.current) { recorder.current.onstop = null; recorder.current.ondataavailable = null; recorder.current.onerror = null; }
      stop(); stream.current?.getTracks().forEach(track => track.stop());
      document.body.style.overflow = overflow; previous?.focus();
    };
  }, []);
  useEffect(() => {
    if (!audio) { setUrl(''); return; }
    const next = URL.createObjectURL(audio); setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [audio]);
  useEffect(() => {
    if (phase !== 'recording') return;
    const started = Date.now();
    const timer = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000); setSeconds(elapsed);
      if (elapsed >= 120) stop();
    }, 250);
    return () => window.clearInterval(timer);
  }, [phase]);

  const start = async () => {
    if (busy.current) return;
    busy.current = true; setError(''); setPhase('requesting');
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') throw new Error('Recording is unavailable in this browser. You can type your question below.');
      const next = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current) { next.getTracks().forEach(track => track.stop()); return; }
      stream.current = next;
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      const current = new MediaRecorder(next, mimeType ? { mimeType } : undefined);
      recorder.current = current;
      const chunks: Blob[] = [];
      let failed = false;
      current.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      current.onerror = () => { failed = true; stop(); next.getTracks().forEach(track => track.stop()); if (alive.current) { busy.current = false; setPhase('idle'); setError('Recording was interrupted. Please try again or type your question.'); } };
      current.onstop = () => {
        next.getTracks().forEach(track => track.stop()); busy.current = false;
        if (!alive.current || failed) return;
        const result = new Blob(chunks, { type: current.mimeType || chunks[0]?.type || mimeType });
        if (!result.size) { setPhase('idle'); setError('No audio was captured. Please try again.'); return; }
        setAudio(result); setPhase('recorded');
      };
      current.start(1000); setAudio(null); setText(''); setSeconds(0); setPhase('recording');
    } catch (failure) {
      stream.current?.getTracks().forEach(track => track.stop()); busy.current = false;
      if (!alive.current) return;
      setPhase(audio ? 'recorded' : 'idle');
      setError(typeof failure === 'object' && failure !== null && 'name' in failure && (failure.name === 'NotAllowedError' || failure.name === 'PermissionDeniedError')
        ? 'Microphone access is blocked. Allow the microphone in your browser settings, then try again—or type your question.'
        : failure instanceof Error ? failure.message : 'The microphone could not start. Please try again.');
    }
  };
  const transcribe = async () => {
    if (!audio || busy.current) return;
    busy.current = true; setPhase('transcribing'); setError('');
    try {
      const result = (await onTranscribe(audio)).trim();
      if (!result) throw new Error('Akili could not hear a clear question. Try again or record closer to the microphone.');
      if (alive.current) { setText(result); setPhase('review'); }
    } catch (failure) {
      if (alive.current) { setPhase('recorded'); setError(failure instanceof Error ? failure.message : 'Transcription failed. Your recording is still here—please try again.'); }
    } finally { busy.current = false; }
  };
  const working = phase === 'requesting' || phase === 'recording' || phase === 'transcribing';
  return <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="voice-title" onKeyDown={event => {
    if (event.key === 'Escape') onClose();
    if (event.key === 'Tab') {
      const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), textarea, audio[controls]'));
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <section className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 text-slate-900 shadow-xl">
      <div className="flex items-center justify-between gap-4"><h2 id="voice-title" className="text-xl font-bold">Ask with your voice</h2><button ref={close} className={button} onClick={onClose} aria-label="Close voice recording">Close</button></div>
      <p className="mt-2 text-slate-600">Speak your question. You can check and edit it before asking Akili.</p>
      <p role="status" className="my-5 font-semibold">{phase === 'recording' ? `Listening · ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} / 2:00` : phase === 'requesting' ? 'Waiting for microphone permission…' : phase === 'transcribing' ? 'Turning your recording into text…' : phase === 'review' ? 'Check what Akili heard' : audio ? 'Your recording is ready' : 'Ready when you are'}</p>
      {error && <p role="alert" className="mb-4 rounded-xl bg-amber-50 p-3 text-amber-900">{error}</p>}
      {url && <audio className="mb-4 w-full" controls src={url} aria-label="Your recorded question" />}
      <div className="flex flex-wrap gap-2">
        {phase === 'recording' ? <button className={`${button} bg-red-600 text-white`} onClick={stop}>Stop recording</button> : <button className={`${button} bg-indigo-600 text-white`} disabled={working} onClick={() => void start()}>{audio ? 'Record again' : 'Start recording'}</button>}
        {audio && phase !== 'review' && <button className={`${button} bg-indigo-50 text-indigo-800`} disabled={working} onClick={() => void transcribe()}>{error ? 'Retry transcription' : 'Transcribe recording'}</button>}
      </div>
      <label htmlFor="voice-question" className="mb-2 mt-6 block font-semibold">{phase === 'review' ? 'Your question' : 'Or type your question'}</label>
      <textarea id="voice-question" className="min-h-32 w-full rounded-xl border border-slate-300 p-3 focus:ring-2 focus:ring-indigo-500" value={text} disabled={working} onChange={event => setText(event.target.value)} placeholder="What would you like to learn?" />
      <button className={`${button} mt-3 w-full bg-indigo-600 text-white`} disabled={working || !text.trim()} onClick={() => onSubmit(text.trim())}>Ask Akili</button>
      <p className="mt-3 text-xs text-slate-500">Your recording is sent for transcription only when you choose. Akili answers only after you tap Ask Akili.</p>
    </section>
  </div>;
}
