import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Lock, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

interface ParentPinModalProps {
    isOpen: boolean;
    onClose: () => void;
    hasPin: boolean; // true = verify existing PIN, false = set new PIN
    onSetPin: (pin: string) => Promise<{ success: boolean; message: string }>;
    onVerifyPin: (pin: string) => Promise<{ success: boolean; message: string }>;
    parentPhone?: string;
}

export const ParentPinModal: React.FC<ParentPinModalProps> = ({
    isOpen, onClose, hasPin, onSetPin, onVerifyPin, parentPhone
}) => {
    const [pin, setPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSetPin = async () => {
        if (pin.length !== 4) {
            setError('PIN must be exactly 4 digits');
            return;
        }
        if (pin !== confirmPin) {
            setError('PINs do not match');
            return;
        }
        setLoading(true);
        setError('');
        const result = await onSetPin(pin);
        setLoading(false);
        if (result.success) {
            setSuccess(true);
            setTimeout(() => { onClose(); setSuccess(false); setPin(''); setConfirmPin(''); }, 1500);
        } else {
            setError(result.message);
        }
    };

    const handleVerifyPin = async () => {
        if (pin.length !== 4) {
            setError('Enter the 4-digit parent PIN');
            return;
        }
        setLoading(true);
        setError('');
        const result = await onVerifyPin(pin);
        setLoading(false);
        if (result.success) {
            setSuccess(true);
            setTimeout(() => { onClose(); setSuccess(false); setPin(''); }, 1500);
        } else {
            setError(result.message);
        }
    };

    const handlePinInput = (value: string, setter: (v: string) => void) => {
        const digits = value.replace(/\D/g, '').slice(0, 4);
        setter(digits);
        setError('');
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl relative overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <button
                            onClick={() => { onClose(); setPin(''); setConfirmPin(''); setError(''); }}
                            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <div className="relative z-10 flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <ShieldCheck className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black">
                                    {hasPin ? 'Parent Approval' : 'Set Parent PIN'}
                                </h3>
                                <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1">
                                    {hasPin ? 'Enter PIN to unlock chat' : 'For child safety'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-8 space-y-6">
                        {success ? (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="flex flex-col items-center py-8"
                            >
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                                </div>
                                <h4 className="text-xl font-black text-slate-900 mb-1">
                                    {hasPin ? 'Chat Approved!' : 'PIN Set Successfully!'}
                                </h4>
                                <p className="text-sm text-slate-500 font-medium">
                                    {hasPin ? 'Your child can now chat with teachers.' : 'Your child will need this PIN to start chatting.'}
                                </p>
                            </motion.div>
                        ) : hasPin ? (
                            /* Verify existing PIN */
                            <>
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3">
                                    <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-amber-900">Parent permission required</p>
                                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                                            To chat with a teacher, ask your parent or guardian to enter the 4-digit PIN they set up.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        Parent PIN
                                    </label>
                                    <div className="flex justify-center gap-3">
                                        {[0, 1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className={`w-14 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all ${pin[i] ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-slate-50 text-slate-300'
                                                    }`}
                                            >
                                                {pin[i] ? '•' : '—'}
                                            </div>
                                        ))}
                                    </div>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={pin}
                                        onChange={e => handlePinInput(e.target.value, setPin)}
                                        placeholder="Enter 4-digit PIN"
                                        maxLength={4}
                                        autoFocus
                                        className="w-full text-center bg-transparent border-0 text-lg font-bold text-slate-800 focus:outline-none opacity-0 absolute"
                                        style={{ caretColor: 'transparent' }}
                                    />
                                    {/* Visible input for mobile */}
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={pin}
                                        onChange={e => handlePinInput(e.target.value, setPin)}
                                        placeholder="Enter 4-digit PIN"
                                        maxLength={4}
                                        autoFocus
                                        className="w-full text-center bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xl font-black text-slate-800 tracking-[1em] focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleVerifyPin}
                                    disabled={pin.length !== 4 || loading}
                                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${pin.length === 4 && !loading
                                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5'
                                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                        }`}
                                >
                                    {loading ? 'Verifying...' : 'Unlock Chat'}
                                </button>
                            </>
                        ) : (
                            /* Set new PIN */
                            <>
                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3">
                                    <KeyRound className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-blue-900">Parents: Set a 4-digit PIN</p>
                                        <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                            This PIN protects your child&apos;s ability to chat with teachers. Your child will need to ask you for this PIN before they can start any conversation.
                                        </p>
                                    </div>
                                </div>

                                {parentPhone && (
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm">
                                        <span className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">Parent Phone: </span>
                                        <span className="font-bold text-slate-700">{parentPhone}</span>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            Create PIN
                                        </label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={pin}
                                            onChange={e => handlePinInput(e.target.value, setPin)}
                                            placeholder="4 digits"
                                            maxLength={4}
                                            autoFocus
                                            className="w-full text-center bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xl font-black text-slate-800 tracking-[1em] focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                            Confirm PIN
                                        </label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={confirmPin}
                                            onChange={e => handlePinInput(e.target.value, setConfirmPin)}
                                            placeholder="Repeat 4 digits"
                                            maxLength={4}
                                            className="w-full text-center bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xl font-black text-slate-800 tracking-[1em] focus:border-indigo-500 focus:bg-white transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm font-bold bg-red-50 p-3 rounded-xl">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <button
                                    onClick={handleSetPin}
                                    disabled={pin.length !== 4 || confirmPin.length !== 4 || loading}
                                    className={`w-full py-4 rounded-2xl font-black text-lg transition-all ${pin.length === 4 && confirmPin.length === 4 && !loading
                                            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5'
                                            : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                        }`}
                                >
                                    {loading ? 'Setting PIN...' : 'Set Parent PIN'}
                                </button>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
