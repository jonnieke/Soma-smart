import React, { useState, useEffect } from 'react';
import { 
    ArrowLeft, BookOpen, Target, CheckCircle, GraduationCap, FileText, Layers,
    Sparkles, MessageCircle, Send, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { extractTextFromURL } from '../../services/contextService';
import { explainTopic } from '../../services/geminiService';

interface Props {
    data: any;
    onExit: () => void;
}

interface SyllabusStrand {
    title: string;
    objectives: string[];
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export const SyllabusViewer: React.FC<Props> = ({ data, onExit }) => {
    const [loading, setLoading] = useState(true);
    const [strands, setStrands] = useState<SyllabusStrand[]>([]);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'overview' | 'document'>('overview');

    // Text extraction and page viewing state
    const [extractedPages, setExtractedPages] = useState<string[]>([]);
    const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
    const [isExtractingText, setIsExtractingText] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'text' | 'pdf'>('text');

    // Font control state
    const [fontScale, setFontScale] = useState<number>(1.0);
    const [fontFamily, setFontFamily] = useState<'sans' | 'serif'>('sans');

    // Chat coach state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState<string>('');
    const [isResponding, setIsResponding] = useState<boolean>(false);

    // Selection coordinates popup
    const [selectedText, setSelectedText] = useState<string>('');
    const [selectionCoords, setSelectionCoords] = useState<{ x: number; y: number } | null>(null);

    const title = data?.title || 'Syllabus';
    const subject = data?.subject || '';
    const grade = data?.grade || '';

    // Handle clicks outside of text selection to clear coordinate menu
    useEffect(() => {
        const handleDocumentClick = () => {
            const selection = window.getSelection();
            if (!selection || selection.isCollapsed) {
                setSelectedText('');
                setSelectionCoords(null);
            }
        };
        document.addEventListener('click', handleDocumentClick);
        return () => document.removeEventListener('click', handleDocumentClick);
    }, []);

    useEffect(() => {
        const init = async () => {
            try {
                if (data?.file_path) {
                    const encodedPath = data.file_path ? data.file_path.split('/').map(encodeURIComponent).join('/') : '';
                    const fallbackUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/syllabus-docs/${encodedPath}`;
                    const docUrl = data.file_url || data.fileUrl || fallbackUrl;
                    const isImage = data.file_path?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i);

                    if (!isImage) {
                        setPdfUrl(docUrl);
                        
                        // Extract text for syllabus
                        setIsExtractingText(true);
                        try {
                            const fullText = await extractTextFromURL(docUrl);
                            if (fullText) {
                                // Split text into pages based on delimiter "--- Page X ---"
                                const rawPages = fullText.split(/--- Page \d+ ---/);
                                const parsedPages = rawPages
                                    .map(p => p.trim())
                                    .filter(p => p.length > 0);
                                    
                                if (parsedPages.length > 0) {
                                    setExtractedPages(parsedPages);
                                    setActiveTab('text');
                                } else {
                                    setActiveTab('pdf');
                                }
                            } else {
                                setActiveTab('pdf');
                            }
                        } catch (err) {
                            console.error("Failed to extract syllabus PDF text:", err);
                            setActiveTab('pdf');
                        } finally {
                            setIsExtractingText(false);
                        }
                    }
                }

                // Generate overview strands from metadata
                setStrands([
                    {
                        title: 'Learning Objectives', objectives: [
                            `Understand core ${subject} concepts for ${grade}`,
                            `Apply knowledge in practical contexts`,
                            `Demonstrate competency in assessments`
                        ]
                    },
                    {
                        title: 'Assessment Standards', objectives: [
                            'Formative and summative evaluation criteria',
                            'Expected competency levels for this grade',
                            'Performance indicators and benchmarks'
                        ]
                    },
                    {
                        title: 'Scope & Coverage', objectives: [
                            `Complete ${subject} syllabus for ${grade}`,
                            'Strands, sub-strands, and specific learning outcomes',
                            'Suggested learning activities and resources'
                        ]
                    }
                ]);

                setLoading(false);
            } catch (error) {
                console.error('Error loading syllabus:', error);
                setLoading(false);
            }
        };
        init();
    }, [data]);

    const handleTextSelection = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            setSelectedText('');
            setSelectionCoords(null);
            return;
        }

        const text = selection.toString().trim();
        if (text.length > 3) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            setSelectedText(text);
            setSelectionCoords({
                x: rect.left + rect.width / 2,
                y: rect.top
            });
        } else {
            setSelectedText('');
            setSelectionCoords(null);
        }
    };

    const handleChatSubmit = async (messageText: string) => {
        if (!messageText.trim() || isResponding) return;

        const userMsg: ChatMessage = { role: 'user', text: messageText };
        setChatMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsResponding(true);

        try {
            const currentPageText = extractedPages[currentPageIndex] || "";
            
            // Build grounded instruction using the active page text
            const queryWithContext = currentPageText
                ? `Here is the syllabus text context from the page the student is currently reading:\n"""\n${currentPageText}\n"""\n\nQuestion: ${messageText}`
                : messageText;

            const result = await explainTopic(
                queryWithContext,
                'Exam',
                'EN',
                data?.realId || data?.id,
                subject || data?.subject,
                grade || data?.grade,
                undefined,
                undefined,
                undefined,
                'TUTOR'
            );

            const botMsg: ChatMessage = { role: 'model', text: result.explanation };
            setChatMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error("Error in Syllabus Coach chat:", err);
            const errorMsg: ChatMessage = { 
                role: 'model', 
                text: "I'm sorry, I hit a snag while answering. Let's try again!" 
            };
            setChatMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsResponding(false);
        }
    };

    const handleSelectionAsk = (text: string) => {
        const queryPrompt = `Explain this syllabus detail and how it might be examined:\n"${text}"`;
        handleChatSubmit(queryPrompt);
        setSelectedText('');
        setSelectionCoords(null);
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
                <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">Loading syllabus...</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden font-sans transition-colors duration-300">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm transition-colors shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onExit} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                    </button>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 dark:text-white">{title}</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-2">
                            <GraduationCap className="w-3 h-3" />
                            {subject} • {grade}
                            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                                Open Access
                            </span>
                        </p>
                    </div>
                </div>

                {/* View Toggle */}
                {pdfUrl && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setViewMode('overview')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'overview'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setViewMode('document')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'document'
                                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                }`}
                        >
                            Full Document
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {viewMode === 'document' && pdfUrl ? (
                    <div className="h-[calc(100vh-76px)] flex flex-col md:flex-row bg-slate-150 dark:bg-slate-950 overflow-hidden relative">
                        
                        {/* LEFT COLUMN: Clean Text / PDF Reader (60% width) */}
                        <div className="flex-1 flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-hidden">
                            {/* Reader toolbar */}
                            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                        Page {currentPageIndex + 1} of {extractedPages.length || 1}
                                    </span>
                                    
                                    {/* Reader tab switcher */}
                                    {extractedPages.length > 0 && (
                                        <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-black ml-2 select-none border border-slate-300/10">
                                            <button
                                                onClick={() => setActiveTab('text')}
                                                className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 'text' ? 'bg-white dark:bg-slate-750 text-indigo-700 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                Clean Text
                                            </button>
                                            <button
                                                onClick={() => setActiveTab('pdf')}
                                                className={`px-2.5 py-1 rounded-md transition-all ${activeTab === 'pdf' ? 'bg-white dark:bg-slate-750 text-indigo-700 dark:text-indigo-400 shadow-sm font-black' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                Original PDF
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Font size & styling controls */}
                                {activeTab === 'text' && extractedPages.length > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setFontScale(prev => Math.max(0.8, prev - 0.1))}
                                            className="w-7 h-7 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 text-xs flex items-center justify-center transition-colors"
                                            title="Make text smaller"
                                        >
                                            A-
                                        </button>
                                        <button
                                            onClick={() => setFontScale(prev => Math.min(1.5, prev + 0.1))}
                                            className="w-7 h-7 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 text-xs flex items-center justify-center transition-colors"
                                            title="Make text larger"
                                        >
                                            A+
                                        </button>
                                        <button
                                            onClick={() => setFontFamily(prev => prev === 'sans' ? 'serif' : 'sans')}
                                            className="px-2.5 h-7 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black hover:bg-slate-50 text-[9px] uppercase tracking-wider flex items-center justify-center transition-colors font-semibold"
                                            title="Change font style"
                                        >
                                            {fontFamily === 'sans' ? 'Serif' : 'Sans'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Main Document Content */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar bg-slate-50 dark:bg-slate-950 relative">
                                {isExtractingText ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-650 rounded-full animate-spin mb-4" />
                                        <p className="text-xs font-black uppercase tracking-widest animate-pulse text-indigo-500">Extracting Syllabus Content...</p>
                                    </div>
                                ) : activeTab === 'pdf' || extractedPages.length === 0 ? (
                                    <div className="h-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm bg-white">
                                        <embed
                                            src={pdfUrl}
                                            type="application/pdf"
                                            className="w-full h-full"
                                            style={{ minHeight: 'calc(100vh - 160px)' }}
                                        />
                                    </div>
                                ) : (
                                    <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 md:p-10 rounded-3xl shadow-sm border border-slate-150 dark:border-slate-800 relative min-h-full">
                                        <div className="prose prose-slate dark:prose-invert max-w-none">
                                            <p 
                                                style={{ fontSize: `${fontScale}rem` }} 
                                                className={`text-slate-750 dark:text-slate-300 leading-relaxed m-0 whitespace-pre-line select-text ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
                                                onMouseUp={handleTextSelection}
                                            >
                                                {extractedPages[currentPageIndex]}
                                            </p>
                                        </div>

                                        {/* Selection coordinate popup */}
                                        {selectedText && selectionCoords && (
                                            <div 
                                                className="fixed z-[100] bg-slate-950 text-white rounded-xl shadow-xl py-2 px-3 flex items-center gap-2 border border-slate-800 text-xs font-black select-none pointer-events-auto"
                                                style={{ 
                                                    left: `${selectionCoords.x}px`, 
                                                    top: `${selectionCoords.y - 10}px`, 
                                                    transform: 'translate(-50%, -100%)' 
                                                }}
                                            >
                                                <button
                                                    onClick={() => handleSelectionAsk(selectedText)}
                                                    className="flex items-center gap-1 hover:text-indigo-400 transition-colors font-bold"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
                                                    <span>Ask Akili</span>
                                                </button>
                                                <div className="w-px h-3.5 bg-slate-800" />
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(selectedText);
                                                        setSelectedText('');
                                                        setSelectionCoords(null);
                                                    }}
                                                    className="hover:text-slate-300 transition-colors"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer page controls */}
                            {extractedPages.length > 0 && activeTab === 'text' && (
                                <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-4 py-3.5 flex items-center justify-between shrink-0 select-none">
                                    <button
                                        disabled={currentPageIndex === 0}
                                        onClick={() => setCurrentPageIndex(prev => Math.max(0, prev - 1))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-black uppercase tracking-wider text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all font-semibold"
                                    >
                                        <ChevronLeft className="w-4 h-4" /> Prev
                                    </button>
                                    <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                                        {Array.from({ length: extractedPages.length }).map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentPageIndex(i)}
                                                className={`w-6 h-6 rounded-full text-[10px] font-black transition-all flex items-center justify-center shrink-0 ${currentPageIndex === i ? 'bg-indigo-650 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        disabled={currentPageIndex === extractedPages.length - 1}
                                        onClick={() => setCurrentPageIndex(prev => Math.min(extractedPages.length - 1, prev + 1))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-black uppercase tracking-wider text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent transition-all font-semibold"
                                    >
                                        Next <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* RIGHT COLUMN: AI Chat Panel (40% width, max 380px) */}
                        <div className="w-full md:w-[380px] shrink-0 flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 overflow-hidden relative">
                            {/* Chat Toolbar */}
                            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                                    <h4 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-wider">Syllabus Coach</h4>
                                </div>
                                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">Akili Assistant</span>
                            </div>

                            {/* Messages List */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                                {chatMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center mb-4 border border-indigo-100 dark:border-indigo-900 shadow-sm">
                                            <MessageCircle className="w-6 h-6 text-indigo-600" />
                                        </div>
                                        <h5 className="font-black text-xs text-slate-850 dark:text-white mb-1 uppercase tracking-wider">Ask Your Syllabus Coach</h5>
                                        <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed font-medium">
                                            Ask Akili to summarize learning outcomes, test you on scope areas, or clarify KNEC standards.
                                        </p>

                                        {/* Starter Prompts list */}
                                        <div className="grid grid-cols-1 gap-2 mt-6 w-full max-w-xs select-none">
                                            {[
                                                "Explain the curriculum goals on this page",
                                                "What are typical exam questions for this area?",
                                                "Give me a 3-question MCQ quiz on this"
                                            ].map((prompt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleChatSubmit(prompt)}
                                                    className="w-full text-left p-3.5 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50 hover:bg-indigo-50/50 dark:bg-slate-900 dark:hover:bg-slate-850 transition-colors text-[11px] font-bold text-slate-650 dark:text-slate-350 hover:text-indigo-700"
                                                >
                                                    {prompt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-[1.25rem] p-3.5 text-xs leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-650 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-805 dark:text-slate-200 rounded-bl-none'}`}>
                                                    <p className="whitespace-pre-line">{msg.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                        {isResponding && (
                                            <div className="flex justify-start">
                                                <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-none p-4 flex gap-1 items-center">
                                                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-550 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                                                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-550 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                                                    <div className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-550 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Chat Input Form */}
                            <form 
                                onSubmit={(e) => { e.preventDefault(); handleChatSubmit(chatInput); }}
                                className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3.5 flex gap-2 items-center"
                            >
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type your question..."
                                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl px-4 py-3 text-xs outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-slate-800 dark:text-white"
                                />
                                <button
                                    type="submit"
                                    disabled={!chatInput.trim() || isResponding}
                                    className="p-3 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl transition-all shadow-sm"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </div>
                ) : (
                    /* Overview */
                    <div className="max-w-3xl mx-auto p-6 space-y-6">
                        {/* Hero Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-br from-emerald-600 to-teal-700 p-8 rounded-3xl text-white relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <BookOpen className="w-10 h-10 mb-4 opacity-80" />
                                <h2 className="text-2xl font-black mb-2">{title}</h2>
                                <p className="text-emerald-100 text-sm leading-relaxed max-w-lg font-medium">
                                    This syllabus outlines what learners should study, achieve, and master in {subject} at {grade} level.
                                    It&apos;s your roadmap — what to learn, not how to be examined.
                                </p>
                            </div>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10" />
                        </motion.div>

                        {/* Info Banner */}
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 flex items-start gap-3">
                            <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/40 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border border-amber-200/20">
                                <Target className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-900 dark:text-amber-300">Information Only — Not for Examination</p>
                                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 font-medium">
                                    The syllabus is a guide for what you should learn. It is not examined directly.
                                    Use it to understand the scope of your studies and plan your revision.
                                </p>
                            </div>
                        </div>

                        {/* Strands */}
                        {strands.map((strand, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm transition-colors"
                            >
                                <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg flex items-center justify-center">
                                            {idx === 0 && <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                            {idx === 1 && <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                            {idx === 2 && <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                                        </div>
                                        <h3 className="font-bold text-slate-850 dark:text-slate-250">{strand.title}</h3>
                                    </div>
                                </div>
                                <div className="p-6 space-y-3">
                                    {strand.objectives.map((obj, objIdx) => (
                                        <div key={objIdx} className="flex items-start gap-3">
                                            <div className="w-6 h-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{objIdx + 1}</span>
                                            </div>
                                            <p className="text-sm text-slate-705 dark:text-slate-400 leading-relaxed font-semibold">{obj}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}

                        {/* View Full Document CTA */}
                        {pdfUrl && (
                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                onClick={() => setViewMode('document')}
                                className="w-full bg-white dark:bg-slate-900 border-2 border-dashed border-emerald-300 dark:border-emerald-900 rounded-3xl p-6 text-center hover:border-emerald-500 dark:hover:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all group"
                            >
                                <FileText className="w-8 h-8 text-emerald-400 dark:text-emerald-600 mx-auto mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
                                <p className="font-black text-emerald-700 dark:text-emerald-400">View Full Syllabus Document</p>
                                <p className="text-xs text-emerald-500 dark:text-emerald-600 mt-1 font-medium">Open the complete PDF document</p>
                            </motion.button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
