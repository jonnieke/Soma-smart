import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, MessageCircle, ArrowRight, RefreshCw, X, CheckCircle2, ShieldAlert, Sparkles, ExternalLink } from 'lucide-react';
import { openWhatsAppShare } from '../services/whatsappService';

const TARGET_WHATSAPP = '0722763760';

interface ChatMessage {
    id: string;
    sender: 'BOT' | 'USER';
    text: string;
    options?: Array<{ label: string; action: string }>;
    showWhatsAppButton?: boolean;
    whatsappMessage?: string;
}

const SUPPORT_KNOWLEDGE: Array<{ keywords: string[]; answer: string; options?: Array<{ label: string; action: string }> }> = [
    {
        keywords: ['payment', 'mpesa', 'm-pesa', 'subscribe', 'pay', 'kes', 'pricing', 'charged', 'stk'],
        answer: 'M-Pesa payments on Somo Smart are instant! Plans start at KES 20/day and KES 499/month. If your payment was completed but not reflected yet, click "Verify Payment" on the Pricing Page or enter your M-Pesa transaction code.',
        options: [
            { label: 'Go to Pricing & Payment Verification', action: 'GOTO_PRICING' },
            { label: 'Chat with Human Agent on WhatsApp', action: 'WHATSAPP_PAYMENT' }
        ]
    },
    {
        keywords: ['paper', 'past paper', 'exam', 'marking scheme', 'knec', 'kcse', 'kpsea', 'cbse'],
        answer: 'You can access KCSE, KPSEA & CBC past papers with official marking schemes in our Exam Paper Bank or Candidates Hub! Papers start from KES 20 or are free with a Pro plan.',
        options: [
            { label: 'Open Exam Paper Bank', action: 'GOTO_EXAMPAPERS' },
            { label: 'Open Candidates Hub', action: 'GOTO_REVISION' }
        ]
    },
    {
        keywords: ['teacher', 'schemes', 'lesson', 'darasa', 'quiz', 'mark'],
        answer: 'Teachers can generate lesson notes, schemes of work, topical quizzes, and Darasa recaps in seconds using our Teacher Studio.',
        options: [
            { label: 'Open Teacher Workspace', action: 'GOTO_TEACHER' }
        ]
    },
    {
        keywords: ['parent', 'child', 'code', 'mama', 'progress', 'track'],
        answer: 'Parents can monitor student study time, quiz scores, and weak topics using their child’s Student Code (found in the app under Me → Profile).',
        options: [
            { label: 'Open Parent Dashboard', action: 'GOTO_PARENT' }
        ]
    },
    {
        keywords: ['akili', 'ai', 'tutor', 'homework', 'ask', 'question'],
        answer: 'Ask Akili gives you instant step-by-step working for any homework question across CBC, KPSEA, and KCSE subjects!',
        options: [
            { label: 'Ask Akili AI Tutor Now', action: 'GOTO_LEARNER' }
        ]
    }
];

