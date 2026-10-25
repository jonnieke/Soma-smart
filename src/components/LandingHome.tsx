import React from 'react';
import { Link } from 'react-router-dom';
import './LandingHome.css';
import {
  ArrowRight,
  Bot,
  Camera,
  CheckCircle2,
  CircleHelp,
  FileText,
  Menu,
  Mic,
  Notebook,
  Search,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import logoImg from '../assets/images/main_logo.png';
import { learnerPoolService } from '../services/learnerPoolService';
import { examPaperBankService } from '../services/examPaperBankService';

export type LandingHomeProps = {
  isRegistered: boolean;
  userName?: string;
  onStartLearning?: () => void;
  onAskQuestion: (question: string, file?: File) => void;
  onLearnerShortcut?: (
    targetTab: 'SMART_TUTOR' | 'RESOURCES' | 'SUBJECTS' | 'TALKBACK' | 'NOTEBOOK',
    targetIntent?: string
  ) => void;
  onTeacher: () => void;
  onParent: () => void;
  onLibrary?: () => void;
  onExamPapers: (paperId?: string | number) => void;
  onSomaGuide: () => void;
  onRevision: () => void;
  onContact?: () => void;
  onPrivacy?: () => void;
  onTerms?: () => void;
  onStartPaper?: (paperId: string | number) => void;
  onPreviewPaper?: (paperId: string | number) => void;
  onPreviewMarkingScheme?: (paperId: string | number) => void;
  onPricing: () => void;
  onSignIn: () => void;
  onDashboard: () => void;
  onTrack: (eventName: string, params?: Record<string, unknown>) => void;
  latestPapers?: Array<{
    id: string | number;
    title: string;
    subject: string;
    grade: string;
  }>;
};

export const DEFAULT_TRENDING_POOL_CARDS = [
  {
    id: 'starter-math-g9-linear',
    grade: 'Grade 9',
    subject: 'Mathematics',
    topic: 'Simultaneous Linear Equations',
    badgeLabel: 'Practice Drill · Grade 9 Mathematics',
    summaryPreview: '3 KNEC-style structured questions covering substitution, elimination, and word problem formation.',
    reuseCount: 42,
    itemType: 'PRACTICE_DRILL' as const,
  },
  {
    id: 'starter-bio-photosynthesis',
    grade: 'Form 4',
    subject: 'Biology',
    topic: 'Photosynthesis Light & Dark Stage [KNEC Marking Points]',
    badgeLabel: 'Akili Breakdown · Form 4 Biology',
    summaryPreview: 'Photolysis of water in the grana vs. carbon dioxide fixation in the stroma with full 1-mark point breakdown.',
    reuseCount: 68,
    itemType: 'TOPIC_EXPLANATION' as const,
  },
  {
    id: 'starter-chem-paper-pass',
    grade: 'Form 4',
    subject: 'Chemistry',
    topic: 'KCSE Chemistry Paper 1 (KES 20 · Instant M-Pesa)',
    badgeLabel: 'Past Paper + 24h AI Pass',
    summaryPreview: 'Download the full question paper + marking scheme and unlock 24 hours of unlimited AI revision across all subjects.',
    reuseCount: 95,
    itemType: 'REVISION_PAPER' as const,
  },
];

const focusAskBox = () => {
  const box = document.getElementById('soma-ask');
  box?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => box?.querySelector<HTMLTextAreaElement | HTMLInputElement>('textarea, input[type="text"]')?.focus(), 350);
};

