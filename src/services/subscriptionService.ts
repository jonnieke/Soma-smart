import { SubscriptionTier, UserSegment, SubscriptionPlan } from '../types';
import { supabase } from '../lib/supabase';

const LAUNCH_DATE = new Date('2026-01-01T00:00:00+03:00');

export const checkSubscriptionAccess = async (userId: string, segment: UserSegment): Promise<{ isPro: boolean; tier: SubscriptionTier; expiry: string | null }> => {
    try {
        const { data, error, status } = await supabase
            .from('profiles')
            .select('subscription_tier, subscription_expiry')
            .eq('id', userId)
            .maybeSingle();

        // Graceful handling of missing columns (Status 400 usually indicates invalid column in Supabase/PostgREST)
        if (error || !data) {
            if (status === 400) {
                console.warn("Subscription columns likely missing in DB. Migration needed. Falling back to FREE tier.");
            }
            return { isPro: false, tier: 'FREE', expiry: null };
        }

        const now = new Date();
        const isExpired = data.subscription_expiry ? new Date(data.subscription_expiry) < now : true;
        const isPreLaunch = now < LAUNCH_DATE;

        return {
            isPro: isPreLaunch || (data.subscription_tier !== 'FREE' && !isExpired),
            tier: (data.subscription_tier || 'FREE') as SubscriptionTier,
            expiry: data.subscription_expiry || null
        };
    } catch (e) {
        console.error("Access Check Critical Error:", e);
        return { isPro: false, tier: 'FREE', expiry: null };
    }
};

export const updateSubscription = async (userId: string, plan: SubscriptionPlan): Promise<boolean> => {
    try {
        const now = new Date();
        // If we are before launch, the subscription starts AT launch date
        const baseDate = now < LAUNCH_DATE ? new Date(LAUNCH_DATE) : new Date(now);
        let expiryDate = new Date(baseDate);

        switch (plan.duration) {
            case 'DAILY': expiryDate.setDate(baseDate.getDate() + 1); break;
            case 'WEEKLY': expiryDate.setDate(baseDate.getDate() + 7); break;
            case 'MONTHLY': expiryDate.setMonth(baseDate.getMonth() + 1); break;
            case 'TERMLY': expiryDate.setMonth(baseDate.getMonth() + 3); break;
            case 'ANNUAL': expiryDate.setFullYear(baseDate.getFullYear() + 1); break;
            default: expiryDate.setDate(baseDate.getDate() + 1);
        }

        const { error } = await supabase
            .from('profiles')
            .update({
                subscription_tier: plan.duration,
                subscription_expiry: expiryDate.toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

        // Record transaction
        await supabase.from('transactions').insert({
            user_id: userId,
            amount: plan.price,
            type: 'SUBSCRIPTION',
            status: 'SUCCESS',
            method: 'MPESA',
            reference_code: `SUB-${plan.id}-${Date.now().toString().slice(-4)}`,
            created_at: now.toISOString()
        });

        return true;
    } catch (e) {
        console.error("Subscription Update Error:", e);
        return false;
    }
};
