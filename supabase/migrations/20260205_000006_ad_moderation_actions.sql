-- Ad moderation actions (statement of reasons)

create table if not exists public.ad_moderation_actions (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  report_id uuid references public.ad_reports(id) on delete set null,
  action_type text not null,
  reason_category text not null,
  reason_details text not null,
  legal_basis text,
  automated boolean not null default false,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ad_moderation_actions_action_check'
      and conrelid = 'public.ad_moderation_actions'::regclass
  ) then
    alter table public.ad_moderation_actions
      add constraint ad_moderation_actions_action_check
      check (action_type in ('reject', 'expire', 'restore'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ad_moderation_actions_reason_check'
      and conrelid = 'public.ad_moderation_actions'::regclass
  ) then
    alter table public.ad_moderation_actions
      add constraint ad_moderation_actions_reason_check
      check (reason_category in ('illegal', 'prohibited', 'scam', 'spam', 'other'));
  end if;
end $$;

create index if not exists ad_moderation_actions_ad_id_created_at_idx
  on public.ad_moderation_actions (ad_id, created_at desc);

alter table public.ad_moderation_actions enable row level security;

drop policy if exists "Ad owners can read moderation actions" on public.ad_moderation_actions;
create policy "Ad owners can read moderation actions"
  on public.ad_moderation_actions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.ads a
      where a.id = ad_id
        and a.user_id = auth.uid()
    )
  );
