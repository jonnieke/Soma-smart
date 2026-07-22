import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Bot } from 'lucide-react';
import { SomoSupportChatbot } from './SomoSupportChatbot';

export const WhatsAppFloatingWidget: React.FC = () => {
    const location = useLocation();
    const [isOpen, setIsOpen] = useState(false);

    // Hide widget on admin routes or contact page itself (to avoid duplicate elements)
    if (location.pathname.startsWith('/admin') || location.pathname === '/contact' || location.pathname === '/contact-us') {
        return null;
    }

    return (
        <div className="fixed bottom-6 right-6 z-[89] flex flex-col items-end print:hidden">
            {/* Interactive Support Chatbot Popover */}
            {isOpen && (
                <div className="mb-3 w-[340px] sm:w-[380px] animate-fadeIn transition-all">
                    <SomoSupportChatbot onClose={() => setIsOpen(false)} />
                </div>
            )}

            {/* Floating Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`group relative flex items-center justify-center gap-2 p-3.5 sm:px-4 sm:py-3 rounded-full text-white font-extrabold shadow-2xl transition-all transform hover:scale-105 active:scale-95 ${
                    isOpen ? 'bg-slate-900' : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                }`}
                aria-label="Somo AI Support"
            >
                {!isOpen && (
                    <span className="absolute -inset-1 rounded-full bg-emerald-500 opacity-40 animate-ping pointer-events-none" />
                )}

                {isOpen ? (
                    <X className="w-6 h-6 text-white" />
                ) : (
                    <>
                        <Bot className="w-6 h-6 text-white" />
                        <span className="hidden sm:inline-block text-xs font-black tracking-wide">
                            AI &amp; WhatsApp Support
                        </span>
                    </>
                )}
            </button>
        </div>
    );
};

export default WhatsAppFloatingWidget;
