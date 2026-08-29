# Kickoff Times & Next Deadline — Design

**Date:** 2026-08-29
**Status:** Approved (brainstorming)

## Goal

Two user-facing improvements driven by the `fixtures.kickoff_time` data already
in Supabase:

1. **Predictions entry page** — show each match's date and kickoff time, and
   order the matches chronologically (date, then kickoff) so they appear in the
   order the games are played. Mirror the same ordering on the Weekly Watcher.
2. **Home page** — show the next predictions deadline (the kickoff of the first
   match in the next round open for predictions) so a logged-in user sees, on
   landing, when their next set of predictions is due.

Display only. No change to when predictions are actually accepted — a round
already stops accepting entries once its first fixture leaves `NS` status
(`getCurrentRound` in `src/lib/predictions/gameweek.ts`).

## Background / constraints

- `fixtures.kickoff_time` is a `timestamptz`, populated verbatim from
  football-data.org's `utcDate` (genuine UTC ISO-8601, e.g.
  `2026-08-22T14:00:00+00:00`). Cross-checked against known Premier League
  slots: `14:00Z` = 15:00 BST (Sat 3pm), `11:30Z` = 12:30 BST (Sat lunchtime),
  `19:00Z` = 20:00 BST (Fri night). The offset is correct UTC — it must be
  converted to a wall-clock zone for display, not shown raw.
- Rounds 1–9 have real per-match kickoff times spread across the matchweek.
  Rounds 10–38 currently share one placeholder time per round; they will
  self-correct when real times sync. The feature must behave correctly with
  both.
- **Times are shown in the viewer's own device time zone.** No time-zone label
  (nearly all users are UK-based). Fall back to `Europe/London` only if
  device-zone formatting fails.
- 24-hour clock. Date as `DD/MM` with a weekday abbreviation.
- Vitest environment is `node` — no component-render tests. New pure logic is
  unit-tested; component changes are verified manually via `npm run dev`.
- Next.js 14 App Router, React 18, Tailwind 3, shadcn/ui.

## New pure modules (unit-tested)

### `src/lib/format/kickoff.ts`

Formatting helpers built on `Intl.DateTimeFormat`. Each takes an optional
`timeZone`; when omitted, the runtime (device) zone is used. Tests pass an
explicit zone to pin output.

- `formatKickoffTime(iso, timeZone?)` → `"19:00"` (`hourCycle: 'h23'`).
- `formatKickoffRow(iso, timeZone?)` → `"Sat 21/08 · 19:00"`
  (`weekday: 'short'`, `day: '2-digit'`, `month: '2-digit'`).
- `formatKickoffDayHeading(iso, timeZone?)` → `"Saturday 21/08"`
  (`weekday: 'long'`).
- `kickoffDayKey(iso, timeZone?)` → `"2026-08-22"`-style stable key for
  grouping matches by calendar day in a given zone (derived from
  `Intl.DateTimeFormat` parts, not from the raw ISO date).

Error handling: wrap formatting in `try/catch`. On `Invalid Date` or an `Intl`
failure, retry with `timeZone: 'Europe/London'`; if that also fails, return the
raw `YYYY-MM-DD` slice (and `""` for the time helpers).

### `src/lib/predictions/fixture-order.ts`

- `sortByKickoff(fixtures)` → new array sorted by `kickoff_time` instant
  ascending (`new Date(a.kickoff_time).getTime()`), stable tie-break on
  ascending `id` (matters for placeholder rounds where every match shares a
  time). Pure; does not mutate input. Generic over
  `{ id: number; kickoff_time: string }`.

### `src/lib/predictions/deadline.ts`

- `getNextDeadline(fixtures)` →
  `{ round: number; kickoff: string } | null`.
  Uses the existing `getCurrentRound(fixtures)`; if it returns `null` (season
  complete / no round fully un-started), returns `null`. Otherwise returns the
  minimum `kickoff_time` among that round's fixtures, with its round number.
  Accepts unsorted input. Input type widened to include `kickoff_time` on top
  of the `GameweekFixture` shape (`round`, `status`).

## Page changes

### Predictions entry — `src/app/predictions/page.tsx`

- After computing `roundFixtures`, apply `sortByKickoff`.
- Add `kickoffTime: f.kickoff_time` to each object passed into `PredictionForm`.

