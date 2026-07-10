/**
 * Admin Agent Service — Super Teacher Phase 3
 * 
 * The "Evolutionary Educator" agent that:
 * 1. Aggregates student performance data across the platform
 * 2. Identifies weak spots and ineffective teaching patterns
 * 3. Generates refined teaching strategies
 * 4. Proposes prompt updates for human approval
 */

import { SchemaType } from "@google/generative-ai";
import { callGeminiProxy } from "./geminiService";
import { parseModelJson } from "./jsonResponse";
import { TeachingStrategy, PedagogicalAnalytics, TopicAnalytics } from "../types";
import { supabase } from '../lib/supabase';

const MODEL_NAME = "gemini-2.5-flash";

// --- ANALYTICS ENGINE ---

/**
 * Aggregate mastery data from all students on the platform.
 * Falls back to localStorage data if Supabase is unavailable.
 */
export const fetchPedagogicalAnalytics = async (): Promise<PedagogicalAnalytics> => {
    try {
        // Try Supabase first for platform-wide data
        const { data: masteryData, error } = await supabase
            .from('activities')
            .select('topic, score, student_id, details')
            .eq('type', 'QUIZ')
            .not('score', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error || !masteryData || masteryData.length === 0) {
            console.warn('No platform mastery data available, using local fallback');
            return buildLocalAnalytics();
        }

        return buildAnalyticsFromData(masteryData);
    } catch (e) {
        console.error('Analytics fetch failed:', e);
        return buildLocalAnalytics();
    }
};

/**
 * Build analytics from Supabase activity data.
 */
const buildAnalyticsFromData = (data: any[]): PedagogicalAnalytics => {
    const topicMap: Record<string, { scores: number[], students: Set<string> }> = {};

    data.forEach((d: any) => {
        const topic = d.topic;
        if (!topic || /^\d{13}$/.test(topic)) return; // Skip corrupted entries

        if (!topicMap[topic]) {
            topicMap[topic] = { scores: [], students: new Set() };
        }
        topicMap[topic].scores.push(d.score ?? 0);
        topicMap[topic].students.add(d.student_id);
    });

    const topicBreakdown: TopicAnalytics[] = Object.entries(topicMap).map(([topic, data]) => {
        const avgMastery = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
        return {
            topic,
            subject: inferSubject(topic),
            grade: '',
            avgMastery,
            studentCount: data.students.size,
            avgAttempts: Math.round(data.scores.length / data.students.size * 10) / 10
        };
    });

    // Sort by mastery
    const sorted = [...topicBreakdown].sort((a, b) => a.avgMastery - b.avgMastery);
    const allStudents = new Set(data.map((d: any) => d.student_id));
    const overallAvg = topicBreakdown.length > 0
        ? Math.round(topicBreakdown.reduce((sum, t) => sum + t.avgMastery, 0) / topicBreakdown.length)
        : 0;

    return {
        topicBreakdown,
        bottomTopics: sorted.slice(0, 10),
        topTopics: sorted.slice(-5).reverse(),
        totalStudentsAnalyzed: allStudents.size,
        totalTopicsTracked: topicBreakdown.length,
        overallAvgMastery: overallAvg,
        computedAt: new Date().toISOString()
    };
};

/**
 * Build analytics from localStorage mastery graph (single-user fallback).
 */
const buildLocalAnalytics = (): PedagogicalAnalytics => {
    try {
        const data = localStorage.getItem('soma_mastery_graph');
        const mastery: Record<string, number> = data ? JSON.parse(data) : {};

        const topicBreakdown: TopicAnalytics[] = Object.entries(mastery).map(([topic, level]) => ({
            topic,
            subject: inferSubject(topic),
            grade: '',
            avgMastery: level,
            studentCount: 1,
            avgAttempts: 1
        }));

        const sorted = [...topicBreakdown].sort((a, b) => a.avgMastery - b.avgMastery);
        const overallAvg = topicBreakdown.length > 0
            ? Math.round(topicBreakdown.reduce((sum, t) => sum + t.avgMastery, 0) / topicBreakdown.length)
            : 0;

        return {
            topicBreakdown,
            bottomTopics: sorted.slice(0, 10),
            topTopics: sorted.slice(-5).reverse(),
            totalStudentsAnalyzed: topicBreakdown.length > 0 ? 1 : 0,
            totalTopicsTracked: topicBreakdown.length,
            overallAvgMastery: overallAvg,
            computedAt: new Date().toISOString()
        };
    } catch {
        return {
            topicBreakdown: [], bottomTopics: [], topTopics: [],
            totalStudentsAnalyzed: 0, totalTopicsTracked: 0,
            overallAvgMastery: 0, computedAt: new Date().toISOString()
        };
    }
};

/**
 * Infer subject from topic string (fuzzy match).
 */
