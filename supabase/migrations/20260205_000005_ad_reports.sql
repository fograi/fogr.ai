-- Ad reports (DSA notice-and-action intake)

create table if not exists public.ad_reports (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  reporter_user_id uuid references auth.users(id) on delete set null,
  reporter_name text not null,
  reporter_email text not null,
  reason_category text not null,
  reason_details text not null,
  location_url text not null,
  good_faith boolean not null default true,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  reporter_ip text,
  reporter_user_agent text
);

-- Status constraint (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ad_reports_status_check'
      and conrelid = 'public.ad_reports'::regclass
  ) then
    alter table public.ad_reports
      add constraint ad_reports_status_check
      check (status in ('open', 'in_review', 'actioned', 'dismissed'));
  end if;
end $$;

-- Reason constraint (idempotent)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ad_reports_reason_check'
      and conrelid = 'public.ad_reports'::regclass
  ) then
    alter table public.ad_reports
      add constraint ad_reports_reason_check
      check (reason_category in ('illegal', 'prohibited', 'scam', 'spam', 'other'));
  end if;
end $$;

create index if not exists ad_reports_ad_id_created_at_idx
  on public.ad_reports (ad_id, created_at desc);

create index if not exists ad_reports_status_created_at_idx
  on public.ad_reports (status, created_at desc);

alter table public.ad_reports enable row level security;
