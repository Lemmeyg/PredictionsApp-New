-- supabase/migrations/0004_hall_of_fame.sql
-- Historical Hall of Fame data: past season/competition winners and the
-- highest weekly scores on record. Populated by hand via Supabase Studio --
-- there is no admin UI for these tables. The app only ever reads from them;
-- the current season's weekly scores are computed live in TypeScript
-- (src/lib/hof/weekly-scores.ts) and merged with these rows at render time.

create table public.hof_season_winners (
  id uuid primary key default gen_random_uuid(),
  competition_name text not null,
  season text not null,
  winner_name text not null,
  final_points integer not null,
  created_at timestamptz not null default now()
);

create table public.hof_weekly_high_scores (
  id uuid primary key default gen_random_uuid(),
  season text not null,
  week_number integer not null,
  player_name text not null,
  score integer not null,
  created_at timestamptz not null default now()
);

alter table public.hof_season_winners enable row level security;
alter table public.hof_weekly_high_scores enable row level security;

create policy "hof season winners are readable by authenticated users"
  on public.hof_season_winners for select
  to authenticated
  using (true);

create policy "hof weekly high scores are readable by authenticated users"
  on public.hof_weekly_high_scores for select
  to authenticated
  using (true);
