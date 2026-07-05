import { supabase } from '../lib/supabase';

export type AnalyticsEventType = 'PAGE_VIEW' | 'ROUTE_CHANGE' | 'AUTH_EVENT' | 'FUNNEL' | 'TEACHER_WORKFLOW';

export interface TeacherWorkflowAnalyticsSummary {
    totalEvents: number;
    schemeGenerated: number;
    homeworkGenerated: number;
    noteGenerated: number;
    stepCompleted: number;
    resetCount: number;
    recentEvents: Array<{
        eventName: string;
        time: string;
    }>;
}

export interface TrackAnalyticsEventInput {
    eventType: AnalyticsEventType;
    eventName: string;
    path?: string;
    previousPath?: string;
    role?: string | null;
    metadata?: Record<string, unknown>;
}

interface TeacherWorkflowMetricRow {
    teacher_id: string;
    metric_date: string;
    total_events: number;
    scheme_generated: number;
    homework_generated: number;
    note_generated: number;
    step_completed: number;
    reset_count: number;
    last_event_name: string | null;
    last_event_at: string | null;
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

const todayKey = () => new Date().toISOString().slice(0, 10);

const createEmptyMetricsRow = (teacherId: string): TeacherWorkflowMetricRow => ({
    teacher_id: teacherId,
    metric_date: todayKey(),
    total_events: 0,
    scheme_generated: 0,
    homework_generated: 0,
    note_generated: 0,
    step_completed: 0,
    reset_count: 0,
    last_event_name: null,
    last_event_at: null,
});

const bumpMetricsForEvent = async (eventName: string) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        const teacherId = session?.user?.id;
        if (!teacherId) return;

        const metricDate = todayKey();
        const { data: existing, error: fetchError } = await supabase
            .from('teacher_workflow_metrics')
            .select('teacher_id,metric_date,total_events,scheme_generated,homework_generated,note_generated,step_completed,reset_count,last_event_name,last_event_at')
            .eq('teacher_id', teacherId)
            .eq('metric_date', metricDate)
            .maybeSingle();

        if (fetchError && import.meta.env.DEV) {
            console.warn('Teacher workflow metrics lookup skipped:', fetchError.message);
        }

        const row = (existing as TeacherWorkflowMetricRow | null) || createEmptyMetricsRow(teacherId);
        const nextRow: TeacherWorkflowMetricRow = {
            ...row,
            teacher_id: teacherId,
            metric_date: metricDate,
            total_events: (row.total_events || 0) + 1,
            scheme_generated: row.scheme_generated + (eventName === 'scheme_generated' ? 1 : 0),
            homework_generated: row.homework_generated + (eventName === 'homework_generated' ? 1 : 0),
            note_generated: row.note_generated + (eventName === 'note_generated' ? 1 : 0),
            step_completed: row.step_completed + (eventName === 'teacher_workflow_step_completed' ? 1 : 0),
            reset_count: row.reset_count + (eventName === 'teacher_workflow_reset' ? 1 : 0),
            last_event_name: eventName,
            last_event_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('teacher_workflow_metrics').upsert(nextRow, {
            onConflict: 'teacher_id,metric_date',
        });

        if (error && import.meta.env.DEV) {
            console.warn('Teacher workflow metrics update skipped:', error.message);
        }
    } catch (error) {
        if (import.meta.env.DEV) {
            console.warn('Teacher workflow metrics update failed:', error);
        }
    }
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

        if (input.eventType === 'TEACHER_WORKFLOW') {
            await bumpMetricsForEvent(input.eventName);
        }
    } catch (error) {
        if (import.meta.env.DEV) {
            console.warn('Analytics event tracking failed:', error);
        }
    }
};

export const fetchTeacherWorkflowAnalytics = async (teacherId?: string | null): Promise<TeacherWorkflowAnalyticsSummary> => {
    if (!teacherId) {
        return {
            totalEvents: 0,
            schemeGenerated: 0,
            homeworkGenerated: 0,
            noteGenerated: 0,
            stepCompleted: 0,
            resetCount: 0,
            recentEvents: [],
        };
    }

    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [metricsResult, recentResult] = await Promise.all([
            supabase
                .from('teacher_workflow_metrics')
                .select('total_events,scheme_generated,homework_generated,note_generated,step_completed,reset_count')
                .eq('teacher_id', teacherId)
                .gte('metric_date', sevenDaysAgo.toISOString().slice(0, 10)),
            supabase
                .from('analytics_events')
                .select('event_name, created_at')
                .eq('event_type', 'TEACHER_WORKFLOW')
                .eq('user_id', teacherId)
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(10),
        ]);

        const metricsRows = metricsResult.data || [];
        const recentRows = recentResult.data || [];

        const summaryFromMetrics = metricsRows.reduce((acc, row: any) => ({
            totalEvents: acc.totalEvents + (Number(row.total_events) || 0),
            schemeGenerated: acc.schemeGenerated + (Number(row.scheme_generated) || 0),
            homeworkGenerated: acc.homeworkGenerated + (Number(row.homework_generated) || 0),
            noteGenerated: acc.noteGenerated + (Number(row.note_generated) || 0),
            stepCompleted: acc.stepCompleted + (Number(row.step_completed) || 0),
            resetCount: acc.resetCount + (Number(row.reset_count) || 0),
        }), {
            totalEvents: 0,
            schemeGenerated: 0,
            homeworkGenerated: 0,
            noteGenerated: 0,
            stepCompleted: 0,
            resetCount: 0,
        });

        if (metricsResult.error && import.meta.env.DEV) {
            console.warn('Teacher metrics fetch skipped:', metricsResult.error.message);
        }
        if (recentResult.error && import.meta.env.DEV) {
            console.warn('Teacher analytics fetch skipped:', recentResult.error.message);
        }

        return {
            ...summaryFromMetrics,
            recentEvents: recentRows.map((row: any) => ({
                eventName: row.event_name || 'unknown',
                time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            })),
        };
    } catch (error) {
        if (import.meta.env.DEV) {
            console.warn('Teacher analytics fetch failed:', error);
        }
        return {
            totalEvents: 0,
            schemeGenerated: 0,
            homeworkGenerated: 0,
            noteGenerated: 0,
            stepCompleted: 0,
            resetCount: 0,
            recentEvents: [],
        };
    }
};