const inferSubject = (topic: string): string => {
    const t = topic.toLowerCase();
    if (t.includes('math') || t.includes('algebra') || t.includes('geometry') || t.includes('fraction') || t.includes('equation')) return 'Mathematics';
    if (t.includes('english') || t.includes('grammar') || t.includes('comprehension') || t.includes('writing')) return 'English';
    if (t.includes('kiswahili') || t.includes('swahili') || t.includes('msamiati') || t.includes('sarufi')) return 'Kiswahili';
    if (t.includes('science') || t.includes('biology') || t.includes('chemistry') || t.includes('physics') || t.includes('photosynthesis')) return 'Science';
    if (t.includes('social') || t.includes('history') || t.includes('geography') || t.includes('civic')) return 'Social Studies';
    if (t.includes('cre') || t.includes('christian') || t.includes('bible') || t.includes('religious')) return 'CRE';
    return 'General';
};

// --- ADMIN AGENT: STRATEGY GENERATION ---

/**
 * The Admin Agent's core function: analyze performance data and generate
 * refined teaching strategies using AI.
 */
export const generateTeachingStrategies = async (
    analytics: PedagogicalAnalytics,
    currentStrategies: TeachingStrategy[] = []
): Promise<TeachingStrategy[]> => {
    const generationConfig = {
        responseMimeType: "application/json",
        maxOutputTokens: 4096,
        responseSchema: {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    insight: { type: SchemaType.STRING, description: "Pattern observed in the data" },
                    rootCause: { type: SchemaType.STRING, description: "Why current teaching may be ineffective" },
                    strategy: { type: SchemaType.STRING, description: "Specific prompt instruction to add" },
                    expectedImpact: { type: SchemaType.STRING, description: "Predicted improvement" },
                    targetGrade: { type: SchemaType.STRING },
                    targetTopic: { type: SchemaType.STRING },
                    targetSubject: { type: SchemaType.STRING },
                    priority: { type: SchemaType.STRING, description: "HIGH, MEDIUM, or LOW" }
                },
                required: ["insight", "rootCause", "strategy", "expectedImpact", "priority"]
            }
        }
    };

    // Build analytics summary for the AI
    const bottomTopicsSummary = analytics.bottomTopics.map(t =>
        `- "${t.topic}" (${t.subject}): ${t.avgMastery}% avg mastery, ${t.studentCount} students, ${t.avgAttempts} avg attempts`
    ).join('\n');

    const topTopicsSummary = analytics.topTopics.map(t =>
        `- "${t.topic}" (${t.subject}): ${t.avgMastery}% avg mastery`
    ).join('\n');

    const currentStrategiesSummary = currentStrategies.length > 0
        ? currentStrategies.map(s => `- [${s.status}] ${s.strategy}`).join('\n')
        : 'No existing strategies yet.';

    const prompt = `
    You are the Somo Smart Admin Agent — a meta-teaching strategist for the Kenyan education system.
    
    SYSTEM CONTEXT: Somo Smart is an AI tutoring platform serving Kenyan students (CBC Grades 1-9 and 8-4-4 Forms 1-4).
    The platform uses the Kenyan Competency-Based Education (CBE) and 8-4-4 syllabi.
    
    AGGREGATED PERFORMANCE DATA:
    - Total students analyzed: ${analytics.totalStudentsAnalyzed}
    - Total topics tracked: ${analytics.totalTopicsTracked}
    - Overall average mastery: ${analytics.overallAvgMastery}%
    
    WEAKEST TOPICS (need most improvement):
    ${bottomTopicsSummary || 'No data available yet.'}
    
    STRONGEST TOPICS (working well):
    ${topTopicsSummary || 'No data available yet.'}
    
    CURRENT ACTIVE STRATEGIES:
    ${currentStrategiesSummary}
    
    TASK: Generate 3-5 specific, actionable teaching strategy refinements that would improve student outcomes.
    
    RULES:
    1. Each strategy must be a CONCRETE prompt instruction, not a vague suggestion.
    2. Use Kenyan pedagogical context (e.g., reference CBC strands, KCSE patterns).
    3. Use relatable Kenyan examples (e.g., matatu for distance problems, chapati for fractions).
    4. Focus on the WEAKEST topics first — these need the most help.
    5. Do NOT repeat strategies that are already active.
    6. Priority should be HIGH for weak topics with many students, MEDIUM for moderate issues, LOW for optimization.
    
    Output JSON array.
  `;

    try {
        const contents = [{ role: 'user', parts: [{ text: prompt }] }];
        const result = await callGeminiProxy(MODEL_NAME, contents, generationConfig);
        const text = result.response.text();
        if (!text) throw new Error("No response from Admin Agent");

        const strategies: any[] = parseModelJson(text);

        // Enrich with metadata
        return strategies.map((s, i) => ({
            ...s,
            id: `strategy_${Date.now()}_${i}`,
            status: 'PENDING' as const,
            createdAt: new Date().toISOString()
        }));
    } catch (error) {
        console.error("Admin Agent strategy generation failed:", error);
        throw error;
    }
};

