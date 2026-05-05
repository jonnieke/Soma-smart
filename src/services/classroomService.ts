import { supabase } from '../lib/supabase';

export interface ClassroomPost {
    id: string;
    class_id: string;
    author_id: string;
    post_type: 'ANNOUNCEMENT' | 'ASSIGNMENT';
    content: string;
    created_at: string;
}

export interface StudentProfile {
    id: string;
    name: string;
    email?: string;
}

export interface ClassMember {
    id: string;
    class_id: string;
    student_id: string;
    profiles?: StudentProfile;
}

export interface GradebookEntry {
    id: string;
    class_id: string;
    student_id: string;
    assignment_id?: string;
    title: string;
    score: number;
    max_score: number;
    created_at: string;
}

class ClassroomService {
    async getClassesForTeacher(teacherId: string) {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('teacher_id', teacherId);

        if (error) throw error;
        return data;
    }

    async getOrCreateClassByName(teacherId: string, className: string, subject: string) {
        // Find existing
        let { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('teacher_id', teacherId)
            .eq('name', className)
            .single();

        if (!data) {
            // Create default
            const res = await supabase
                .from('classes')
                .insert([{ teacher_id: teacherId, name: className, subject: subject, grade_level: 'High School' }])
                .select()
                .single();
            if (res.error) throw res.error;
            data = res.data;
        }
        
        return data;
    }

    async getClassStream(classId: string): Promise<ClassroomPost[]> {
        const { data, error } = await supabase
            .from('class_posts')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }

    async createPost(classId: string, authorId: string, type: 'ANNOUNCEMENT' | 'ASSIGNMENT', content: string) {
        const { data, error } = await supabase
            .from('class_posts')
            .insert([
                {
                    class_id: classId,
                    author_id: authorId,
                    post_type: type,
                    content: content
                }
            ])
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async getClassRoster(classId: string): Promise<ClassMember[]> {
        const { data, error } = await supabase
            .from('class_members')
            .select(`
                *,
                profiles (
                    id,
                    name,
                    email
                )
            `)
            .eq('class_id', classId);

        if (error) throw error;
        return data || [];
    }

    async getGradebook(classId: string): Promise<GradebookEntry[]> {
        const { data, error } = await supabase
            .from('gradebook_entries')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
    }
}

export const classroomService = new ClassroomService();
