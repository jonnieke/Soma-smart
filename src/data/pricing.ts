import { SubscriptionPlan } from '../types';

export const STUDENT_PLANS: SubscriptionPlan[] = [
    { id: 's_daily', segment: 'STUDENT', name: 'Daily Dash', price: 20, duration: 'DAILY', features: ['Ask Akili step-by-step help', 'Try-first answer guidance', 'Quick quizzes with marking'] },
    { id: 's_weekly', segment: 'STUDENT', name: 'Weekly Warrior', price: 100, duration: 'WEEKLY', savings: 'Save 28%', features: ['Ask Akili step-by-step help', 'Notes and past papers access', 'Quick quizzes with marking', 'Parent progress proof'] },
    { id: 's_monthly', segment: 'STUDENT', name: 'Monthly Master', price: 300, duration: 'MONTHLY', savings: 'Save 50%', features: ['Ask Akili step-by-step help', 'Notes and past papers access', 'Unlimited quiz and repair drills', 'Parent progress proof', 'Audio learning and scans'] },
    { id: 's_termly', segment: 'STUDENT', name: 'Term Lite', price: 700, duration: 'TERMLY', savings: 'Save 61%', features: ['Ask Akili step-by-step help', 'Notes and past papers access', 'Unlimited quiz and repair drills', 'Parent progress proof', 'Audio learning and scans'] },
    { id: 's_annual', segment: 'STUDENT', name: 'Annual Ace', price: 2000, duration: 'ANNUAL', savings: 'Save 72%', features: ['Ask Akili step-by-step help', 'Notes and past papers access', 'Unlimited quiz and repair drills', 'Parent progress proof', 'Audio learning and scans', 'Exam prep habit tracking'] },
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

export const SCHOOL_PLANS: SubscriptionPlan[] = [
    { id: 'sch_small', segment: 'SCHOOL', name: 'Small School', price: 10000, duration: 'TERMLY', teacherLimit: 3, studentLimit: 50 },
    { id: 'sch_medium', segment: 'SCHOOL', name: 'Medium School', price: 20000, duration: 'TERMLY', teacherLimit: 10, studentLimit: 100 },
    { id: 'sch_large', segment: 'SCHOOL', name: 'Large School', price: 36000, duration: 'TERMLY', teacherLimit: 50, studentLimit: 500 },
];
