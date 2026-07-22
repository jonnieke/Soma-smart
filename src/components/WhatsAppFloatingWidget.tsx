import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, X, ExternalLink, Send, Sparkles, MessageSquare, Headphones } from 'lucide-react';
import { buildWhatsAppUrl, openWhatsAppShare } from '../services/whatsappService';

const TARGET_WHATSAPP = '0722763760';

export const WhatsAppFloatingWidget: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);

    // Hide widget on admin routes or contact page itself (to avoid duplicate elements)
    if (location.pathname.startsWith('/admin') || location.pathname === '/contact' || location.pathname === '/contact-us') {
        return null;
    }

    const handleQuickChat = (message: string) => {
        openWhatsAppShare(message, TARGET_WHATSAPP);
        setIsOpen(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[89] flex flex-col items-end print:hidden">
            {/* Popover Card */}
            {isOpen && (
                <div className="mb-3 w-80 sm:w-88 bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden animate-fadeIn transition-all">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 text-white relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-3 right-3 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            aria-label="Close WhatsApp support widget"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-2xl bg-white text-emerald-600 flex items-center justify-center font-extrabold shadow-md">
                                    <MessageCircle className="w-6 h-6" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full" />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-sm text-white">Soma AI Support</h3>
                                <p className="text-[11px] text-emerald-100 flex items-center gap-1 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                                    WhatsApp: 0722 763 760
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-4 space-y-3 bg-slate-50/50">
                        <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm text-xs text-slate-600 leading-relaxed">
                            👋 Hi there! Need help with <span className="font-bold text-slate-800">M-Pesa payments</span>, <span className="font-bold text-slate-800">revision papers</span>, or <span className="font-bold text-slate-800">school accounts</span>? Chat with our team directly on WhatsApp!
                        </div>

                        {/* Quick Action Chips */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-1">
                                Quick Inquiries
                            </span>
                            <div className="grid grid-cols-1 gap-1.5">
                                <button
                                    onClick={() => handleQuickChat('Hi Soma AI, I need assistance with M-Pesa payment / subscription.')}
                                    className="p-2.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-slate-200 text-left text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-all flex items-center justify-between"
                                >
                                    <span>💳 M-Pesa & Subscription Help</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                </button>
                                <button
                                    onClick={() => handleQuickChat('Hi Soma AI, I have a question about revision papers and marking schemes.')}
                                    className="p-2.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-slate-200 text-left text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-all flex items-center justify-between"
                                >
                                    <span>📚 CBC / KCSE Revision Papers</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                </button>
                                <button
                                    onClick={() => handleQuickChat('Hello, I am interested in setting up Soma AI for our school.')}
                                    className="p-2.5 rounded-xl bg-white hover:bg-emerald-50/80 border border-slate-200 text-left text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:border-emerald-300 transition-all flex items-center justify-between"
                                >
                                    <span>🏫 School Package Setup</span>
                                    <ExternalLink className="w-3 h-3 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        {/* Main Buttons */}
                        <div className="pt-1 flex flex-col gap-2">
                            <button
                                onClick={() => handleQuickChat('Hi Soma AI, I need support.')}
                                className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Chat on WhatsApp (0722763760)</span>
                            </button>

                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    navigate('/contact');
                                }}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-3 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5"
                            >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Open Full Contact Us Page</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative flex items-center justify-center gap-2 p-3.5 sm:px-4 sm:py-3 rounded-full text-white font-extrabold shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${
                    isOpen ? 'bg-slate-900' : 'bg-[#25D366] hover:bg-[#20ba59]'
                }`}
                aria-label="WhatsApp support"
            >
                {!isOpen && (
                    <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none" />
                )}

                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <>
                        <MessageCircle className="w-6 h-6 text-white" />
                        <span className="hidden sm:inline-block text-xs font-black tracking-wide">
                            WhatsApp Support
                        </span>
                    </>
                )}
            </button>
        </div>
    );
};

export default WhatsAppFloatingWidget;
