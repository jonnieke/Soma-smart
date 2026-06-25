-- Persist teacher workflow drafts for cross-session recovery.

create table if not exists public.teacher_workflow_drafts (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid not null references public.profiles(id) on delete cascade,
    draft_type text not null check (draft_type in ('LESSON_PLAN', 'SCHEME', 'HOMEWORK')),
    class_name text,
    subject text,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (teacher_id, draft_type)
);

create index if not exists teacher_workflow_drafts_teacher_idx
    on public.teacher_workflow_drafts (teacher_id, draft_type, updated_at desc);

alter table public.teacher_workflow_drafts enable row level security;

drop policy if exists "Teachers can manage own workflow drafts" on public.teacher_workflow_drafts;
create policy "Teachers can manage own workflow drafts"
    on public.teacher_workflow_drafts
    for all
    using (auth.uid() = teacher_id)
    with check (auth.uid() = teacher_id);

drop trigger if exists on_teacher_workflow_drafts_updated on public.teacher_workflow_drafts;
create trigger on_teacher_workflow_drafts_updated
    before update on public.teacher_workflow_drafts
    for each row execute procedure public.handle_updated_at();