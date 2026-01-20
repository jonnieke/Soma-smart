
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Phone, Mail, User, MessageSquare } from 'lucide-react';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIsSubmitting(false);
        setIsSent(true);

        // Reset after showing success
        setTimeout(() => {
            setIsSent(false);
            setFormData({ name: '', contact: '', message: '' });
            onClose();
        }, 2000);
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
                    className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden bg-gradient-to-b from-white to-blue-50"
                >
                    {/* Header */}
                    <div className="bg-blue-600 p-6 text-white text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-white/10 skew-y-6 transform origin-top-left" />
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                        <h2 className="text-2xl font-bold relative z-10">Get in Touch</h2>
                        <p className="text-blue-100 text-sm relative z-10 mt-1">We'd love to hear from you!</p>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {isSent ? (
                            <div className="text-center py-10 space-y-4">
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <Send className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">Message Sent!</h3>
                                <p className="text-gray-500">Thanks for reaching out. We'll get back to you shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
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
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300"
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
                                            placeholder="john@example.com"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide ml-1">Message</label>
                                    <div className="relative">
                                        <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                                        <textarea
                                            required
                                            rows={4}
                                            value={formData.message}
                                            onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                            placeholder="How can we help?"
                                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none placeholder:text-gray-300"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-slate-200 hover:bg-slate-800 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Send Message <Send className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
