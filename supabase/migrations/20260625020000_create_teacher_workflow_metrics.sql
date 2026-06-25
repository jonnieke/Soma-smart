-- Persist daily teacher workflow metrics for dashboard analytics.

create table if not exists public.teacher_workflow_metrics (
    id uuid primary key default gen_random_uuid(),
    teacher_id uuid not null references public.profiles(id) on delete cascade,
    metric_date date not null default current_date,
    total_events integer not null default 0,
    scheme_generated integer not null default 0,
    homework_generated integer not null default 0,
    note_generated integer not null default 0,
    step_completed integer not null default 0,
    reset_count integer not null default 0,
    last_event_name text,
    last_event_at timestamptz,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null,
    unique (teacher_id, metric_date)
);

create index if not exists teacher_workflow_metrics_teacher_date_idx
    on public.teacher_workflow_metrics (teacher_id, metric_date desc);

alter table public.teacher_workflow_metrics enable row level security;

drop policy if exists "Teachers can manage own workflow metrics" on public.teacher_workflow_metrics;
create policy "Teachers can manage own workflow metrics"
    on public.teacher_workflow_metrics
    for all
    using (auth.uid() = teacher_id)
    with check (auth.uid() = teacher_id);

drop trigger if exists on_teacher_workflow_metrics_updated on public.teacher_workflow_metrics;
create trigger on_teacher_workflow_metrics_updated
    before update on public.teacher_workflow_metrics
    for each row execute procedure public.handle_updated_at();
