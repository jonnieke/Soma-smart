import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageCircle, Volume2, ArrowRight, CheckCircle, HelpCircle, ChevronRight, ZoomIn, ZoomOut, X, FileText } from 'lucide-react';
import { ViewState, RevisionMode, ExamAnalysis, ExamQuestion, TutoringStep, TutorResponse, TeacherActivity, QuizData } from '../../types';
import { analyzeExamPaper, getRevisionTutorResponse, fileToGenerativePart, generateSpeech, stopSpeech } from '../../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '../../components/Shared';

interface Props {
    data: File | TeacherActivity;
    mode: RevisionMode;
    onExit: () => void;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    step?: TutoringStep;
}

export const RevisionSession: React.FC<Props> = ({ data, mode, onExit }) => {
    // State
    const [analysis, setAnalysis] = useState<ExamAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingText, setLoadingText] = useState("Scanning exam paper...");
    const [activeQuestion, setActiveQuestion] = useState<ExamQuestion | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [currentStep, setCurrentStep] = useState<TutoringStep>(TutoringStep.A_UNDERSTAND);
    const [userInput, setUserInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [imageZoom, setImageZoom] = useState(1);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Initial Load & Analysis
    useEffect(() => {
        const init = async () => {
            try {
                if (data instanceof File) {
                    const base64 = await fileToGenerativePart(data);
                    setImageSrc(URL.createObjectURL(data));

                    setLoadingText("Scanning exam paper...");
                    const result = await analyzeExamPaper(base64, data.type);
                    setAnalysis(result);
                } else {
                    const quiz = data.content as QuizData;
                    const mappedAnalysis: ExamAnalysis = {
                        subject: data.subject,
                        grade: data.className,
                        questions: (quiz?.questions || []).map((q, idx) => ({
                            id: typeof q.id === 'number' ? q.id : idx,
                            number: (idx + 1).toString(),
                            text: q.question,
                            topic: quiz?.topic || data.title,
                            marks: 5
                        }))
                    };
                    setAnalysis(mappedAnalysis);
                    setImageSrc(null);
                }
                setLoading(false);
            } catch (error) {
                console.error(error);
                alert("Failed to load revision content.");
                onExit();
            }
        };
        init();
    }, [data]);

    // Scroll to bottom of chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isTyping]);

    // Start tutoring a specific question
    const handleSelectQuestion = async (q: ExamQuestion) => {
        setActiveQuestion(q);
        setChatHistory([]); // Clear previous chat
        setCurrentStep(TutoringStep.A_UNDERSTAND);
        setIsTyping(true);

        // Initial AI Message for Step A
        try {
            const response = await getRevisionTutorResponse(q, TutoringStep.A_UNDERSTAND, [], mode);
            addMessage('model', response.text, response.step);
        } catch (e) {
            console.error(e);
        } finally {
            setIsTyping(false);
        }
    };

    const addMessage = (role: 'user' | 'model', text: string, step?: TutoringStep) => {
        setChatHistory(prev => [...prev, { id: Date.now().toString(), role, text, step }]);
    };

    const handleSendMessage = async () => {
        if (!userInput.trim() || !activeQuestion) return;

        const userText = userInput;
        setUserInput("");
        addMessage('user', userText);
        setIsTyping(true);

        try {
            // Build history for API
            const apiHistory = chatHistory.map(m => ({ role: m.role, text: m.text }));
            apiHistory.push({ role: 'user', text: userText });

            const response = await getRevisionTutorResponse(activeQuestion, currentStep, apiHistory, mode);

            addMessage('model', response.text, response.step);

            if (response.nextStep !== 'COMPLETE' && response.nextStep !== currentStep) {
                setCurrentStep(response.nextStep as TutoringStep);
                // Optionally trigger next step immediately if it's just a transition, 
                // but usually we want user interaction first. 
                // For now, we wait for user to respond unless the AI prompts specifically.
            }
        } catch (e) {
            console.error(e);
            addMessage('model', "I had a momentary brain freeze! Can you say that again?");
        } finally {
            setIsTyping(false);
        }
    };

    // TTS Logic
    const handleReadAloud = async (text: string) => {
        if (isPlaying) {
            stopSpeech();
            setIsPlaying(false);
            return;
        }

        setIsPlaying(true);
        try {
            await generateSpeech(text);
        } catch (e) {
            console.error(e);
        } finally {
            setIsPlaying(false);
        }
    };

    const getLastModelMessage = () => {
        const models = chatHistory.filter(m => m.role === 'model');
        return models.length > 0 ? models[models.length - 1].text : "";
    };


    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
                <p className="text-slate-600 font-medium animate-pulse">{loadingText}</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-slate-100 flex flex-col md:flex-row overflow-hidden font-sans">

            {/* LEFT: Exam Paper View */}
            <div className="flex-1 bg-slate-900 relative flex flex-col items-center justify-center p-4 overflow-hidden">
                <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-xs">
                    {analysis?.subject} | {analysis?.grade}
                </div>

                <div className="relative w-full h-full flex items-center justify-center overflow-auto" style={{ cursor: 'grab' }}>
                    {imageSrc ? (
                        <img
                            src={imageSrc}
                            alt="Exam Paper"
                            className="max-w-none transition-transform duration-200"
                            style={{ transform: `scale(${imageZoom})` }}
                        />
                    ) : (
                        <div className="text-center text-white/40 space-y-4">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                                <FileText className="w-10 h-10" />
                            </div>
                            <p className="font-bold text-lg">Candidate Test Paper</p>
                            <p className="text-sm opacity-60">You are revising a national syllabus quiz.</p>
                        </div>
                    )}
                </div>

                {/* Zoom Controls */}
                {imageSrc && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 p-2 rounded-xl backdrop-blur-sm">
                        <button onClick={() => setImageZoom(z => Math.max(0.5, z - 0.2))} className="p-2 text-white hover:bg-white/20 rounded-lg"><ZoomOut className="w-5 h-5" /></button>
                        <span className="text-white text-xs py-2 min-w-[3rem] text-center">{Math.round(imageZoom * 100)}%</span>
                        <button onClick={() => setImageZoom(z => Math.min(3, z + 0.2))} className="p-2 text-white hover:bg-white/20 rounded-lg"><ZoomIn className="w-5 h-5" /></button>
                    </div>
                )}
            </div>

            {/* RIGHT: Interaction Panel */}
            <div className="flex-1 md:max-w-lg bg-white flex flex-col shadow-2xl z-10">

                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-white z-20">
                    <div>
                        <h2 className="font-bold text-slate-800">Candidate Specialist</h2>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${mode === RevisionMode.EXAM ? 'bg-orange-500' : 'bg-green-500'}`} />
                            {mode === RevisionMode.EXAM ? 'Exam Mode' : 'Learn Mode'}
                        </p>
                    </div>
                    <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-full">
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-slate-50 p-4 relative">

                    {!activeQuestion ? (
                        /* Question Selection State */
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Select a Question to Start</h3>
                            {analysis?.questions.map((q) => (
                                <motion.button
                                    key={q.id}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={() => handleSelectQuestion(q)}
                                    className="w-full text-left bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-sm">Q{q.number}</span>
                                        {q.marks && <span className="text-xs text-slate-400 font-mono">{q.marks} marks</span>}
                                    </div>
                                    <p className="text-slate-700 text-sm line-clamp-2 mb-2 font-medium">{q.text}</p>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{q.topic}</span>
                                        <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full">{q.competency}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    ) : (
                        /* Chat / Tutoring State */
                        <div className="space-y-4 pb-20">
                            {/* Question Context Header */}
                            <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex justify-between items-center sticky top-0 z-10 shadow-sm backdrop-blur-md bg-indigo-50/90">
                                <div>
                                    <span className="font-bold text-indigo-700 text-xs uppercase tracking-wider">Current Question</span>
                                    <p className="text-xs font-medium text-indigo-900 line-clamp-1">Q{activeQuestion.number}: {activeQuestion.text}</p>
                                </div>
                                <button
                                    onClick={() => setActiveQuestion(null)}
                                    className="text-xs text-indigo-600 hover:underline"
                                >
                                    Change
                                </button>
                            </div>

                            {/* Chat Messages */}
                            {chatHistory.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-indigo-600 text-white rounded-br-none shadow-md'
                                        : 'bg-white text-slate-700 border border-slate-200 rounded-bl-none shadow-sm'
                                        }`}>
                                        {msg.role === 'model' && (
                                            <div className="flex gap-2 mb-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                    <MessageCircle className="w-3 h-3 text-indigo-600" />
                                                </div>
                                                <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1">
                                                    {msg.step?.replace('A_', '').replace('B_', '').replace('C_', '').replace('D_', '') || 'ASSISTANT'}
                                                </span>
                                            </div>
                                        )}
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-200 shadow-sm flex gap-1">
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                        <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                    </div>
                                </div>
                            )}

                            <div ref={chatEndRef} />
                        </div>
                    )}
                </div>

                {/* Input Area (Only when active question) */}
                {activeQuestion && (
                    <div className="p-4 bg-white border-t">

                        {/* Quick Actions / TTS */}
                        <div className="flex justify-between items-center mb-3">
                            <button
                                onClick={() => handleReadAloud(activeQuestion.text + ". " + getLastModelMessage())}
                                className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${isPlaying ? 'bg-indigo-100 text-indigo-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                            >
                                <Volume2 className="w-3 h-3" />
                                {isPlaying ? 'Listening...' : 'Read Aloud'}
                            </button>

                            {/* Hint button for Exam Mode */}
                            {mode === RevisionMode.EXAM && (
                                <button className="flex items-center gap-1 text-xs font-bold text-orange-500 hover:text-orange-600">
                                    <HelpCircle className="w-3 h-3" /> Get Hint (-2 pts)
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type your answer..."
                                className="flex-1 bg-slate-100 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!userInput.trim() || isTyping}
                                className="bg-indigo-600 text-white p-3 rounded-xl disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                            >
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
