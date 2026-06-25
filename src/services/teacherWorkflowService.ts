import { supabase } from '../lib/supabase';

export type TeacherWorkflowDraftType = 'LESSON_PLAN' | 'SCHEME' | 'HOMEWORK';

export interface TeacherWorkflowDraftRecord {
    draftType: TeacherWorkflowDraftType;
    className?: string | null;
    subject?: string | null;
    payload: Record<string, unknown>;
    updatedAt?: string | null;
}

const localKey = (teacherId: string, draftType: TeacherWorkflowDraftType) =>
    `soma_teacher_workflow_draft_${teacherId}_${draftType}`;

const readLocalDraft = (teacherId: string, draftType: TeacherWorkflowDraftType): TeacherWorkflowDraftRecord | null => {
    try {
        const raw = localStorage.getItem(localKey(teacherId, draftType));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<TeacherWorkflowDraftRecord> & { payload?: Record<string, unknown> };
        if (!parsed?.payload || typeof parsed.payload !== 'object') return null;
        return {
            draftType,
            className: typeof parsed.className === 'string' ? parsed.className : null,
            subject: typeof parsed.subject === 'string' ? parsed.subject : null,
            payload: parsed.payload,
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : null,
        };
    } catch {
        return null;
    }
};

const writeLocalDraft = (teacherId: string, draftType: TeacherWorkflowDraftType, record: TeacherWorkflowDraftRecord) => {
    try {
        localStorage.setItem(localKey(teacherId, draftType), JSON.stringify(record));
    } catch {
        // Best effort.
    }
};

export const loadTeacherWorkflowDraft = async (
    teacherId: string | undefined,
    draftType: TeacherWorkflowDraftType,
): Promise<TeacherWorkflowDraftRecord | null> => {
    if (!teacherId) return null;

    if (navigator.onLine) {
        try {
            const { data, error } = await supabase
                .from('teacher_workflow_drafts')
                .select('draft_type,class_name,subject,payload,updated_at')
                .eq('teacher_id', teacherId)
                .eq('draft_type', draftType)
                .maybeSingle();

            if (!error && data?.payload) {
                const record: TeacherWorkflowDraftRecord = {
                    draftType,
                    className: data.class_name,
                    subject: data.subject,
                    payload: typeof data.payload === 'object' && data.payload !== null ? (data.payload as Record<string, unknown>) : {},
                    updatedAt: data.updated_at,
                };
                writeLocalDraft(teacherId, draftType, record);
                return record;
            }
        } catch {
            // Fall through to local cache.
        }
    }

    return readLocalDraft(teacherId, draftType);
};

export const saveTeacherWorkflowDraft = async (
    teacherId: string | undefined,
    draftType: TeacherWorkflowDraftType,
    payload: Record<string, unknown>,
    meta: { className?: string | null; subject?: string | null } = {},
) => {
    if (!teacherId) return;

    const record: TeacherWorkflowDraftRecord = {
        draftType,
        className: meta.className ?? null,
        subject: meta.subject ?? null,
        payload,
        updatedAt: new Date().toISOString(),
    };

    writeLocalDraft(teacherId, draftType, record);

    if (!navigator.onLine) return;

    try {
        const { error } = await supabase.from('teacher_workflow_drafts').upsert(
            {
                teacher_id: teacherId,
                draft_type: draftType,
                class_name: record.className,
                subject: record.subject,
                payload: record.payload,
            },
            { onConflict: 'teacher_id,draft_type' },
        );

        if (error && import.meta.env.DEV) {
            console.warn('Could not sync teacher workflow draft:', error.message);
        }
    } catch (error) {
        if (import.meta.env.DEV) {
            console.warn('Could not sync teacher workflow draft:', error);
        }
    }
};

export const clearTeacherWorkflowDraft = async (teacherId: string | undefined, draftType: TeacherWorkflowDraftType) => {
    if (!teacherId) return;

    try {
        localStorage.removeItem(localKey(teacherId, draftType));
    } catch {
        // Best effort.
    }

    if (!navigator.onLine) return;

    try {
        await supabase
            .from('teacher_workflow_drafts')
            .delete()
            .eq('teacher_id', teacherId)
            .eq('draft_type', draftType);
    } catch {
        // Best effort.
    }
};
