import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

export interface DashboardStats {
    totalRevenue: number;
    activeTrials: number;
    verifiedUsers: number;
    activePro: number;
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalUsers: number;
    totalKnowledgeDocs: number;
    totalTeacherMaterials: number;
    totalNotes: number;
    totalPastPapers: number;
    totalSyllabuses: number;
    activeToday: number;
    newUsers7d: number;
    pageViews7d: number;
    routeChanges7d: number;
    authEvents7d: number;
    topSubjects: { subject: string; count: number }[];
    topPages: { path: string; count: number }[];
    authBreakdown: { eventName: string; count: number }[];
    recentActivity: FeedItem[];
    recentAnalyticsEvents: { id: string; eventName: string; eventType: string; path: string; time: string }[];
    activityTrend: number[]; // Last 14 days activity count
}

export interface FeedItem {
    id: string;
    title: string;
    time: string;
    type: 'student' | 'teacher' | 'money' | 'parent' | 'system';
}

export interface UsageCostFeatureSummary {
    feature: string;
    calls: number;
    estimatedCostKes: number;
    inputTokens: number;
    outputTokens: number;
}

export interface FinanceSummary {
    totalRevenueKes: number;
    aiCostKes: number;
    grossMarginKes: number;
    grossMarginPct: number;
    aiCalls: number;
    avgAiCostPerCallKes: number;
    topFeatures: UsageCostFeatureSummary[];
}

export const fetchFinanceSummary = async (): Promise<FinanceSummary> => {
    const defaultSummary: FinanceSummary = {
        totalRevenueKes: 0,
        aiCostKes: 0,
        grossMarginKes: 0,
        grossMarginPct: 0,
        aiCalls: 0,
        avgAiCostPerCallKes: 0,
        topFeatures: []
    };

    try {
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const [{ data: transactions }, { data: usageEvents, error: usageError }] = await Promise.all([
            supabase.from('transactions').select('amount, status, created_at').gte('created_at', since.toISOString()),
            supabase.from('usage_cost_events').select('feature, input_tokens, output_tokens, estimated_cost_kes, created_at').gte('created_at', since.toISOString())
        ]);

        const totalRevenueKes = transactions
            ?.filter((t: any) => t.status === 'SUCCESS')
            .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0) || 0;

        if (usageError) {
            if (import.meta.env.DEV) console.warn('Usage cost summary unavailable:', usageError.message);
            return {
                ...defaultSummary,
                totalRevenueKes,
                grossMarginKes: totalRevenueKes,
                grossMarginPct: totalRevenueKes > 0 ? 100 : 0
            };
        }

        const featureMap = new Map<string, UsageCostFeatureSummary>();
        let aiCostKes = 0;
        let aiCalls = 0;

        (usageEvents || []).forEach((event: any) => {
            const feature = event.feature || 'unknown';
            const cost = Number(event.estimated_cost_kes) || 0;
            const inputTokens = Number(event.input_tokens) || 0;
            const outputTokens = Number(event.output_tokens) || 0;
            aiCostKes += cost;
            aiCalls += 1;

            const current = featureMap.get(feature) || {
                feature,
                calls: 0,
                estimatedCostKes: 0,
                inputTokens: 0,
                outputTokens: 0
            };
            current.calls += 1;
            current.estimatedCostKes += cost;
            current.inputTokens += inputTokens;
            current.outputTokens += outputTokens;
            featureMap.set(feature, current);
        });

        const grossMarginKes = totalRevenueKes - aiCostKes;
        const grossMarginPct = totalRevenueKes > 0 ? (grossMarginKes / totalRevenueKes) * 100 : 0;

        return {
            totalRevenueKes,
            aiCostKes,
            grossMarginKes,
            grossMarginPct,
            aiCalls,
            avgAiCostPerCallKes: aiCalls > 0 ? aiCostKes / aiCalls : 0,
            topFeatures: Array.from(featureMap.values())
                .sort((a, b) => b.estimatedCostKes - a.estimatedCostKes)
                .slice(0, 8)
                .map(feature => ({
                    ...feature,
                    estimatedCostKes: Number(feature.estimatedCostKes.toFixed(2))
                }))
        };
    } catch (error) {
        console.error('Finance summary fetch failed:', error);
        return defaultSummary;
    }
};

