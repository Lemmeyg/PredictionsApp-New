# Hall of Fame (HOF) — Design

## Summary

Add a "HOF" button to the home page (below "View Leaderboard") that links to a
new `/hof` page. The page shows two tables:

1. **Season Winners** — one row per past competition/season: competition
   name, season, winner name, final points. Purely historical data, entered
   by hand via Supabase Studio.
2. **Top 10 Weekly Scores** — the ten highest single-round scores ever
   recorded, across all seasons, merging hand-entered historical rows with
   scores computed live from the current season's `predictions`/`fixtures`
   data. This means a new high score earned during the current season
   appears on the board automatically, without manual data entry.

The app currently has no concept of "season" or "competition" at all — the
existing `fixtures`/`predictions` tables just track rounds within a single
ongoing season. HOF data for past seasons is therefore independent of the
live schema and will be entered directly into Supabase via the dashboard's
table editor (no admin UI is being built for this).

## Database schema

New migration: `supabase/migrations/0004_hall_of_fame.sql`

```sql
create table public.hof_season_winners (
  id uuid primary key default gen_random_uuid(),
  competition_name text not null,
  season text not null,        -- e.g. "2023/24"
  winner_name text not null,
  final_points integer not null,
  created_at timestamptz not null default now()
);

create table public.hof_weekly_high_scores (
  id uuid primary key default gen_random_uuid(),
  season text not null,        -- e.g. "2023/24"
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
```

Both tables use free-text name columns (`winner_name`, `player_name`) rather
than a foreign key to `profiles` — past winners/players may never have had an
app account, and the user will be hand-entering data via Supabase Studio, so
a plain text column is simplest.

No insert/update policy is defined for either table. Historical data is
entered through Supabase Studio, which uses the service role and bypasses
RLS, so the app itself never needs write access to these tables.

## Current season label

The app has no existing "current season" label anywhere. Add a constant:

```ts
// src/lib/config/season.ts
export const CURRENT_SEASON_LABEL = '2025/26'
```

This is updated by hand once per year when a new season starts. It is used
only to tag live-computed weekly score rows (see below) so they display with
a season value consistent with the historical rows.

## Weekly high scores: live + historical merge

`hof_weekly_high_scores` alone only contains past seasons. To satisfy "any
new score that earns a place on the top 10 board is included," the `/hof`
page computes each player's per-round total for the *current* season at
request time and merges it with the historical rows before ranking.

Computation reuses the existing scoring logic from
`src/lib/predictions/gameweek.ts` (`FINISHED_STATUSES`) and
`src/lib/predictions/scoring.ts` (`calculatePoints`) — the same functions the
leaderboard page already uses for `gameweekTotal`, generalized here to every
finished round instead of just the latest one:

```ts
// pseudocode, actual implementation lives in src/app/hof/page.tsx
for each profile:
  for each finished prediction:
    points = calculatePoints(...)
    accumulate points into pointsByRound[fixture.round]

for each (round, total) in pointsByRound:
  liveRows.push({ season: CURRENT_SEASON_LABEL, week_number: round, player_name: profile.display_name, score: total })
```

`liveRows` are concatenated with the rows fetched from
`hof_weekly_high_scores`, sorted by `score` descending, and the first 10 are
rendered. This recomputes on every page load (a server component with no
caching, consistent with how `leaderboard/page.tsx` already works), so the
board is always current without any snapshotting job or manual step.

No deduplication logic is needed: historical rows and live-computed rows are
disjoint by construction (historical rows only ever cover past seasons;
live rows only ever cover `CURRENT_SEASON_LABEL`).

## Season winners: no live computation

The season winners table renders `hof_season_winners` as-is, sorted by
`season` descending. It is not merged with any live computation — the
current season has no winner until it concludes, so there is nothing to
compute yet. When a season finishes, its winner is added to
`hof_season_winners` by hand, the same way other historical rows are.

## Types

Add to `src/lib/supabase/database.types.ts`:

```ts
export interface HofSeasonWinner {
  id: string
  competition_name: string
  season: string
  winner_name: string
  final_points: number
  created_at: string
}

export interface HofWeeklyHighScore {
  id: string
  season: string
  week_number: number
  player_name: string
  score: number
  created_at: string
}
```

## Page & components

- `src/app/hof/page.tsx` — server component, mirrors the structure of
  `src/app/leaderboard/page.tsx`: fetches `profiles`, `fixtures`,
  `predictions`, and both new tables in parallel via
  `supabase.from(...).select('*')`, builds the two typed row arrays as
  described above, and renders:

  ```tsx
  <div className="container mx-auto p-4">
    <h1 className="text-2xl font-semibold text-foreground mb-4">Hall of Fame</h1>
    <SeasonWinnersTable data={winners} />
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-foreground mb-4">Top 10 Weekly Scores</h2>
      <WeeklyHighScoresTable data={topTen} />
    </div>
  </div>
  ```

- `src/components/hof/season-winners-table.tsx` — client component, follows
  `leaderboard-table.tsx`'s shadcn `Table` pattern exactly. Columns:
  Competition, Season, Winner, Final Points.
- `src/components/hof/weekly-high-scores-table.tsx` — same pattern. Columns:
  Season, Week, Player, Score.

Both handle an empty data array gracefully (render just the header row),
since `hof_season_winners`/`hof_weekly_high_scores` will be empty until the
user populates them via Supabase Studio.

## Home page button

In `src/app/page.tsx`, inside the existing `user ?` authenticated branch,
add a new button directly below "View Leaderboard":

```tsx
<Button asChild className="w-full h-11" variant="secondary">
  <Link href="/hof">HOF</Link>
</Button>
```

HOF is only reachable when logged in, consistent with every other page in
the app.

## Out of scope

- No admin UI for managing HOF data — entry is via Supabase Studio.
- No linkage between HOF names and `profiles` rows.
- No automatic snapshotting of the live season's winner or weekly scores
  into the historical tables at season end — that remains a manual step for
  a future backlog item if wanted.
- No pagination/filtering on either table.
