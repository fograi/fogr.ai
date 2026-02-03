-- Age confirmation table + RLS
create table if not exists public.user_age_confirmations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  age_confirmed_at timestamptz not null default now(),
  age_confirmed_ip text,
  age_confirmed_user_agent text,
  terms_version text
);

alter table public.user_age_confirmations enable row level security;

drop policy if exists "Users can read own age confirmation" on public.user_age_confirmations;
create policy "Users can read own age confirmation"
on public.user_age_confirmations
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own age confirmation" on public.user_age_confirmations;
create policy "Users can insert own age confirmation"
on public.user_age_confirmations
for insert
to authenticated
with check (user_id = auth.uid());
