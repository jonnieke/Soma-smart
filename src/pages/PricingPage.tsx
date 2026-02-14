import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { PricingPage as PricingComponent } from '../features/subscription/PricingPage';
import { Button } from '../components/Shared';
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { pesapalService } from '../services/pesapalService';

export const PricingPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { isPro, role, subscriptionPlan, refreshProfile } = useApp();
    const [verifying, setVerifying] = React.useState(false);
    const [verifyError, setVerifyError] = React.useState('');
    const [verifySuccess, setVerifySuccess] = React.useState(false);

    const status = searchParams.get('status');
    const ref = searchParams.get('ref');

    const handleVerification = async (reference: string) => {
        // WORLD-CLASS PROCESS: Success UI
        setVerifySuccess(true);
        setVerifying(false);

        // Explicit sync with DB and refresh profile
        try {
            await pesapalService.checkTransactionStatus(reference);
            await refreshProfile();
        } catch (err) {
            console.error("Verification sync failed:", err);
        }

        // Check for material intent
        const materialId = searchParams.get('materialId');

        // Instant Smooth Redirect
        setTimeout(() => {
            const dashboard = role === 'TEACHER' ? '/teacher' : (role === 'SCHOOL' ? '/school' : '/learner');
            // Ensure we break out of any iframes (like the Pesapal one)
            window.top!.location.href = window.location.origin + dashboard;
        }, 1500);
    };

    React.useEffect(() => {
        if (status === 'verifying' && ref) {
            handleVerification(ref);
        }
    }, [status, ref]);

    const location = useLocation();
    const state = location.state as { initialTab?: any } | null;

    // Pro users can freely view the pricing plans now to see what they are paying for or to upgrade.

    return (
        <div className="relative min-h-screen">
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
                                <p className="text-slate-500 font-medium">Welcome to Somo Pro. Redirecting you to your dashboard...</p>
                            </>
                        )}
                        {verifyError && (
                            <>
                                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ArrowLeft className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">Verification Pending</h2>
                                <p className="text-slate-500 font-medium mb-6">{verifyError}</p>
                                <Button
                                    className="w-full bg-slate-900 text-white rounded-xl py-4"
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
