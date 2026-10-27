import React from 'react';
import { Link } from 'react-router-dom';
import './LandingHome.css';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookMarked,
  BookOpen,
  Bot,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FilePlus2,
  FileText,
  Headphones,
  HelpCircle,
  KeyRound,
  Library,
  Menu,
  Mic,
  MoreVertical,
  Notebook,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Upload,
  User,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import logoImg from '../assets/images/main_logo.png';
import heroBoyMotherImg from '../assets/images/hero_boy_mother_mock.png';
import parentStudyImg from '../assets/images/parent_study_mock.png';
import somoBuddyAvatar from '../assets/images/somo_buddy_avatar.png';
import { examPaperBankService, PhoneRestoreSession } from '../services/examPaperBankService';

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
    exam_body?: string | null;
    duration_minutes?: number | null;
    total_marks?: number | null;
    source?: string | null;
    exam_type?: string | null;
    created_at?: string | null;
    published_at?: string | null;
    homepage_featured?: boolean | null;
    file_url?: string | null;
    file_path?: string | null;
    has_marking_scheme?: boolean | null;
    marking_scheme_url?: string | null;
    markingSchemeUrl?: string | null;
  }>;
};

export const DEFAULT_FALLBACK_PAPERS = [
  {
    id: 'kcse-2023-math-alt-a-p1',
    title: 'KCSE 2023 Mathematics Alt A Paper 1',
    subject: 'Mathematics',
    grade: 'Form 4',
    exam_body: 'KNEC',
    duration_minutes: 150,
    total_marks: 100,
    source: 'KNEC National Examination',
    homepage_featured: true,
  },
  {
    id: 'kcse-2023-chem-p1',
    title: 'KCSE 2023 Chemistry Paper 1 (Theory)',
    subject: 'Chemistry',
    grade: 'Form 4',
    exam_body: 'KNEC',
    duration_minutes: 120,
    total_marks: 80,
    source: 'KNEC National Examination',
    homepage_featured: true,
  },
  {
    id: 'kpsea-2023-int-sci',
    title: 'KPSEA 2023 Integrated Science & Technology',
    subject: 'Science',
    grade: 'Grade 6',
    exam_body: 'KNEC',
    duration_minutes: 100,
    total_marks: 50,
    source: 'KNEC CBC Assessment',
    homepage_featured: false,
  },
  {
    id: 'kcse-2023-bio-p1',
    title: 'KCSE 2023 Biology Paper 1 (Theory)',
    subject: 'Biology',
    grade: 'Form 4',
    exam_body: 'KNEC',
    duration_minutes: 120,
    total_marks: 80,
    source: 'KNEC National Examination',
    homepage_featured: false,
  },
  {
    id: 'grade9-kjsea-math-pilot',
    title: 'KJSEA Grade 9 Mathematics National Pilot Paper',
    subject: 'Mathematics',
    grade: 'Grade 9',
    exam_body: 'KNEC',
    duration_minutes: 120,
    total_marks: 100,
    source: 'KNEC KJSEA Assessment',
    homepage_featured: false,
  },
  {
    id: 'kcse-2023-eng-p2',
    title: 'KCSE 2023 English Paper 2 (Comprehension & Literature)',
    subject: 'English',
    grade: 'Form 4',
    exam_body: 'KNEC',
    duration_minutes: 150,
    total_marks: 80,
    source: 'KNEC National Examination',
    homepage_featured: false,
  },
];

