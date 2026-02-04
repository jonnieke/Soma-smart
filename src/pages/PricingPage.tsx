import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PricingPage as PricingComponent } from '../features/subscription/PricingPage';
import { Button } from '../components/Shared';
import { ArrowLeft } from 'lucide-react';

export const PricingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="relative">
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
                onSelectPlan={(plan) => {
                    // Navigate to registration with plan intent
                    navigate('/', { state: { selectedPlan: plan, showRegistration: true } });
                }}
                onClose={() => navigate('/')}
            />
        </div>
    );
};
