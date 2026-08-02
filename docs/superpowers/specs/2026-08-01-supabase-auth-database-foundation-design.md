# Supabase Auth + Database Foundation — Design Spec

Status: Approved by user, ready for implementation planning
Date: 2026-08-01
Phase: 1 of 4 (see Roadmap below)

## Objective

Replace the current Google Sheets-backed data layer and "tap your name" pseudo-auth
with a proper Supabase (Postgres) database and real authentication, while keeping the
app fully functional end-to-end (login → enter predictions → admin enters results →
leaderboard). This is the foundation phase; scoring/standings views, graphs,
hall-of-fame/stats, predictive data, and desktop/UI polish are later phases.

## Roadmap (for context — only Phase 1 is specced here)

1. **Phase 1 (this doc)**: Supabase auth + full DB schema redesign, fixtures/results
   import (API + admin manual override), scoring calculation, migrate existing pages
   off Google Sheets.
2. **Phase 2**: New views — weekly scores breakdown ("which games mattered"), season
   table/standings page.
3. **Phase 3**: Cumulative score graph, hall-of-fame/stats table.
4. **Phase 4 (nice-to-have)**: Predictive stats (xG, form) via a football data API,
   desktop layout polish, collapsible match-details menu (mobile + desktop), initials
   instead of full names for player identity.

## Immediate security fix (do first, independent of everything else)

`DraftPRD.md` contains a live Google service-account private key, a Google Sheets API
key, and a football-data API key in plaintext, committed to the repo. Before or
alongside this phase:
- Rotate/regenerate all three credentials at their respective providers.
- Remove them from `DraftPRD.md`.
- Scrub them from git history (repo is not currently public, but treat as compromised
  regardless).

## Constraints

- 6 fixed players for now (David, Gordon, Huw, James, Tom, Ty) — no self-signup, no
  dynamic player management UI in this phase.
- Minimize shared infrastructure load: user has other apps on Vercel/Supabase and
  wants this app's footprint isolated.
- No migration of historical Google Sheets data — this is a full, fresh schema
  redesign; the old season's data is not carried over.

## Infrastructure

- **New, dedicated Supabase project** (free tier), used only for this app — fully
  isolated compute/storage from the user's other Supabase projects. No Edge
  Functions, no `pg_cron`.
- **Vercel Hobby Cron**, once daily (matches the old "5pm EST" pattern), triggers a
  Next.js API route that syncs fixtures/results from api-football.com into Supabase.
- Business logic (scoring, fixture sync, admin checks) lives in TypeScript
  (Next.js server actions / API routes), matching the existing codebase's stack.
  Supabase Row Level Security (RLS) is used as a defense-in-depth safety net, not as
  the primary place logic lives.

## Data model (Supabase Postgres)

### `profiles`
| column | type | notes |
|---|---|---|
| id | uuid | = `auth.users.id` |
| display_name | text | e.g. "Gordon" |
| initials | text | e.g. "GL" — for later phases' compact UI |
| is_admin | boolean | default false; toggled via Supabase dashboard |
| created_at | timestamptz | default now() |

Seeded up front with the 6 fixed players (accounts created by the admin, not via
self-signup).

### `fixtures`
| column | type | notes |
|---|---|---|
| id | bigint | api-football fixture id (primary key) |
| round | int | matchweek/round number |
| home_team | text | |
| away_team | text | |
| kickoff_time | timestamptz | |
| status | text | e.g. `NS`, `FT`, etc. (api-football status codes) |
| home_score | int, nullable | |
| away_score | int, nullable | |
| result_source | text | `'api'` \| `'admin'` — set when a result is written |
| updated_at | timestamptz | |

Holds the **full season** (~380 fixtures), not just the upcoming round. Statuses and
scores update in place as matches are played.

### `predictions`
| column | type | notes |
|---|---|---|
| id | uuid | |
| user_id | uuid | FK → `profiles.id` |
| fixture_id | bigint | FK → `fixtures.id` |
| predicted_home_score | int | |
| predicted_away_score | int | |
| submitted_at | timestamptz | |

