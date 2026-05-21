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

/**
 * Self-healing: Checks if a valid transaction exists but profile is out of sync
 */
export const verifyAndFixSubscription = async (userId: string): Promise<boolean> => {
    try {
        // 1. Find all SUCCESS subscription transactions (bounded window)
        const { data: txs, error } = await supabase
            .from('transactions')
            .select('amount, created_at')
            .eq('user_id', userId)
            .eq('type', 'SUBSCRIPTION')
            .eq('status', 'SUCCESS')
            .order('created_at', { ascending: false })
            .limit(120);

        if (error || !txs || txs.length === 0) return false;

        const now = new Date();
        const durationFromAmount = (amount: number): SubscriptionPlan['duration'] => {
            if (amount === 20) return 'DAILY';
            if (amount === 100) return 'WEEKLY';
            if (amount === 300 || amount === 600) return 'MONTHLY';
            if (amount === 700 || amount === 1600) return 'TERMLY';
            if (amount === 2000 || amount === 5000) return 'ANNUAL';
            return 'MONTHLY';
        };

        const computeExpiry = (start: Date, duration: SubscriptionPlan['duration']) => {
            const expiry = new Date(start);
            switch (duration) {
                case 'DAILY': expiry.setDate(start.getDate() + 1); break;
                case 'WEEKLY': expiry.setDate(start.getDate() + 7); break;
                case 'MONTHLY': expiry.setMonth(start.getMonth() + 1); break;
                case 'TERMLY': expiry.setMonth(start.getMonth() + 3); break;
                case 'ANNUAL': expiry.setFullYear(start.getFullYear() + 1); break;
                default: expiry.setMonth(start.getMonth() + 1);
            }
            return expiry;
        };

        // Choose the best active entitlement (furthest future expiry), not merely latest tx.
        let best: { duration: SubscriptionPlan['duration']; expiry: Date } | null = null;
        for (const tx of txs) {
            const txDate = new Date(tx.created_at);
            if (isNaN(txDate.getTime())) continue;
            const duration = durationFromAmount(Number(tx.amount));
            const expiry = computeExpiry(txDate, duration);
            if (expiry <= now) continue;
            if (!best || expiry > best.expiry) {
                best = { duration, expiry };
            }
        }

        if (!best) return false;

        await supabase.from('profiles').update({
            subscription_tier: best.duration,
            subscription_expiry: best.expiry.toISOString()
        }).eq('id', userId);
        return true;

    } catch (e) {
        console.error("Verify Fix Error:", e);
        return false;
    }
};