export const SomoSupportChatbot: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'msg-1',
            sender: 'BOT',
            text: '👋 Hi! I am your Somo Smart AI Support Assistant. How can I help you today?',
            options: [
                { label: '💳 M-Pesa & Payment Help', action: 'QUERY_PAYMENT' },
                { label: '📚 Past Papers & Marking Schemes', action: 'QUERY_PAPERS' },
                { label: '🎓 Teacher Workspace & Schemes', action: 'QUERY_TEACHER' },
                { label: '💬 Chat with Human Agent on WhatsApp', action: 'WHATSAPP_HUMAN' }
            ]
        }
    ]);
    const [input, setInput] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = (textToSend?: string) => {
        const query = (textToSend || input).trim();
        if (!query) return;

        const userMsgId = `usr-${Date.now()}`;
        const userMsg: ChatMessage = { id: userMsgId, sender: 'USER', text: query };

        setMessages(prev => [...prev, userMsg]);
        if (!textToSend) setInput('');

        // Search Knowledge Base
        setTimeout(() => {
            const lowerQuery = query.toLowerCase();
            const match = SUPPORT_KNOWLEDGE.find(k => k.keywords.some(kw => lowerQuery.includes(kw)));

            if (match) {
                setMessages(prev => [
                    ...prev,
                    {
                        id: `bot-${Date.now()}`,
                        sender: 'BOT',
                        text: match.answer,
                        options: match.options
                    }
                ]);
            } else {
                setMessages(prev => [
                    ...prev,
                    {
                        id: `bot-${Date.now()}`,
                        sender: 'BOT',
                        text: 'I could not find a direct answer to that query in our quick guide. Would you like to connect directly with our human support team on WhatsApp (0722763760)?',
                        showWhatsAppButton: true,
                        whatsappMessage: `Hi Somo Smart Support, I need help with: ${query}`
                    }
                ]);
            }
        }, 500);
    };

    const handleOptionClick = (option: { label: string; action: string }) => {
        if (option.action === 'WHATSAPP_HUMAN' || option.action === 'WHATSAPP_PAYMENT') {
            openWhatsAppShare(`Hi Somo Smart Support (0722763760), I need assistance with my account.`, TARGET_WHATSAPP);
            return;
        }
        if (option.action === 'GOTO_PRICING') { window.location.assign('/pricing'); return; }
        if (option.action === 'GOTO_EXAMPAPERS') { window.location.assign('/exam-papers'); return; }
        if (option.action === 'GOTO_REVISION') { window.location.assign('/revision'); return; }
        if (option.action === 'GOTO_TEACHER') { window.location.assign('/teacher'); return; }
        if (option.action === 'GOTO_PARENT') { window.location.assign('/parent'); return; }
        if (option.action === 'GOTO_LEARNER') { window.location.assign('/learner'); return; }

        if (option.action === 'QUERY_PAYMENT') handleSend('M-Pesa payment and subscription help');
        else if (option.action === 'QUERY_PAPERS') handleSend('How to find past papers and marking schemes');
        else if (option.action === 'QUERY_TEACHER') handleSend('Teacher tools and schemes of work');
        else handleSend(option.label);
    };

    return (
        <div className="flex flex-col h-[480px] w-full bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-2xl font-sans text-slate-900">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-slate-900 to-purple-900 px-4 py-3.5 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center font-bold text-indigo-300">
                        <Bot className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-sm text-white">Somo Support AI</h3>
                        <p className="text-[10px] text-indigo-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Instant Assistance
                        </p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-4 h-4 text-white" />
                    </button>
                )}
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/60">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-2.5 items-start ${msg.sender === 'USER' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                            msg.sender === 'USER' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                        }`}>
                            {msg.sender === 'USER' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </div>

                        <div className="space-y-2 max-w-[82%]">
                            <div className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                                msg.sender === 'USER'
                                    ? 'bg-indigo-600 text-white rounded-tr-xs font-semibold'
                                    : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs shadow-sm font-medium'
                            }`}>
                                {msg.text}
                            </div>

                            {/* Action Options */}
                            {msg.options && (
                                <div className="flex flex-col gap-1.5 pt-1">
                                    {msg.options.map((opt, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleOptionClick(opt)}
                                            className="text-left text-[11px] font-bold px-3 py-2 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-700 hover:text-indigo-700 rounded-xl transition-all shadow-xs flex items-center justify-between"
                                        >
                                            <span>{opt.label}</span>
                                            <ArrowRight className="w-3 h-3 text-slate-400" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* WhatsApp Escalation Button */}
                            {msg.showWhatsAppButton && (
                                <button
                                    onClick={() => openWhatsAppShare(msg.whatsappMessage || 'Hi Somo Smart Support, I need assistance.', TARGET_WHATSAPP)}
                                    className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-extrabold py-2.5 px-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    <span>Chat with Human on WhatsApp (0722763760)</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
                <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Ask a support question..."
                    className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                />
                <button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SomoSupportChatbot;
