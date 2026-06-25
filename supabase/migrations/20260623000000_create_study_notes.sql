-- Private learner Notebook storage.
-- Guest/offline drafts stay on-device until a real Supabase Auth session exists.

create table if not exists public.study_notes (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid not null references public.profiles(id) on delete cascade,
    student_code text,
    title text not null check (char_length(title) between 1 and 200),
    content text not null check (char_length(content) between 1 and 50000),
    subject text not null default 'General',
    grade text not null default '',
    topic text,
    source text not null default 'manual'
        check (source in ('ai_answer', 'manual', 'teacher', 'library', 'audio')),
    mastery_status text not null default 'new'
        check (mastery_status in ('new', 'learning', 'understood', 'revise_again')),
    audio_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists study_notes_owner_updated_idx
    on public.study_notes (owner_id, updated_at desc);

alter table public.study_notes enable row level security;

drop policy if exists "Learners read own study notes" on public.study_notes;
create policy "Learners read own study notes"
    on public.study_notes for select
    to authenticated
    using (auth.uid() = owner_id);

drop policy if exists "Learners create own study notes" on public.study_notes;
create policy "Learners create own study notes"
    on public.study_notes for insert
    to authenticated
    with check (auth.uid() = owner_id);

drop policy if exists "Learners update own study notes" on public.study_notes;
create policy "Learners update own study notes"
    on public.study_notes for update
    to authenticated
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);

drop policy if exists "Learners delete own study notes" on public.study_notes;
create policy "Learners delete own study notes"
    on public.study_notes for delete
    to authenticated
    using (auth.uid() = owner_id);
