import { SubscriptionPlan } from '../types';

export const STUDENT_PLANS: SubscriptionPlan[] = [
    { id: 's_daily', segment: 'STUDENT', name: 'Daily Dash', price: 20, duration: 'DAILY', features: ['Basic Ask Akili help', 'Soma Library grounded answers', '6 smart marking checks/day', 'Notes and past papers access', 'Voice lessons for focused revision'] },
    { id: 's_weekly', segment: 'STUDENT', name: 'Weekly Warrior', price: 100, duration: 'WEEKLY', savings: 'Save 28%', features: ['Higher Ask Akili limits', 'Exam Coach with past-paper grounding', '35 smart marking checks/day', 'Notes and past papers access', 'Parent progress proof'] },
    { id: 's_monthly', segment: 'STUDENT', name: 'Monthly Master', price: 300, duration: 'MONTHLY', savings: 'Save 50%', features: ['High-limit Ask Akili and library grounding', 'Deep past-paper and PDF analysis', '150 smart marking checks/day', 'High-limit quiz and repair drills', 'Parent progress proof', 'Audio learning and scans'] },
    { id: 's_termly', segment: 'STUDENT', name: 'Term Lite', price: 700, duration: 'TERMLY', savings: 'Save 61%', features: ['Term-long grounded revision support', 'Deep past-paper and PDF analysis', '420 smart marking checks/day', 'High-limit quiz and repair drills', 'Parent progress proof', 'Audio learning and scans'] },
    { id: 's_annual', segment: 'STUDENT', name: 'Annual Ace', price: 2000, duration: 'ANNUAL', savings: 'Save 72%', features: ['Year-round grounded study support', 'Deep past-paper and PDF analysis', '1,500 smart marking checks/day', 'High-limit quiz and repair drills', 'Parent progress proof', 'Audio learning and scans', 'Exam prep habit tracking'] },
];

export const TEACHER_PLANS: SubscriptionPlan[] = [
    { id: 't_monthly', segment: 'TEACHER', name: 'Pro Monthly', price: 600, duration: 'MONTHLY', features: ['Somo Lesson Planner', 'Automated Grading', 'Student Analytics', 'Unlimited Classrooms'] },
    { id: 't_termly', segment: 'TEACHER', name: 'Pro Termly', price: 1600, duration: 'TERMLY', savings: 'Save 11%', features: ['Somo Lesson Planner', 'Automated Grading', 'Student Analytics', 'Unlimited Classrooms', 'Priority Verified Badge'] },
    { id: 't_annual', segment: 'TEACHER', name: 'Pro Annual', price: 5000, duration: 'ANNUAL', savings: 'Save 30%', features: ['Somo Lesson Planner', 'Automated Grading', 'Student Analytics', 'Unlimited Classrooms', 'Priority Verified Badge', 'Export Reports'] },
];

export const DOWNLOAD_PASS: SubscriptionPlan = {
    id: 'download_pack_5',
    segment: 'STUDENT',
    name: '5 Download Pack',
    price: 20,
    duration: 'DAILY', // Re-using DAILY for backend compatibility (same price point)
};

export const LEARNING_CREDIT_PACKS: SubscriptionPlan[] = [
    {
        id: 'credit_30',
        segment: 'STUDENT',
        name: '30 Learning Credits',
        price: 20,
        duration: 'DAILY',
        credits: 30,
        isCreditPack: true,
        features: ['30 extra AI actions', 'Can extend grounded answers, marking, or voice', 'Expires after 1 day']
    },
    {
        id: 'credit_100',
        segment: 'STUDENT',
        name: '100 Learning Credits',
        price: 50,
        duration: 'WEEKLY',
        credits: 100,
        isCreditPack: true,
        savings: 'Best top-up',
        features: ['100 extra AI actions', 'Useful for Exam Coach, marking, and voice revision', 'Expires after 7 days']
    },
    {
        id: 'credit_250',
        segment: 'STUDENT',
        name: '250 Learning Credits',
        price: 100,
        duration: 'MONTHLY',
        credits: 250,
        isCreditPack: true,
        savings: 'Most value',
        features: ['250 extra AI actions', 'Best for deep Exam Prep and document analysis weeks', 'Expires after 30 days']
    },
];

export const SCHOOL_PLANS: SubscriptionPlan[] = [
    {
        id: 'sch_basic',
        segment: 'SCHOOL',
        name: 'School Basic',
        price: 4999,
        duration: 'TERMLY',
        schoolTier: 'SCHOOL_BASIC',
        isSchoolWorkspacePlan: true,
        teacherSeatLimit: 5,
        aiCredits: 500,
        studentLimit: 200,
        features: [
            'Up to 5 teacher seats',
            '500 shared AI credits per term',
            'School question bank',
            'Review & approval workflow',
            'School-branded exam templates',
            'Examination paper locking & versioning',
            'Basic audit trail',
        ],
    },
    {
        id: 'sch_pro',
        segment: 'SCHOOL',
        name: 'School Pro',
        price: 12999,
        duration: 'TERMLY',
        schoolTier: 'SCHOOL_PRO',
        isSchoolWorkspacePlan: true,
        teacherSeatLimit: 20,
        aiCredits: 2000,
        studentLimit: 600,
        savings: 'Most popular',
        features: [
            'Up to 20 teacher seats',
            '2,000 shared AI credits per term',
            'Full department management & HOD roles',
            'Multi-stage review & approval pipeline',
            'School-branded exam templates',
            'Paper versioning & version history',
            'Full audit trail & activity logs',
            'Marketplace submissions enabled',
        ],
    },
    {
        id: 'sch_enterprise',
        segment: 'SCHOOL',
        name: 'School Enterprise',
        price: 29999,
        duration: 'TERMLY',
        schoolTier: 'SCHOOL_ENTERPRISE',
        isSchoolWorkspacePlan: true,
        teacherSeatLimit: 0, // 0 = unlimited
        aiCredits: 10000,
        studentLimit: 0, // 0 = unlimited
        savings: 'Best value',
        features: [
            'Unlimited teacher seats',
            '10,000 shared AI credits per term',
            'Full department, HOD & coordinator roles',
            'Multi-stage review & approval pipeline',
            'Custom school branding & watermarks',
            'Full paper versioning & history',
            'Full audit trail & compliance reports',
            'Marketplace submissions enabled',
            'District analytics access',
            'Priority platform support',
        ],
    },
];


