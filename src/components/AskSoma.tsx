
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Sparkles, User, Bot } from 'lucide-react';
import { askSoma } from '../services/geminiService';
import { useApp } from '../context/AppContext';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

export const AskSoma: React.FC = () => {
    const navigate = useNavigate();
    const { language } = useApp();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
        { role: 'model', text: language === 'FR' ? "Bonjour ! Je suis Soma. 👋 Comment puis-je t'aider à apprendre aujourd'hui ?" : "Hi! I'm Soma. 👋 How can I help you learn today?" }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMsg = { role: 'user' as const, text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue("");
        setIsTyping(true);

        // Call Gemini
        const responseText = await askSoma(text, messages, language);

        setIsTyping(false);
        setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(inputValue);
        }
    };

    const suggestions = [
        "How do I scan a book?",
        "What is my Student ID?",
        "Can I create a quiz?",
        "Help me study!"
    ];

    // Custom Link Renderer for ReactMarkdown
    const LinkRenderer = (props: any) => {
        return (
            <a
                href={props.href}
                onClick={(e) => {
                    if (props.href?.startsWith('/')) {
                        e.preventDefault();
                        navigate(props.href);
                        setIsOpen(false); // Close chat on navigation
                    }
                }}
                className="text-blue-600 underline font-semibold hover:text-blue-800"
                target={props.href?.startsWith('/') ? "_self" : "_blank"}
                rel="noopener noreferrer"
            >
                {props.children}
            </a>
        );
    };

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl transition-all ${isOpen ? 'bg-red-500 pr-3 pl-3' : 'bg-blue-600 pr-6 pl-4'
                    } text-white font-semibold`}
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <>
                        <MessageSquare className="w-6 h-6" />
                        <span>{language === 'FR' ? 'Demander à Soma' : 'Ask Soma'}</span>
                    </>
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[600px] h-[70vh]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">{language === 'FR' ? 'Demander à Soma' : 'Ask Soma'}</h3>
                                <p className="text-blue-100 text-xs">{language === 'FR' ? "Votre compagnon d'étude IA" : 'Your AI Learning Buddy'}</p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((msg, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex items-start gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                        {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                                    </div>
                                    <div className={`p-3 rounded-2xl max-w-[80%] text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                                        }`}>
                                        <ReactMarkdown components={{ a: LinkRenderer }}>
                                            {msg.text}
                                        </ReactMarkdown>
                                    </div>
                                </motion.div>
                            ))}
                            {isTyping && (
                                <div className="flex items-center gap-2 text-slate-400 text-xs ml-10">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestions - Only show if strict few messages */}
                        {messages.length < 3 && (
                            <div className="px-4 pb-2 bg-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSend(s)}
                                        className="whitespace-nowrap px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full text-xs font-medium hover:bg-blue-50 transition-colors"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-slate-100">
                            <div className="flex gap-2 relative">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder={language === 'FR' ? "Posez une question sur vos devoirs..." : "Ask about homework..."}
                                    className="flex-1 pl-4 pr-12 py-3 bg-slate-100 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 placeholder:text-slate-400"
                                />
                                <button
                                    onClick={() => handleSend(inputValue)}
                                    disabled={!inputValue.trim()}
                                    className="absolute right-2 top-2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    title="Send"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