export interface TodayPilotStats {
    activeUsersToday: number;
    newSignupsToday: number;
    paymentsToday: number;
    aiCallsToday: number;
    recentAiEvents: { feature: string; time: string; costKes: number }[];
}

export const fetchTodayPilotStats = async (): Promise<TodayPilotStats> => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const iso = todayStart.toISOString();

    try {
        const [
            { data: analyticsToday },
            { data: signupsToday },
            { data: paymentsToday },
            { data: aiCallsToday }
        ] = await Promise.all([
            supabase.from('analytics_events').select('user_id').gte('created_at', iso),
            supabase.from('profiles').select('id').gte('created_at', iso),
            supabase.from('transactions').select('id').eq('status', 'SUCCESS').gte('created_at', iso),
            supabase.from('usage_cost_events').select('feature, created_at, estimated_cost_kes').gte('created_at', iso).order('created_at', { ascending: false }).limit(20)
        ]);

        const uniqueUsers = new Set((analyticsToday || []).map((e: any) => e.user_id).filter(Boolean));

        return {
            activeUsersToday: uniqueUsers.size,
            newSignupsToday: (signupsToday || []).length,
            paymentsToday: (paymentsToday || []).length,
            aiCallsToday: (aiCallsToday || []).length,
            recentAiEvents: (aiCallsToday || []).slice(0, 10).map((e: any) => ({
                feature: e.feature || 'ai',
                time: new Date(e.created_at).toLocaleTimeString(),
                costKes: Number(e.estimated_cost_kes) || 0
            }))
        };
    } catch {
        return { activeUsersToday: 0, newSignupsToday: 0, paymentsToday: 0, aiCallsToday: 0, recentAiEvents: [] };
    }
};

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const oneDayAgo = new Date(now);
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const isActiveTrialProfile = (profile: any) => {
            const tier = String(profile?.subscription_tier || '').toUpperCase();
            const status = String(profile?.subscription_status || '').toUpperCase();
            return status === 'TRIAL' || tier === 'TRIAL';
        };

        // 1. User Counts
        const [
            { count: studentCount },
            { count: teacherCount },
            { count: parentCount },
            { count: revisionCount },
            { count: schoolCount },
            { count: newUsers7d },
            { count: verifiedUsers },
            { data: trialProfiles, error: trialError }
        ] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'LEARNER'),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'TEACHER'),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'PARENT'),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'REVISION'),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'SCHOOL'),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
            supabase.from('profiles').select('id', { count: 'exact', head: true }).neq('subscription_tier', 'FREE'),
            supabase.from('profiles').select('subscription_tier, subscription_status')
        ]);

        const totalStudents = studentCount || 0;
        const totalTeachers = teacherCount || 0;
        const totalParents = parentCount || 0;
        const totalUsers = totalStudents + totalTeachers + totalParents + (revisionCount || 0) + (schoolCount || 0);
        const activePro = verifiedUsers || 0;
        const activeTrials = trialError ? 0 : (trialProfiles || []).filter(isActiveTrialProfile).length;

        // 2. Activity Feed
        const [{ data: recentActivities, error: activityError }, { data: trendData }, { count: activeToday }] = await Promise.all([
            supabase
                .from('activities')
                .select('id, type, topic, created_at, student_id, details')
                .order('created_at', { ascending: false })
                .limit(10),
            supabase
                .from('activities')
                .select('created_at')
                .order('created_at', { ascending: false })
                .limit(500),
            supabase.from('activities').select('id', { count: 'exact', head: true }).gte('created_at', oneDayAgo.toISOString())
        ]);

        const { data: analyticsRows, error: analyticsError } = await supabase
            .from('analytics_events')
            .select('id, event_type, event_name, path, created_at')
            .gte('created_at', sevenDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(1000);

        if (activityError) {
            console.warn("Activities fetch failed:", activityError.message);
        }
        if (analyticsError && import.meta.env.DEV) {
            console.warn("Analytics events fetch failed:", analyticsError.message);
        }

        const recentActivityIds = Array.from(
            new Set(
                (recentActivities || [])
                    .map((act: any) => act.student_id)
                    .filter((id: any) => typeof id === 'string' && id.trim().length > 0)
            )
        );

        const { data: recentProfiles } = recentActivityIds.length > 0
            ? await supabase
                .from('profiles')
                .select('id, full_name, student_id, role')
                .in('id', recentActivityIds)
            : { data: [] as any[] };

        const profileById = new Map<string, any>();
        (recentProfiles || []).forEach((profile: any) => {
            profileById.set(profile.id, profile);
        });

        const resolveActorLabel = (studentId: any) => {
            const raw = String(studentId || '').trim();
            if (!raw) return 'System';

            const profile = profileById.get(raw);
            const fullName = String(profile?.full_name || '').trim();
            const schoolCode = String(profile?.student_id || '').trim();
            if (fullName && schoolCode) return `${fullName} (${schoolCode})`;
            if (fullName) return fullName;
            if (schoolCode) return schoolCode;

            if (/^[0-9a-f-]{8,}$/i.test(raw)) return `Student ${raw.slice(0, 8)}...`;
            return raw;
        };

        const recentActivity: FeedItem[] = recentActivities?.map((act: any) => ({
            id: act.id,
            title: `${resolveActorLabel(act.student_id)} completed a ${String(act.type || 'activity').toLowerCase()}`,
            time: new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: String(act.type || '').toUpperCase().includes('PAY')
                ? 'money'
                : String(act.type || '').toUpperCase().includes('TEACH')
                    ? 'teacher'
                    : 'student'
        })) || [];

        const trendMap = new Array(14).fill(0);
        trendData?.forEach((d: any) => {
            const date = new Date(d.created_at);
            const diffTime = Math.abs(now.getTime() - date.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 14) {
                trendMap[13 - diffDays]++;
            }
        });

        const analyticsRowsSafe = analyticsRows || [];
        const pageViews7d = analyticsRowsSafe.filter((row: any) => row.event_type === 'PAGE_VIEW').length;
        const routeChanges7d = analyticsRowsSafe.filter((row: any) => row.event_type === 'ROUTE_CHANGE').length;
        const authEvents7d = analyticsRowsSafe.filter((row: any) => row.event_type === 'AUTH_EVENT').length;

        const pageCounts = new Map<string, number>();
        const authCounts = new Map<string, number>();
        analyticsRowsSafe.forEach((row: any) => {
            const path = String(row.path || '/').split('?')[0] || '/';
            pageCounts.set(path, (pageCounts.get(path) || 0) + 1);
            const authName = String(row.event_name || 'unknown');
            authCounts.set(authName, (authCounts.get(authName) || 0) + 1);
        });

        const topPages = Array.from(pageCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([path, count]) => ({ path, count }));

        const authBreakdown = Array.from(authCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([eventName, count]) => ({ eventName, count }));

        const recentAnalyticsEvents = analyticsRowsSafe.slice(0, 8).map((row: any) => ({
            id: row.id,
            eventName: row.event_name || 'unknown',
            eventType: row.event_type || 'unknown',
            path: row.path || '/',
            time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));

        // 3. Financials (Real from transactions)
        const { data: transactions } = await supabase.from('transactions').select('amount, status, type');
        const realRevenue = transactions
            ?.filter((t: any) => t.status === 'SUCCESS')
            .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0) || 0;

        // 4. Content inventory
        const [
            { count: totalKnowledgeDocs },
            { count: totalTeacherMaterials },
            { data: knowledgeRows },
            { data: schoolMaterialRows },
        ] = await Promise.all([
            supabase.from('knowledge_base').select('id', { count: 'exact', head: true }),
            supabase.from('school_materials').select('id', { count: 'exact', head: true }),
            supabase.from('knowledge_base').select('subject, type, created_at'),
            supabase.from('school_materials').select('target_subject, created_at')
        ]);

        const totalNotes = (knowledgeRows || []).filter((row: any) => row.type === 'NOTES').length;
        const totalPastPapers = (knowledgeRows || []).filter((row: any) => row.type === 'PAST_PAPER').length;
        const totalSyllabuses = (knowledgeRows || []).filter((row: any) => row.type === 'SYLLABUS').length;

        const subjectCounts = new Map<string, number>();
        [...(knowledgeRows || []), ...(schoolMaterialRows || [])].forEach((row: any) => {
            const subject = String(row.subject || row.target_subject || 'General').trim();
            if (!subject) return;
            subjectCounts.set(subject, (subjectCounts.get(subject) || 0) + 1);
        });

        const topSubjects = Array.from(subjectCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([subject, count]) => ({ subject, count }));

        return {
            totalRevenue: realRevenue,
            activeTrials,
            verifiedUsers: verifiedUsers || 0,
            activePro,
            totalStudents,
            totalTeachers,
            totalParents,
            totalUsers,
            totalKnowledgeDocs: totalKnowledgeDocs || 0,
            totalTeacherMaterials: totalTeacherMaterials || 0,
            totalNotes,
            totalPastPapers,
            totalSyllabuses,
            activeToday: activeToday || 0,
            newUsers7d: newUsers7d || 0,
            pageViews7d,
            routeChanges7d,
            authEvents7d,
            topSubjects,
            topPages,
            authBreakdown,
            recentActivity,
            recentAnalyticsEvents,
            activityTrend: trendMap
        };

    } catch (error) {
        console.error("Admin stats fetch failed:", error);
        return {
            totalRevenue: 0,
            activeTrials: 0,
            verifiedUsers: 0,
            activePro: 0,
            totalStudents: 0,
            totalTeachers: 0,
            totalParents: 0,
            totalUsers: 0,
            totalKnowledgeDocs: 0,
            totalTeacherMaterials: 0,
            totalNotes: 0,
            totalPastPapers: 0,
            totalSyllabuses: 0,
            activeToday: 0,
            newUsers7d: 0,
            pageViews7d: 0,
            routeChanges7d: 0,
            authEvents7d: 0,
            topSubjects: [],
            topPages: [],
            authBreakdown: [],
            recentActivity: [],
            recentAnalyticsEvents: [],
            activityTrend: new Array(14).fill(0)
        };
    }
};

