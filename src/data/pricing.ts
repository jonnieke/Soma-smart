import { SubscriptionPlan } from '../types';

export const STUDENT_PLANS: SubscriptionPlan[] = [
    { id: 's_daily', segment: 'STUDENT', name: 'Daily Dash', price: 10, duration: 'DAILY' },
    { id: 's_weekly', segment: 'STUDENT', name: 'Weekly Warrior', price: 50, duration: 'WEEKLY', savings: 'Save 28%' },
    { id: 's_monthly', segment: 'STUDENT', name: 'Monthly Master', price: 150, duration: 'MONTHLY', savings: 'Save 50%' },
    { id: 's_termly', segment: 'STUDENT', name: 'Term Lite', price: 350, duration: 'TERMLY', savings: 'Save 61%' },
    { id: 's_annual', segment: 'STUDENT', name: 'Annual Ace', price: 1000, duration: 'ANNUAL', savings: 'Save 72%' },
];

export const TEACHER_PLANS: SubscriptionPlan[] = [
    { id: 't_monthly', segment: 'TEACHER', name: 'Pro Monthly', price: 300, duration: 'MONTHLY' },
    { id: 't_termly', segment: 'TEACHER', name: 'Pro Termly', price: 800, duration: 'TERMLY', savings: 'Save 11%' },
    { id: 't_annual', segment: 'TEACHER', name: 'Pro Annual', price: 2500, duration: 'ANNUAL', savings: 'Save 30%' },
];

export const SCHOOL_PLANS = [
    { id: 'sch_small', name: 'Small School', teacherLimit: 10, price: 5000, duration: 'TERMLY' },
    { id: 'sch_medium', name: 'Medium School', teacherLimit: 30, price: 10000, duration: 'TERMLY' },
    { id: 'sch_large', name: 'Large School', teacherLimit: 60, price: 18000, duration: 'TERMLY' },
];