Unique constraint on `(user_id, fixture_id)` — enforces "can't submit twice for the
same fixture" at the database level.

**Points are not stored.** They're computed on read (leaderboard, weekly view) by
joining `predictions` to `fixtures` and applying the scoring function. At this data
volume (~380 fixtures × 6 users/season) this is instant, and it removes any risk of
stored points drifting out of sync with corrected results.

## Auth & access control

- Supabase email + password auth for the 6 players. Accounts are created up front by
  the admin (Supabase dashboard or a one-off seed script) — no open self-signup.
- `profiles.is_admin` is a plain boolean, toggled directly in the Supabase dashboard.
  This satisfies "switch on admin for other players if needed" without building an
  in-app admin-management UI.
- RLS policies:
  - Any authenticated user can **read** all rows in `fixtures` and `predictions`
    (players can see others' picks).
  - A user can **insert/update** only their own rows in `predictions`
    (`user_id = auth.uid()`).
  - Only rows where the requesting user's `profiles.is_admin = true` can
    **insert/update** `fixtures` (results).
  - This means a bug in a Next.js route cannot let a non-admin overwrite results or
    another player's prediction — the database enforces it independently of the app
    code.

## Fixtures & results sync

- Daily Vercel Cron → API route → `fetchFixtures()` (existing function, retargeted
  from Sheets to Supabase, and updated from the stale hardcoded `SEASON = 2024` to the
  current season) → upsert into `fixtures` by fixture id, for all ~380 fixtures.
- **Admin manual override**: an admin-only form/action to directly set a fixture's
  `home_score` / `away_score` / `status`. This is the backup path for when the
  api-football.com sync is unreliable or hasn't run. Writes set
  `result_source = 'admin'` so manually-entered results are distinguishable later.

## Current gameweek logic

"Current gameweek" = the **lowest-numbered round where every fixture in that round
has status `NS`** (not started). Computed server-side from the full `fixtures` table
each time the predictions page loads (not cached), so it advances correctly as rounds
complete.

The predictions page fetches and displays only the fixtures belonging to that
computed round (typically up to ~20 fixtures).

## Scoring engine

Pure TypeScript function, e.g.:

```ts
function calculatePoints(prediction, fixture): number
```

Rule:
- **8 points** — exact score match.
- **5 points** — correct result (home win / draw / away win) but wrong score.
- **0 points** — wrong result.

Weekly total = sum of a user's points across their predictions in a round.
Season total = sum across all rounds. Both computed via query/aggregation at read
time, not stored.

## Migration of existing pages

- `user` page ("tap your name") → real login page (Supabase email + password).
- `predictions` page → fetches current gameweek's fixtures from Supabase; submit
  writes to `predictions` table; enforces one-submission-per-fixture via the DB
  unique constraint (surfaced as a friendly "already submitted" state in the UI).
- `leaderboard` page → queries Supabase, computes totals via the scoring function,
  sorts by season total.
- `lib/api/sheets.ts` and `google-sheets.ts` are removed from the active code path.
  (Whether Google Sheets is kept as a backup/export target is an open decision,
  deferred to a later phase — not blocking here.)

## Error handling & reliability

- Cron sync failures are logged and non-fatal — the admin override exists
  specifically so a bad API day doesn't block results entry.
- New env vars (Supabase URL, anon key, service role key, football API key — all
  freshly rotated) are set in Vercel project settings, not committed to the repo.

## Testing

- Unit tests for `calculatePoints` covering exact score, correct-result-wrong-score,
  wrong result, and edge cases (e.g. 0-0 draws).
- Unit tests for the current-gameweek selection logic (e.g. partially-started rounds
  are skipped, fully-NS rounds are picked, lowest round number wins).
- Manual verification of: login flow, one-submission-per-fixture constraint, admin
  result override, RLS boundaries (a non-admin cannot write to `fixtures`; a player
  cannot write another player's `predictions` row).

## Out of scope for this phase

Weekly scores breakdown view, cumulative score graph, hall-of-fame/stats table,
predictive stats (xG/form) API integration, desktop CSS/layout polish, collapsible
match-details menu, initials-based player display. Tracked in the Roadmap above for
later phases.
