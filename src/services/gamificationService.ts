import { LearnerActivity } from '../types';

export const XP_RULES = {
    QUIZ_COMPLETION: 50,
    TOPIC_STUDY: 20,
    PERFECT_SCORE_BONUS: 30,
};

export interface LevelInfo {
    level: number;
    currentXP: number;
    nextLevelXP: number;
    progressPercent: number;
    totalXP: number;
}

export const calculateTotalXP = (activities: LearnerActivity[]): number => {
    return activities.reduce((total, activity) => {
        let xp = 0;

        if (activity.type === 'QUIZ') {
            xp += XP_RULES.QUIZ_COMPLETION;
            if ((activity.score || 0) >= 100) {
                xp += XP_RULES.PERFECT_SCORE_BONUS;
            }
        } else if (activity.type === 'EXPLANATION') {
            xp += XP_RULES.TOPIC_STUDY;
        }

        return total + xp;
    }, 0);
};

export const calculateLevel = (totalXP: number): LevelInfo => {
    // Simple formula: Level = sqrt(XP / 100) + 1
    // XP required for level L = 100 * (L-1)^2

    // Example Curve:
    // L1: 0 XP
    // L2: 100 XP
    // L3: 400 XP
    // L4: 900 XP

    const level = Math.floor(Math.sqrt(totalXP / 100)) + 1;

    const currentLevelBaseXP = 100 * Math.pow(level - 1, 2);
    const nextLevelBaseXP = 100 * Math.pow(level, 2);

    const levelXP = totalXP - currentLevelBaseXP;
    const neededXP = nextLevelBaseXP - currentLevelBaseXP;

    const progressPercent = Math.min(100, Math.max(0, (levelXP / neededXP) * 100));

    return {
        level,
        currentXP: levelXP,
        nextLevelXP: neededXP,
        progressPercent,
        totalXP
    };
};

export const getAchievementMessage = (activityType: 'QUIZ' | 'EXPLANATION', score?: number): string => {
    if (activityType === 'QUIZ') {
        if ((score || 0) >= 100) return "PERFECT! +80 XP";
        if ((score || 0) >= 80) return "Great Job! +50 XP";
        return "Quiz Complete +50 XP";
    }
    return "Topic Studied +20 XP";
};

export const calculateStreak = (activities: LearnerActivity[]): number => {
    if (!activities || activities.length === 0) return 0;

    // Get unique dates (YYYY-MM-DD)
    const uniqueDates = Array.from(new Set(
        activities.map(a => new Date(a.date).toISOString().split('T')[0])
    )).sort().reverse(); // Newest first

    if (uniqueDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Check if the most recent activity is today or yesterday
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
        return 0; // Streak broken
    }

    let streak = 0;

    // Check consecutive days
    // We start from the most recent date found (today or yesterday)
    // and check if previous date in array is exactly 1 day before

    // It's cleaner to iterate and check diff
    let currentDate = new Date(uniqueDates[0]);
    streak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i]);
        const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            streak++;
            currentDate = prevDate;
        } else {
            break;
        }
    }

    return streak;
};

export const calculateSubjectPerformance = (activities: LearnerActivity[]) => {
    const subjects = ['Math', 'English', 'Kiswahili', 'Science', 'Social Studies'];
    const performance: { [key: string]: { total: number, count: number } } = {};

    subjects.forEach(s => performance[s] = { total: 0, count: 0 });

    activities.filter(a => a.type === 'QUIZ' && a.score !== undefined).forEach(a => {
        // Determine subject from topic string (fuzzy match)
        const topicLower = a.topic.toLowerCase();
        let subject = 'Other';

        if (topicLower.includes('math')) subject = 'Math';
        else if (topicLower.includes('english')) subject = 'English';
        else if (topicLower.includes('kiswahili')) subject = 'Kiswahili';
        else if (topicLower.includes('science')) subject = 'Science';
        else if (topicLower.includes('social')) subject = 'Social Studies';

        if (performance[subject]) {
            performance[subject].total += (a.score || 0);
            performance[subject].count += 1;
        }
    });

    return subjects.map(subject => ({
        subject,
        score: performance[subject].count > 0
            ? Math.round(performance[subject].total / performance[subject].count)
            : 0, // Return 0 if no data
        hasData: performance[subject].count > 0,
        // Helper colors for UI
        color: subject === 'Math' ? 'bg-blue-500' :
            subject === 'English' ? 'bg-emerald-500' :
                subject === 'Kiswahili' ? 'bg-purple-500' :
                    subject === 'Science' ? 'bg-amber-500' : 'bg-cyan-500',
        bg: subject === 'Math' ? 'bg-blue-100' :
            subject === 'English' ? 'bg-emerald-100' :
                subject === 'Kiswahili' ? 'bg-purple-100' :
                    subject === 'Science' ? 'bg-amber-100' : 'bg-cyan-100'
    }));
};

export const getDailyChallenge = () => {
    const day = new Date().getDay();
    // 0 = Sun, 1 = Mon, ...

    const challenges = [
        { topic: "Social Studies", title: "Sunday Socials", quiz: "Social Studies Quiz" },
        { topic: "Mathematics", title: "Math Monday", quiz: "Mental Math" },
        { topic: "English", title: "English Tuesday", quiz: "Grammar & Vocab" },
        { topic: "Kiswahili", title: "Kiswahili Wednesday", quiz: "Msamiati & Sarufi" },
        { topic: "Science", title: "Science Thursday", quiz: "Nature & Environment" },
        { topic: "Mathematics", title: "Math Friday", quiz: "Geometry & Shapes" },
        { topic: "Science", title: "Super Science Saturday", quiz: "Space & Planets" },
    ];

    return challenges[day];
};
