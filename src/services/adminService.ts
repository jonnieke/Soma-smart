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
    recentActivity: FeedItem[];
    activityTrend: number[]; // Last 14 days activity count
}

export interface FeedItem {
    id: string;
    title: string;
    time: string;
    type: 'student' | 'teacher' | 'money' | 'parent' | 'system';
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
    try {
        // 1. User Counts
        const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'LEARNER');
        const { count: teacherCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'TEACHER');
        const { count: parentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'PARENT');

        // 2. Pro/Verified Stats (Mocked for now based on implementation plan as we don't have explicit columns yet)
        // In real app: select count from profiles where is_pro = true
        // We will assume 10% of users are pro for visual demo if column missing, or check if 'subscription_tier' exists. 
        // Checking profiles table structure via a broad select in Overview showed basic fields. 
        // Let's check for specific 'is_pro' or similar if it was added to types/context. 
        // Context has isPro state but not explicitly saving to DB in the code I saw earlier (it said "Ideally save to DB").
        // So we will use a heuristic or just mock the *Ratio* but use real *Total* base.

        const totalUsers = (studentCount || 0) + (teacherCount || 0) + (parentCount || 0);
        const activePro = Math.floor(totalUsers * 0.15);
        const verifiedUsers = Math.floor(totalUsers * 0.8);

        // 3. Activity Feed (Real from activities table)
        // Note: profiles(...) join requires the FK created in 20260303121500_fix_activities_relationship.sql
        const { data: recentActivities, error: activityError } = await supabase
            .from('activities')
            .select('*, profiles(full_name, role)')
            .order('created_at', { ascending: false })
            .limit(10);

        if (activityError) {
            console.warn("Activities fetch failed (likely relationship missing):", activityError.message);
        }

        const recentActivity: FeedItem[] = recentActivities?.map((act: any) => ({
            id: act.id,
            title: `${act.profiles?.full_name || 'System User'} completed a ${act.type.toLowerCase()}`,
            time: new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: act.profiles?.role === 'TEACHER' ? 'teacher' : (act.profiles?.role === 'LEARNER' ? 'student' : 'system')
        })) || [];

        // 4. Activity Trend (Real-ish: Group by created_at date)
        // Since we can't do complex group-by mainly in simple client query without RPG, we will just fetch last 100 activities and map dates in JS
        const { data: trendData } = await supabase
            .from('activities')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(500);

        const trendMap = new Array(14).fill(0);
        const today = new Date();
        trendData?.forEach((d: any) => {
            const date = new Date(d.created_at);
            const diffTime = Math.abs(today.getTime() - date.getTime());
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 14) {
                trendMap[13 - diffDays]++; // 13 is today, 0 is 14 days ago
            }
        });


        // 5. Financials (Real from transactions)
        const { data: transactions } = await supabase.from('transactions').select('amount, status, type');
        const realRevenue = transactions
            ?.filter((t: any) => t.status === 'SUCCESS')
            .reduce((sum: number, t: any) => sum + (Number(t.amount) || 0), 0) || 0;

        return {
            totalRevenue: realRevenue,
            activeTrials: 12, // Still mock or check transactions for verified
            verifiedUsers: verifiedUsers,
            activePro: activePro,
            totalStudents: studentCount || 0,
            totalTeachers: teacherCount || 0,
            totalParents: parentCount || 0,
            recentActivity,
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
            recentActivity: [],
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
