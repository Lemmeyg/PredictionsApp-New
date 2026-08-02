# Backlog

Not prioritized yet — this is the raw list to sort through together. Grouped by
theme, not by phase or urgency.

## Standings & stats

- **Hall of fame / stats table.** Season records, streaks, best/worst weeks, etc.
  Needs its own scoping pass — not yet defined in detail.
- **Weekly scores breakdown ("which games mattered").** For a completed round,
  show every player's prediction vs. the actual result and points earned, per
  fixture. Deferred earlier for clarification on exact shape/scope — revisit now
  that real prediction/result data exists to design against.
- **View predictions for the current (open) round.** The original pre-Supabase
  app let players see everyone's predictions for the week once submitted
  (`DraftPRD.md` section 2.4). Never rebuilt in the Supabase migration — decide
  whether this comes back, and if so, whether it's visible only after a player
  submits their own predictions (to avoid copying) or always.

## Match data & predictions

- **Predictive stats (xG, form).** football-data.org's paid tier reportedly has
  a "predictions" feature — worth a look once free-tier basics are solid.
- **Populate the collapsible match-details panel.** The chevron/expand UI on
  each fixture card already exists (`src/components/predictions/prediction-form.tsx`);
  it currently shows a "Match details coming soon" placeholder. Wire in real
  content once a data source is chosen (ties to the predictive-stats item above).

## UX / UI polish

- **Desktop layout pass.** Original ask was specifically for David to have a
  good desktop experience — current design is mobile-first/narrow-centered
  throughout (login, predictions, leaderboard). Needs a deliberate desktop
  breakpoint pass, not just "it doesn't break."
- **Use initials consistently instead of full names.** `profiles.initials` exists
  and is already used on the cumulative graph's line-end labels, but the
  leaderboard table and other surfaces still show full `display_name`. Decide
  where initials should replace full names app-wide vs. where full names read
  better (e.g. a "Player" column vs. a compact chart label).
- **In-app admin management.** Right now `is_admin` is toggled directly in the
  Supabase dashboard (by design, for Phase 1 simplicity). If more than one
  admin needs to be added/removed regularly, a small in-app UI would remove the
  dashboard dependency.

## Data / infra decisions

- **Google Sheets as backup/export target — still an open decision.** The
  original design spec deferred this ("decide later"); Sheets integration code
  was fully removed in Phase 1. Revisit only if a concrete backup/export need
  shows up.

## Tech debt / housekeeping

- `next.config.js` still declares `serverComponentsExternalPackages:
  ['@google-cloud/storage']` and a `node-fetch$` webpack alias — leftover
  Google-era config, safe to remove.
- `package.json` keeps `vercel` as a production dependency (should be a dev
  dependency, if kept at all).
- `tsconfig.json` has `strict: false` — most `as FixtureRow[]` / `as Profile |
  null` casts throughout the app pages are unchecked as a result. Turning on
  `strict` is a real, separate effort.
- `/admin/results` has no in-app link and no round picker — defaults to
  `?round=1` in the URL. A "latest open/relevant round" default plus a simple
  picker would remove the need to hand-edit the URL.
- Middleware protects `/api/*` broadly, which means the daily cron request to
  `/api/cron/sync-fixtures` pays an extra `supabase.auth.getUser()` round trip
  it doesn't need. Narrowing the matcher would trim that.
- Cron route's `CRON_SECRET` check doesn't special-case a completely unset env
  var (`"Bearer undefined"` matches if `CRON_SECRET` is ever missing in prod).
  Low practical risk, cheap to close.
- Test coverage gap: no test exercises a mixed-status round beyond `PST`/`AWD`
  (e.g. `SUSP`, `CANC` combinations), and no test covers an empty fixture list.
- `src/components/predictions/prediction-form.tsx` uses `'in' operator` type
  guards where discriminated-union narrowing should suffice — cosmetic, worth
  a quick cleanup pass.
- `src/app/leaderboard/page.tsx`'s existing-predictions query result is left
  untyped (harmless today since only `.length` is read, but inconsistent with
  the typing used elsewhere in the same file).
