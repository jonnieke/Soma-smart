import { supabase } from '../lib/supabase';
import { classroomService } from './classroomService';
import type { PracticeQuestion } from './geminiService';

export interface HomeworkAssignment {
    id: string;
    title: string;
    questions: PracticeQuestion[];
}

/** Publish questions only. Model answers remain in the teacher's private draft. */
export async function publishTeacherHomework(
    teacherId: string,
    grade: string,
    subject: string,
    homework: HomeworkAssignment,
    dueDate: string,
) {
    if (!navigator.onLine) throw new Error('Connect to the internet to post homework. Your draft is still here.');
    if (!teacherId || !grade.trim() || !subject.trim() || !homework.id || !homework.questions.length) {
        throw new Error('Choose a class and subject and generate questions before posting.');
    }
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || auth.user?.id !== teacherId) throw new Error('Sign in to your teacher account before posting.');

    const classroom = await classroomService.getOrCreateClassByName(teacherId, grade, subject);
    if (!classroom?.id || classroom.id.startsWith('local-class:') || classroom.is_local_fallback) {
        throw new Error('Your classroom could not be reached. Nothing was posted; your draft is still here.');
    }
    const content = [
        homework.title,
        `Subject: ${subject}`,
        `Class: ${grade}`,
        dueDate ? `Due: ${dueDate}` : 'Complete as instructed by your teacher.',
        '',
        ...homework.questions.map((question, index) => `${index + 1}. ${question.text} (${question.marks} marks)`),
    ].join('\n\n');
    const row = { id: homework.id, class_id: classroom.id, author_id: teacherId, post_type: 'ASSIGNMENT', content };
    // A stable draft ID makes retries safe, including a lost response after a successful insert.
    const { data, error } = await supabase.from('class_posts').insert(row).select().single();
    if (!error && data?.id) return data;
    if (error?.code === '23505') {
        const existing = await supabase.from('class_posts').select('*')
            .eq('id', row.id).eq('author_id', teacherId).eq('class_id', classroom.id).single();
        if (!existing.error && existing.data?.content === content && existing.data?.post_type === 'ASSIGNMENT') {
            return existing.data;
        }
    }
    throw new Error('Posting could not be confirmed. Your draft is safe; retry to check the same assignment.');
}
