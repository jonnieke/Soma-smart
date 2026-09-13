import { SubscriptionTier, UserSegment, SubscriptionPlan } from '../types';
import { supabase } from '../lib/supabase';
import { getOwnPaymentHistory, getPaymentReceipt } from './transactionAccessService';

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
            console.warn("Subscription Check Failed:", error);
            if (status === 400) {
                console.warn("Subscription columns likely missing in DB. Migration needed. Falling back to FREE tier.");
            }
            return { isPro: false, tier: 'FREE', expiry: null };
        }

        const now = new Date();
        const isExpired = data.subscription_expiry ? new Date(data.subscription_expiry) < now : true;
        const isPreLaunch = now < LAUNCH_DATE;

        // Fix: If expired and not pre-launch, report tier as FREE so UI updates correctly
        const effectiveTier = (isPreLaunch || !isExpired) ? (data.subscription_tier || 'FREE') : 'FREE';

        return {
            isPro: isPreLaunch || (data.subscription_tier !== 'FREE' && !isExpired),
            tier: effectiveTier as SubscriptionTier,
            expiry: data.subscription_expiry || null
        };
    } catch (e) {
        console.error("Access Check Critical Error:", e);
        return { isPro: false, tier: 'FREE', expiry: null };
    }
};

// Only the payment backend grants subscriptions. This legacy entry point now verifies.
export const updateSubscription = async (userId: string, plan: SubscriptionPlan): Promise<boolean> => {
    const active = await verifyAndFixSubscription(userId);
    if (!active) return false;
    const access = await checkSubscriptionAccess(userId, plan.segment);
    return access.isPro && access.tier === plan.duration;
};

/** Recover only this account's provider-confirmed subscription; never infer a plan from its price. */
export const verifyAndFixSubscription = async (userId: string): Promise<boolean> => {
    try {
        const transactions = await getOwnPaymentHistory(userId);
        for (const tx of transactions) {
            if (tx.type !== 'SUBSCRIPTION' || !tx.reference_code) continue;
            const receipt = await getPaymentReceipt(tx.reference_code, userId);
            if (receipt?.status !== 'SUCCESS') continue;
            const { data, error } = await supabase.from('profiles')
                .select('subscription_tier,subscription_expiry').eq('id', userId).maybeSingle();
            if (!error && data?.subscription_tier !== 'FREE' && data?.subscription_expiry && Date.parse(data.subscription_expiry) > Date.now()) return true;
        }
        return false;
    } catch { return false; }
};
