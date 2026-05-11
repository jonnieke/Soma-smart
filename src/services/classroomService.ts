import { supabase } from '../lib/supabase';
import { warnIfDev } from '../utils/logger';

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

export interface AssignmentPost {
    id: string;
    class_id: string;
    class_name: string;
    title: string;
    created_at: string;
}

export interface ClassroomDetails {
    id: string;
    teacher_id: string;
    name: string;
    subject: string;
    grade_level: string;
    created_at?: string;
    profiles?: {
        name?: string;
    };
}

export interface StudentClassroomSummary {
    class: ClassroomDetails;
    latestPosts: ClassroomPost[];
}

class ClassroomService {
    private classLookupCooldownMs = 5 * 60 * 1000;
    private classLookupFailureCache = new Map<string, number>();

    private isLocalClassId(classId: string) {
        return classId.startsWith('local-class:');
    }

    private getLocalClassId(teacherId: string, className: string) {
        return `local-class:${teacherId}:${encodeURIComponent(className)}`;
    }

    private getLocalPostKey(classId: string) {
        return `soma_classroom_posts_${classId}`;
    }

    private readLocalPosts(classId: string): ClassroomPost[] {
        if (typeof localStorage === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem(this.getLocalPostKey(classId)) || '[]');
        } catch {
            return [];
        }
    }

    private writeLocalPosts(classId: string, posts: ClassroomPost[]) {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(this.getLocalPostKey(classId), JSON.stringify(posts));
    }

    private createLocalClass(teacherId: string, className: string, subject: string) {
        return {
            id: this.getLocalClassId(teacherId, className),
            teacher_id: teacherId,
            name: className,
            subject,
            grade_level: 'High School',
            is_local_fallback: true
        };
    }

    async getClassesForTeacher(teacherId: string) {
        const { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('teacher_id', teacherId);

        if (error) throw error;
        return data;
    }

    async getClassById(classId: string): Promise<ClassroomDetails | null> {
        const { data, error } = await supabase
            .from('classes')
            .select(`
                *,
                profiles:teacher_id (
                    name,
                    full_name
                )
            `)
            .eq('id', classId)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;
        return {
            ...data,
            profiles: profile
                ? { name: profile.name || profile.full_name }
                : undefined
        };
    }

    async getClassesForStudent(studentId: string): Promise<StudentClassroomSummary[]> {
        const { data, error } = await supabase
            .from('class_members')
            .select(`
                class_id,
                classes (
                    *,
                    profiles:teacher_id (
                        name,
                        full_name
                    )
                )
            `)
            .eq('student_id', studentId);

        if (error) {
            warnIfDev('Student classroom fetch failed:', error);
            return [];
        }

        const classes = (data || [])
            .map((row: any) => {
                const rawClass = Array.isArray(row.classes) ? row.classes[0] : row.classes;
                if (!rawClass) return null;
                const rawProfile = Array.isArray(rawClass.profiles) ? rawClass.profiles[0] : rawClass.profiles;
                return {
                    ...rawClass,
                    profiles: rawProfile
                        ? { name: rawProfile.name || rawProfile.full_name }
                        : undefined
                } as ClassroomDetails;
            })
            .filter(Boolean) as ClassroomDetails[];

        const summaries = await Promise.all(classes.map(async (classroom) => {
            const latestPosts = (await this.getClassStream(classroom.id)).slice(0, 3);
            return { class: classroom, latestPosts };
        }));

        return summaries;
    }

    async getOrCreateClassByName(teacherId: string, className: string, subject: string) {
        const normalizedClassName = String(className || '').trim();
        if (!normalizedClassName) {
            throw new Error('Class name is required.');
        }
        const cacheKey = `${teacherId}:${normalizedClassName.toLowerCase()}`;
        const now = Date.now();
        const lastFailureAt = this.classLookupFailureCache.get(cacheKey);
        if (lastFailureAt && now - lastFailureAt < this.classLookupCooldownMs) {
            return this.createLocalClass(teacherId, normalizedClassName, subject);
        }

        // Find existing
        let { data, error } = await supabase
            .from('classes')
            .select('*')
            .eq('teacher_id', teacherId)
            .eq('name', normalizedClassName)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (error) {
            warnIfDev('Class lookup failed; using local classroom fallback:', error);
            this.classLookupFailureCache.set(cacheKey, now);
            return this.createLocalClass(teacherId, normalizedClassName, subject);
        }

        if (!data) {
            // Create default
            const res = await supabase
                .from('classes')
                .insert([{ teacher_id: teacherId, name: normalizedClassName, subject: subject, grade_level: 'High School' }])
                .select()
                .single();
            if (res.error) {
                warnIfDev('Class create failed; using local classroom fallback:', res.error);
                this.classLookupFailureCache.set(cacheKey, now);
                return this.createLocalClass(teacherId, normalizedClassName, subject);
            }
            data = res.data;
        }
        this.classLookupFailureCache.delete(cacheKey);
        
        return data;
    }

    async getClassStream(classId: string): Promise<ClassroomPost[]> {
        if (this.isLocalClassId(classId)) {
            return this.readLocalPosts(classId);
        }

        const { data, error } = await supabase
            .from('class_posts')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: false });

        if (error) {
            warnIfDev('Class stream fetch failed; showing local stream fallback:', error);
            return this.readLocalPosts(classId);
        }
        return data || [];
    }

    async createPost(classId: string, authorId: string, type: 'ANNOUNCEMENT' | 'ASSIGNMENT', content: string) {
        if (this.isLocalClassId(classId)) {
            const post: ClassroomPost = {
                id: `local-post:${Date.now()}`,
                class_id: classId,
                author_id: authorId,
                post_type: type,
                content,
                created_at: new Date().toISOString()
            };
            const posts = [post, ...this.readLocalPosts(classId)];
            this.writeLocalPosts(classId, posts);
            return post;
        }

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

        if (error) {
            warnIfDev('Class post create failed; saving post locally:', error);
            const post: ClassroomPost = {
                id: `local-post:${Date.now()}`,
                class_id: classId,
                author_id: authorId,
                post_type: type,
                content,
                created_at: new Date().toISOString()
            };
            const posts = [post, ...this.readLocalPosts(classId)];
            this.writeLocalPosts(classId, posts);
            return post;
        }
        return data;
    }

    async getClassRoster(classId: string): Promise<ClassMember[]> {
        if (this.isLocalClassId(classId)) {
            return [];
        }

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

        if (error) {
            warnIfDev('Class roster fetch failed; showing empty roster fallback:', error);
            return [];
        }
        return data || [];
    }

    async joinClass(classId: string, studentId: string): Promise<{ success: boolean; alreadyJoined?: boolean; message?: string }> {
        const { error } = await supabase
            .from('class_members')
            .insert([{ class_id: classId, student_id: studentId }]);

        if (!error) return { success: true };

        if (error.code === '23505') {
            return { success: true, alreadyJoined: true };
        }

        return { success: false, message: error.message || 'Could not join class.' };
    }

    async joinClassWithStudentCode(classId: string, studentCode: string): Promise<{ success: boolean; message?: string }> {
        const { data, error } = await supabase.rpc('join_class_with_student_code', {
            target_class_id: classId,
            target_student_code: studentCode
        });

        if (error) {
            return { success: false, message: error.message || 'Could not join class.' };
        }

        return data === true
            ? { success: true }
            : { success: false, message: 'Learner code could not be matched.' };
    }

    async getGradebook(classId: string): Promise<GradebookEntry[]> {
        if (this.isLocalClassId(classId)) {
            return [];
        }

        const { data, error } = await supabase
            .from('gradebook_entries')
            .select('*')
            .eq('class_id', classId)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Gradebook fetch failed; showing empty gradebook fallback:', error);
            return [];
        }
        return data || [];
    }

    async createGradebookEntry(payload: {
        classId: string;
        studentId: string;
        title: string;
        score: number;
        maxScore: number;
        assignmentId?: string;
    }): Promise<GradebookEntry> {
        const { data, error } = await supabase
            .from('gradebook_entries')
            .insert([{
                class_id: payload.classId,
                student_id: payload.studentId,
                title: payload.title,
                score: payload.score,
                max_score: payload.maxScore,
                assignment_id: payload.assignmentId || null
            }])
            .select('*')
            .single();

        if (error) throw error;
        return data;
    }

    async getTeacherAssignments(teacherId: string): Promise<AssignmentPost[]> {
        const classes = await this.getClassesForTeacher(teacherId);
        if (!classes?.length) return [];

        const rows = await Promise.all(classes.map(async (c: any) => {
            const posts = await this.getClassStream(c.id);
            return posts
                .filter((p) => p.post_type === 'ASSIGNMENT')
                .map((p) => ({
                    id: p.id,
                    class_id: c.id,
                    class_name: c.name,
                    title: p.content || 'Assignment',
                    created_at: p.created_at
                }));
        }));

        return rows.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
}

export const classroomService = new ClassroomService();
