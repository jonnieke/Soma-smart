import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Loader2, CheckCircle2, XCircle, ArrowLeft, ShieldCheck, CreditCard, ExternalLink, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { pesapalService } from '../../services/pesapalService';

interface Props {
    plan: any;
    onSuccess: () => void;
    onCancel: () => void;
}

export const PaymentFlow: React.FC<Props> = ({ plan, onSuccess, onCancel }) => {
    const { userId, studentProfile, teacherProfile, role } = useApp();
    const [step, setStep] = useState<'INPUT' | 'IFRAME' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('INPUT');
    const [phone, setPhone] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [iframeUrl, setIframeUrl] = useState('');
    const [error, setError] = useState('');

    // Pre-fill profile data for registered users
    useEffect(() => {
        if (studentProfile) {
            const names = studentProfile.name.split(' ');
            setFirstName(names[0] || '');
            setLastName(names.slice(1).join(' ') || 'Learner');
            // Email might not be in studentProfile yet, but we can attempt to get it if needed
            // For now, if studentProfile exists, we at least have the name
        } else if (teacherProfile) {
            const names = teacherProfile.name.split(' ');
            setFirstName(names[0] || '');
            setLastName(names.slice(1).join(' ') || 'Teacher');
        }
    }, [studentProfile, teacherProfile]);

    const isRegistered = !!(studentProfile || teacherProfile);

    const handlePayment = async () => {
        if (!phone || (!isRegistered && (!firstName || !lastName || !email))) {
            setError(isRegistered ? 'Please enter your phone number' : 'Please fill in all contact details');
            return;
        }

        setStep('PROCESSING');
        setError('');

        try {
            // Priority for UUID: Auth session > Profile ID > Guest dummy
            const profileId = studentProfile?.id || teacherProfile?.id;
            const uid = userId || profileId || '00000000-0000-0000-0000-000000000000';

            // Fallback email for registered users if empty
            const profileEmail = studentProfile?.email || teacherProfile?.email;
            const finalEmail = email || profileEmail || (role === 'TEACHER' ? 'teacher@soma.app' : 'learner@soma.app');

            const response = await pesapalService.initiatePayment(uid, plan, {
                email: finalEmail,
                firstName: firstName || (role === 'TEACHER' ? 'Teacher' : 'Learner'),
                lastName: lastName || 'User',
                phone: `254${phone.replace(/^0/, '')}`
            });

            if (response.redirect_url) {
                setIframeUrl(response.redirect_url);
                setStep('IFRAME');
            } else {
                throw new Error('Failed to get payment URL');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Payment initiation failed. Please try again.');
            setStep('ERROR');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {step === 'INPUT' && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-8"
                        >
                            <button onClick={onCancel} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold text-sm">
                                <ArrowLeft className="w-4 h-4" /> Back to Plans
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
                                    <Smartphone className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">M-Pesa Payment</h2>
                                    <p className="text-slate-500 font-medium">Paying KES {plan.price.toLocaleString()} for {plan.name}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {!isRegistered && (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">First Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent font-bold outline-none"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                />
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Last Name</label>
                                                <input
                                                    type="text"
                                                    className="w-full bg-transparent font-bold outline-none"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                className="w-full bg-transparent font-bold outline-none"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}

                                {isRegistered && (
                                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-2">
                                        <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Paying as</p>
                                        <p className="font-bold text-slate-700">{firstName} {lastName}</p>
                                        <div className="hidden">
                                            <input type="text" value={firstName} readOnly />
                                            <input type="text" value={lastName} readOnly />
                                            <input type="text" value={email} readOnly />
                                        </div>
                                    </div>
                                )}

                                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Phone Number</label>
                                    <div className="flex items-center gap-3">
                                        <span className="font-bold text-slate-400">+254</span>
                                        <input
                                            type="tel"
                                            placeholder="7XX XXX XXX"
                                            className="w-full bg-transparent font-bold outline-none placeholder:text-slate-300"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

                                <button
                                    onClick={handlePayment}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
                                >
                                    Proceed to Payment <ArrowRight className="w-6 h-6" />
                                </button>

                                <div className="flex items-center justify-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-4">
                                    <ShieldCheck className="w-4 h-4" /> Secure SSL Encrypted Checkout
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'PROCESSING' && (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-12 text-center"
                        >
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <Loader2 className="w-full h-full text-indigo-600 animate-spin" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Securing Connection</h2>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Please wait while we connect to Pesapal Secure Gateway...
                            </p>
                        </motion.div>
                    )}

                    {step === 'IFRAME' && (
                        <motion.div
                            key="iframe"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="h-[600px] flex flex-col"
                        >
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Secure Pesapal Checkout</span>
                                </div>
                                <button onClick={onCancel} className="text-slate-400 hover:text-red-500 font-bold text-xs uppercase">Cancel</button>
                            </div>
                            <iframe
                                src={iframeUrl}
                                className="w-full flex-1 border-none"
                                title="Pesapal Checkout"
                                allow="payment"
                            />
                        </motion.div>
                    )}

                    {step === 'SUCCESS' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-12 text-center"
                        >
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">Karibu Pro! 🎉</h2>
                            <p className="text-slate-500 font-medium">Payment received. Your account is being upgraded right now.</p>
                        </motion.div>
                    )}

                    {step === 'ERROR' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-12 text-center"
                        >
                            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-8 text-red-600">
                                <XCircle className="w-12 h-12" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Cancelled</h2>
                            <p className="text-slate-500 font-medium mb-8">It seems the payment was declined or timed out. Please try again.</p>
                            <button
                                onClick={() => setStep('INPUT')}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold"
                            >
                                Try Again
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
