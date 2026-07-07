import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactGA from 'react-ga4';
import { Smartphone, Loader2, CheckCircle2, XCircle, ArrowLeft, ShieldCheck, CreditCard, ExternalLink, ArrowRight, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { pesapalService } from '../../services/pesapalService';
import { getCreditPackExpiry } from '../../services/planLimitService';
import { UserRole } from '../../types';
import { supabase } from '../../lib/supabase';
import { trackAnalyticsEvent } from '../../services/analyticsEventService';
import { verifyAndFixSubscription } from '../../services/subscriptionService';
import { GA_MEASUREMENT_ID } from '../../config/analytics';

interface Props {
    plan: any;
    materialId?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const PaymentFlow: React.FC<Props> = ({ plan, materialId, onSuccess, onCancel }) => {
    const { userId, studentProfile, teacherProfile, role, login, registerStudent, refreshProfile, grantLearningCredits } = useApp();
    const [step, setStep] = useState<'INPUT' | 'IFRAME' | 'PROCESSING' | 'SUCCESS' | 'ERROR'>('INPUT');
    const [phone, setPhone] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [payerMode, setPayerMode] = useState<'NEW' | 'EXISTING'>('NEW');
    const [existingStudentCode, setExistingStudentCode] = useState('');
    const [existingStudentProfileId, setExistingStudentProfileId] = useState<string | null>(null);
    const existingStudentProfileIdRef = useRef<string | null>(null);
    const [isResolvingStudent, setIsResolvingStudent] = useState(false);
    const [iframeUrl, setIframeUrl] = useState('');
    const [paymentReference, setPaymentReference] = useState<string | null>(null);
    const [paymentUserId, setPaymentUserId] = useState<string | null>(null);
    const [iframeFailed, setIframeFailed] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);
    const [autoOpenedCheckout, setAutoOpenedCheckout] = useState(false);
    const [error, setError] = useState('');
    const isCreditPackCheckout = Boolean(plan?.isCreditPack || String(plan?.id || '').startsWith('credit_'));
    const isSubscriptionCheckout = Boolean(plan?.segment === 'STUDENT' || plan?.segment === 'TEACHER') && plan?.id !== 'download_pack_5' && !materialId && !isCreditPackCheckout;
    
    const getPlanLabel = (tier?: string | null) => {
        const t = String(tier || '').toUpperCase();
        if (t === 'DAILY') return 'Daily Plan';
        if (t === 'WEEKLY') return 'Weekly Plan';
        if (t === 'MONTHLY') return 'Monthly Plan';
        if (t === 'TERMLY') return 'Termly Plan';
        if (t === 'ANNUAL') return 'Annual Plan';
        if (t === 'PRO') return 'Pro Plan';
        return t ? `${t} Plan` : 'Active Plan';
    };

    const hasActiveSubscription = async (profileId: string): Promise<{ active: boolean; plan?: string }> => {
        try {
            await verifyAndFixSubscription(profileId);
            const { data, error: subError } = await supabase
                .from('profiles')
                .select('subscription_tier, subscription_expiry')
                .eq('id', profileId)
                .maybeSingle();

            if (subError || !data) return { active: false };
            const tier = String(data.subscription_tier || 'FREE').toUpperCase();
            const expiry = data.subscription_expiry ? new Date(data.subscription_expiry) : null;
            const now = new Date();
            const active = tier !== 'FREE' && !!expiry && expiry > now;
            if (active) return { active: true, plan: tier };

            const repaired = await verifyAndFixSubscription(profileId);
            if (!repaired) return { active: false };

            const { data: repairedData } = await supabase
                .from('profiles')
                .select('subscription_tier, subscription_expiry')
                .eq('id', profileId)
                .maybeSingle();

            const repairedTier = String(repairedData?.subscription_tier || 'FREE').toUpperCase();
            const repairedExpiry = repairedData?.subscription_expiry ? new Date(repairedData.subscription_expiry) : null;
            return {
                active: repairedTier !== 'FREE' && !!repairedExpiry && repairedExpiry > now,
                plan: repairedTier
            };
        } catch {
            return { active: false };
        }
    };

    const trackFunnelEvent = (eventName: string, params: Record<string, unknown> = {}) => {
        try {
            if (GA_MEASUREMENT_ID !== 'G-CHECK_GA_DASHBOARD') {
                ReactGA.event(eventName, params);
            }
            void trackAnalyticsEvent({
                eventType: 'FUNNEL',
                eventName,
                path: `${window.location.pathname}${window.location.search}`,
                metadata: params,
            });
        } catch (_) {
            // Non-blocking analytics
        }
    };

    // Pre-fill profile data for registered users
    useEffect(() => {
        const profile = teacherProfile || studentProfile;
        if (profile) {
            const names = profile.name.split(' ');
            setFirstName(names[0] || '');
            setLastName(names.slice(1).join(' ') || (role === UserRole.TEACHER ? 'Teacher' : 'Learner'));
            if (profile.email) setEmail(profile.email);

            // Pre-fill phone if available (parentPhone for students)
            const profilePhone = (profile as any).parentPhone || '';
            if (profilePhone) {
                // Sanitize: strip 254 or +254 to fit the 7XX... format
                setPhone(profilePhone.replace(/^\+?254/, '0').replace(/^0/, ''));
            }
        }
    }, [studentProfile, teacherProfile, role]);

    useEffect(() => {
        if (!isSubscriptionCheckout || step !== 'INPUT') return;
        const profileId = studentProfile?.id || teacherProfile?.id || userId;
        if (!profileId) return;

        let cancelled = false;
        const blockDuplicateCheckout = async () => {
            const existingSub = await hasActiveSubscription(profileId);
            if (cancelled || !existingSub.active) return;

            setError(`Already subscribed: ${getPlanLabel(existingSub.plan)} is still active. Returning to your dashboard...`);
            setStep('SUCCESS');
            await refreshProfile();
            window.setTimeout(onSuccess, 700);
        };

        blockDuplicateCheckout();
        return () => {
            cancelled = true;
        };
    }, [isSubscriptionCheckout, step, studentProfile?.id, teacherProfile?.id, userId, refreshProfile, onSuccess]);

    const isRegistered = !!(studentProfile || teacherProfile);
    const isGuestExistingStudent = !isRegistered && payerMode === 'EXISTING';
    const GUEST_DUMMY_UUID = '00000000-0000-0000-0000-000000000000';

    // Poll for payment success when in IFRAME
    useEffect(() => {
        if (step !== 'IFRAME') return;

        const interval = setInterval(async () => {
            const profileId = studentProfile?.id || teacherProfile?.id;
            const uid = paymentUserId || userId || profileId || existingStudentProfileId;
            if (!uid) return;

            try {
                let data: { status?: string } | null = null;
                if (paymentReference) {
                    const { data: refData } = await supabase
                        .from('transactions')
                        .select('status')
                        .eq('reference_code', paymentReference)
                        .maybeSingle();
                    data = refData;
                }

                if (!data) {
                    const { data: latestData } = await supabase
                    .from('transactions')
                    .select('status')
                    .eq('user_id', uid)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                    data = latestData;
                }

                if (data && data.status === 'SUCCESS') {
                    // Stop polling while we process success
                    clearInterval(interval);
                    
                    setStep('SUCCESS');
                    setTimeout(async () => {
                        // Polling for profile update to resolve IPN race condition
                        const checkProfileUpdate = async (profileId: string) => {
                            for (let i = 0; i < 5; i++) {
                                const { data: p } = await supabase.from('profiles').select('subscription_tier').eq('id', profileId).maybeSingle();
                                if (p && p.subscription_tier && p.subscription_tier !== 'FREE') return true;
                                await new Promise(r => setTimeout(r, 1000));
                            }
                            return false;
                        };

                        const creditProfileId = studentProfile?.id || teacherProfile?.id || paymentUserId || existingStudentProfileId || userId;
                        const creditExpiry = getCreditPackExpiry(plan?.duration);
                        if (isCreditPackCheckout && plan?.credits) {
                            try {
                                if (creditProfileId) {
                                    const { error: creditErr } = await supabase.rpc('grant_learning_credits', {
                                        p_profile_id: creditProfileId,
                                        p_credits: plan.credits,
                                        p_expires_at: creditExpiry
                                    });
                                    if (creditErr) throw creditErr;
                                    grantLearningCredits(plan.credits, creditExpiry);
                                } else {
                                    grantLearningCredits(plan.credits, creditExpiry);
                                }
                            } catch (creditErr) {
                                console.warn('Could not persist learning credits, falling back to local wallet:', creditErr);
                                grantLearningCredits(plan.credits, creditExpiry);
                            }
                        }

                        // Credit packs do not change subscription tier, so avoid waiting for a
                        // subscription profile update that will never happen.
                        if (isCreditPackCheckout) {
                            if (!isRegistered && existingStudentCode) {
                                await login(existingStudentCode);
                            } else {
                                await refreshProfile();
                            }
                            onSuccess();
                            return;
                        }

                        // Always attempt account handoff after subscription success to avoid guest/paywall loops.
                        if (!isRegistered) {
                            if (existingStudentCode) {
                                // Guest used existing student ID
                                if (existingStudentProfileId) await checkProfileUpdate(existingStudentProfileId);
                                await login(existingStudentCode);
                            } else if (paymentUserId && paymentUserId !== GUEST_DUMMY_UUID) {
                                // Guest created a new account during payment
                                await checkProfileUpdate(paymentUserId);
                                const { data: paidProfile } = await supabase
                                    .from('profiles')
                                    .select('student_id')
                                    .eq('id', paymentUserId)
                                    .maybeSingle();
                                if (paidProfile?.student_id) {
                                    await login(paidProfile.student_id);
                                }
                            }
                        } else {
                            // User is already registered and logged in, refresh context to pick up new tier
                            if (uid && uid !== GUEST_DUMMY_UUID) {
                                await checkProfileUpdate(uid);
                            }
                            await refreshProfile();
                        }
                        onSuccess();
                    }, 2000); // 2 second buffer to allow IPN to save profile
                } else if (data && data.status === 'FAILED') {
                    setStep('ERROR');
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, [step, paymentUserId, userId, studentProfile, teacherProfile, existingStudentProfileId, paymentReference, onSuccess, isRegistered, existingStudentCode, login, isCreditPackCheckout, plan?.credits, grantLearningCredits, refreshProfile]);

    const resolveExistingStudent = async (): Promise<boolean> => {
        const code = existingStudentCode.trim().toUpperCase();
        if (!code) {
            setError('Enter Student ID (SOMA-XXXX)');
            return false;
        }

        setIsResolvingStudent(true);
        setError('');
        try {
            const { data, error: lookupError } = await supabase
                .from('profiles')
                .select('id, full_name, email, parent_phone, student_id')
                .eq('student_id', code)
                .maybeSingle();

            if (lookupError) throw lookupError;
            if (!data) {
                setError('Student ID not found. Confirm and try again.');
                setExistingStudentProfileId(null);
                existingStudentProfileIdRef.current = null;
                return false;
            }

            const names = (data.full_name || '').trim().split(/\s+/).filter(Boolean);
            setFirstName(names[0] || 'Learner');
            setLastName(names.slice(1).join(' ') || 'User');
            setEmail(data.email || '');
            setPhone(((data.parent_phone || '') as string).replace(/^\+?254/, '').replace(/^0/, ''));
            setExistingStudentProfileId(data.id);
            existingStudentProfileIdRef.current = data.id;
            setExistingStudentCode(data.student_id || code);

            if (isSubscriptionCheckout) {
                const existingSub = await hasActiveSubscription(data.id);
                if (existingSub.active) {
                    setError(`Already subscribed: ${getPlanLabel(existingSub.plan)} is still active. Redirecting...`);
                    setStep('SUCCESS');
                    await login(data.student_id || code);
                    window.setTimeout(onSuccess, 700);
                    return false;
                }
            }
            return true;
        } catch (lookupErr) {
            console.error('Existing student lookup failed:', lookupErr);
            setError('Could not verify Student ID right now. Please try again.');
            setExistingStudentProfileId(null);
            existingStudentProfileIdRef.current = null;
            return false;
        } finally {
            setIsResolvingStudent(false);
        }
    };

    const handlePayment = async () => {
        if (!isRegistered && !isGuestExistingStudent) {
            setError('For guest checkout, use Existing Student and verify a SOMA ID first.');
            return;
        }

        if (isGuestExistingStudent && !existingStudentProfileId) {
            const resolved = await resolveExistingStudent();
            if (!resolved) return;
        }

        if (!phone || (!isRegistered && !isGuestExistingStudent && (!firstName || !lastName || !email))) {
            setError(isRegistered ? 'Please enter your phone number' : 'Please fill in all contact details');
            return;
        }

        const profileId = studentProfile?.id || teacherProfile?.id || existingStudentProfileId || existingStudentProfileIdRef.current;
        if (profileId && isSubscriptionCheckout) {
            const existingSub = await hasActiveSubscription(profileId);
            if (existingSub.active) {
                setError(`Already subscribed: ${getPlanLabel(existingSub.plan)} is still active. Redirecting...`);
                setStep('SUCCESS');
                setTimeout(async () => {
                    if (!isRegistered && existingStudentCode) {
                        await login(existingStudentCode);
                    }
                    onSuccess();
                }, 900);
                return;
            }
        }

        setStep('PROCESSING');
        setError('');
        trackFunnelEvent('payment_started', {
            plan_id: plan?.id,
            plan_name: plan?.name,
            amount_kes: plan?.price,
            is_registered: isRegistered,
            role
        });
        trackFunnelEvent('payment_initiated', {
            plan_id: plan?.id,
            plan_name: plan?.name,
            amount_kes: plan?.price,
            is_registered: isRegistered,
            role
        });

        try {
            // Auto-register NEW learners so their payment attaches to a real account
            let finalUid = userId || studentProfile?.id || teacherProfile?.id || existingStudentProfileId || existingStudentProfileIdRef.current;
            let finalEmail = email || studentProfile?.email || teacherProfile?.email;
            
            if (!isRegistered && payerMode === 'NEW') {
                setIsResolvingStudent(true);
                const regResult = await registerStudent(`${firstName} ${lastName}`.trim(), 'Unknown', '1234', `254${phone.replace(/^0/, '')}`);
                if (!regResult.success || !regResult.data) {
                    setError(regResult.message || 'Failed to create student account automatically.');
                    setStep('INPUT');
                    setIsResolvingStudent(false);
                    return;
                }
                
                // Get the real UID
                const newCode = regResult.data;
                const { data: newProfile } = await supabase.from('profiles').select('id, email').eq('student_id', newCode).maybeSingle();
                if (newProfile?.id) {
                    finalUid = newProfile.id;
                    finalEmail = email || newProfile.email;
                    setExistingStudentCode(newCode); // Save for login later
                }
                setIsResolvingStudent(false);
            }

            const uid = finalUid || GUEST_DUMMY_UUID;
            finalEmail = finalEmail || (role === 'TEACHER' ? 'teacher@soma.app' : 'learner@soma.app');

            const response = await pesapalService.initiatePayment(uid, plan, {
                email: finalEmail,
                firstName: firstName || (role === 'TEACHER' ? 'Teacher' : 'Learner'),
                lastName: lastName || 'User',
                phone: `254${phone.replace(/^0/, '')}`
            }, materialId);

            if (response.redirect_url) {
                setIframeUrl(response.redirect_url);
                setPaymentReference(response.client_reference || null);
                setPaymentUserId(uid);
                
                // Persist reference to localStorage for self-healing/recovery
                if (response.client_reference) {
                    localStorage.setItem('soma_last_payment_reference', response.client_reference);
                    localStorage.setItem('soma_last_payment_time', Date.now().toString());
                    localStorage.setItem('soma_last_payment_amount', plan.price.toString());
                }

                setIframeLoaded(false);
                setAutoOpenedCheckout(false);
                setIframeFailed(false);
                setStep('IFRAME');
                trackFunnelEvent('payment_iframe_opened', {
                    plan_id: plan?.id,
                    plan_name: plan?.name,
                    amount_kes: plan?.price
                });
            } else {
                throw new Error('Failed to get payment URL');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Payment initiation failed. Please try again.');
            setStep('ERROR');
        }
    };

    useEffect(() => {
        if (isRegistered) return;
        setError('');
        setExistingStudentProfileId(null);
        existingStudentProfileIdRef.current = null;
        if (payerMode === 'NEW') {
            setExistingStudentCode('');
        }
    }, [payerMode, isRegistered]);

    const openCheckoutDirectly = () => {
        if (!iframeUrl) return;
        const opened = window.open(iframeUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
            window.location.href = iframeUrl;
        }
    };

    useEffect(() => {
        if (step !== 'IFRAME' || !iframeUrl || iframeLoaded || autoOpenedCheckout) return;

        const timeout = window.setTimeout(() => {
            // In some in-app browsers, the checkout iframe stays blank.
            // Auto-fallback so users don't need to click manually.
            setIframeFailed(true);
            setAutoOpenedCheckout(true);
            openCheckoutDirectly();
        }, 2200);

        return () => window.clearTimeout(timeout);
    }, [step, iframeUrl, iframeLoaded, autoOpenedCheckout]);

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
                                    <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => setPayerMode('NEW')}
                                            className={`py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${payerMode === 'NEW' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            New Learner
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPayerMode('EXISTING')}
                                            className={`py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${payerMode === 'EXISTING' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                                        >
                                            Existing Student
                                        </button>
                                    </div>
                                )}
                                {!isRegistered && payerMode === 'NEW' && (
                                    <div className="mx-1 p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-medium">
                                        We will automatically generate a <span className="font-black">SOMA ID</span> for you after payment so you can access your resources on any device.
                                    </div>
                                )}

                                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mb-2">
                                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Paying as</p>
                                    <p className="font-bold text-slate-700">{firstName} {lastName}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{email}</p>
                                </div>

                                {!isRegistered && payerMode === 'EXISTING' && (
                                    <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Student ID</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="SOMA-XXXX"
                                                className="w-full bg-transparent font-bold uppercase outline-none placeholder:text-slate-300"
                                                value={existingStudentCode}
                                                onChange={(e) => {
                                                    setExistingStudentCode(e.target.value.toUpperCase());
                                                    setExistingStudentProfileId(null);
                                                    existingStudentProfileIdRef.current = null;
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={resolveExistingStudent}
                                                disabled={isResolvingStudent || !existingStudentCode.trim()}
                                                className="px-3 py-2 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                                            >
                                                {isResolvingStudent ? 'Checking...' : existingStudentProfileId ? 'Verified' : 'Verify'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {!isRegistered && payerMode === 'NEW' && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">First Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Amina"
                                                className="w-full bg-transparent font-bold outline-none placeholder:text-slate-300"
                                                value={firstName}
                                                onChange={(e) => setFirstName(e.target.value)}
                                            />
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Last Name</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Otieno"
                                                className="w-full bg-transparent font-bold outline-none placeholder:text-slate-300"
                                                value={lastName}
                                                onChange={(e) => setLastName(e.target.value)}
                                            />
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                placeholder="e.g. parent@email.com"
                                                className="w-full bg-transparent font-bold outline-none placeholder:text-slate-300"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">M-Pesa Phone Number</label>
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

                                <div className="flex flex-col items-center justify-center gap-3 pt-6">
                                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure SSL Checkout
                                    </div>
                                    <div className="flex gap-4 opacity-50 grayscale scale-75">
                                        <div className="w-10 h-6 bg-slate-200 rounded"></div>
                                        <div className="w-10 h-6 bg-slate-200 rounded"></div>
                                        <div className="w-10 h-6 bg-slate-200 rounded"></div>
                                    </div>
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
                            <div className="relative w-32 h-32 mx-auto mb-8">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                                    transition={{ repeat: Infinity, duration: 4 }}
                                    className="absolute inset-0 bg-indigo-600/10 rounded-full blur-2xl"
                                ></motion.div>
                                <Sparkles className="w-full h-full text-indigo-600 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Securing Connection</h2>
                            <p className="text-slate-500 font-medium leading-relaxed px-4">
                                Preparing your secure gateway to <br /><span className="text-indigo-600 font-black">Pesapal Africa</span>
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
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={openCheckoutDirectly}
                                        className="text-indigo-600 hover:text-indigo-800 font-bold text-xs uppercase inline-flex items-center gap-1"
                                    >
                                        Open Checkout <ExternalLink className="w-3 h-3" />
                                    </button>
                                    <button onClick={onCancel} className="text-slate-400 hover:text-red-500 font-bold text-xs uppercase">Cancel</button>
                                </div>
                            </div>
                            {iframeFailed && (
                                <div className="mx-4 mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                                    Embedded checkout could not load in this browser. Use <span className="font-black">Open Checkout</span> above to continue payment securely.
                                </div>
                            )}
                            <iframe
                                src={iframeUrl}
                                className="w-full flex-1 border-none"
                                title="Pesapal Checkout"
                                allow="payment"
                                onLoad={() => setIframeLoaded(true)}
                                onError={() => setIframeFailed(true)}
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
                            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">
                                {isCreditPackCheckout ? 'Credits Added' : 'Karibu Pro!'}
                            </h2>
                            <p className="text-slate-500 font-medium mb-6">
                                {isCreditPackCheckout
                                    ? `${plan?.credits || 0} learning credits are being added for the active term.`
                                    : 'Payment received. Your account is being upgraded right now.'}
                            </p>
                            
                            {!isRegistered && existingStudentCode && payerMode === 'NEW' && (
                                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-left">
                                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-2">Save Your Credentials</p>
                                    <p className="text-sm text-slate-700 mb-1">We created a student account for you:</p>
                                    <p className="text-lg font-black text-slate-900 font-mono">{existingStudentCode}</p>
                                    <p className="text-xs text-slate-500 mt-2">PIN: <span className="font-bold">1234</span></p>
                                </div>
                            )}
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
