import { supabase } from '../lib/supabase';

export type AnalyticsEventType = 'PAGE_VIEW' | 'ROUTE_CHANGE' | 'AUTH_EVENT';

export interface TrackAnalyticsEventInput {
    eventType: AnalyticsEventType;
    eventName: string;
    path?: string;
    previousPath?: string;
    role?: string | null;
    metadata?: Record<string, unknown>;
}

const getAnalyticsSessionId = () => {
    const key = 'soma_analytics_session_id';
    let sessionId = sessionStorage.getItem(key);
    if (!sessionId) {
        sessionId = (crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
        sessionStorage.setItem(key, sessionId);
    }
    return sessionId;
};

export const trackAnalyticsEvent = async (input: TrackAnalyticsEventInput) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentPath = input.path || `${window.location.pathname}${window.location.search}`;

        const payload = {
            event_type: input.eventType,
            event_name: input.eventName,
            path: currentPath,
            previous_path: input.previousPath || null,
            user_id: session?.user?.id || null,
            role: input.role || localStorage.getItem('soma_user_role') || null,
            session_id: getAnalyticsSessionId(),
            referrer: document.referrer || null,
            metadata: input.metadata || {},
        };

        const { error } = await supabase.from('analytics_events').insert(payload);
        if (error && import.meta.env.DEV) {
            console.warn('Analytics event tracking skipped:', error.message);
        }
    } catch (error) {
        if (import.meta.env.DEV) {
            console.warn('Analytics event tracking failed:', error);
        }
    }
};