// --- PERSONA RECOMMENDATION ---

/**
 * Determine the best teaching persona for a given student segment.
 */
export const recommendPersona = (
    grade: string,
    masteryLevel: number,
    isRevisionMode: boolean = false
): { persona: 'Coach' | 'Professor' | 'Mentor' | 'DrillSergeant'; reason: string } => {
    // Revision/Exam mode → DrillSergeant
    if (isRevisionMode) {
        return {
            persona: 'DrillSergeant',
            reason: 'Exam preparation mode — focused, direct, exam-strategy oriented.'
        };
    }

    // Parse grade level
    const gradeNum = parseGradeLevel(grade);

    // Lower primary (Grade 1-4) + low mastery → Coach
    if (gradeNum <= 4 || masteryLevel < 30) {
        return {
            persona: 'Coach',
            reason: 'Young learner or struggling student — encouraging, motivational, uses simple analogies.'
        };
    }

    // Middle school (Grade 5-8) + moderate mastery → Mentor
    if (gradeNum <= 8 && masteryLevel < 70) {
        return {
            persona: 'Mentor',
            reason: 'Middle school student building confidence — conversational, storytelling, relatable.'
        };
    }

    // Upper secondary (Form 1-4) or high mastery → Professor
    return {
        persona: 'Professor',
        reason: 'Advanced learner or secondary student — structured, formal, exam-focused.'
    };
};

/**
 * Parse a grade string to a numeric level for comparison.
 */
const parseGradeLevel = (grade: string): number => {
    const g = grade.toLowerCase().trim();

    // CBC grades: Grade 1-9
    const gradeMatch = g.match(/grade\s*(\d+)/i);
    if (gradeMatch) return parseInt(gradeMatch[1]);

    // 8-4-4 forms: Form 1-4 → map to 9-12
    const formMatch = g.match(/form\s*(\d+)/i);
    if (formMatch) return 8 + parseInt(formMatch[1]);

    // PP1/PP2
    if (g.includes('pp1') || g.includes('pre-primary 1')) return 0;
    if (g.includes('pp2') || g.includes('pre-primary 2')) return 0;

    return 6; // Default to middle
};

/**
 * Build a persona instruction string for AI prompt injection.
 */
export const buildPersonaInstruction = (
    persona: 'Coach' | 'Professor' | 'Mentor' | 'DrillSergeant'
): string => {
    switch (persona) {
        case 'Coach':
            return `
TEACHING PERSONA: 🏆 The Coach
- Tone: Warm, encouraging, energetic. Like a friendly PE teacher or football coach.
- Language: Simple, uses lots of analogies from everyday Kenyan life (sports, cooking, nature).
- Approach: Celebrate small wins ("Great thinking!"), use step-by-step guidance, never criticize mistakes.
- Phrases: "Let's try this together!", "You're getting closer!", "Think of it like..."
- Breaking down: Use very small steps. One idea at a time.
      `;

        case 'Professor':
            return `
TEACHING PERSONA: 🎓 The Professor
- Tone: Professional, structured, exam-focused. Like a top national school teacher.
- Language: Academic but clear. Uses proper Kenyan educational terminology (CBE strands, KNEC rubrics).
- Approach: Direct answers, structured explanations, exam-pattern awareness, marking scheme insights.
- Phrases: "According to the syllabus...", "KNEC expects you to...", "The marking scheme awards marks for..."
- Focus: Exam readiness, marking scheme alignment, time management tips.
      `;

        case 'Mentor':
            return `
TEACHING PERSONA: 🌟 The Mentor
- Tone: Conversational, relatable, like an older sibling helping with homework.
- Language: Casual but accurate. Uses storytelling and real-world Kenyan examples.
- Approach: Connect concepts to student's daily life, use "what if" scenarios, encourage curiosity.
- Phrases: "Imagine you're at the market...", "Here's a cool way to think about it...", "What would happen if..."
- Style: Ask questions to guide thinking before giving answers.
      `;

        case 'DrillSergeant':
            return `
TEACHING PERSONA: ⚡ The Drill Sergeant
- Tone: Rapid-fire, no-nonsense, exam drill mode. Like a KCSE revision bootcamp instructor.
- Language: Concise, direct, action-oriented. No fluff.
- Approach: Present → Practice → Mark → Next. Maximum questions per minute.
- Phrases: "Quick! What's the formula for...", "No time to waste — let's drill this!", "Remember: in the exam..."
- Focus: Speed, accuracy, exam tricks, common traps, time management.
      `;
    }
};
