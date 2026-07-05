import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Bot, User, MessageCircle, Zap, Clock, ShieldCheck, ArrowRight, Brain } from 'lucide-react';
import { getExamGuruResponse } from '../../services/geminiService';

interface Message {
    id: string;
    role: 'user' | 'guru';
    content: string;
}

export const ExamGuruChat: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'guru',
            content: "Hello, Candidate! I am your Exam Guru. I don't just teach subjects—I teach you how to CRUSH the exam. Ask me about time management, paper traps, or how to handle high-pressure topics!"
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim()
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        try {
            // Convert history for the service
            const history = newMessages.map(m => ({ role: m.role, content: m.content }));
            const response = await getExamGuruResponse(input.trim(), history);

            const guruMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'guru',
                content: response
            };
            setMessages(prev => [...prev, guruMsg]);
        } catch (err) {
            console.error(err);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 bottom-4 md:inset-auto md:right-8 md:bottom-8 z-[100] w-full max-w-sm md:w-[400px] h-[600px] flex flex-col bg-slate-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10"
        >
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                        <Brain className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-white font-black text-sm tracking-tight">Exam Guru Smart</h3>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest">Online Strategy Mode</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-white/60 transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Strategy Belt */}
            <div className="px-4 py-2 bg-slate-900 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                {['Time Mgt', 'Exam Traps', 'Memory Hacks', 'Focus'].map((tag) => (
                    <button key={tag} className="shrink-0 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black text-indigo-300 uppercase tracking-widest hover:bg-white/10 transition-colors">
                        {tag}
                    </button>
                ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth custom-scrollbar">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${msg.role === 'guru' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                            {msg.role === 'guru' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-[13px] leading-relaxed font-medium ${msg.role === 'guru'
                            ? 'bg-slate-900 text-slate-100 rounded-tl-none border border-white/5 shadow-sm'
                            : 'bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-900/20'
                            }`}>
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                            <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="bg-slate-900 p-4 rounded-2xl rounded-tl-none border border-white/5">
                            <div className="flex gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-100" />
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-slate-950 border-t border-white/10 shrink-0">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask for strategy..."
                        className="w-full bg-slate-900 border-2 border-slate-800 rounded-2xl pl-4 pr-12 py-3.5 text-sm font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-600 focus:bg-slate-800 transition-all"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${input.trim() ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-700 cursor-not-allowed'
                            }`}
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-[10px] text-slate-600 text-center mt-4 font-bold uppercase tracking-widest">Strategy v2.0 • Candidate Edition</p>
            </div>
        </motion.div>
    );
};
