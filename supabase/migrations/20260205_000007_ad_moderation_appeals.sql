-- Ad moderation appeals (internal complaint handling)

create table if not exists public.ad_moderation_appeals (
  id uuid primary key default gen_random_uuid(),
  ad_id uuid not null references public.ads(id) on delete cascade,
  action_id uuid references public.ad_moderation_actions(id) on delete set null,
  appellant_user_id uuid not null references auth.users(id) on delete cascade,
  reason_details text not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ad_moderation_appeals_status_check'
      and conrelid = 'public.ad_moderation_appeals'::regclass
  ) then
    alter table public.ad_moderation_appeals
      add constraint ad_moderation_appeals_status_check
      check (status in ('open', 'resolved', 'dismissed'));
  end if;
end $$;

create index if not exists ad_moderation_appeals_ad_id_created_at_idx
  on public.ad_moderation_appeals (ad_id, created_at desc);

create index if not exists ad_moderation_appeals_status_created_at_idx
  on public.ad_moderation_appeals (status, created_at desc);

alter table public.ad_moderation_appeals enable row level security;

drop policy if exists "Ad owners can read own appeals" on public.ad_moderation_appeals;
create policy "Ad owners can read own appeals"
  on public.ad_moderation_appeals
  for select
  to authenticated
  using (appellant_user_id = auth.uid());

drop policy if exists "Ad owners can create appeals" on public.ad_moderation_appeals;
create policy "Ad owners can create appeals"
  on public.ad_moderation_appeals
  for insert
  to authenticated
  with check (appellant_user_id = auth.uid());
