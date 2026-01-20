import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, CheckCircle, Star, Crown, Smartphone, CreditCard, Loader2 } from 'lucide-react';
import { Button } from './Shared';
import { initiateMpesaVerification, initiateCardVerification } from '../services/paymentService';

interface TeacherPaywallProps {
    isOpen: boolean;
    onClose: () => void;
}

export const TeacherPaywall: React.FC<TeacherPaywallProps> = ({ isOpen, onClose }) => {
    const [step, setStep] = useState<'OFFER' | 'PAYMENT' | 'PROCESSING' | 'SUCCESS'>('OFFER');
    const [method, setMethod] = useState<'MPESA' | 'CARD' | null>(null);
    const [identifier, setIdentifier] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleVerify = async () => {
        if (!method) return;
        if (identifier.length < 4) {
            setError(method === 'MPESA' ? "Enter a valid phone number" : "Enter a valid card number");
            return;
        }

        setStep('PROCESSING');
        setError('');

        try {
            const res = method === 'MPESA'
                ? await initiateMpesaVerification(identifier)
                : await initiateCardVerification(identifier);

            if (res.success) {
                setStep('SUCCESS');
            } else {
                setError(res.message);
                setStep('PAYMENT');
            }
        } catch (e) {
            setError("Something went wrong. Try again.");
            setStep('PAYMENT');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <AnimatePresence mode="wait">
                {step === 'SUCCESS' ? (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm text-center"
                    >
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="w-10 h-10 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">You're a Pro!</h2>
                        <p className="text-slate-500 mb-6">Your 30-day free trial has started. Verification successful.</p>
                        <Button fullWidth onClick={onClose} className="shadow-lg shadow-green-200 bg-green-600 hover:bg-green-700">
                            Start Teaching
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="main"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-white text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                            <Crown className="w-12 h-12 mx-auto mb-3 text-yellow-300 drop-shadow-md animate-bounce" />
                            <h2 className="text-2xl font-extrabold mb-1">Teacher Pro Trial</h2>
                            <p className="text-indigo-100 font-medium text-sm">30 Days Free • Then KES 20/Day</p>
                        </div>

                        <div className="p-8">
                            {step === 'OFFER' && (
                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-xl">
                                            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shrink-0">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Unlimited Everything</h4>
                                                <p className="text-sm text-slate-500">Lesson plans, quizzes, and grading.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 p-3 bg-purple-50 rounded-xl">
                                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                                                <Star className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">Verify to Start</h4>
                                                <p className="text-sm text-slate-500">Pay KES 1 today to verify identity.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <Button fullWidth onClick={() => setStep('PAYMENT')} className="py-4 text-lg shadow-xl shadow-indigo-200">
                                        Active Free Trial
                                    </Button>
                                    <button onClick={onClose} className="w-full text-center text-sm text-slate-400 hover:text-slate-600">
                                        Maybe Later
                                    </button>
                                </div>
                            )}

                            {step === 'PAYMENT' && (
                                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <button
                                            onClick={() => { setMethod('MPESA'); setIdentifier(''); setError(''); }}
                                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'MPESA' ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                                        >
                                            <Smartphone className="w-6 h-6" />
                                            <span className="font-bold text-sm">M-Pesa</span>
                                        </button>
                                        <button
                                            onClick={() => { setMethod('CARD'); setIdentifier(''); setError(''); }}
                                            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${method === 'CARD' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 hover:border-slate-200 text-slate-500'}`}
                                        >
                                            <CreditCard className="w-6 h-6" />
                                            <span className="font-bold text-sm">Card</span>
                                        </button>
                                    </div>

                                    {method && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                                                    {method === 'MPESA' ? "M-Pesa Phone Number" : "Card Number"}
                                                </label>
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder={method === 'MPESA' ? "07XX XXX XXX" : "XXXX XXXX XXXX XXXX"}
                                                    className="w-full bg-white border-b-2 border-slate-200 p-2 text-lg font-mono outline-none focus:border-indigo-500 transition-colors"
                                                    value={identifier}
                                                    onChange={(e) => setIdentifier(e.target.value)}
                                                />
                                            </div>
                                            {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}
                                            <Button fullWidth onClick={handleVerify} className="py-3 shadow-lg">
                                                {method === 'MPESA' ? "Pay KES 1 & Verify" : "Verify Card"}
                                            </Button>
                                        </motion.div>
                                    )}

                                    <button onClick={() => setStep('OFFER')} className="w-full text-center text-sm text-slate-400 hover:text-slate-600">
                                        Back
                                    </button>
                                </div>
                            )}

                            {step === 'PROCESSING' && (
                                <div className="py-10 flex flex-col items-center text-center animate-pulse">
                                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                                    <h3 className="font-bold text-lg text-slate-800">Verifying...</h3>
                                    <p className="text-slate-500 text-sm">Check your phone for the push.</p>
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
