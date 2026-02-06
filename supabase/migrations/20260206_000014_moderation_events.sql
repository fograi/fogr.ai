-- Moderation workflow events (DSA ops logging)

create table if not exists public.moderation_events (
  id uuid primary key default gen_random_uuid(),
  content_type text not null default 'ad',
  content_id uuid not null,
  report_id uuid references public.ad_reports(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  decision text,
  legal_basis text,
  automated_flag boolean not null default false,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'moderation_events_content_type_check'
      and conrelid = 'public.moderation_events'::regclass
  ) then
    alter table public.moderation_events
      add constraint moderation_events_content_type_check
      check (content_type in ('ad'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'moderation_events_event_type_check'
      and conrelid = 'public.moderation_events'::regclass
  ) then
    alter table public.moderation_events
      add constraint moderation_events_event_type_check
      check (
        event_type in (
          'report_received',
          'review_started',
          'decision_made',
          'statement_sent',
          'appeal_opened',
          'appeal_resolved',
          'appeal_dismissed'
        )
      );
  end if;
end $$;

create index if not exists moderation_events_created_at_idx
  on public.moderation_events (created_at desc);

create index if not exists moderation_events_content_id_created_at_idx
  on public.moderation_events (content_id, created_at desc);

create index if not exists moderation_events_report_id_idx
  on public.moderation_events (report_id);

create index if not exists moderation_events_event_type_created_at_idx
  on public.moderation_events (event_type, created_at desc);

create index if not exists moderation_events_user_id_idx
  on public.moderation_events (user_id);

alter table public.moderation_events enable row level security;
