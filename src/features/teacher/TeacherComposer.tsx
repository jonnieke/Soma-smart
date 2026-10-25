import React from 'react';
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Mic,
  Sparkles,
  Store,
  Upload,
  X,
} from 'lucide-react';
import type { TeacherComposerDraft, TeacherComposerIntent } from '../../types/teacherComposer';
import { saveTeacherComposerDraft } from '../../types/teacherComposerHandoff';

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: {
    resultIndex: number;
    results: Array<{ 0: { transcript: string } }>;
  }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

export const teacherIntents: Array<{ id: TeacherComposerIntent; label: string; hint: string }> = [
  { id: 'CREATE', label: 'Create material', hint: 'Notes, lesson plans and schemes' },
  { id: 'MARK', label: 'Mark learner work', hint: 'Feedback and corrections' },
  { id: 'ASSESS', label: 'Build an assessment', hint: 'Questions and marking guides' },
  { id: 'MARKETPLACE', label: 'Prepare to sell', hint: 'Private draft before review' },
];

export type TeacherComposerProps = {
  isRegistered: boolean;
  onPreview: (draft: TeacherComposerDraft) => Promise<string>;
  onSignUp: (draft: TeacherComposerDraft) => void;
  onSubmit: (draft: TeacherComposerDraft) => void;
  onTrack: (eventName: string, params?: Record<string, unknown>) => void;
};

