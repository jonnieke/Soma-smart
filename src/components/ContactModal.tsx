import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Mail, User, MessageSquare, MessageCircle, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { openWhatsAppShare } from '../services/whatsappService';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        contact: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleWhatsAppSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formattedMsg = [
            '👋 *Soma AI Contact Query*',
            '----------------------------------',
            `👤 *Name:* ${formData.name || '[Not specified]'}`,
            `📞 *Contact:* ${formData.contact || '[Not specified]'}`,
            '',
            '💬 *Message:*',
            formData.message || 'I have a question about Soma AI.',
            '----------------------------------',
            'Sent via Soma AI Quick Contact Modal'
        ].join('\n');

        openWhatsAppShare(formattedMsg, '0722763760');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const { error } = await supabase.functions.invoke('contact-form', {
                body: formData
            });

            if (error) throw error;

            setIsSent(true);
            setTimeout(() => {
                setIsSent(false);
                setFormData({ name: '', contact: '', message: '' });
                onClose();
            }, 3000);
        } catch (err: any) {
            console.error('Contact Form Error:', err);
            setErrorMessage("Failed to send message. Opening WhatsApp support...");
            // Fallback directly to WhatsApp
            handleWhatsAppSubmit(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden bg-gradient-to-b from-white to-emerald-50/30"
                >
                    {/* Header */}
                    <div className="bg-emerald-600 p-6 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/10 skew-y-6 transform origin-top-left" />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                        <h2 className="text-2xl font-bold relative z-10">Get in Touch</h2>
                        <p className="text-emerald-100 text-xs sm:text-sm relative z-10 mt-1">
                            WhatsApp Support <span className="font-extrabold underline">0722763760</span>
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {isSent ? (
                            <div className="text-center py-10 space-y-4">
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                    <Send className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">Message Sent!</h3>
                                <p className="text-gray-500">Thanks for reaching out. We&apos;ll get back to you shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Your Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            required
                                            type="text"
                                            value={formData.name}
                                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="John Doe"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Email or Phone</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <input
                                            required
                                            type="text"
                                            value={formData.contact}
                                            onChange={e => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                                            placeholder="0712345678 or john@example.com"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Message</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <textarea
                                            required
                                            rows={3}
                                            value={formData.message}
                                            onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                            placeholder="How can we help?"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-gray-300 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-2.5 pt-1">
                                    <button
                                        type="button"
                                        onClick={handleWhatsAppSubmit}
                                        className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-3 rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>Send via WhatsApp (0722763760)</span>
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 text-xs flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <>
                                                Send Form Web Inquiry <Send className="w-3.5 h-3.5" />
                                            </>
                                        )}
                                    </button>
                                </div>

                                <div className="text-center pt-2">
                                    <a
                                        href="/contact"
                                        onClick={() => onClose()}
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 inline-flex items-center gap-1 hover:underline"
                                    >
                                        <span>Open Full Contact Us Page</span>
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </form>
                        )}
                        {errorMessage && (
                            <p className="text-red-500 text-sm text-center mt-4 bg-red-50 p-2 rounded-lg border border-red-100">
                                {errorMessage}
                            </p>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
