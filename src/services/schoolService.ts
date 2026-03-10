import { supabase } from '../lib/supabase';

export const registerSchool = async (name: string, teacherLimit: number): Promise<{ success: boolean; schoolId?: string; message?: string }> => {
    try {
        const { data, error } = await supabase
            .from('schools')
            .insert({
                name,
                teacher_limit: teacherLimit,
                subscription_status: 'TRIAL',
                expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 day trial
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, schoolId: data.id };
    } catch (e: any) {
        console.error("School Registration Error:", e);
        return { success: false, message: e.message };
    }
};

export const onboardBulkTeachers = async (schoolId: string, teachers: { name: string, email: string }[]) => {
    // This would typically call a Supabase Edge function or bulk upsert profiles
    // For now, we simulate profile creation

    return { success: true };
};
