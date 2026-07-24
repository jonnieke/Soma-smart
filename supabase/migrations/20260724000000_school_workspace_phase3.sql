-- SomaAI Phase 3: School Assessment Workspace Database Schema & RLS Policies

-- 1. School Memberships
CREATE TABLE IF NOT EXISTS public.school_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    user_phone TEXT,
    roles TEXT[] NOT NULL DEFAULT '{"TEACHER"}',
    department_ids TEXT[] DEFAULT '{}',
    subject_ids TEXT[] DEFAULT '{}',
    grade_ids TEXT[] DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended', 'removed')),
    invited_by UUID,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(school_id, user_id)
);

-- 2. School Invitations
CREATE TABLE IF NOT EXISTS public.school_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    school_name TEXT NOT NULL,
    invitee_name TEXT NOT NULL,
    invitee_email TEXT NOT NULL,
    invitee_phone TEXT,
    roles TEXT[] NOT NULL DEFAULT '{"TEACHER"}',
    department_ids TEXT[] DEFAULT '{}',
    subject_ids TEXT[] DEFAULT '{}',
    token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
    invited_by UUID NOT NULL,
    invited_by_name TEXT NOT NULL,
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ
);

-- 3. School Departments
CREATE TABLE IF NOT EXISTS public.school_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    subject_ids TEXT[] DEFAULT '{}',
    grade_ids TEXT[] DEFAULT '{}',
    head_user_ids TEXT[] DEFAULT '{}',
    member_user_ids TEXT[] DEFAULT '{}',
    approval_workflow_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Review Comments
CREATE TABLE IF NOT EXISTS public.review_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    paper_id TEXT NOT NULL,
    question_id TEXT,
    section_id TEXT,
    author_id UUID NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'dismissed')),
    resolved_by UUID,
    resolved_by_name TEXT,
    resolved_at TIMESTAMPTZ,
    parent_id UUID REFERENCES public.review_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Paper Versions
CREATE TABLE IF NOT EXISTS public.paper_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    paper_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    editor_id UUID NOT NULL,
    editor_name TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    change_summary TEXT NOT NULL,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    questions_count INTEGER DEFAULT 0,
    total_marks INTEGER DEFAULT 0,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. School Templates
CREATE TABLE IF NOT EXISTS public.school_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    department_id TEXT,
    grade TEXT,
    subject TEXT,
    exam_type TEXT,
    header_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    candidate_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    instructions TEXT[] DEFAULT '{}',
    section_layouts JSONB DEFAULT '[]'::jsonb,
    footer_text TEXT,
    page_number_style TEXT DEFAULT 'PAGE_X_OF_Y',
    working_space_style TEXT DEFAULT 'STANDARD',
    marking_scheme_style TEXT DEFAULT 'INLINE',
    default_duration_minutes INTEGER DEFAULT 60,
    default_total_marks INTEGER DEFAULT 50,
    is_default BOOLEAN DEFAULT FALSE,
    is_department_default BOOLEAN DEFAULT FALSE,
    created_by UUID NOT NULL,
    created_by_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Assessment Deadlines
CREATE TABLE IF NOT EXISTS public.assessment_deadlines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    title TEXT NOT NULL,
    term TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    grade TEXT NOT NULL,
    subject TEXT NOT NULL,
    department_id TEXT NOT NULL,
    paper_owner_id UUID,
    paper_owner_name TEXT,
    paper_id TEXT,
    draft_due_date DATE NOT NULL,
    review_due_date DATE NOT NULL,
    approval_due_date DATE NOT NULL,
    printing_date DATE NOT NULL,
    exam_date DATE NOT NULL,
    status TEXT DEFAULT 'UPCOMING' CHECK (status IN ('UPCOMING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. School Credit Allocations
CREATE TABLE IF NOT EXISTS public.school_credit_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID UNIQUE NOT NULL,
    total_allocated_credits INTEGER DEFAULT 5000,
    used_credits INTEGER DEFAULT 0,
    remaining_credits INTEGER DEFAULT 5000,
    term TEXT NOT NULL DEFAULT 'Term 1',
    user_limits JSONB DEFAULT '{}'::jsonb,
    department_limits JSONB DEFAULT '{}'::jsonb,
    suspended_user_ids TEXT[] DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. School Activity Logs
CREATE TABLE IF NOT EXISTS public.school_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    actor_id UUID NOT NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_title TEXT,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 10. School Notifications
CREATE TABLE IF NOT EXISTS public.school_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. School Settings
CREATE TABLE IF NOT EXISTS public.school_settings (
    school_id UUID PRIMARY KEY,
    school_name TEXT NOT NULL,
    default_curriculum TEXT DEFAULT 'CBC_CBE',
    current_term TEXT DEFAULT 'Term 1',
    current_academic_year TEXT DEFAULT '2026',
    grading_system TEXT DEFAULT 'CBC_4_POINT',
    required_approval_stages TEXT[] DEFAULT '{"HOD"}',
    require_independent_reviewer BOOLEAN DEFAULT TRUE,
    allow_teacher_personal_credits BOOLEAN DEFAULT TRUE,
    default_paper_visibility TEXT DEFAULT 'department',
    default_template_id TEXT,
    default_review_deadline_days INTEGER DEFAULT 3,
    allow_department_level_approval BOOLEAN DEFAULT TRUE,
    allow_teachers_to_export_drafts BOOLEAN DEFAULT FALSE,
    allow_reviewers_to_edit_questions BOOLEAN DEFAULT TRUE,
    low_credit_threshold INTEGER DEFAULT 100,
    default_watermark_text TEXT DEFAULT 'CONFIDENTIAL - SCHOOL EXAM',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing for high-performance school queries
CREATE INDEX IF NOT EXISTS idx_school_memberships_school_user ON public.school_memberships(school_id, user_id);
CREATE INDEX IF NOT EXISTS idx_school_invitations_token ON public.school_invitations(token);
CREATE INDEX IF NOT EXISTS idx_school_departments_school ON public.school_departments(school_id);
CREATE INDEX IF NOT EXISTS idx_review_comments_paper ON public.review_comments(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_versions_paper ON public.paper_versions(paper_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_school_activity_logs_school ON public.school_activity_logs(school_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_school_notifications_user ON public.school_notifications(user_id, is_read);

-- Enable RLS on all Phase 3 tables
ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_credit_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;

-- Base RLS Policy: Users can read data belonging to their active school membership
CREATE POLICY "School members can view school memberships"
    ON public.school_memberships FOR SELECT
    USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM public.school_memberships m 
        WHERE m.school_id = school_memberships.school_id 
        AND m.user_id = auth.uid() 
        AND m.status = 'active'
    ));

CREATE POLICY "School admins can manage memberships"
    ON public.school_memberships FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.school_memberships m 
        WHERE m.school_id = school_memberships.school_id 
        AND m.user_id = auth.uid() 
        AND m.status = 'active'
        AND ('OWNER' = ANY(m.roles) OR 'ADMIN' = ANY(m.roles))
    ));
