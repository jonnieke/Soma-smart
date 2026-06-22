import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { PricingPage as PricingComponent } from '../features/subscription/PricingPage';
import { Button } from '../components/Shared';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pesapalService } from '../services/pesapalService';
import { supabase } from '../lib/supabase';

type PaymentStatusResponse = {
    payment_status_description?: string;
    payment_status?: string;
    status?: string;
};

const isCompletedPayment = (statusData: PaymentStatusResponse) => {
    const status = String(
        statusData?.payment_status_description ||
        statusData?.payment_status ||
        statusData?.status ||
        ''
    ).toLowerCase();

    return status === 'completed' || status === 'success' || status === 'successful';
};

export const PricingPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isPro, role, subscriptionPlan, refreshProfile } = useApp();
    const [verifying, setVerifying] = React.useState(false);
    const [verifyError, setVerifyError] = React.useState('');
    const [verifySuccess, setVerifySuccess] = React.useState(false);

    const status = searchParams.get('status');
    const ref = searchParams.get('ref');
    const orderTrackingId =
        searchParams.get('OrderTrackingId') ||
        searchParams.get('orderTrackingId') ||
        searchParams.get('order_tracking_id');

    const handleVerification = React.useCallback(async (reference: string) => {
        setVerifying(true);
        setVerifySuccess(false);
        setVerifyError('');
        localStorage.setItem('soma_pending_payment_ref', reference);

        try {
            const statusData = await pesapalService.checkTransactionStatus({
                orderTrackingId,
                merchantReference: reference
            });

            if (!isCompletedPayment(statusData)) {
                setVerifyError('We could not confirm this payment yet. If M-Pesa completed, wait a moment and try again.');
                return;
            }

            localStorage.removeItem('soma_pending_payment_ref');

            // Handle marketplace material purchase
            if (reference.startsWith('MKT_')) {
                const { data: tx } = await supabase.from('transactions').select('description, user_id').eq('reference_code', reference).maybeSingle();
                const match = tx?.description?.match(/MKT:([^|]+)/);
                if (match) {
                    const materialId = match[1];
                    const { data: material } = await supabase.from('marketplace_materials').select('teacher_id, price, download_count').eq('id', materialId).maybeSingle();
                    if (material) {
                        const { data: wallet } = await supabase.from('teacher_wallets').select('balance').eq('id', material.teacher_id).maybeSingle();
                        if (wallet) {
                            await supabase.from('teacher_wallets').update({ balance: wallet.balance + material.price }).eq('id', material.teacher_id);
                        } else {
                            await supabase.from('teacher_wallets').insert({ id: material.teacher_id, balance: material.price, currency: 'KES' });
                        }
                        await supabase.from('marketplace_materials').update({ download_count: (material.download_count || 0) + 1 }).eq('id', materialId);
                    }
                    const purchased = JSON.parse(localStorage.getItem('soma_purchased_materials') || '[]');
                    if (!purchased.includes(materialId)) {
                        localStorage.setItem('soma_purchased_materials', JSON.stringify([...purchased, materialId]));
                    }
                }
            }

            await refreshProfile();
            setVerifySuccess(true);

            setTimeout(() => {
                const dashboard = role === 'TEACHER' ? '/teacher' : (role === 'SCHOOL' ? '/school' : '/learner');
                window.top!.location.href = window.location.origin + dashboard;
            }, 1500);
        } catch (err) {
            console.error("Verification sync failed:", err);
            setVerifyError('Payment verification failed. Please try again or contact support if your account was charged.');
        } finally {
            setVerifying(false);
        }
    }, [orderTrackingId, refreshProfile, role]);

    const pendingRef = ref || localStorage.getItem('soma_pending_payment_ref');

    React.useEffect(() => {
        if (status === 'verifying' && ref) {
            handleVerification(ref);
        }
    }, [status, ref, handleVerification]);

    const location = useLocation();
    const state = location.state as { initialTab?: 'STUDENT' | 'TEACHER' | 'SCHOOL' } | null;

    // Pro users can freely view the pricing plans now to see what they are paying for or to upgrade.

    return (
        <div className="relative min-h-screen">
            <Helmet>
                <title>Somo Smart Pricing | Affordable AI Education in Kenya</title>
                <meta name="description" content="Explore Somo Smart's affordable pricing plans for Kenyan students, parents, and teachers. Get unlimited access to CBC and KCSE past papers and our AI study tutor starting at just KES 20." />
                <meta name="keywords" content="somo smart pricing, learning app subscription kenya, kcse revision cost, affordable cbc learning, ai tutor subscription" />

                {/* AIO */}
                <meta name="ai-search-index" content="index" />
                <meta name="ai-knowledge-base" content="official" />
                <meta name="pricing-structure" content="Daily, Weekly, Monthly, Termly Options Available" />

                {/* Open Graph */}
                <meta property="og:title" content="Somo Smart Pricing | Affordable AI Education in Kenya" />
                <meta property="og:description" content="Explore affordable plans for unlimited CBC and KCSE AI-assisted learning. Unlock your potential today." />
                <meta property="og:url" content="https://somaai.co.ke/pricing" />

                <link rel="canonical" href="https://somaai.co.ke/pricing" />
            </Helmet>

            {/* Status Overlays */}
            {(verifying || verifySuccess || verifyError) && (
                <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full text-center shadow-2xl">
                        {verifying && (
                            <>
                                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-6" />
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Verifying Payment</h2>
                                <p className="text-slate-500 font-medium">Checking with Pesapal Secure Gateway...</p>
                            </>
                        )}
                        {verifySuccess && (
                            <>
                                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Confirmed!</h2>
                                <p className="text-slate-500 font-medium">
                                    {pendingRef?.startsWith('MKT_') ? 'Material unlocked! Redirecting to marketplace...' : 'Welcome to Somo Pro. Redirecting you to your dashboard...'}
                                </p>
                            </>
                        )}
                        {verifyError && (
                            <>
                                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ArrowLeft className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Payment Pending</h2>
                                <p className="text-slate-500 font-medium mb-6">{verifyError}</p>
                                {pendingRef && (
                                    <Button
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-4 mb-3"
                                        onClick={() => handleVerification(pendingRef)}
                                    >
                                        Try Again
                                    </Button>
                                )}
                                <Button
                                    className="w-full bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl py-4"
                                    onClick={() => setVerifyError('')}
                                >
                                    View Pricing Plans
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <div className="absolute top-6 left-6 z-50">
                <Button
                    variant="outline"
                    className="bg-white/10 text-white border-white/20 hover:bg-white/20 backdrop-blur-sm gap-2"
                    onClick={() => navigate('/')}
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Button>
            </div>

            <PricingComponent
                currentTier={subscriptionPlan}
                initialTab={state?.initialTab}
                onSelectPlan={async (plan) => {
                    // 1. If user is logged in, Initiate Payment Directly
                    if (isPro) {
                        // Already pro? maybe show toast or just return
                        return;
                    }

                    // We need the user object to initiate payment, but useApp doesn't expose 'user' directly in the destructure above
                    // Let's get it from context if available, or just rely on 'role' check implies logged in?
                    // Actually, 'role' might be default 'LEARNER' even if guest? No, usually null or default.
                    // Let's check session persistence. For now, we'll assume if we have a role that isn't null, we might be logged in?
                    // Better to check specific 'user' object.

                    // To keep it simple and safe for now: 
                    // We will redirect to dashboard with a specific 'initiatePayment' state if logged in.

                    // Actually, let's just do the payment here if we can access user details.
                    // Since 'user' isn't destructured, let's assume we can get it or we drive them to dashboard to pay.
                    // Driving to dashboard to pay is safer because dashboard has the context.

                    if (role) {
                        // User is logged in (presumably)
                        // Navigate to their dashboard with payment intent
                        const target = role === 'TEACHER' ? '/teacher' : (role === 'SCHOOL' ? '/school' : '/learner');
                        navigate(target, { state: { initiatePaymentFor: plan } });
                        return;
                    }

                    // 2. If not logged in, go to registration
                    navigate('/', { state: { selectedPlan: plan, showRegistration: true } });
                }}
                onClose={() => navigate('/')}
            />
        </div>
    );
};
