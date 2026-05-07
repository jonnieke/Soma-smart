import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Send, X, User, MessageCircle } from 'lucide-react';
import { getExamGuruResponse } from '../../services/geminiService';

interface Message {
    id: string;
    role: 'user' | 'guru';
    content: string;
}

const PROMPT_CHIPS = [
    'How do I answer a Biology question on osmosis?',
    'How is KCSE Maths P1 marked?',
    'What structure does an English essay need?',
    'How do I attempt Chemistry P3 practical?',
    'KCSE History: how many points per question?',
    'Time plan for a 3-hour KCSE paper',
];

export const ExamGuruPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'guru',
            content: "Exam Guru online. Ask me any Biology, Chemistry, Maths, English or other subject question — I'll show you exactly how KNEC marks it and what earns full marks. No vague advice. Just marks."
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    useEffect(() => {
        // Focus input after mount
        setTimeout(() => inputRef.current?.focus(), 300);
    }, []);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isTyping) return;
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
        const newMsgs = [...messages, userMsg];
        setMessages(newMsgs);
        setInput('');
        setIsTyping(true);
        try {
            const history = newMsgs.map(m => ({ role: m.role, content: m.content }));
            const response = await getExamGuruResponse(text.trim(), history);
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'guru', content: response }]);
        } catch {
            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'guru', content: "I'm having trouble connecting. Please try again in a moment." }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
            />

            {/* Panel — full bottom sheet on mobile, right side panel on desktop */}
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed z-50 flex flex-col
                    bottom-0 left-0 right-0 h-[88vh] rounded-t-3xl
                    md:top-0 md:right-0 md:left-auto md:bottom-0 md:h-full md:w-[420px] md:rounded-none md:rounded-l-3xl
                    bg-slate-950 shadow-2xl border border-white/10 overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-black text-sm">Exam Guru AI</h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Strategy Mode · Online</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Prompt chips */}
                <div className="px-4 py-2.5 bg-slate-900 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                    {PROMPT_CHIPS.map(chip => (
                        <button
                            key={chip}
                            onClick={() => sendMessage(chip)}
                            className="shrink-0 text-[11px] font-bold text-indigo-300 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap"
                        >
                            {chip}
                        </button>
                    ))}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center mt-0.5 ${msg.role === 'guru' ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                {msg.role === 'guru'
                                    ? <Sparkles className="w-3.5 h-3.5 text-white" />
                                    : <User className="w-3.5 h-3.5 text-slate-300" />
                                }
                            </div>
                            <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-[13px] leading-relaxed font-medium ${
                                msg.role === 'guru'
                                    ? 'bg-slate-800/80 text-slate-100 rounded-tl-none border border-white/5'
                                    : 'bg-indigo-600 text-white rounded-tr-none shadow-lg'
                            }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex gap-3">
                            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="bg-slate-800/80 border border-white/5 px-4 py-3.5 rounded-2xl rounded-tl-none">
                                <div className="flex gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:100ms]" />
                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:200ms]" />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={scrollRef} />
                </div>

                {/* Input */}
                <div className="px-4 pb-6 pt-3 bg-slate-950 border-t border-white/10 shrink-0">
                    <div className="relative">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                            placeholder="Ask about exam strategy..."
                            className="w-full bg-slate-900 border-2 border-slate-800 focus:border-indigo-600 rounded-2xl pl-4 pr-12 py-3.5 text-sm font-medium text-white placeholder:text-slate-600 outline-none transition-all"
                        />
                        <button
                            onClick={() => sendMessage(input)}
                            disabled={!input.trim() || isTyping}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
                                input.trim() && !isTyping
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'text-slate-700 cursor-not-allowed'
                            }`}
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <p className="text-[10px] text-slate-700 text-center mt-3 font-bold uppercase tracking-widest">
                        Exam Guru · Powered by Somo Smart AI
                    </p>
                </div>
            </motion.div>
        </>
    );
};