export const TeacherComposer: React.FC<TeacherComposerProps> = ({
  isRegistered,
  onPreview,
  onSignUp,
  onSubmit,
  onTrack,
}) => {
  const [prompt, setPrompt] = React.useState('');
  const [intent, setIntent] = React.useState<TeacherComposerIntent>('CREATE');
  const [file, setFile] = React.useState<File | undefined>();
  const [source, setSource] = React.useState<TeacherComposerDraft['source']>('TEXT');
  const [isListening, setIsListening] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [preview, setPreview] = React.useState('');
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const previewDialogRef = React.useRef<HTMLDivElement | null>(null);
  const uploadRef = React.useRef<HTMLInputElement | null>(null);
  const scanRef = React.useRef<HTMLInputElement | null>(null);
  const recognitionRef = React.useRef<SpeechRecognitionLike | null>(null);
  const trackedOpenRef = React.useRef(false);
  const [isOnline, setIsOnline] = React.useState(() => navigator.onLine);

  React.useEffect(() => {
    if (trackedOpenRef.current) return;
    trackedOpenRef.current = true;
    onTrack('teacher_composer_viewed', { source: 'teacher_composer' });
  }, [onTrack]);

  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setMessage((current) => current.startsWith('You are offline') ? '' : current);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setMessage('You are offline. Your input is kept safely.');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  React.useEffect(() => {
    if (previewOpen) {
      previewDialogRef.current?.focus();
    }
  }, [previewOpen]);

  const chooseFile = (nextFile?: File, nextSource: 'UPLOAD' | 'SCAN' = 'UPLOAD') => {
    if (!nextFile) return;
    const isImage = nextFile.type.startsWith('image/');
    const isDoc = /\.(pdf|docx?|pptx?|txt)$/i.test(nextFile.name);
    if (!isImage && !isDoc) {
      setMessage('This file type is not supported yet. Try a photo, PDF, or Word document.');
      onTrack('teacher_composer_error', { stage: 'file', reason: 'unsupported_type' });
      return;
    }
    setFile(nextFile);
    setSource(nextSource);
    setMessage(`Attached: ${nextFile.name}`);
    onTrack('teacher_composer_attached', { source: nextSource, file_type: nextFile.type || 'unknown' });
  };

  const startVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMessage('Voice input is not supported on this browser. You can type or upload instead.');
      onTrack('teacher_composer_error', { stage: 'voice', reason: 'unsupported_browser' });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-KE';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((r) => r[0].transcript)
          .join(' ');
        setPrompt((current) => current ? `${current} ${transcript}`.trim() : transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setMessage('Voice recognition had a problem. Please try speaking again or type your request.');
        onTrack('teacher_composer_error', { stage: 'voice', reason: 'recognition_error' });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      setSource('VOICE');
      setMessage('Listening for your lesson notes or marking instructions...');
      onTrack('teacher_composer_voice_started', { intent });
    } catch {
      setIsListening(false);
      setMessage('Could not start microphone. Check permissions or type below.');
      onTrack('teacher_composer_error', { stage: 'voice', reason: 'start_failed' });
    }
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const draft = (): TeacherComposerDraft => ({
    prompt: prompt.trim(),
    intent,
    file,
    source,
  });

  const generatePreview = async () => {
    const request = draft();
    if (!request.prompt && !request.file) {
      setMessage('Please enter a topic or upload your material first.');
      return;
    }
    if (!isOnline) {
      setMessage('You are offline. Reconnect to generate preview notes.');
      return;
    }

    setIsGenerating(true);
    setMessage('');
    try {
      const result = await onPreview(request);
      setPreview(result);
      setPreviewOpen(true);
      await saveTeacherComposerDraft({ ...request, generatedContent: result });
      onTrack('teacher_composer_preview_ready', {
        intent: request.intent,
        source: request.source,
      });
    } catch {
      setMessage('Could not build the preview sample right now. You can still continue to the dashboard.');
      onTrack('teacher_composer_error', { stage: 'preview', reason: 'preview_failed' });
    } finally {
      setIsGenerating(false);
    }
  };

  const submit = async () => {
    const request = draft();
    if (!request.prompt && !request.file) {
      setMessage('Please enter a topic or upload your material first.');
      return;
    }
    if (!isOnline) {
      setMessage('You are offline. Reconnect before opening the dashboard.');
      return;
    }

    onTrack('teacher_composer_submitted', {
      intent: request.intent,
      source: request.source,
    });
    onSubmit(request);
  };

  const continueToDashboard = () => {
    const request = draft();
    setPreviewOpen(false);
    onSubmit({ ...request, generatedContent: preview });
  };

  const createTeacherAccount = () => {
    const request = draft();
    setPreviewOpen(false);
    onSignUp({ ...request, generatedContent: preview });
  };

  const previewExcerpt = React.useMemo(() => {
    if (!preview) return '';
    const lines = preview.split('\n');
    return lines.slice(0, 8).join('\n');
  }, [preview]);

  return (
    <section aria-labelledby="teacher-composer-heading" className="border-b border-indigo-100 bg-[#f6f7ff] py-10">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-indigo-100 bg-white p-6 shadow-xl shadow-indigo-100/50 sm:p-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
              <Sparkles className="h-3.5 w-3.5" /> For Kenyan Teachers
            </span>
            <h2 id="teacher-composer-heading" className="mt-3 text-3xl font-black text-[#07133f] sm:text-4xl">
              Prepare your next lesson with Soma
            </h2>
            <p className="mt-2 text-base text-slate-600 sm:text-lg">
              Type a topic, speak, or upload past work. Soma organizes schemes, notes, learner check questions, and marking support.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Lesson preparation goal">
            {teacherIntents.map((item) => {
              const active = intent === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => {
                    setIntent(item.id);
                    onTrack('teacher_composer_intent_changed', { intent: item.id });
                  }}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                    active
                      ? 'border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-indigo-100 bg-slate-50/60 p-3 sm:p-4 focus-within:border-indigo-400 focus-within:bg-white transition">
            <label htmlFor="teacher-composer-input" className="sr-only">What would you like to prepare for your learners?</label>
            <textarea
              id="teacher-composer-input"
              aria-describedby="teacher-composer-status teacher-composer-privacy"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Create Grade 8 integrated science notes on human digestive system with three recap questions..."
              rows={3}
              className="w-full resize-none border-none bg-transparent text-sm sm:text-base font-medium text-[#07133f] placeholder-slate-400 focus:outline-none"
            />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-3">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <input ref={scanRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0], 'SCAN')} />
                <input ref={uploadRef} type="file" aria-label="Attach notes or work" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.txt" className="hidden" onChange={(event) => chooseFile(event.target.files?.[0], 'UPLOAD')} />

                <button type="button" onClick={() => scanRef.current?.click()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                  <Camera className="h-3.5 w-3.5" /> Scan work
                </button>

                <button type="button" onClick={() => uploadRef.current?.click()} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                  <Upload className="h-3.5 w-3.5" /> Upload file
                </button>

                <button type="button" onClick={isListening ? stopVoice : startVoice} aria-label={isListening ? 'Stop voice input' : 'Start voice input'} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${isListening ? 'border-red-300 bg-red-50 text-red-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'}`}>
                  <Mic className={`h-3.5 w-3.5 ${isListening ? 'animate-pulse text-red-600' : ''}`} /> {isListening ? 'Listening...' : 'Voice'}
                </button>

                {file && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800">
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" /> {file.name}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button type="button" onClick={() => { void generatePreview(); }} disabled={isGenerating} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-black text-indigo-700 hover:bg-indigo-100 disabled:opacity-50">
                  {isGenerating ? 'Generating sample...' : 'Create sample'}
                </button>
                <button type="button" onClick={() => { void submit(); }} disabled={isGenerating} aria-describedby="teacher-composer-status" className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-black text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50">
                  Open Teacher Workspace <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <p id="teacher-composer-status" role="status" aria-live="polite" aria-atomic="true" className={message ? 'text-amber-700 font-bold' : ''}>{message || 'Tip: Press Create sample to preview before continuing.'}</p>
            <p id="teacher-composer-privacy" className="inline-flex items-center gap-1.5"><Store className="h-3.5 w-3.5" /> Marketplace publishing always requires your approval.</p>
          </div>
        </div>
      </div>

      {previewOpen && preview ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="presentation">
          <div
            ref={previewDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-sample-heading"
            tabIndex={-1}
            className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl outline-none"
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-indigo-600">Sample preview</p>
                <h3 id="teacher-sample-heading" className="mt-1 text-xl font-black text-[#07133f]">Your notes have started</h3>
                <p className="mt-1 text-sm text-slate-500">Here is the first part. Continue to unlock the complete editable notes.</p>
              </div>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close sample preview" className="shrink-0 rounded-full p-2 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative max-h-[42vh] overflow-hidden bg-indigo-50/40 px-5 py-5 sm:px-6">
              <div className="whitespace-pre-wrap text-sm font-medium leading-7 text-slate-700">{previewExcerpt}</div>
              <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent via-white/80 to-white" />
            </div>

            <div className="border-t border-slate-100 bg-white px-5 py-5 sm:px-6">
              <p className="mb-4 text-center text-sm font-bold text-[#07133f]">Continue to see the full notes and make them your own.</p>
              {isRegistered ? (
                <button type="button" onClick={continueToDashboard} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-black text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">
                  Continue to Teacher Dashboard <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" onClick={createTeacherAccount} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-indigo-600 px-5 text-sm font-black text-white hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">
                    Create teacher account
                  </button>
                  <button type="button" onClick={continueToDashboard} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-indigo-200 bg-white px-5 text-sm font-black text-indigo-700 hover:bg-indigo-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2">
                    Teacher login
                  </button>
                </div>
              )}
              <p className="mt-3 text-center text-xs font-medium text-slate-500">Private by default. Nothing is published automatically.</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};