export interface AdminUser {
    id: string;
    full_name: string;
    role: string;
    grade?: string;
    school?: string;
    student_id?: string;
    created_at: string;
    is_pro?: boolean;
}

export const fetchAllUsers = async (): Promise<AdminUser[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Fetch users failed", error);
        return [];
    }
    return data || [];
};

export interface SchoolCognitiveHealth {
    averageScore: number;
    totalMasteredTopics: number;
    topStrugglingTopics: { topic: string, count: number }[];
    activeLearners: number;
}

export const fetchSchoolWideMastery = async (): Promise<SchoolCognitiveHealth> => {
    try {
        const { data, error } = await supabase
            .from('learner_memory')
            .select('mastery_graph, weak_topics');

        if (error) throw error;
        if (!data || data.length === 0) {
            return { averageScore: 0, totalMasteredTopics: 0, topStrugglingTopics: [], activeLearners: 0 };
        }

        let totalScore = 0;
        let scoreCount = 0;
        let totalMastered = 0;
        const weakTopicCounts: Record<string, number> = {};

        data.forEach(row => {
            // Calculate averages from mastery_graph
            if (row.mastery_graph) {
                Object.values(row.mastery_graph).forEach((score: any) => {
                    totalScore += Number(score);
                    scoreCount++;
                    if (Number(score) >= 80) totalMastered++;
                });
            }

            // Aggregate weak topics
            if (row.weak_topics && Array.isArray(row.weak_topics)) {
                row.weak_topics.forEach((topic: string) => {
                    weakTopicCounts[topic] = (weakTopicCounts[topic] || 0) + 1;
                });
            }
        });

        const averageScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
        
        // Sort weak topics by frequency
        const topStrugglingTopics = Object.entries(weakTopicCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([topic, count]) => ({ topic, count }));

        return {
            averageScore,
            totalMasteredTopics: totalMastered,
            topStrugglingTopics,
            activeLearners: data.length
        };
    } catch (err) {
        console.error("School-wide mastery fetch failed:", err);
        return { averageScore: 0, totalMasteredTopics: 0, topStrugglingTopics: [], activeLearners: 0 };
    }
};
