# Kickoff Times & Next Deadline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each match's date and kickoff time (in the viewer's device time zone) with chronological ordering on the Predictions entry page and Weekly Watcher, and show the next predictions deadline on the home page.

**Architecture:** Three new pure, unit-tested modules (`kickoff.ts` formatting, `fixture-order.ts` sort/group, `deadline.ts`) feed thin display changes in existing server components plus three small `'use client'` components. Server components sort fixtures and pass ISO strings down; client components format in the device zone, falling back to `Europe/London` until mounted so SSR and first client render agree.

**Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS 3, shadcn/ui, Vitest (`environment: 'node'`), `@supabase/ssr`.

**Spec:** `docs/superpowers/specs/2026-08-29-kickoff-times-and-deadline-design.md`

## Global Constraints

- `fixtures.kickoff_time` is genuine UTC ISO-8601 (e.g. `2026-08-22T14:00:00+00:00`); it must be converted to a wall-clock zone for display, never shown raw.
- Times display in the **viewer's device time zone**. No time-zone label. Fall back to `Europe/London` only when device-zone formatting fails or before client mount.
- 24-hour clock (`hourCycle: 'h23'`). Date as `DD/MM`. Weekday abbreviation `short` in rows, `long` in day headings.
- Separator between date and time in a single-line label: ` · ` (space, U+00B7, space).
- Vitest environment is `node` — no component-render tests exist or are added. New pure logic is unit-tested; component changes are verified with `npm run build`, `npm run lint`, `npm test` (existing suite stays green) plus manual `npm run dev`.
- Display only. Do not change when predictions are accepted.
- Follow existing patterns: `src/lib/**` for pure logic with a colocated `*.test.ts`; `src/components/**` for UI; server components fetch via `@/lib/supabase/server`.
- Commit after every task. Branch is `feature/kickoff-times-deadline` (already created).

---

### Task 1: Kickoff formatting helpers

**Files:**
- Create: `src/lib/format/kickoff.ts`
- Test: `src/lib/format/kickoff.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `formatKickoffTime(iso: string, timeZone?: string): string` — `"19:00"`, `""` on failure.
  - `formatKickoffRow(iso: string, timeZone?: string): string` — `"Sat 21/08 · 19:00"`, `YYYY-MM-DD` slice on failure.
  - `formatKickoffDayHeading(iso: string, timeZone?: string): string` — `"Saturday 21/08"`, `YYYY-MM-DD` slice on failure.
  - `kickoffDayKey(iso: string, timeZone?: string): string` — `"2026-08-22"` in the given zone, `iso.slice(0, 10)` on failure.
  - When `timeZone` is omitted, `Intl` uses the runtime (device) zone.

- [ ] **Step 1: Write the failing test**

Create `src/lib/format/kickoff.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  formatKickoffTime,
  formatKickoffRow,
  formatKickoffDayHeading,
  kickoffDayKey,
} from './kickoff'

// 2026-08-21T19:00:00Z is a Friday; London is on BST (UTC+1) in August.
// 2027-01-16T15:00:00Z is a Saturday; London is on GMT (UTC+0) in January.
const FRI_AUG = '2026-08-21T19:00:00+00:00'
const SAT_JAN = '2027-01-16T15:00:00+00:00'

describe('formatKickoffTime', () => {
  it('formats 24-hour time in the given zone', () => {
    expect(formatKickoffTime(FRI_AUG, 'Europe/London')).toBe('20:00') // BST
    expect(formatKickoffTime(SAT_JAN, 'Europe/London')).toBe('15:00') // GMT
  })

  it('honours a non-UK zone', () => {
    expect(formatKickoffTime(FRI_AUG, 'America/New_York')).toBe('15:00') // EDT
  })

  it('returns empty string for an invalid date', () => {
    expect(formatKickoffTime('not-a-date', 'Europe/London')).toBe('')
  })
})

describe('formatKickoffRow', () => {
  it('formats "Sat 21/08 · 19:00" style with short weekday and DD/MM', () => {
    expect(formatKickoffRow(FRI_AUG, 'Europe/London')).toBe('Fri 21/08 · 20:00')
    expect(formatKickoffRow(SAT_JAN, 'America/New_York')).toBe('Sat 16/01 · 10:00')
  })

  it('falls back to the date slice on invalid input', () => {
    expect(formatKickoffRow('not-a-date', 'Europe/London')).toBe('not-a-dat'.slice(0, 10))
  })
})

describe('formatKickoffDayHeading', () => {
  it('formats "Saturday 16/01" style with long weekday and DD/MM', () => {
    expect(formatKickoffDayHeading(FRI_AUG, 'Europe/London')).toBe('Friday 21/08')
    expect(formatKickoffDayHeading(SAT_JAN, 'Europe/London')).toBe('Saturday 16/01')
  })
})