export const AskAkiliHeroWidget: React.FC<LandingHomeProps> = (props) => {
  const [question, setQuestion] = React.useState('');
  const [attachedFile, setAttachedFile] = React.useState<File | null>(null);
  const [attachmentNotice, setAttachmentNotice] = React.useState<string | null>(null);
  const [isListening, setIsListening] = React.useState(false);
  const [voiceNotice, setVoiceNotice] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'answer' | 'steps' | 'quiz' | 'note'>('answer');
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false);
  const cameraInputRef = React.useRef<HTMLInputElement | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const sampleQuestion = 'What is photosynthesis?';
  const sampleAnswer =
    'Photosynthesis is the process used by green plants to make their own food. They use sunlight, water, and carbon dioxide to produce glucose (food) and oxygen.';

  const handleOpenQuestion = (override?: string) => {
    const cleaned = (override || question || sampleQuestion).trim();
    try {
      if (cleaned) {
        sessionStorage.setItem('soma_pending_hero_question', cleaned);
      }
    } catch {
      /* ignore */
    }
    props.onTrack('ask_akili_home_question_submitted', {
      source: 'landing_hero_widget',
      question_length: cleaned.length,
      has_attachment: Boolean(attachedFile),
    });
    props.onAskQuestion(
      cleaned || (attachedFile ? `Explain attached question from ${attachedFile.name}` : ''),
      attachedFile || undefined
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
    if (!isImage && !isPdf) {
      setAttachmentNotice('Please attach a photo or PDF.');
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
  };

  const startVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Voice input is not supported on this browser.');
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
          setQuestion(transcript);
          try {
            sessionStorage.setItem('soma_pending_hero_question', transcript);
          } catch {
            /* ignore */
          }
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setVoiceNotice('Could not recognize voice. Please try again.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceNotice('Microphone access unavailable.');
    }
  };

  const handleListenAnswer = () => {
    if (!('speechSynthesis' in window)) {
      props.onLearnerShortcut?.('TALKBACK', sampleQuestion);
      return;
    }
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(sampleAnswer);
    utterance.lang = 'en-GB';
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);
    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
    props.onTrack('ask_akili_listen_clicked', { source: 'landing_hero' });
  };

  return (
    <div className="soma-widget-card" aria-label="Interactive Ask Akili Preview">
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

      {/* Widget Dark Header */}
      <div className="soma-widget-header">
        <div className="soma-widget-header-left">
          <div className="soma-widget-avatar-wrap">
            <img src={somoBuddyAvatar} alt="Akili Avatar" className="soma-widget-avatar" />
          </div>
          <span className="soma-widget-title">Ask Akili</span>
        </div>
        <div className="soma-widget-header-right">
          <button
            type="button"
            className="soma-widget-icon-btn"
            title="History"
            onClick={() => props.onLearnerShortcut?.('SMART_TUTOR', 'history')}
            aria-label="Study History"
          >
            <Clock className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="soma-widget-icon-btn"
            title="Options"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Widget Body */}
      <div className="soma-widget-body">
        {/* Search Input Pill */}
        <div className="soma-widget-input-pill">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
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
              } catch {
                /* ignore */
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleOpenQuestion();
              }
            }}
            placeholder="Ask a homework question..."
            className="soma-widget-input"
            aria-label="Ask a homework question"
          />

          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            title="Snap homework photo"
            aria-label="Snap photo with camera"
            className="soma-widget-tool-btn"
          >
            <Camera className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Upload homework document"
            aria-label="Upload homework document"
            className="soma-widget-tool-btn"
          >
            <Upload className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={startVoice}
            title="Speak homework question"
            aria-label="Speak homework question"
            className={`soma-widget-tool-btn ${isListening ? 'text-red-600 animate-pulse' : ''}`}
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleOpenQuestion()}
            className="soma-widget-ask-btn"
            aria-label="Send question"
          >
            Ask
          </button>
        </div>

        {attachedFile && (
          <div className="soma-widget-attachment-badge">
            <span className="flex items-center gap-1.5 truncate">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Attached: {attachedFile.name}
            </span>
            <button
              type="button"
              onClick={() => setAttachedFile(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {attachmentNotice && (
          <p role="status" className="text-xs text-amber-700 font-medium">{attachmentNotice}</p>
        )}
        {voiceNotice && (
          <p role="status" className="text-xs text-indigo-700 font-medium">{voiceNotice}</p>
        )}

        {/* Prompt Question Card */}
        <button
          type="button"
          onClick={() => {
            setQuestion(sampleQuestion);
            handleOpenQuestion(sampleQuestion);
          }}
          className="soma-widget-sample-bubble"
          aria-label="Load sample question: What is photosynthesis?"
        >
          <span>What is photosynthesis?</span>
        </button>

        {/* Answer Preview Box (Soft Green with Leaf) */}
        <div className="soma-widget-answer-card">
          <div className="soma-widget-answer-text">
            {activeTab === 'answer' && (
              <p>{sampleAnswer}</p>
            )}
            {activeTab === 'steps' && (
              <div className="space-y-1">
                <p className="font-bold text-emerald-900 mb-1">Step-by-step breakdown:</p>
                <ol className="list-decimal pl-4 space-y-0.5 text-slate-700">
                  <li>Chlorophyll absorbs sunlight energy in leaf chloroplasts.</li>
                  <li>Water (roots) + Carbon Dioxide (stomata) combine chemically.</li>
                  <li>Glucose food is stored while oxygen gas is released.</li>
                </ol>
              </div>
            )}
            {activeTab === 'quiz' && (
              <div className="space-y-1">
                <p className="font-bold text-emerald-900 mb-1">Target Quiz (KNEC Point):</p>
                <p className="text-slate-700"><strong>Q:</strong> What gas is released as a byproduct during photolysis?</p>
                <p className="text-emerald-700 font-bold"><strong>A:</strong> Oxygen (O₂)</p>
              </div>
            )}
            {activeTab === 'note' && (
              <div className="space-y-1">
                <p className="font-bold text-emerald-900 mb-1">Saved to Notebook:</p>
                <p className="text-slate-700">Photosynthesis (Grade 8 Science · Form 1 Biology)</p>
              </div>
            )}
          </div>
          <div className="soma-widget-leaf-graphic" aria-hidden="true">
            <svg viewBox="0 0 64 64" fill="none" className="w-10 h-10 text-emerald-500">
              <path
                d="M56 8C36 8 20 24 20 44C20 54 28 56 36 56C52 56 56 36 56 8Z"
                fill="#86EFAC"
                stroke="#15803D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 44C28 40 38 32 46 20"
                stroke="#15803D"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M32 36L38 42M40 28L46 34"
                stroke="#15803D"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M20 44C16 48 10 54 8 56"
                stroke="#15803D"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* 4 Action Cards in 2x2 Grid */}
        <div className="soma-widget-actions-grid">
          <button
            type="button"
            onClick={() => {
              setActiveTab('steps');
              props.onTrack('ask_akili_step_clicked', { source: 'landing_hero' });
            }}
            className={`soma-widget-action-btn ${activeTab === 'steps' ? 'soma-widget-action-btn--active' : ''}`}
          >
            <span className="soma-action-icon">≡</span>
            <span>Explain step by step</span>
          </button>

          <button
            type="button"
            onClick={handleListenAnswer}
            className={`soma-widget-action-btn ${isPlayingAudio ? 'soma-widget-action-btn--playing' : ''}`}
          >
            <Volume2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{isPlayingAudio ? 'Pause audio' : 'Listen'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('quiz');
              props.onTrack('ask_akili_test_me_clicked', { source: 'landing_hero' });
            }}
            className={`soma-widget-action-btn ${activeTab === 'quiz' ? 'soma-widget-action-btn--active' : ''}`}
          >
            <HelpCircle className="h-4 w-4 text-purple-600 shrink-0" />
            <span>Test me</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('note');
              props.onLearnerShortcut?.('NOTEBOOK', sampleQuestion);
              props.onTrack('ask_akili_save_notebook_clicked', { source: 'landing_hero' });
            }}
            className={`soma-widget-action-btn ${activeTab === 'note' ? 'soma-widget-action-btn--active' : ''}`}
          >
            <BookMarked className="h-4 w-4 text-blue-600 shrink-0" />
            <span>Save to Notebook</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const AskAkiliDemo = AskAkiliHeroWidget;