export const AskAkiliDemo: React.FC<LandingHomeProps & { compact?: boolean }> = (props) => {
  const [question, setQuestion] = React.useState('');
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null);
  const [attachmentNotice, setAttachmentNotice] = React.useState<string | null>(null);
  const [isListening, setIsListening] = React.useState(false);
  const [voiceNotice, setVoiceNotice] = React.useState<string | null>(null);
  const [demoView, setDemoView] = React.useState<'answer' | 'steps' | 'quiz' | 'note'>('answer');
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const sampleQuestion = 'What is photosynthesis?';
  const sampleAnswer = 'Photosynthesis is the process used by green plants to make their own food. They use sunlight, water, and carbon dioxide to produce glucose (food) and oxygen.';
  const sampleSteps = [
    'Plants trap sunlight using chlorophyll in the leaves.',
    'They take in water from the roots and carbon dioxide from the air.',
    'They make glucose for food and release oxygen.',
  ];
  const sampleQuiz = [
    { q: 'What gas do plants take in for photosynthesis?', a: 'Carbon dioxide' },
    { q: 'What part of the plant captures sunlight?', a: 'Chlorophyll in the leaves' },
    { q: 'What is the main food made?', a: 'Glucose' },
  ];

  const quickChips = [
    { label: 'Grade 8 Science', prompt: 'Grade 8 Science: How do plants adapt to arid environments?' },
    { label: 'Form 3 Math', prompt: 'Form 3 Mathematics: Solve quadratic equations by completing the square.' },
    { label: 'KPSEA English', prompt: 'KPSEA English: What are the main parts of speech with examples?' },
    { label: 'KCSE Biology', prompt: 'KCSE Biology: Explain the process of gaseous exchange in alveoli.' },
    { label: 'Grade 7 Agriculture', prompt: 'Grade 7 Agriculture: Describe methods of soil conservation.' },
  ];

  const openQuestion = (override?: string) => {
    const cleaned = (override || question).trim();
    if (!cleaned && !attachedFile) return;
    try {
      if (cleaned) {
        sessionStorage.setItem('soma_pending_hero_question', cleaned);
      }
    } catch { /* ignore */ }
    props.onTrack('ask_akili_home_question_submitted', {
      source: 'landing_hero',
      question_length: cleaned.length,
      has_attachment: Boolean(attachedFile),
    });
    props.onAskQuestion(cleaned || (attachedFile ? `Explain attached question from ${attachedFile.name}` : ''), attachedFile || undefined);
    setQuestion('');
    setAttachedFile(null);
    setAttachmentNotice(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isImage && !isPdf) {
      setAttachmentNotice('Please attach a photo or PDF. Word documents are not supported yet.');
      setAttachedFile(null);
      e.target.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAttachmentNotice('Attachment is too large. Please use an image or PDF under 10MB.');
      setAttachedFile(null);
      e.target.value = '';
      return;
    }
    setAttachedFile(file);
    setAttachmentNotice(null);
    if (!question.trim()) {
      setQuestion(`Analyze and explain homework problem from ${file.name}`);
    }
    props.onTrack('ask_akili_home_attachment_selected', {
      source: 'landing_hero',
      file_type: file.type || 'unknown',
      size_bytes: file.size,
    });
  };

  const startVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Voice input is not supported on this browser. Please type your question.');
      props.onTrack('ask_akili_voice_unsupported', { source: 'landing_hero' });
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-KE';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice('Listening... speak your homework question now.');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          setQuestion((prev) => (prev ? `${prev} ${transcript}` : transcript));
          try {
            sessionStorage.setItem('soma_pending_hero_question', transcript);
          } catch { /* ignore */ }
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceNotice('Could not recognize voice. Please try again or type.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceNotice('Microphone access unavailable. Please type your question.');
    }
  };

  const showSampleQuestion = (view: 'answer' | 'steps' | 'quiz' | 'note') => {
    setDemoView(view);
    if (!question.trim()) {
      setQuestion(sampleQuestion);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Capture homework photo"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        aria-label="Attach homework photo or PDF"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 dark:border-slate-700 dark:bg-slate-800">
          <Search className="h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={question}
            onChange={(e) => {
              const val = e.target.value;
              setQuestion(val);
              try {
                if (val.trim()) {
                  sessionStorage.setItem('soma_pending_hero_question', val.trim());
                }
              } catch { /* ignore */ }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                openQuestion();
              }
            }}
            placeholder="Ask a homework question..."
            className="w-full bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 dark:text-slate-100"
            aria-label="Ask a homework question"
          />

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            title="Snap photo with camera"
            aria-label="Snap photo with camera"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Camera className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload homework photo or PDF"
            aria-label="Upload homework photo or PDF"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <Upload className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={startVoice}
            title="Speak question"
            aria-label="Speak question"
            className={`rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 ${isListening ? 'text-red-600 animate-pulse' : ''}`}
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => openQuestion()}
            disabled={!question.trim() && !attachedFile}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            aria-label="Send question"
          >
            Ask
          </button>
        </div>

        {attachedFile && (
          <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
            <span className="flex items-center gap-1.5 truncate">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              Attached: {attachedFile.name}
            </span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-emerald-700 hover:text-emerald-900 ml-2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {attachmentNotice && (
          <p role="status" className="text-xs font-medium text-amber-700">{attachmentNotice}</p>
        )}
        {voiceNotice && (
          <p role="status" className="text-xs font-medium text-indigo-700">{voiceNotice}</p>
        )}

        <div className="flex flex-wrap gap-1.5 pt-1">
          {quickChips.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => {
                setQuestion(chip.prompt);
                try {
                  sessionStorage.setItem('soma_pending_hero_question', chip.prompt);
                } catch { /* ignore */ }
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {!props.compact && (
          <>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
              <div className="font-bold text-slate-800 dark:text-slate-200">
                {demoView === 'answer' && sampleAnswer}
                {demoView === 'steps' && (
                  <ol className="list-decimal pl-4 space-y-1">
                    {sampleSteps.map((step, i) => <li key={i}>{step}</li>)}
                  </ol>
                )}
                {demoView === 'quiz' && (
                  <div className="space-y-1.5">
                    {sampleQuiz.map((item, i) => (
                      <div key={i}>
                        <span className="font-semibold text-slate-500">Q{i + 1}: {item.q}</span>
                        <div className="text-indigo-700 font-bold">A: {item.a}</div>
                      </div>
                    ))}
                  </div>
                )}
                {demoView === 'note' && (
                  <div>
                    <div className="font-black text-slate-900 mb-1">📘 Summary Note: Photosynthesis</div>
                    <p className="text-slate-600 leading-relaxed">{sampleAnswer}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => showSampleQuestion('steps')}
                className={`flex min-h-11 flex-col items-start justify-center rounded-lg border px-2.5 py-1 text-left text-xs font-bold transition ${demoView === 'steps' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <span>Steps</span>
                <span className="text-[10px] text-slate-500">Clear working</span>
              </button>
              <button
                type="button"
                onClick={() => showSampleQuestion('quiz')}
                className={`flex min-h-11 flex-col items-start justify-center rounded-lg border px-2.5 py-1 text-left text-xs font-bold transition ${demoView === 'quiz' ? 'border-violet-300 bg-violet-50 text-violet-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <span>Test me</span>
                <span className="text-[10px] text-slate-500">Micro-quiz</span>
              </button>
              <button
                type="button"
                onClick={() => showSampleQuestion('note')}
                className={`flex min-h-11 flex-col items-start justify-center rounded-lg border px-2.5 py-1 text-left text-xs font-bold transition ${demoView === 'note' ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <span>Save it</span>
                <span className="text-[10px] text-slate-500">Notebook</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => openQuestion(sampleQuestion)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white hover:bg-blue-700 transition"
            >
              Open this full answer in Ask Akili <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const LandingHome: React.FC<LandingHomeProps> = (props) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [restorePhone, setRestorePhone] = React.useState(
    () => examPaperBankService?.readPhoneSession?.()?.last9 || ''
  );
  const [restoreLoading, setRestoreLoading] = React.useState(false);
  const [restoreNotice, setRestoreNotice] = React.useState<{
    tone: 'ok' | 'err';
    text: string;
  } | null>(null);

  const topPoolItems = React.useMemo(() => {
    const local = learnerPoolService.listLocalPool({ limit: 3 });
    if (local.length >= 3) return local;
    const merged = [...local];
    for (const fallback of DEFAULT_TRENDING_POOL_CARDS) {
      if (merged.length >= 3) break;
      if (!merged.some((item) => item.topic.toLowerCase() === fallback.topic.toLowerCase())) {
        merged.push(fallback as any);
      }
    }
    return merged;
  }, []);

  const handleHeaderPhoneRestore = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!restorePhone.trim() || restoreLoading) return;
    setRestoreLoading(true);
    setRestoreNotice(null);
    try {
      const res = await examPaperBankService.restoreByPhone(restorePhone.trim());
      if (res.found && res.passActive) {
        setRestoreNotice({
          tone: 'ok',
          text: `✅ 24h Pass active (+254${res.last9} · ${res.hoursRemaining}h left).`,
        });
      } else if (res.found) {
        setRestoreNotice({
          tone: 'ok',
          text: `✅ Past papers restored for +254${res.last9} (${res.paperIds.length} paper${res.paperIds.length === 1 ? '' : 's'}).`,
        });
      } else {
        setRestoreNotice({
          tone: 'err',
          text: 'No pass found for that number yet. Buy any KES 20 past paper to unlock a 24h Pass.',
        });
      }
    } catch {
      setRestoreNotice({ tone: 'err', text: 'Could not verify phone right now.' });
    } finally {
      setRestoreLoading(false);
    }
  };

  const navigation = (
    <>
      <button onClick={() => { setMenuOpen(false); focusAskBox(); }}>Homework</button>
      <button onClick={props.onRevision}>Revision</button>
      <button onClick={() => props.onExamPapers()}>Past papers</button>
    </>
  );

  const doors = [
    {
      title: 'Homework help',
      text: 'Type, snap or speak a question. Get it explained step by step.',
      Icon: Bot,
      tone: 'bg-blue-50 text-blue-600',
      cta: 'Ask Akili',
      onClick: focusAskBox,
    },
    {
      title: 'Revise a topic',
      text: 'Timed practice, weak-topic drills and free shared revision.',
      Icon: Notebook,
      tone: 'bg-violet-50 text-violet-600',
      cta: 'Start revising',
      onClick: props.onRevision,
    },
    {
      title: 'Past papers',
      text: 'KNEC papers with marking schemes. KES 20 each, or KES 100 a set.',
      Icon: FileText,
      tone: 'bg-emerald-50 text-emerald-600',
      cta: 'Find a paper',
      onClick: () => props.onExamPapers(),
    },
  ];

  return (
    <div className="soma-landing">
      <header className="soma-header">
        <Link to="/" className="soma-brand" aria-label="Soma AI homepage">
          <img src={logoImg} alt="" width="48" height="48" />
          <span>Soma AI</span>
        </Link>
        <nav className="soma-desktop-nav" aria-label="Main navigation">{navigation}</nav>
        <div className="soma-header-right">
          <form className="soma-pass-restore-pill" onSubmit={handleHeaderPhoneRestore} aria-label="Restore 24h Pass by phone">
            <span className="soma-pass-label">Have a 24h Pass?</span>
            <input
              type="tel"
              value={restorePhone}
              onChange={(e) => setRestorePhone(e.target.value)}
              placeholder="Enter phone (07...)"
              aria-label="Enter phone number to restore 24h pass"
            />
            <button type="submit" disabled={restoreLoading || !restorePhone.trim()}>
              {restoreLoading ? '...' : 'Restore'}
            </button>
          </form>
          <button className="soma-outline soma-signin" onClick={props.isRegistered ? props.onDashboard : props.onSignIn}>
            {props.isRegistered ? 'My desk' : 'Sign in'}
          </button>
          <button
            className="soma-menu-toggle"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            aria-controls="soma-mobile-menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {restoreNotice && (
        <div role="status" className={`soma-restore-notice soma-restore-notice--${restoreNotice.tone}`}>
          <span>{restoreNotice.text}</span>
          {restoreNotice.tone === 'ok' && (
            <button type="button" onClick={props.onDashboard}>Open my desk →</button>
          )}
        </div>
      )}

      {menuOpen && (
        <nav id="soma-mobile-menu" className="soma-mobile-nav" aria-label="Mobile navigation" onClick={() => setMenuOpen(false)}>
          {navigation}
        </nav>
      )}

      <div className="soma-landing-body">
        <section className="soma-hero" aria-labelledby="soma-headline">
          <div className="soma-hero-copy">
            <div className="soma-eyebrow-pill">
              <span className="soma-eyebrow-exams">KPSEA · KJSEA · KCSE · CBC</span>
              <span className="soma-eyebrow-grades">Grades 1–12</span>
            </div>
            <h1 id="soma-headline">Understand more.<br />Any homework or past<br />paper—step by step.</h1>
            <div id="soma-ask" className="soma-hero-input-wrap">
              <AskAkiliDemo {...props} compact />
            </div>
            <p className="soma-hero-trust-line">
              <span>✨ First answer free, no sign-up</span>
              <span className="soma-trust-divider">|</span>
              <span>📄 KES 20 past paper = 24h full AI pass</span>
            </p>
          </div>
          <div className="soma-hero-art">
            <div className="soma-breakdown-preview-card" aria-label="Akili Step-by-Step Breakdown Preview">
              <div className="soma-breakdown-header">
                <div>
                  <span className="soma-breakdown-kicker">What you get · 1/3 free</span>
                  <h2>Akili Step-by-Step Breakdown</h2>
                </div>
                <span className="soma-breakdown-badge">KCSE · KJSEA</span>
              </div>
              <p className="soma-breakdown-problem">
                <strong>Question:</strong> Find the gradient and y-intercept of the line <code>2y - 6x = 8</code> [3 mks]
              </p>
              <div className="soma-breakdown-visible-step">
                <span className="soma-step-number">1</span>
                <div>
                  <strong>Step 1: Rearrange into y = mx + c form [1 mk]</strong>
                  <p>Add <code>6x</code> to both sides, then divide by 2: <code>y = 3x + 4</code>. Gradient <strong>m = 3</strong>, y-intercept <strong>c = (0, 4)</strong>.</p>
                </div>
              </div>
              <div className="soma-breakdown-frosted-wrap">
                <div className="soma-breakdown-blurred-steps" aria-hidden="true">
                  <div className="soma-blurred-line"><span>2</span> Step 2: Find the x-intercept by setting y = 0 [1 mk]</div>
                  <div className="soma-blurred-line"><span>3</span> Step 3: Plot both intercepts and label the line [1 mk]</div>
                </div>
                <div className="soma-breakdown-paywall-card">
                  <p>Unlock every step + <strong>24h Unlimited AI</strong> with any past paper (<strong>KES 20 via M-Pesa</strong>)</p>
                  <div className="soma-breakdown-paywall-actions">
                    <button type="button" onClick={() => props.onExamPapers()} className="soma-paywall-btn-primary">
                      Unlock with a past paper <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="soma-doors" aria-labelledby="soma-doors-title">
          <h2 id="soma-doors-title">What do you need today?</h2>
          <div className="soma-doors-grid">
            {doors.map(({ title, text, Icon, tone, cta, onClick }) => (
              <button key={title} type="button" className="soma-door" onClick={onClick}>
                <div className={`soma-door-icon ${tone}`}>
                  <Icon size={24} />
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="soma-door-cta">
                  {cta} <ArrowRight size={16} />
                </span>
              </button>
            ))}
          </div>
        </section>

        <section aria-labelledby="soma-pool-strip-title" className="soma-pool-showcase">
          <div className="soma-pool-header">
            <div>
              <span className="soma-pool-kicker">Free Learners' Pool · Verified answers</span>
              <h2 id="soma-pool-strip-title">Trending CBC &amp; KCSE Questions</h2>
            </div>
            <Link to="/learner-pool" className="soma-pool-view-all">
              Explore 5,000+ free questions <ArrowRight size={14} />
            </Link>
          </div>
          <div className="soma-pool-cards">
            {topPoolItems.map((item) => (
              <Link
                key={item.id}
                to={`/learner-pool?search=${encodeURIComponent(item.topic)}`}
                className="soma-pool-card"
              >
                <div className="soma-pool-badge">
                  <span>{item.subject}</span>
                  <span>·</span>
                  <span>{item.grade}</span>
                </div>
                <h3 className="soma-pool-topic">{item.topic}</h3>
                <p className="soma-pool-preview">{item.summaryPreview}</p>
                <div className="soma-pool-footer">
                  <span className="soma-pool-count">👁️ Used {item.reuseCount || 12} times today</span>
                  <span className="soma-pool-action">
                    Study solution <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <footer className="soma-footer">
        <span>Soma AI</span>
        <nav aria-label="Footer navigation">
          <button onClick={props.onParent}>For parents</button>
          <button onClick={props.onTeacher}>For teachers</button>
          <button onClick={props.onSomaGuide}>Exam calendar</button>
          <Link to="/learning-videos">Learning videos</Link>
          <button onClick={props.onPricing}>Pricing</button>
          {props.onContact && <button onClick={props.onContact}>Help</button>}
          {props.onPrivacy && <button onClick={props.onPrivacy}>Privacy</button>}
          {props.onTerms && <button onClick={props.onTerms}>Terms</button>}
        </nav>
      </footer>
    </div>
  );
};