describe('kickoffDayKey', () => {
  it('returns the calendar day in the given zone as YYYY-MM-DD', () => {
    expect(kickoffDayKey(FRI_AUG, 'Europe/London')).toBe('2026-08-21')
  })

  it('can differ from the UTC date when the zone shifts the day', () => {
    // 00:30 UTC on the 22nd is still the 21st, 20:30, in New York.
    expect(kickoffDayKey('2026-08-22T00:30:00+00:00', 'America/New_York')).toBe('2026-08-21')
  })

  it('falls back to the ISO date slice on invalid input', () => {
    expect(kickoffDayKey('not-a-date', 'Europe/London')).toBe('not-a-dat')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/format/kickoff.test.ts`
Expected: FAIL — `Failed to resolve import "./kickoff"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/format/kickoff.ts`:

```ts
// Formatting helpers for fixture kickoff timestamps.
//
// `fixtures.kickoff_time` is genuine UTC ISO-8601. These helpers convert it to
// a wall-clock zone for display. When `timeZone` is omitted, Intl uses the
// runtime zone — on the client that is the viewer's device zone, which is what
// we want users to see. Callers that render on the server (or before hydration)
// pass 'Europe/London' as a stable fallback.

const UK_ZONE = 'Europe/London'

function isValidIso(iso: string): boolean {
  return !Number.isNaN(new Date(iso).getTime())
}

/** `Intl.DateTimeFormat` that throws if `timeZone` is not a real zone. */
function parts(iso: string, timeZone: string | undefined) {
  const date = new Date(iso)
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const map: Record<string, string> = {}
  for (const part of dtf.formatToParts(date)) {
    map[part.type] = part.value
  }
  return map
}

const SHORT_WEEKDAY: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
}

function safe<T>(iso: string, timeZone: string | undefined, build: (p: Record<string, string>) => T, fallback: T): T {
  if (!isValidIso(iso)) return fallback
  try {
    return build(parts(iso, timeZone))
  } catch {
    try {
      return build(parts(iso, UK_ZONE))
    } catch {
      return fallback
    }
  }
}

export function formatKickoffTime(iso: string, timeZone?: string): string {
  return safe(iso, timeZone, (p) => `${p.hour}:${p.minute}`, '')
}

export function formatKickoffRow(iso: string, timeZone?: string): string {
  return safe(
    iso,
    timeZone,
    (p) => `${SHORT_WEEKDAY[p.weekday] ?? p.weekday} ${p.day}/${p.month} · ${p.hour}:${p.minute}`,
    iso.slice(0, 10),
  )
}

export function formatKickoffDayHeading(iso: string, timeZone?: string): string {
  return safe(iso, timeZone, (p) => `${p.weekday} ${p.day}/${p.month}`, iso.slice(0, 10))
}

export function kickoffDayKey(iso: string, timeZone?: string): string {
  return safe(iso, timeZone, (p) => `${p.year}-${p.month}-${p.day}`, iso.slice(0, 10))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/format/kickoff.test.ts`
Expected: PASS (all 11 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/format/kickoff.ts src/lib/format/kickoff.test.ts
git commit -m "feat: add kickoff time/date formatting helpers"
```

---

### Task 2: Fixture ordering and day grouping

**Files:**
- Create: `src/lib/predictions/fixture-order.ts`
- Test: `src/lib/predictions/fixture-order.test.ts`

**Interfaces:**
- Consumes: `kickoffDayKey`, `formatKickoffDayHeading` from `src/lib/format/kickoff.ts`.
- Produces:
  - `sortByKickoff<T extends { id: number; kickoff_time: string }>(fixtures: T[]): T[]` — new array, ascending by kickoff instant, stable tie-break on ascending `id`. Does not mutate input.
  - `interface KickoffDayGroup<T> { dayKey: string; headingIso: string; fixtures: T[] }`
  - `groupByKickoffDay<T>(fixtures: T[], getIso: (f: T) => string, timeZone?: string): KickoffDayGroup<T>[]` — groups an already-sorted list into consecutive same-day runs; `headingIso` is the first fixture's ISO in each group.

- [ ] **Step 1: Write the failing test**

Create `src/lib/predictions/fixture-order.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { sortByKickoff, groupByKickoffDay } from './fixture-order'

describe('sortByKickoff', () => {
  it('orders by kickoff instant ascending', () => {
    const input = [
      { id: 3, kickoff_time: '2026-08-23T13:00:00+00:00' },
      { id: 1, kickoff_time: '2026-08-21T19:00:00+00:00' },
      { id: 2, kickoff_time: '2026-08-22T14:00:00+00:00' },
    ]
    expect(sortByKickoff(input).map((f) => f.id)).toEqual([1, 2, 3])
  })

  it('breaks ties on ascending id (placeholder rounds share a time)', () => {
    const input = [
      { id: 20, kickoff_time: '2027-01-06T20:00:00+00:00' },
      { id: 11, kickoff_time: '2027-01-06T20:00:00+00:00' },
      { id: 15, kickoff_time: '2027-01-06T20:00:00+00:00' },
    ]
    expect(sortByKickoff(input).map((f) => f.id)).toEqual([11, 15, 20])
  })

  it('does not mutate the input array', () => {
    const input = [
      { id: 2, kickoff_time: '2026-08-22T14:00:00+00:00' },
      { id: 1, kickoff_time: '2026-08-21T19:00:00+00:00' },
    ]
    const snapshot = input.map((f) => f.id)
    sortByKickoff(input)
    expect(input.map((f) => f.id)).toEqual(snapshot)
  })

  it('returns an empty array unchanged', () => {
    expect(sortByKickoff([])).toEqual([])
  })
})

describe('groupByKickoffDay', () => {
  const fixtures = [
    { id: 1, kickoff_time: '2026-08-21T19:00:00+00:00' },
    { id: 2, kickoff_time: '2026-08-22T14:00:00+00:00' },
    { id: 3, kickoff_time: '2026-08-22T16:30:00+00:00' },
    { id: 4, kickoff_time: '2026-08-23T13:00:00+00:00' },
  ]

  it('groups consecutive same-day fixtures in the given zone', () => {
    const groups = groupByKickoffDay(fixtures, (f) => f.kickoff_time, 'Europe/London')
    expect(groups.map((g) => g.dayKey)).toEqual(['2026-08-21', '2026-08-22', '2026-08-23'])
    expect(groups.map((g) => g.fixtures.map((f) => f.id))).toEqual([[1], [2, 3], [4]])
  })

  it('exposes the first fixture ISO of each group as headingIso', () => {
    const groups = groupByKickoffDay(fixtures, (f) => f.kickoff_time, 'Europe/London')
    expect(groups[1].headingIso).toBe('2026-08-22T14:00:00+00:00')
  })

  it('returns an empty array for no fixtures', () => {
    expect(groupByKickoffDay([], (f: { kickoff_time: string }) => f.kickoff_time)).toEqual([])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/predictions/fixture-order.test.ts`
Expected: FAIL — `Failed to resolve import "./fixture-order"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/predictions/fixture-order.ts`:

```ts
import { kickoffDayKey } from '@/lib/format/kickoff'

/**
 * Sort fixtures into the order the games are played: ascending by kickoff
 * instant, with a stable tie-break on ascending id so placeholder rounds
 * (every match sharing one time) still get a deterministic order.
 * Returns a new array; the input is not mutated.
 */
export function sortByKickoff<T extends { id: number; kickoff_time: string }>(
  fixtures: T[],
): T[] {
  return [...fixtures].sort((a, b) => {
    const delta =
      new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
    return delta !== 0 ? delta : a.id - b.id
  })
}

export interface KickoffDayGroup<T> {
  /** `YYYY-MM-DD` in the grouping zone. */
  dayKey: string
  /** ISO timestamp of the first fixture in the group, for a day heading. */
  headingIso: string
  fixtures: T[]
}

/**
 * Group an already-sorted fixture list into consecutive same-calendar-day runs,
 * evaluated in `timeZone` (device zone when omitted).
 */
export function groupByKickoffDay<T>(
  fixtures: T[],
  getIso: (fixture: T) => string,
  timeZone?: string,
): KickoffDayGroup<T>[] {
  const groups: KickoffDayGroup<T>[] = []

  for (const fixture of fixtures) {
    const iso = getIso(fixture)
    const dayKey = kickoffDayKey(iso, timeZone)
    const last = groups[groups.length - 1]

    if (last && last.dayKey === dayKey) {
      last.fixtures.push(fixture)
    } else {
      groups.push({ dayKey, headingIso: iso, fixtures: [fixture] })
    }
  }

  return groups
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/predictions/fixture-order.test.ts`
Expected: PASS (7 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/predictions/fixture-order.ts src/lib/predictions/fixture-order.test.ts
git commit -m "feat: add sortByKickoff and groupByKickoffDay helpers"
```

---

### Task 3: Next deadline computation

**Files:**
- Create: `src/lib/predictions/deadline.ts`
- Test: `src/lib/predictions/deadline.test.ts`

**Interfaces:**
- Consumes: `getCurrentRound` from `src/lib/predictions/gameweek.ts`.
- Produces:
  - `interface DeadlineFixture { round: number; status: string; kickoff_time: string }`
  - `interface NextDeadline { round: number; kickoff: string }`
  - `getNextDeadline(fixtures: DeadlineFixture[]): NextDeadline | null` — the earliest `kickoff_time` among fixtures in the round returned by `getCurrentRound`; `null` when `getCurrentRound` returns `null` (season complete) or that round has no fixtures.

- [ ] **Step 1: Write the failing test**

Create `src/lib/predictions/deadline.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { getNextDeadline } from './deadline'

const NS = 'NS'
const FT = 'FT'

describe('getNextDeadline', () => {
  it('returns the earliest kickoff of the next round open for predictions', () => {
    const fixtures = [
      { round: 1, status: FT, kickoff_time: '2026-08-21T19:00:00+00:00' },
      { round: 2, status: NS, kickoff_time: '2026-08-29T14:00:00+00:00' },
      { round: 2, status: NS, kickoff_time: '2026-08-28T19:00:00+00:00' },
      { round: 2, status: NS, kickoff_time: '2026-08-30T15:30:00+00:00' },
      { round: 3, status: NS, kickoff_time: '2026-09-12T14:00:00+00:00' },
    ]
    expect(getNextDeadline(fixtures)).toEqual({
      round: 2,
      kickoff: '2026-08-28T19:00:00+00:00',
    })
  })

  it('ignores fixtures from later rounds', () => {
    const fixtures = [
      { round: 5, status: NS, kickoff_time: '2026-09-19T14:00:00+00:00' },
      { round: 6, status: NS, kickoff_time: '2026-08-01T00:00:00+00:00' },
    ]
    expect(getNextDeadline(fixtures)?.round).toBe(5)
    expect(getNextDeadline(fixtures)?.kickoff).toBe('2026-09-19T14:00:00+00:00')
  })

  it('accepts unsorted input', () => {
    const fixtures = [
      { round: 2, status: NS, kickoff_time: '2026-08-30T15:30:00+00:00' },
      { round: 2, status: NS, kickoff_time: '2026-08-28T19:00:00+00:00' },
    ]
    expect(getNextDeadline(fixtures)?.kickoff).toBe('2026-08-28T19:00:00+00:00')
  })

  it('returns null when every round has started (season complete)', () => {
    const fixtures = [
      { round: 1, status: FT, kickoff_time: '2026-08-21T19:00:00+00:00' },
      { round: 2, status: FT, kickoff_time: '2026-08-28T19:00:00+00:00' },
    ]
    expect(getNextDeadline(fixtures)).toBeNull()
  })

  it('returns null for an empty fixture list', () => {
    expect(getNextDeadline([])).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/predictions/deadline.test.ts`
Expected: FAIL — `Failed to resolve import "./deadline"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/predictions/deadline.ts`:

```ts
import { getCurrentRound } from './gameweek'

export interface DeadlineFixture {
  round: number
  status: string
  kickoff_time: string
}

export interface NextDeadline {
  round: number
  kickoff: string
}

/**
 * The next predictions deadline: the kickoff of the first match in the round
 * that is currently open for predictions (the lowest round where every fixture
 * is still not-started, per getCurrentRound). Returns null once the season is
 * complete.
 */
export function getNextDeadline(fixtures: DeadlineFixture[]): NextDeadline | null {
  const round = getCurrentRound(fixtures)
  if (round === null) return null

  const kickoffs = fixtures
    .filter((f) => f.round === round)
    .map((f) => f.kickoff_time)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  if (kickoffs.length === 0) return null

  return { round, kickoff: kickoffs[0] }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/predictions/deadline.test.ts`
Expected: PASS (6 assertions).

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — all pre-existing suites plus the three new ones.

- [ ] **Step 6: Commit**

```bash
git add src/lib/predictions/deadline.ts src/lib/predictions/deadline.test.ts
git commit -m "feat: add getNextDeadline for the next predictions deadline"
```

---

### Task 4: Predictions entry page — sorted, day-grouped, timed

**Files:**
- Create: `src/lib/format/use-display-time-zone.ts`
- Modify: `src/app/predictions/page.tsx` (line 44 `roundFixtures`; lines 77-95 `<PredictionForm>` props)
- Modify: `src/components/predictions/prediction-form.tsx` (lines 24-31 `FormFixture`; lines 202-274 render)

**Interfaces:**
- Consumes: `sortByKickoff`, `groupByKickoffDay` (Task 2); `formatKickoffTime`, `formatKickoffDayHeading` (Task 1).
- Produces:
  - `useDisplayTimeZone(): string | undefined` — `'Europe/London'` during SSR and first client render, `undefined` (device zone) after mount. `'use client'` module.
  - `FormFixture` gains `kickoffTime: string`.

- [ ] **Step 1: Create the time-zone hook**

Create `src/lib/format/use-display-time-zone.ts`:

```ts
'use client'

import { useEffect, useState } from 'react'

/**
 * The time zone to format kickoff times in.
 *
 * Returns 'Europe/London' during SSR and the first client render so the markup
 * matches, then switches to `undefined` after mount — letting Intl use the
 * viewer's device zone, which is what we want them to see. UK viewers (nearly
 * all of them) see no change across the switch.
 */
export function useDisplayTimeZone(): string | undefined {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? undefined : 'Europe/London'
}
```

- [ ] **Step 2: Sort fixtures and pass the kickoff time in the page**

In `src/app/predictions/page.tsx`:

Add the import near the other `@/lib/predictions` imports (after line 7):

```ts
import { sortByKickoff } from '@/lib/predictions/fixture-order'
```

Replace line 44:

```ts
  const roundFixtures = fixtures.filter((f) => f.round === currentRound)
```

with:

```ts
  const roundFixtures = sortByKickoff(fixtures.filter((f) => f.round === currentRound))
```

In the `<PredictionForm fixtures={roundFixtures.map((f) => ({ ... }))}>` block (lines 78-95), add one property to the mapped object, alongside `id`:

```ts
          id: f.id,
          kickoffTime: f.kickoff_time,
```

- [ ] **Step 3: Add `kickoffTime` to `FormFixture` and render grouping + time**

In `src/components/predictions/prediction-form.tsx`:

Add imports after line 10:

```ts
import { groupByKickoffDay } from '@/lib/predictions/fixture-order'
import { formatKickoffTime, formatKickoffDayHeading } from '@/lib/format/kickoff'
import { useDisplayTimeZone } from '@/lib/format/use-display-time-zone'
```

Add the field to `FormFixture` (after `id: number` on line 25):

```ts
  id: number
  kickoffTime: string
```

Inside `PredictionForm`, after the `inputRefs` declaration (line 115), add:

```ts
  const timeZone = useDisplayTimeZone()
```

The `alreadySubmitted` early return (lines 121-127) stays as-is.

Replace the render body — the `<form>` element and its `{fixtures.map((fixture, index) => { ... })}` block (lines 202-274) — so fixtures are rendered in day groups with a heading and a kickoff-time line. Keep every existing per-fixture element (team columns, score `<Input>`s with their `inputRefs` indices, expand/collapse chevron, `FormSquares`, `OtherPicksGrid`) unchanged. The running `index` for `inputRefs` must stay sequential across groups, so compute it from the fixture's position in the flat `fixtures` array, not per-group:

```tsx
  const dayGroups = groupByKickoffDay(fixtures, (f) => f.kickoffTime, timeZone)

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-6">
      {dayGroups.map((group) => (
        <div key={group.dayKey} className="space-y-4">
          <h2
            suppressHydrationWarning
            className="text-sm font-semibold text-muted-foreground"
          >
            {formatKickoffDayHeading(group.headingIso, timeZone)}
          </h2>

          {group.fixtures.map((fixture) => {
            const index = fixtures.indexOf(fixture)
            const isExpanded = expandedFixtureId === fixture.id

            return (
              <div key={fixture.id} className="border border-gray-700 rounded-lg p-4">
                <div
                  suppressHydrationWarning
                  className="text-xs text-muted-foreground text-center mb-2"
                >
                  {formatKickoffTime(fixture.kickoffTime, timeZone)}
                </div>

                <div className="flex items-center">
                  <div className="w-36 text-right">
                    <span className="text-white">{fixture.homeTeam}</span>
                  </div>
                  <div className="flex items-center gap-2 mx-4">
                    <Input
                      ref={(el) => {
                        if (el) inputRefs.current[index * 2] = el
                      }}
                      className="w-14 h-14 text-center bg-transparent border-gray-600 text-lg"
                      value={predictions[fixture.id]?.home || ''}
                      onChange={(e) =>
                        handleScoreChange(fixture.id, 'home', e.target.value, index * 2)
                      }
                    />
                    <span className="text-gray-400 mx-1">-</span>
                    <Input
                      ref={(el) => {
                        if (el) inputRefs.current[index * 2 + 1] = el
                      }}
                      className="w-14 h-14 text-center bg-transparent border-gray-600 text-lg"
                      value={predictions[fixture.id]?.away || ''}
                      onChange={(e) =>
                        handleScoreChange(fixture.id, 'away', e.target.value, index * 2 + 1)
                      }
                    />
                  </div>
                  <div className="w-36">
                    <span className="text-white">{fixture.awayTeam}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-4">
                    <div className="flex items-start">
                      <div className="w-36 flex justify-end">
                        <FormSquares form={fixture.homeForm} />
                      </div>
                      <div className="flex-1" />
                      <div className="w-36 flex justify-start">
                        <FormSquares form={fixture.awayForm} />
                      </div>
                    </div>
                    <OtherPicksGrid otherPicks={fixture.otherPicks} />
                  </div>
                )}

                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(fixture.id)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Collapse match details' : 'Expand match details'}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronDown
                      className={cn('h-5 w-5 transition-transform', isExpanded && 'rotate-180')}
                    />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ))}

      {fixtures.length > 0 && (
        <Button type="submit" className="w-full mt-8" disabled={!isFormComplete()}>
          Submit Predictions
        </Button>
      )}
    </form>
  )
```

- [ ] **Step 4: Typecheck, lint, and run the suite**

Run: `npm run lint && npm test`
Expected: no lint errors in the two changed files / new file; all tests pass (no new tests here — the pure helpers are already covered).

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, sign in, open `/predictions`.
Expected: matches appear oldest-kickoff first, under long-weekday date headings (`Saturday 22/08`), each card showing a 24-hour time (`15:00`). Score entry, auto-advance between inputs, expand/collapse, and submit all still work.

- [ ] **Step 6: Commit**

```bash
git add src/lib/format/use-display-time-zone.ts src/app/predictions/page.tsx src/components/predictions/prediction-form.tsx
git commit -m "feat: order and date-group fixtures on the predictions page"
```

---

### Task 5: Weekly Watcher — matching order and kickoff time

**Files:**
- Create: `src/components/weekly-watcher/watcher-fixture-list.tsx`
- Modify: `src/app/weekly-watcher/page.tsx` (lines 43-44 `roundFixtures`; lines 61-71 render)
- Modify: `src/components/weekly-watcher/watcher-fixture-card.tsx` (props + heading area)

**Interfaces:**
- Consumes: `sortByKickoff`, `groupByKickoffDay` (Task 2); `formatKickoffTime`, `formatKickoffDayHeading` (Task 1); `useDisplayTimeZone` (Task 4); `getAllPlayersPicks` (existing); `WatcherFixtureCard` (existing, extended).
- Produces:
  - `WatcherFixtureCard` gains a required `kickoffTime: string` prop, rendered as a centered muted time line above the picks grid.
  - `<WatcherFixtureList fixtures={FixtureRow[]} predictions={PredictionRow[]} profiles={Profile[]} />` — `'use client'`; sorts are done by the caller, this component only groups by day and renders headings + cards.

- [ ] **Step 1: Add the kickoff-time line to `WatcherFixtureCard`**

In `src/components/weekly-watcher/watcher-fixture-card.tsx`, extend the props (lines 19-27) and render a time line just inside the outer `<div>` (before the picks grid on line 36):

```tsx
export function WatcherFixtureCard({
  homeTeam,
  awayTeam,
  kickoffTime,
  picks,
}: {
  homeTeam: string
  awayTeam: string
  kickoffTime: string
  picks: WatcherPick[]
}) {
```

Add the import at the top:

```tsx
import { formatKickoffTime } from '@/lib/format/kickoff'
```

Add this as the first child of the outer `<div className="border border-gray-700 rounded-lg p-4">`:

```tsx
      <div
        suppressHydrationWarning
        className="text-xs text-muted-foreground text-center mb-2"
      >
        {formatKickoffTime(kickoffTime)}
      </div>
```

Note: this component renders inside a `'use client'` list (Step 2) but takes no `timeZone` prop; it uses the device zone directly. The pre-hydration mismatch is absorbed by `suppressHydrationWarning`, consistent with the entry page.

- [ ] **Step 2: Create the client list wrapper**

Create `src/components/weekly-watcher/watcher-fixture-list.tsx`:

```tsx
'use client'

import { groupByKickoffDay } from '@/lib/predictions/fixture-order'
import { formatKickoffDayHeading } from '@/lib/format/kickoff'
import { useDisplayTimeZone } from '@/lib/format/use-display-time-zone'
import { getAllPlayersPicks } from '@/lib/predictions/picks'
import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'
import { WatcherFixtureCard } from './watcher-fixture-card'

export function WatcherFixtureList({
  fixtures,
  predictions,
  profiles,
}: {
  fixtures: FixtureRow[]
  predictions: PredictionRow[]
  profiles: Profile[]
}) {
  const timeZone = useDisplayTimeZone()
  const dayGroups = groupByKickoffDay(fixtures, (f) => f.kickoff_time, timeZone)

  return (
    <>
      {dayGroups.map((group) => (
        <div key={group.dayKey} className="space-y-4">
          <h2
            suppressHydrationWarning
            className="text-sm font-semibold text-muted-foreground"
          >
            {formatKickoffDayHeading(group.headingIso, timeZone)}
          </h2>
          {group.fixtures.map((fixture) => (
            <WatcherFixtureCard
              key={fixture.id}
              homeTeam={fixture.home_team}
              awayTeam={fixture.away_team}
              kickoffTime={fixture.kickoff_time}
              picks={getAllPlayersPicks(fixture.id, predictions, profiles)}
            />
          ))}
        </div>
      ))}
    </>
  )
}
```

- [ ] **Step 3: Sort and delegate from the page**

In `src/app/weekly-watcher/page.tsx`:

Add imports after line 8:

```ts
import { sortByKickoff } from '@/lib/predictions/fixture-order'
import { WatcherFixtureList } from '@/components/weekly-watcher/watcher-fixture-list'
```

Replace lines 43-44:

```ts
  const roundFixtures =
    selectedRound === null ? [] : fixtures.filter((f) => f.round === selectedRound)
```

with:

```ts
  const roundFixtures =
    selectedRound === null
      ? []
      : sortByKickoff(fixtures.filter((f) => f.round === selectedRound))
```

Replace the fixture map inside the `<div className="max-w-md mx-auto space-y-4">` (lines 63-70) with:

```tsx
          <WatcherFixtureList
            fixtures={roundFixtures}
            predictions={predictions}
            profiles={profiles}
          />
```

The `space-y-4` on the wrapper plus `space-y-4` inside each group gives even spacing; leave `WeekSelect` above it untouched.

Remove the now-unused `WatcherFixtureCard` and `getAllPlayersPicks` imports from `page.tsx` if the linter flags them (they moved into `WatcherFixtureList`).

- [ ] **Step 4: Lint and run the suite**

Run: `npm run lint && npm test`
Expected: no unused-import or type errors; all tests pass.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`, open `/weekly-watcher` for a round you have predictions for.
Expected: fixtures listed oldest-first under date headings, each card showing its kickoff time; the week `<select>` still switches rounds.

- [ ] **Step 6: Commit**

```bash
git add src/components/weekly-watcher/watcher-fixture-list.tsx src/components/weekly-watcher/watcher-fixture-card.tsx src/app/weekly-watcher/page.tsx
git commit -m "feat: match kickoff order and show times on Weekly Watcher"
```

---

### Task 6: Home page — next predictions deadline

**Files:**
- Create: `src/components/home/next-deadline.tsx`
- Modify: `src/app/page.tsx` (imports; data fetch in the component body; render inside the `Card` above the buttons block on lines 35-57)

**Interfaces:**
- Consumes: `getNextDeadline` (Task 3); `formatKickoffRow` (Task 1); `useDisplayTimeZone` (Task 4); `createClient` from `@/lib/supabase/server` (existing).
- Produces:
  - `<NextDeadline kickoff={string | null} alreadySubmitted={boolean} />` — `'use client'`; renders the deadline line(s).

- [ ] **Step 1: Create the `NextDeadline` component**

Create `src/components/home/next-deadline.tsx`:

```tsx
'use client'

import { formatKickoffRow } from '@/lib/format/kickoff'
import { useDisplayTimeZone } from '@/lib/format/use-display-time-zone'

export function NextDeadline({
  kickoff,
  alreadySubmitted,
}: {
  kickoff: string | null
  alreadySubmitted: boolean
}) {
  const timeZone = useDisplayTimeZone()

  if (kickoff === null) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Season complete — no more predictions
      </p>
    )
  }

  const when = formatKickoffRow(kickoff, timeZone)

  if (alreadySubmitted) {
    return (
      <div className="text-center space-y-0.5" suppressHydrationWarning>
        <p className="text-sm text-muted-foreground">Predictions submitted</p>
        <p className="text-sm text-foreground">Next deadline: {when}</p>
      </div>
    )
  }

  return (
    <p className="text-center text-sm text-foreground" suppressHydrationWarning>
      Predictions close: {when}
    </p>
  )
}
```

- [ ] **Step 2: Fetch fixtures + submitted state and render it on the home page**

In `src/app/page.tsx`:

Add imports after line 6:

```ts
import { getNextDeadline } from '@/lib/predictions/deadline'
import { NextDeadline } from '@/components/home/next-deadline'
import type { FixtureRow, PredictionRow } from '@/lib/supabase/database.types'
```

In the component body, after the `user` is resolved (after line 12), add the deadline lookup for signed-in users:

```ts
  let deadlineKickoff: string | null = null
  let deadlineSubmitted = false

  if (user) {
    const [{ data: fixturesData }, { data: predictionsData }] = await Promise.all([
      supabase.from('fixtures').select('round,status,kickoff_time'),
      supabase.from('predictions').select('fixture_id,user_id').eq('user_id', user.id),
    ])

    const fixtures = (fixturesData ?? []) as Pick<
      FixtureRow,
      'round' | 'status' | 'kickoff_time'
    >[]
    const deadline = getNextDeadline(fixtures)
    deadlineKickoff = deadline?.kickoff ?? null

    if (deadline) {
      const predictions = (predictionsData ?? []) as Pick<
        PredictionRow,
        'fixture_id' | 'user_id'
      >[]
      // Note: `fixtures` here has no `id`; re-read round membership from a fuller
      // fetch would be wasteful, so match on the fixture ids belonging to the
      // deadline round via a dedicated id query.
      const { data: roundFixtureRows } = await supabase
        .from('fixtures')
        .select('id')
        .eq('round', deadline.round)
      const roundFixtureIds = new Set((roundFixtureRows ?? []).map((r) => r.id as number))
      deadlineSubmitted = predictions.some((p) => roundFixtureIds.has(p.fixture_id))
    }
  }
```

Then render `<NextDeadline>` inside the `Card`, directly above the `<div className="w-full space-y-3">` buttons block (line 35), only when signed in:

```tsx
          {user && (
            <div className="w-full">
              <NextDeadline kickoff={deadlineKickoff} alreadySubmitted={deadlineSubmitted} />
            </div>
          )}

          <div className="w-full space-y-3">
```

- [ ] **Step 3: Simplify — fold the id lookup into one fixtures fetch**

The two `fixtures` queries in Step 2 are redundant. Replace the Step 2 body with a single fetch that includes `id`:

```ts
  let deadlineKickoff: string | null = null
  let deadlineSubmitted = false

  if (user) {
    const [{ data: fixturesData }, { data: predictionsData }] = await Promise.all([
      supabase.from('fixtures').select('id,round,status,kickoff_time'),
      supabase.from('predictions').select('fixture_id').eq('user_id', user.id),
    ])

    const fixtures = (fixturesData ?? []) as Pick<
      FixtureRow,
      'id' | 'round' | 'status' | 'kickoff_time'
    >[]
    const deadline = getNextDeadline(fixtures)
    deadlineKickoff = deadline?.kickoff ?? null

    if (deadline) {
      const predictions = (predictionsData ?? []) as Pick<PredictionRow, 'fixture_id'>[]
      const roundFixtureIds = new Set(
        fixtures.filter((f) => f.round === deadline.round).map((f) => f.id),
      )
      deadlineSubmitted = predictions.some((p) => roundFixtureIds.has(p.fixture_id))
    }
  }
```

`getNextDeadline` accepts the extra `id` field (its `DeadlineFixture` only requires `round`, `status`, `kickoff_time`; excess properties on array elements are allowed).

- [ ] **Step 4: Lint and run the suite**

Run: `npm run lint && npm test`
Expected: no errors; all tests pass.

- [ ] **Step 5: Manual verification**

Run: `npm run dev`.
- Signed out: home page unchanged (no deadline line).
- Signed in, not yet submitted for the next round: `Predictions close: Sat 21/08 · 19:00` above the menu buttons.
- Signed in, already submitted for the next round: `Predictions submitted` / `Next deadline: …`.
- With every round started (simulate by editing local data or trust the unit test): `Season complete — no more predictions`.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/next-deadline.tsx src/app/page.tsx
git commit -m "feat: show the next predictions deadline on the home page"
```

---

## Self-Review

**1. Spec coverage**

| Spec item | Task |
| --- | --- |
| `src/lib/format/kickoff.ts` (`formatKickoffTime`, `formatKickoffRow`, `formatKickoffDayHeading`, `kickoffDayKey`, fallback) | Task 1 |
| `src/lib/predictions/fixture-order.ts` (`sortByKickoff`, tie-break, no mutation) | Task 2 |
| `groupByKickoffDay` | Task 2 (spec implies grouping; helper extracted here and consumed in Tasks 4–5) |
| `src/lib/predictions/deadline.ts` (`getNextDeadline`, null at season end) | Task 3 |
| Predictions page sort + `kickoffTime` prop | Task 4 |
| `prediction-form.tsx` day grouping + time line + hydration guard | Task 4 |
| `useDisplayTimeZone` (spec's "mounted flag" approach, shared) | Task 4 (created), reused Tasks 5–6 |
| Weekly Watcher sort | Task 5 |
| Weekly Watcher time + day heading (spec flagged this as consistency; user approved) | Task 5 |
| Home page fetch + `getNextDeadline` + submitted check | Task 6 |
| `<NextDeadline>` three states (close / submitted / season complete) | Task 6 |
| Out of scope: tz label, relative text, enforcement, countdown | honoured — none added |
| Tests: `kickoff.test.ts`, `fixture-order.test.ts`, `deadline.test.ts` | Tasks 1–3 |

No gaps.

**2. Placeholder scan**

No `TBD`/`TODO`/"handle edge cases"/"similar to Task N". Every code step has literal code. Task 4 Step 3 repeats the full fixture-card markup rather than referencing the original file, so it can be applied without cross-referencing.

**3. Type consistency**

- `sortByKickoff<T extends { id: number; kickoff_time: string }>` — call sites pass `FixtureRow[]` (has both). ✓
- `groupByKickoffDay(fixtures, getIso, timeZone?)` — called with `(f) => f.kickoffTime` in Task 4 (camelCase form prop) and `(f) => f.kickoff_time` in Task 5 (`FixtureRow`). The accessor parameter is exactly why the signature takes a getter. ✓
- `useDisplayTimeZone(): string | undefined` — consumed as the optional `timeZone` arg of every `kickoff.ts` helper. ✓
- `getNextDeadline(fixtures: DeadlineFixture[])` where `DeadlineFixture = { round; status; kickoff_time }` — Task 6 passes objects with an extra `id`; excess properties on non-literal arrays are allowed by TS. ✓
- `NextDeadline` props `{ kickoff: string | null; alreadySubmitted: boolean }` — Task 6 render passes `deadlineKickoff` (`string | null`) and `deadlineSubmitted` (`boolean`). ✓
- `WatcherFixtureCard` new required prop `kickoffTime: string` — the only caller (`WatcherFixtureList`, Task 5) passes `fixture.kickoff_time`. ✓

Consistent.
