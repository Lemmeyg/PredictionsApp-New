-- supabase/migrations/0001_init.sql
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  initials text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.fixtures (
  id bigint primary key,
  round integer not null,
  home_team text not null,
  away_team text not null,
  kickoff_time timestamptz not null,
  status text not null default 'NS',
  home_score integer,
  away_score integer,
  result_source text,
  updated_at timestamptz not null default now()
);

create table public.predictions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  fixture_id bigint not null references public.fixtures(id) on delete cascade,
  predicted_home_score integer not null,
  predicted_away_score integer not null,
  submitted_at timestamptz not null default now(),
  unique (user_id, fixture_id)
);

-- Auto-create a profile row whenever an auth user is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.fixtures enable row level security;
alter table public.predictions enable row level security;

create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "fixtures are readable by authenticated users"
  on public.fixtures for select
  to authenticated
  using (true);

create policy "fixtures are insertable only by admins"
  on public.fixtures for insert
  to authenticated
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "fixtures are updatable only by admins"
  on public.fixtures for update
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));

create policy "predictions are readable by authenticated users"
  on public.predictions for select
  to authenticated
  using (true);

create policy "users can insert their own predictions"
  on public.predictions for insert
  to authenticated
  with check (user_id = auth.uid());
