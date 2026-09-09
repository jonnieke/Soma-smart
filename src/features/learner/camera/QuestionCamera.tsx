import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Crop as CropIcon, ImagePlus, RotateCw, X } from 'lucide-react';
import { cameraErrorMessage, canvasBlob, FULL_CROP, prepareQuestionPhoto, requestQuestionCamera, type Crop } from './cameraCapture';

type CameraCapabilities = MediaTrackCapabilities & { zoom?: { min: number; max: number; step?: number }; torch?: boolean; focusMode?: string[] };
type CameraSettings = MediaTrackSettings & { zoom?: number; torch?: boolean };
type Props = { onClose: () => void; onUsePhoto: (file: File) => void; onAudio: () => void };
const button = 'min-h-12 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 disabled:cursor-not-allowed disabled:opacity-50';

export function QuestionCamera({ onClose, onUsePhoto, onAudio }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const nativeRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  const operation = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [capabilities, setCapabilities] = useState<CameraCapabilities>({});
  const [zoom, setZoom] = useState(1);
  const [torch, setTorch] = useState(false);
  const [controlBusy, setControlBusy] = useState(false);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState('');
  const [turns, setTurns] = useState(0);
  const [crop, setCrop] = useState<Crop>(FULL_CROP);
  const [cropping, setCropping] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    mounted.current = true;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { mounted.current = false; stop(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [stop]);

  useEffect(() => {
    const inputs = [galleryRef.current, nativeRef.current];
    const resume = () => setPaused(false);
    inputs.forEach(input => input?.addEventListener('cancel', resume));
    return () => inputs.forEach(input => input?.removeEventListener('cancel', resume));
  }, []);

  useEffect(() => {
    if (photo || paused) return;
    let cancelled = false;
    setReady(false); setError(''); setCapabilities({}); setTorch(false);
    const timeout = window.setTimeout(() => {
      if (!cancelled && (!videoRef.current || videoRef.current.readyState < 2)) {
        cancelled = true; stop(); setError('The camera is taking too long to start. Try again, or use your phone camera below.');
      }
    }, 15000);
    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('Camera access is unavailable here. Open Akili over HTTPS, or choose a photo below.');
        const stream = await requestQuestionCamera(navigator.mediaDevices);
        if (cancelled) { stream.getTracks().forEach(track => track.stop()); return; }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        const caps = (track.getCapabilities?.() || {}) as CameraCapabilities;
        setCapabilities(caps);
        setZoom((track.getSettings() as CameraSettings).zoom || caps.zoom?.min || 1);
        if (caps.focusMode?.includes('continuous')) {
          try { await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] }); } catch { /* Optional: keep the browser's autofocus. */ }
        }
        if (cancelled) { stream.getTracks().forEach(item => item.stop()); return; }
        track.onended = () => { if (!cancelled) { setReady(false); setError('Camera access ended. Tap Try again to reconnect.'); } };
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
      } catch (failure) {
        if (!cancelled) { stop(); setError(cameraErrorMessage(failure)); }
      }
    })();
    return () => { cancelled = true; window.clearTimeout(timeout); stop(); };
  }, [attempt, photo, paused, stop]);

  useEffect(() => {
    if (!photo) { setPreview(''); return; }
    let cancelled = false;
    let url = '';
    setPreview(''); setError('');
    void prepareQuestionPhoto(photo, turns).then(blob => {
      if (cancelled) return;
      url = URL.createObjectURL(blob); setPreview(url);
    }).catch(failure => { if (!cancelled) setError(cameraErrorMessage(failure)); });
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [photo, turns]);

  const acceptPhoto = (blob: Blob) => {
    stop(); setReady(false); setTurns(0); setCrop(FULL_CROP); setCropping(false); setPhoto(blob); setError('');
  };
  const capture = async () => {
    const video = videoRef.current;
    if (!video || !ready || operation.current || !video.videoWidth || video.readyState < 2) return;
    operation.current = true; setBusy(true); setError('');
    try {
      // Save the entire high-resolution frame. object-contain shows this exact frame.
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Photo capture is unavailable. Choose a photo instead.');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await canvasBlob(canvas, 0.98);
      if (mounted.current) acceptPhoto(blob);
    } catch (failure) { if (mounted.current) setError(cameraErrorMessage(failure)); }
    finally { operation.current = false; if (mounted.current) setBusy(false); }
  };
  const usePhoto = async () => {
    if (!photo || !preview || operation.current) return;
    operation.current = true; setBusy(true); setError('');
    try {
      const blob = await prepareQuestionPhoto(photo, turns, crop);
      if (mounted.current) onUsePhoto(new File([blob], 'akili-question.jpg', { type: 'image/jpeg' }));
    } catch (failure) { if (mounted.current) setError(cameraErrorMessage(failure)); }
    finally { operation.current = false; if (mounted.current) setBusy(false); }
  };
  const changeControl = async (value: { zoom?: number; torch?: boolean }) => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || controlBusy) return;
    setControlBusy(true);
    try {
      await track.applyConstraints({ advanced: [value as MediaTrackConstraintSet] });
      const settings = track.getSettings() as CameraSettings;
      if (mounted.current) { setZoom(settings.zoom ?? zoom); setTorch(settings.torch ?? false); }
    } catch { if (mounted.current) setError('This camera could not apply that setting. You can still capture a photo.'); }
    finally { if (mounted.current) setControlBusy(false); }
  };
  const restart = () => { setPhoto(null); setPreview(''); setPaused(false); setAttempt(value => value + 1); setError(''); };
  const pick = (native: boolean) => { stop(); setReady(false); setPaused(true); (native ? nativeRef : galleryRef).current?.click(); };
  const importPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) { setPaused(false); return; }
    if (!file.type.startsWith('image/') || file.size > 25 * 1024 * 1024) { setError('Choose an image smaller than 25 MB.'); return; }
    acceptPhoto(file);
  };

  return <div role="dialog" aria-modal="true" aria-labelledby="camera-title" className="fixed inset-0 z-[10000] flex flex-col bg-black text-white" onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key === 'Tab') {
      const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([type="hidden"]), summary')).filter(element => element.getClientRects().length > 0);
      const first = elements[0]; const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))]">
      <div><h1 id="camera-title" className="text-xl font-bold">{photo ? 'Check your photo' : 'Scan with Akili'}</h1><p className="mt-1 text-sm text-white/75">{photo ? 'Can you read every word? Crop out other questions if needed.' : 'Keep the question well lit and hold your phone steady.'}</p></div>
      <button ref={closeRef} type="button" onClick={onClose} aria-label="Close camera" className={`${button} shrink-0 bg-white/10`}><X className="h-5 w-5" /></button>
    </header>
    <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
      {error && <p role="alert" className="mx-auto mb-3 max-w-2xl rounded-xl bg-amber-100 p-4 text-sm text-amber-950">{error}</p>}
      {photo ? <div className="mx-auto max-w-2xl text-center">
        {preview ? <div className="relative mx-auto inline-block max-w-full overflow-hidden align-top leading-none">
          <img src={preview} alt="Question photo to review before sending" className="block max-h-[48dvh] max-w-full object-contain" onLoad={event => setDimensions({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })} />
          <div aria-hidden="true" className="pointer-events-none absolute border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.6)]" style={{ left: `${crop.left}%`, top: `${crop.top}%`, width: `${crop.right - crop.left}%`, height: `${crop.bottom - crop.top}%` }} />
        </div> : !error && <p role="status" className="py-12">Preparing photo…</p>}
        {preview && Math.min(dimensions.width * (crop.right - crop.left) / 100, dimensions.height * (crop.bottom - crop.top) / 100) < 600 && <p className="mt-3 text-sm text-amber-200">Small text may be hard to read. Consider a closer, sharper photo.</p>}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button type="button" disabled={busy || !preview} onClick={() => { setTurns(value => (value + 1) % 4); setCrop(FULL_CROP); }} className={`${button} inline-flex items-center gap-2 bg-white/10`}><RotateCw className="h-4 w-4" />Rotate</button>
          <button type="button" disabled={busy || !preview} aria-expanded={cropping} onClick={() => setCropping(value => !value)} className={`${button} inline-flex items-center gap-2 bg-white/10`}><CropIcon className="h-4 w-4" />Crop</button>
          <button type="button" disabled={busy} onClick={() => { setTurns(0); setCrop(FULL_CROP); }} className={`${button} text-white/80`}>Reset edits</button>
        </div>
        {cropping && <fieldset disabled={busy} className="mt-3 rounded-xl bg-white/10 p-4 text-left"><legend className="px-2 text-sm">Adjust the four edges</legend><div className="grid gap-4 sm:grid-cols-2">
          {(['left', 'top', 'right', 'bottom'] as const).map(edge => <label key={edge} className="flex flex-col gap-2 text-sm capitalize">{edge} edge<input type="range" aria-label={`${edge} crop edge`} min={edge === 'right' ? crop.left + 10 : edge === 'bottom' ? crop.top + 10 : 0} max={edge === 'left' ? crop.right - 10 : edge === 'top' ? crop.bottom - 10 : 100} value={crop[edge]} onChange={event => setCrop(current => ({ ...current, [edge]: Number(event.target.value) }))} className="min-h-8 w-full accent-indigo-400" /></label>)}
        </div></fieldset>}
      </div> : <div className="mx-auto max-w-3xl">
        <video ref={videoRef} autoPlay playsInline muted onLoadedData={() => setReady(true)} onPlaying={() => setReady(true)} className="mx-auto h-[48dvh] w-full object-contain" />
        {!ready && !error && !paused && <p role="status" className="py-3 text-center text-sm">Starting camera…</p>}
        {(error || paused) && !ready && <button type="button" onClick={restart} className={`${button} mx-auto block bg-white/15`}>Try camera again</button>}
        {ready && <div className="mx-auto mt-3 flex max-w-lg flex-wrap items-center justify-center gap-4">
          {capabilities.zoom && capabilities.zoom.max > capabilities.zoom.min && <label className="flex min-w-40 flex-1 flex-col gap-2 text-sm">Zoom {zoom.toFixed(1)}×<input type="range" aria-label="Camera zoom" min={capabilities.zoom.min} max={capabilities.zoom.max} step={capabilities.zoom.step || 0.1} value={zoom} disabled={controlBusy || busy} onChange={event => void changeControl({ zoom: Number(event.target.value) })} className="min-h-8 accent-indigo-400" /></label>}
          {capabilities.torch && <button type="button" aria-pressed={torch} disabled={controlBusy || busy} onClick={() => void changeControl({ torch: !torch })} className={`${button} bg-white/15`}>Light {torch ? 'on' : 'off'}</button>}
        </div>}
      </div>}
    </div>
    <footer className="border-t border-white/20 bg-black px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-3">
        {photo ? <><button type="button" disabled={busy} onClick={restart} className={`${button} bg-white/15`}>Retake</button><button type="button" disabled={busy || !preview} onClick={() => void usePhoto()} className={`${button} bg-white text-indigo-900`}>{busy ? 'Preparing…' : 'Use photo'}</button></> : <>
          <button type="button" disabled={busy} onClick={() => pick(false)} className={`${button} inline-flex items-center gap-2 bg-white/10`}><ImagePlus className="h-5 w-5" />Gallery</button>
          <button type="button" disabled={!ready || busy || controlBusy} onClick={() => void capture()} className={`${button} inline-flex items-center gap-2 bg-white text-indigo-900`}><Camera className="h-5 w-5" />{busy ? 'Capturing…' : 'Capture'}</button>
          <button type="button" onClick={onAudio} className={`${button} text-white/80`}>Use audio</button>
        </>}
      </div>
      {!photo && <button type="button" disabled={busy} onClick={() => pick(true)} className={`${button} mx-auto mt-1 block text-white/80 underline`}>Use phone camera instead</button>}
      <input ref={galleryRef} type="file" accept="image/*" aria-label="Choose question photo" className="hidden" onChange={importPhoto} />
      <input ref={nativeRef} type="file" accept="image/*" capture="environment" aria-label="Take photo with phone camera" className="hidden" onChange={importPhoto} />
    </footer>
  </div>;
}