export const LandingHome: React.FC<LandingHomeProps> = (props) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = React.useState(false);
  const [restorePhone, setRestorePhone] = React.useState(
    () => examPaperBankService?.readPhoneSession?.()?.last9 || ''
  );
  const [restoreLoading, setRestoreLoading] = React.useState(false);
  const [restoreNotice, setRestoreNotice] = React.useState<{
    tone: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [clearSession, setClearSession] = React.useState<PhoneRestoreSession | null>(null);
  const [clearError, setClearError] = React.useState<string | null>(null);

  const carouselRef = React.useRef<HTMLDivElement | null>(null);

  const scrollCarousel = (direction: -1 | 1) => {
    const node = carouselRef.current;
    if (!node) return;
    const card = node.querySelector<HTMLElement>('[data-paper-card]');
    const step = card?.offsetWidth ? card.offsetWidth + 16 : 310;
    node.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  const carouselPapers = React.useMemo(() => {
    const list = [...(props.latestPapers || [])];
    if (list.length >= 4) return list.slice(0, 8);
    const merged = [...list];
    for (const def of DEFAULT_FALLBACK_PAPERS) {
      if (merged.length >= 6) break;
      if (!merged.some((p) => String(p.id) === String(def.id) || p.title.toLowerCase() === def.title.toLowerCase())) {
        merged.push(def as any);
      }
    }
    return merged;
  }, [props.latestPapers]);

  const executePhoneRestore = async (phoneToRestore: string) => {
    const cleanNumber = phoneToRestore.trim();
    if (!cleanNumber) return;
    setRestoreLoading(true);
    setRestoreNotice(null);
    setClearError(null);
    try {
      const res = await examPaperBankService.restoreByPhone(cleanNumber);
      setClearSession(res);
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
      return res;
    } catch (err: any) {
      const msg = err?.message || 'Could not verify phone number right now.';
      setClearError(msg);
      setRestoreNotice({ tone: 'err', text: msg });
      return null;
    } finally {
      setRestoreLoading(false);
    }
  };

  const handleHeaderQuickRestore = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!restorePhone.trim() || restoreLoading) return;
    await executePhoneRestore(restorePhone);
    setIsClearModalOpen(true);
  };

  const handleModalPhoneClear = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!restorePhone.trim() || restoreLoading) return;
    await executePhoneRestore(restorePhone);
  };

  const scrollToHeroInput = () => {
    const el = document.querySelector('.soma-widget-input');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    (el as HTMLInputElement)?.focus();
  };

  return (
    <div className="soma-app-root">
      {/* 1. TOP NAVBAR */}
      <header className="soma-nav-wrapper">
        <div className="soma-nav-container">
          {/* Brand */}
          <Link to="/" className="soma-nav-brand" aria-label="Soma AI homepage">
            <span className="soma-brand-sparkle">✦</span>
            <span className="soma-brand-name">SomaAI</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="soma-nav-links" aria-label="Main navigation">
            <button
              type="button"
              className="soma-nav-link"
              onClick={() => {
                if (props.onStartLearning) props.onStartLearning();
                else scrollToHeroInput();
              }}
            >
              Learners
            </button>
            <button
              type="button"
              className="soma-nav-link"
              onClick={() => props.onExamPapers()}
            >
              Past Papers
            </button>
            <button
              type="button"
              className="soma-nav-link"
              onClick={props.onTeacher}
            >
              Teachers
            </button>
            <button
              type="button"
              className="soma-nav-link"
              onClick={props.onParent}
            >
              Parents
            </button>
            <button
              type="button"
              className="soma-nav-link"
              onClick={() => {
                if (props.onLibrary) props.onLibrary();
                else props.onExamPapers();
              }}
            >
              Library
            </button>
            <button
              type="button"
              className="soma-nav-link"
              onClick={props.onPricing}
            >
              Pricing
            </button>
          </nav>

          {/* Right Action: Pass Clear Pill & Sign In */}
          <div className="soma-nav-right">
            <form
              className="soma-header-pass-form"
              onSubmit={handleHeaderQuickRestore}
              aria-label="Restore 24h Pass by phone"
            >
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="soma-header-pass-label-btn"
                title="Clear revision pass by phone"
              >
                Have a 24h Pass?
              </button>
              <input
                type="tel"
                value={restorePhone}
                onChange={(e) => setRestorePhone(e.target.value)}
                placeholder="Phone (07...)"
                aria-label="Enter phone number to restore 24h pass"
                className="soma-header-pass-input"
              />
              <button
                type="submit"
                disabled={restoreLoading || !restorePhone.trim()}
                className="soma-header-pass-btn"
              >
                {restoreLoading ? '...' : 'Clear'}
              </button>
            </form>

            <button
              type="button"
              className="soma-signin-pill"
              onClick={props.isRegistered ? props.onDashboard : props.onSignIn}
            >
              {props.isRegistered ? 'My desk' : 'Sign In'}
            </button>
            <button
              type="button"
              className="soma-nav-mobile-btn"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="soma-mobile-drawer" aria-label="Mobile navigation">
            <button
              type="button"
              className="soma-mobile-drawer-link"
              onClick={() => {
                setMobileMenuOpen(false);
                props.onStartLearning?.();
              }}
            >
              Learners
            </button>
            <button
              type="button"
              className="soma-mobile-drawer-link"
              onClick={() => {
                setMobileMenuOpen(false);
                props.onExamPapers();
              }}
            >
              Past Papers
            </button>
            <button
              type="button"
              className="soma-mobile-drawer-link"
              onClick={() => {
                setMobileMenuOpen(false);
                props.onTeacher();
              }}
            >
              Teachers
            </button>
            <button
              type="button"
              className="soma-mobile-drawer-link"
              onClick={() => {
                setMobileMenuOpen(false);
                props.onParent();
              }}
            >
              Parents
            </button>
            <button
              type="button"
              className="soma-mobile-drawer-link"
              onClick={() => {
                setMobileMenuOpen(false);
                if (props.onLibrary) props.onLibrary();
                else props.onExamPapers();
              }}
            >
              Library
            </button>
            <button
              type="button"
              className="soma-mobile-drawer-link"
              onClick={() => {
                setMobileMenuOpen(false);
                props.onPricing();
              }}
            >
              Pricing
            </button>
            <form onSubmit={handleHeaderQuickRestore} className="soma-mobile-pass-form">
              <span className="text-xs font-bold text-slate-600">Bought a paper? Clear 24h Pass</span>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={restorePhone}
                  onChange={(e) => setRestorePhone(e.target.value)}
                  placeholder="07... or 01..."
                  aria-label="Enter phone number to restore 24h pass (mobile)"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs w-full"
                />
                <button
                  type="submit"
                  disabled={restoreLoading || !restorePhone.trim()}
                  className="rounded-lg bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shrink-0"
                >
                  {restoreLoading ? '...' : 'Clear'}
                </button>
              </div>
            </form>
          </div>
        )}

        {restoreNotice && (
          <div role="status" className={`soma-restore-banner soma-restore-banner--${restoreNotice.tone}`}>
            <span>{restoreNotice.text}</span>
            <button
              type="button"
              onClick={() => setIsClearModalOpen(true)}
              className="font-bold underline ml-2 text-xs"
            >
              View Pass Details →
            </button>
          </div>
        )}
      </header>

      <main className="soma-main-content">
        {/* 2. HERO SECTION */}
        <section className="soma-hero-section" aria-label="Hero Introduction">
          <div className="soma-hero-grid">
            {/* Left Copy Column */}
            <div className="soma-hero-copy-column">
              <h1 className="soma-hero-headline">
                AI study help for{' '}
                <br />
                CBC, KPSEA, and{' '}
                <br />
                KCSE learners
              </h1>
              <p className="soma-hero-subtitle">
                Ask homework questions, listen to notes, practise weak topics, and save everything in your personal Notebook.
              </p>

              {/* Tagline */}
              <div className="soma-hero-tagline" aria-label="✦ Ask. Listen. Practise. Remember.">
                <span className="text-blue-600 mr-1.5">✦</span>
                <span className="soma-tag-ask">Ask.</span>
                <span className="soma-tag-listen">Listen.</span>
                <span className="soma-tag-practise">Practise.</span>
                <span className="soma-tag-remember">Remember.</span>
              </div>

              {/* Primary & Secondary Action CTAs */}
              <div className="soma-hero-cta-group">
                <button
                  type="button"
                  onClick={props.onStartLearning ? props.onStartLearning : scrollToHeroInput}
                  className="soma-btn-primary"
                >
                  Start Learning Free <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={props.onTeacher}
                  className="soma-btn-secondary"
                >
                  <User className="h-4 w-4 text-blue-600" />
                  <span>I'm a Teacher</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="soma-hero-trust-bar">
                <span className="soma-trust-badge">
                  <span className="soma-flag">🇰🇪</span> Built for Kenyan learners
                </span>
                <span className="soma-dot">·</span>
                <span className="soma-trust-badge">Low-data friendly</span>
                <span className="soma-dot">·</span>
                <span className="soma-trust-badge">Parent progress reports</span>
              </div>
            </div>

            {/* Center Emotional Photo */}
            <div className="soma-hero-photo-wrap">
              <img
                src={heroBoyMotherImg}
                alt="Kenyan student and mother learning together on tablet"
                className="soma-hero-center-photo"
              />
            </div>

            {/* Right Interactive Ask Akili Widget */}
            <div className="soma-hero-widget-wrap">
              <AskAkiliHeroWidget {...props} />
            </div>
          </div>
        </section>

        {/* 3. "WHAT SOMAAI HELPS WITH" (4 CARDS) */}
        <section className="soma-features-section" aria-labelledby="soma-helps-title">
          <h2 id="soma-helps-title" className="soma-section-title">
            What SomaAI helps with
          </h2>
          <div className="soma-four-cards-grid">
            {/* Card 1 */}
            <button
              type="button"
              onClick={scrollToHeroInput}
              className="soma-four-card text-left"
            >
              <div className="soma-card-icon-wrap soma-icon-blue">
                <FileText className="h-6 w-6 text-sky-600" />
              </div>
              <div className="soma-card-content">
                <h3 className="soma-card-heading">Understand homework</h3>
                <p className="soma-card-desc">
                  Get step-by-step explanations for any school question.
                </p>
              </div>
            </button>

            {/* Card 2 */}
            <button
              type="button"
              onClick={() => props.onLearnerShortcut?.('TALKBACK')}
              className="soma-four-card text-left"
            >
              <div className="soma-card-icon-wrap soma-icon-green">
                <Headphones className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="soma-card-content">
                <h3 className="soma-card-heading">Listen &amp; Learn</h3>
                <p className="soma-card-desc">
                  Too tired to read? Listen instead.
                </p>
              </div>
            </button>

            {/* Card 3 */}
            <button
              type="button"
              onClick={props.onRevision}
              className="soma-four-card text-left"
            >
              <div className="soma-card-icon-wrap soma-icon-purple">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div className="soma-card-content">
                <h3 className="soma-card-heading">Practise weak topics</h3>
                <p className="soma-card-desc">
                  Quizzes and targeted revision help you improve.
                </p>
              </div>
            </button>

            {/* Card 4 */}
            <button
              type="button"
              onClick={() => props.onLearnerShortcut?.('NOTEBOOK')}
              className="soma-four-card text-left"
            >
              <div className="soma-card-icon-wrap soma-icon-amber">
                <BookMarked className="h-6 w-6 text-amber-600" />
              </div>
              <div className="soma-card-content">
                <h3 className="soma-card-heading">Notebook</h3>
                <p className="soma-card-desc">
                  Save what you learn and revise it later.
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* 4. PAPERS CAROUSEL SECTION */}
        <section className="soma-carousel-section" aria-labelledby="soma-papers-carousel-title">
          <div className="soma-carousel-header">
            <div>
              <span className="soma-carousel-kicker">
                📄 KES 20 Past Paper = 24h Full AI Revision Pass
              </span>
              <h2 id="soma-papers-carousel-title" className="soma-carousel-title">
                Official KCSE, KPSEA &amp; CBC Past Papers
              </h2>
              <p className="soma-carousel-subtitle">
                Download verified KNEC question papers and official marking schemes. Every KES 20 paper clears your device for 24h unlimited AI revision.
              </p>
            </div>

            <div className="soma-carousel-controls">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="soma-carousel-phone-clear-btn"
                title="Clear access by phone"
              >
                <Phone className="h-4 w-4" />
                <span>Clear by Phone</span>
              </button>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => scrollCarousel(-1)}
                  className="soma-carousel-arrow-btn"
                  aria-label="Scroll papers left"
                  title="Previous papers"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollCarousel(1)}
                  className="soma-carousel-arrow-btn"
                  aria-label="Scroll papers right"
                  title="Next papers"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Carousel Track */}
          <div
            ref={carouselRef}
            className="soma-carousel-track"
            tabIndex={0}
            aria-label="Past papers carousel"
          >
            {carouselPapers.map((paper, index) => {
              const isSpotlight = index === 0 || Boolean((paper as any).homepage_featured);
              return (
                <div
                  key={paper.id}
                  data-paper-card
                  className="soma-paper-card"
                >
                  <div className="soma-paper-card-top">
                    <span className={`soma-paper-badge ${isSpotlight ? 'soma-badge-spotlight' : 'soma-badge-regular'}`}>
                      {isSpotlight ? 'Spotlight Paper' : 'Official KNEC'}
                    </span>
                    <span className="soma-paper-price-pill">
                      KES 20 · 24h Pass
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => props.onExamPapers(paper.id)}
                    className="soma-paper-card-title text-left"
                  >
                    {paper.title}
                  </button>

                  <div className="soma-paper-card-tags">
                    <span className="soma-paper-tag">{paper.subject}</span>
                    <span className="soma-paper-tag">{paper.grade}</span>
                    {paper.duration_minutes ? (
                      <span className="soma-paper-tag">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {paper.duration_minutes} min
                      </span>
                    ) : null}
                    {paper.total_marks ? (
                      <span className="soma-paper-tag">{paper.total_marks} marks</span>
                    ) : null}
                  </div>

                  <div className="soma-paper-card-footer">
                    <button
                      type="button"
                      onClick={() => props.onExamPapers(paper.id)}
                      className="soma-paper-action-open"
                    >
                      <span>Open paper</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={props.onRevision}
                      className="soma-paper-action-revise"
                    >
                      Revise with Akili
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Clear Banner underneath carousel */}
          <div className="soma-carousel-clear-strip">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <strong className="text-sm text-slate-900 block">
                  Bought a paper via M-Pesa? Clear your account now.
                </strong>
                <span className="text-xs text-slate-500">
                  Enter the phone number used at payment to immediately unlock your papers and 24h unlimited AI revision.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(true)}
                className="soma-clear-cta-btn"
              >
                Clear by Phone Number →
              </button>
              <button
                type="button"
                onClick={() => props.onExamPapers()}
                className="soma-browse-all-papers-btn"
              >
                Browse All 200+ Papers
              </button>
            </div>
          </div>
        </section>

        {/* 5. SPLIT ROW: "POWERFUL TOOLS FOR EVERY LEARNER" + "FOR TEACHERS" */}
        <section className="soma-split-row-section" aria-label="Learner Tools and Teacher Suite">
          <div className="soma-split-row-grid">
            {/* Left Box: Powerful tools for every learner */}
            <div className="soma-learner-tools-card">
              <h3 className="soma-sub-section-title">
                Powerful tools for every learner
              </h3>
              <div className="soma-learner-tools-grid">
                <button
                  type="button"
                  onClick={scrollToHeroInput}
                  className="soma-tool-item text-center"
                >
                  <div className="soma-tool-circle bg-blue-600 text-white">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h4 className="soma-tool-name">Ask Akili</h4>
                  <p className="soma-tool-desc">
                    Ask any homework question and get clear answers instantly.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => props.onLearnerShortcut?.('TALKBACK')}
                  className="soma-tool-item text-center"
                >
                  <div className="soma-tool-circle bg-emerald-500 text-white">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <h4 className="soma-tool-name">Listen &amp; Learn</h4>
                  <p className="soma-tool-desc">
                    Listen to notes and explanations anytime, anywhere.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => props.onLearnerShortcut?.('TALKBACK', 'voice')}
                  className="soma-tool-item text-center"
                >
                  <div className="soma-tool-circle bg-orange-500 text-white">
                    <Mic className="h-6 w-6" />
                  </div>
                  <h4 className="soma-tool-name">Talk &amp; Learn</h4>
                  <p className="soma-tool-desc">
                    Speak or type to get help in your own words.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => props.onLearnerShortcut?.('NOTEBOOK')}
                  className="soma-tool-item text-center"
                >
                  <div className="soma-tool-circle bg-purple-600 text-white">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h4 className="soma-tool-name">Notebook</h4>
                  <p className="soma-tool-desc">
                    Save answers, notes and files. Revise anytime, anywhere.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (props.onLibrary) props.onLibrary();
                    else props.onExamPapers();
                  }}
                  className="soma-tool-item text-center"
                >
                  <div className="soma-tool-circle bg-sky-500 text-white">
                    <Library className="h-6 w-6" />
                  </div>
                  <h4 className="soma-tool-name">Library</h4>
                  <p className="soma-tool-desc">
                    Access trusted notes, past papers, and syllabus guides.
                  </p>
                </button>
              </div>
            </div>

            {/* Right Box: For Teachers */}
            <div className="soma-teachers-suite-card">
              <div className="soma-teachers-suite-header">
                <span className="text-xl">🎓</span>
                <h3 className="soma-teachers-suite-title">For Teachers</h3>
              </div>
              <div className="soma-teachers-grid">
                <button
                  type="button"
                  onClick={props.onTeacher}
                  className="soma-teacher-item text-center"
                >
                  <div className="soma-teacher-icon">
                    <FilePlus2 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h4 className="soma-teacher-item-title">Create notes</h4>
                  <p className="soma-teacher-item-desc">Build quality notes in minutes.</p>
                </button>

                <button
                  type="button"
                  onClick={props.onTeacher}
                  className="soma-teacher-item text-center"
                >
                  <div className="soma-teacher-icon">
                    <HelpCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h4 className="soma-teacher-item-title">Create quiz</h4>
                  <p className="soma-teacher-item-desc">Make quizzes in seconds.</p>
                </button>

                <button
                  type="button"
                  onClick={props.onTeacher}
                  className="soma-teacher-item text-center"
                >
                  <div className="soma-teacher-icon">
                    <Users className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h4 className="soma-teacher-item-title">Share with class</h4>
                  <p className="soma-teacher-item-desc">Distribute content instantly.</p>
                </button>

                <button
                  type="button"
                  onClick={props.onTeacher}
                  className="soma-teacher-item text-center"
                >
                  <div className="soma-teacher-icon">
                    <BarChart3 className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h4 className="soma-teacher-item-title">See weak topics</h4>
                  <p className="soma-teacher-item-desc">Track class progress in real time.</p>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 6. SPLIT ROW: "FOR PARENTS" + "SIMPLE, AFFORDABLE PRICING" */}
        <section className="soma-split-row-section" aria-label="Parents and Pricing">
          <div className="soma-split-row-grid">
            {/* Left: For Parents with Weekly Progress Report */}
            <div className="soma-parent-card">
              <div className="soma-parent-left-col">
                <div className="soma-parent-badge-icon">
                  <Users className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="soma-parent-title">For Parents</h3>
                  <p className="soma-parent-tagline">Stay involved. See real progress.</p>
                </div>
              </div>

              {/* Weekly Progress Report */}
              <div className="soma-parent-report-card">
                <div className="soma-report-header">
                  <span className="soma-report-title">Weekly Progress Report</span>
                  <span className="soma-report-date">13 – 19 May 2024</span>
                </div>
                <div className="soma-report-stats-grid">
                  <div className="soma-report-metric">
                    <span className="soma-metric-label">Studied</span>
                    <span className="soma-metric-value-big">4</span>
                    <span className="soma-metric-sub">days this week</span>
                  </div>
                  <div className="soma-report-metric">
                    <span className="soma-metric-label">Strong topics</span>
                    <span className="soma-metric-tag soma-tag-green">
                      Fractions,<br />Photosynthesis
                    </span>
                  </div>
                  <div className="soma-report-metric">
                    <span className="soma-metric-label">Needs revision</span>
                    <span className="soma-metric-tag soma-tag-orange">
                      Algebra<br />expressions
                    </span>
                  </div>
                  <div className="soma-report-metric">
                    <span className="soma-metric-label">Next step</span>
                    <span className="soma-metric-tag soma-tag-blue">
                      Practise 5 Algebra<br />questions
                    </span>
                  </div>
                </div>
              </div>

              {/* Parent Photo */}
              <div className="soma-parent-photo-wrap">
                <img
                  src={parentStudyImg}
                  alt="Kenyan parents reviewing child study progress on tablet"
                  className="soma-parent-photo"
                />
              </div>
            </div>

            {/* Right: Simple, Affordable Pricing */}
            <div className="soma-pricing-card">
              <h3 className="soma-sub-section-title text-center mb-3">
                Simple, affordable pricing
              </h3>
              <div className="soma-pricing-tiers-grid">
                {/* Daily */}
                <button
                  type="button"
                  onClick={props.onPricing}
                  className="soma-pricing-tier-box soma-tier-blue text-center"
                >
                  <span className="soma-tier-label">Daily</span>
                  <span className="soma-tier-price text-blue-700">KES 20</span>
                  <span className="soma-tier-desc">Any past paper + 24h AI pass.</span>
                </button>

                {/* Monthly */}
                <button
                  type="button"
                  onClick={props.onPricing}
                  className="soma-pricing-tier-box soma-tier-green text-center"
                >
                  <span className="soma-tier-label">Monthly</span>
                  <span className="soma-tier-price text-emerald-700">KES 499</span>
                  <span className="soma-tier-desc">Great value for consistent learning.</span>
                </button>

                {/* Termly */}
                <button
                  type="button"
                  onClick={props.onPricing}
                  className="soma-pricing-tier-box soma-tier-purple text-center"
                >
                  <span className="soma-tier-label">Termly</span>
                  <span className="soma-tier-highlight text-purple-700">
                    Best for exam preparation
                  </span>
                  <span className="soma-tier-desc">Best value for serious learners.</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 7. BOTTOM TRUST & QUALITY ASSURANCE STRIP (4 COLUMNS) */}
        <section className="soma-trust-strip-section" aria-label="Soma AI Highlights">
          <div className="soma-trust-strip-grid">
            <div className="soma-trust-col">
              <div className="soma-trust-col-icon">
                <ShieldCheck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="soma-trust-col-title">CBC/KPSEA/KCSE aligned</h4>
                <p className="soma-trust-col-desc">Curriculum-aligned content you can trust.</p>
              </div>
            </div>

            <div className="soma-trust-col">
              <div className="soma-trust-col-icon">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="soma-trust-col-title">Trusted Library materials</h4>
                <p className="soma-trust-col-desc">Quality notes, past papers &amp; guides.</p>
              </div>
            </div>

            <div className="soma-trust-col">
              <div className="soma-trust-col-icon">
                <Headphones className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="soma-trust-col-title">Audio learning support</h4>
                <p className="soma-trust-col-desc">Listen, learn and understand better.</p>
              </div>
            </div>

            <div className="soma-trust-col">
              <div className="soma-trust-col-icon">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h4 className="soma-trust-col-title">Teacher-friendly</h4>
                <p className="soma-trust-col-desc">Tools that save time and improve outcomes.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="soma-footer-bottom">
        <div className="soma-footer-inner">
          <div className="soma-footer-brand">
            <span className="text-blue-600 font-bold">✦</span>
            <span className="font-bold text-slate-800">Soma AI</span>
            <span className="text-xs text-slate-400">· Empowering Kenyan Learners &amp; Educators</span>
          </div>
          <nav className="soma-footer-links" aria-label="Footer navigation">
            <button type="button" onClick={props.onParent}>For parents</button>
            <button type="button" onClick={props.onTeacher}>For teachers</button>
            <button type="button" onClick={() => props.onExamPapers()}>Past papers</button>
            <button type="button" onClick={props.onSomaGuide}>Exam calendar</button>
            <Link to="/learning-videos">Learning videos</Link>
            <button type="button" onClick={props.onPricing}>Pricing</button>
            {props.onContact && <button type="button" onClick={props.onContact}>Help</button>}
            {props.onPrivacy && <button type="button" onClick={props.onPrivacy}>Privacy</button>}
            {props.onTerms && <button type="button" onClick={props.onTerms}>Terms</button>}
          </nav>
        </div>
      </footer>

      {/* 8. PHONE CLEAR MODAL WINDOW */}
      {isClearModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-phone-title"
          className="soma-modal-backdrop"
          onClick={() => setIsClearModalOpen(false)}
        >
          <div
            className="soma-modal-window"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="soma-modal-header">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="clear-phone-title" className="text-lg font-black text-slate-900 leading-snug">
                    Clear &amp; Restore Past Paper Access
                  </h3>
                  <p className="text-xs text-slate-500">
                    For learners &amp; parents who paid via M-Pesa
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="soma-modal-close-btn"
                aria-label="Close modal window"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="soma-modal-body">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                Bought a past paper with M-Pesa (KES 20)? Enter your phone number below to immediately clear your device, unlock your purchased papers, and activate your 24-hour unlimited AI revision pass.
              </p>

              <form onSubmit={handleModalPhoneClear} className="space-y-3">
                <div className="soma-modal-phone-input-wrap">
                  <span className="soma-modal-phone-prefix">
                    <span>🇰🇪</span> +254
                  </span>
                  <input
                    type="tel"
                    value={restorePhone}
                    onChange={(e) => {
                      setRestorePhone(e.target.value);
                      setClearSession(null);
                      setClearError(null);
                    }}
                    placeholder="07... or 01..."
                    aria-label="Enter phone number to restore 24h pass (modal)"
                    className="soma-modal-phone-input"
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={restoreLoading || !restorePhone.trim()}
                  className="soma-modal-submit-btn"
                >
                  {restoreLoading ? 'Verifying payment...' : 'Clear My Access & Unlock Papers →'}
                </button>
              </form>

              {clearError && (
                <div role="status" className="soma-modal-error-box">
                  <p className="font-bold flex items-center gap-1.5 text-rose-800">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    {clearError}
                  </p>
                  <p className="text-slate-600">
                    Need a past paper? Buy any KCSE/KPSEA past paper for KES 20 to immediately activate a 24h AI revision pass.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsClearModalOpen(false);
                      props.onExamPapers();
                    }}
                    className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline pt-1"
                  >
                    Browse Past Papers Bank (KES 20) →
                  </button>
                </div>
              )}

              {clearSession && (
                <div role="status" className="soma-modal-result-box">
                  {clearSession.found && clearSession.passActive ? (
                    <div className="soma-result-active">
                      <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm mb-1">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span>✅ Cleared! 24h Pass is Active</span>
                      </div>
                      <p className="text-slate-700 font-medium">
                        Welcome back! Your number <strong>+254{clearSession.last9}</strong> has <strong>{clearSession.hoursRemaining} hours</strong> of unlimited AI revision remaining and <strong>{clearSession.paperIds.length}</strong> unlocked paper(s).
                      </p>
                      <div className="flex flex-wrap gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsClearModalOpen(false);
                            props.onRevision();
                          }}
                          className="soma-modal-action-primary"
                        >
                          Go to Revision Hub →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsClearModalOpen(false);
                            props.onExamPapers();
                          }}
                          className="soma-modal-action-secondary"
                        >
                          View My Unlocked Papers
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsClearModalOpen(false);
                            props.onDashboard();
                          }}
                          className="soma-modal-action-outline"
                        >
                          My Desk
                        </button>
                      </div>
                    </div>
                  ) : clearSession.found ? (
                    <div className="soma-result-expired">
                      <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm mb-1">
                        <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0" />
                        <span>✅ Past Papers Found</span>
                      </div>
                      <p className="text-slate-700">
                        Your phone <strong>+254{clearSession.last9}</strong> has <strong>{clearSession.paperIds.length}</strong> purchased paper(s). Your 24h AI pass has expired, but all your purchased papers remain accessible.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsClearModalOpen(false);
                            props.onExamPapers();
                          }}
                          className="soma-modal-action-primary"
                        >
                          Open My Purchased Papers →
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsClearModalOpen(false);
                            props.onExamPapers();
                          }}
                          className="soma-modal-action-secondary"
                        >
                          Renew 24h Pass (KES 20)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="soma-result-notfound">
                      <p className="font-bold text-slate-800 mb-1">
                        No purchases found for +254{clearSession.last9}
                      </p>
                      <p className="text-slate-600 mb-3">
                        Past papers are KES 20 via instant M-Pesa. Once bought, you can restore and clear access anytime with your phone number.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsClearModalOpen(false);
                          props.onExamPapers();
                        }}
                        className="soma-modal-action-primary"
                      >
                        Browse Past Papers (KES 20) →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