### Predictions entry — `src/components/predictions/prediction-form.tsx` (`'use client'`)

- Add `kickoffTime: string` to `FormFixture`.
- Fixtures arrive already sorted. Group consecutive fixtures by
  `kickoffDayKey` (device zone) and render a day heading
  (`formatKickoffDayHeading`, e.g. `"Saturday 21/08"`) above each group.
- In each match card, add one small muted line showing
  `formatKickoffTime(kickoffTime)` (e.g. `"19:00"`).
- Hydration: device-zone output differs from server render. Gate zone-dependent
  text behind a `mounted` flag (`useState(false)` + `useEffect`), rendering the
  `Europe/London` fallback string until mounted, and mark the wrapper
  `suppressHydrationWarning`.
- Unchanged: score inputs and refs/auto-advance, form squares, other-picks
  grid, expand/collapse, the `alreadySubmitted` early return, submit flow.

### Weekly Watcher — `src/app/weekly-watcher/page.tsx`

- Apply `sortByKickoff` to `roundFixtures` before mapping to
  `WatcherFixtureCard`.

### Weekly Watcher — `src/components/weekly-watcher/watcher-fixture-card.tsx`

- Same day-heading grouping + `"19:00"` line as the entry page, for
  consistency. Grouping is done in the page (or a small client wrapper) since
  this card is currently a server component and the time text is device-zone
  dependent — introduce a `'use client'` time sub-component
  (`<KickoffTime iso={...} />`) reused by both pages rather than duplicating the
  `mounted` logic.

### Home — `src/app/page.tsx` (server component)

- For logged-in users only, fetch:
  - `fixtures` → `select('round,status,kickoff_time')`
  - the user's own `predictions` → `select('fixture_id')` for the submitted
    check.
- Compute `getNextDeadline(fixtures)`. Determine `alreadySubmitted` = any of the
  user's predictions belongs to a fixture in `deadline.round`.
- Render `<NextDeadline>` inside the welcome `Card`, above the menu buttons.

### Home — `src/components/home/next-deadline.tsx` (`'use client'`)

Props: `{ kickoff: string | null; alreadySubmitted: boolean }`.

- `kickoff === null` → `"Season complete — no more predictions"`.
- `alreadySubmitted` → two lines:
  `"Predictions submitted"` / `"Next deadline: {formatKickoffRow(kickoff)}"`.
- otherwise → `"Predictions close: {formatKickoffRow(kickoff)}"`.
- Same `mounted` + `suppressHydrationWarning` fallback approach (reuse the
  shared `<KickoffTime>` / a shared hook if it factors cleanly; otherwise the
  local `mounted` pattern is acceptable).
- Terse styling consistent with the card (small, muted secondary text).

## Data flow

- **Home:** server fetches fixtures + user prediction fixture-ids → `getNextDeadline`
  + submitted check → pass ISO string + boolean to `<NextDeadline>` → formats in
  device zone on the client.
- **Predictions:** server fetches (existing queries) → `sortByKickoff` → ISO
  strings passed through → client groups by day + shows time.
- **Weekly Watcher:** server fetches (existing) → `sortByKickoff` → cards show
  day headings + time.

## Testing

New Vitest specs:

- `src/lib/format/kickoff.test.ts` — fixed ISO + explicit `timeZone`:
  - `formatKickoffTime` / `formatKickoffRow` / `formatKickoffDayHeading` shapes.
  - DST: `2026-08-22T14:00:00Z` in `Europe/London` → `15:00`;
    `2027-01-16T15:00:00Z` in `Europe/London` → `15:00` (GMT).
  - A non-UK zone (e.g. `America/New_York`) to prove device-zone behaviour.
  - Invalid ISO → fallback (no throw).
- `src/lib/predictions/fixture-order.test.ts` — sorts ascending by instant;
  stable tie-break on `id`; does not mutate input; empty array.
- `src/lib/predictions/deadline.test.ts` — earliest kickoff of the current
  round; `null` at season end; ignores later rounds; unsorted input; empty
  array.

Component changes: manual verification via `npm run dev` (no RTL in this repo).

## Out of scope

- Time-zone label / abbreviation.
- Relative "in 3 days" text.
- Any new submission-cutoff enforcement.
- Countdown timers, stored per-user time-zone preference.
- Fixing the placeholder kickoff times in rounds 10–38 (data sync concern).
