# Desktop Layout Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the Predictions and Leaderboard pages dedicated desktop layout treatment at the `lg` (1024px) breakpoint, per `docs/superpowers/specs/2026-08-04-desktop-layout-pass-design.md`.

**Architecture:** Pure Tailwind CSS class changes to three existing files. No new components, no logic changes, no changes to component props/APIs. All changes are additive `lg:`-prefixed classes — below `lg`, output must be pixel-identical to current behavior.

**Tech Stack:** Next.js 14, React 18, Tailwind CSS 3.

## Global Constraints

- Target breakpoint is `lg:` (1024px, Tailwind default) — do not introduce other breakpoints.
- Below `lg`, rendered output must be unchanged from current behavior — only add `lg:`-prefixed classes, never remove or replace an unprefixed class in a way that changes sub-`lg` rendering.
- No component prop/API changes. No new files.
- This codebase has no component-rendering test setup (vitest environment is `node`, no `@testing-library/react`, no existing component tests) — verification for these tasks is manual visual check via `npm run dev`, not an automated test.
- The Leaderboard page has grown since this spec was written (it now also renders "Top Gameweek Scores" and "Weeks Won" sections below the chart). Those two sections are explicitly OUT OF SCOPE for this plan — do not touch them. Only the table+chart pairing gets the two-column treatment.
- Match old class strings by exact text, not by line number — line numbers below are a locating aid only and may drift from the actual file.

---

### Task 1: Widen Predictions page for desktop

**Files:**
- Modify: `src/components/predictions/prediction-form.tsx` (form container max-width, fixture row padding, team-name column width, score input size, gap spacing, expanded form-squares row width)

**Interfaces:**
- No prop or exported-type changes. `PredictionForm({ fixtures, alreadySubmitted })` signature is unchanged.

- [ ] **Step 1: Widen the form container at `lg`**

In `src/components/predictions/prediction-form.tsx`, find the form element:

```tsx
    <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
```

Change to:

```tsx
    <form onSubmit={handleSubmit} className="max-w-md lg:max-w-2xl mx-auto space-y-4">
```

- [ ] **Step 2: Give fixture rows more room at `lg`**

Find the fixture row wrapper:

```tsx
          <div
            key={fixture.id}
            className="border border-gray-700 rounded-lg p-4"
          >
```

Change the className to:

```tsx
          <div
            key={fixture.id}
            className="border border-gray-700 rounded-lg p-4 lg:p-6"
          >
```

- [ ] **Step 3: Widen team-name columns at `lg`**

Find the home-team column:

```tsx
              <div className="w-36 text-right">
                <span className="text-white">{fixture.homeTeam}</span>
              </div>
```

Change to:

```tsx
              <div className="w-36 lg:w-48 text-right">
                <span className="text-white">{fixture.homeTeam}</span>
              </div>
```

Find the away-team column:

```tsx
              <div className="w-36">
                <span className="text-white">{fixture.awayTeam}</span>
              </div>
```

Change to:

```tsx
              <div className="w-36 lg:w-48">
                <span className="text-white">{fixture.awayTeam}</span>
              </div>
```

- [ ] **Step 4: Enlarge score inputs and their spacing at `lg`**

Find the score-input group wrapper:

```tsx
              <div className="flex items-center gap-2 mx-4">
```

Change to:

```tsx
              <div className="flex items-center gap-2 lg:gap-3 mx-4 lg:mx-6">
```

Find both score `<Input>` elements (there are two — one for the home score, one for the away score), each with:

```tsx
                  className="w-14 h-14 text-center bg-transparent border-gray-600 text-lg"
```

Change both occurrences to:

```tsx
                  className="w-14 h-14 lg:w-16 lg:h-16 text-center bg-transparent border-gray-600 text-lg lg:text-xl"
```

- [ ] **Step 5: Keep the expanded form-squares row aligned with the widened team-name columns**

When a fixture row is expanded, it renders a row of two `FormSquares` wrappers directly under the home/away team names. Those wrappers currently share the same `w-36` width as the team-name columns above them (Step 3), so they must widen the same way at `lg` or they'll drift out of alignment.

Find:

```tsx
                <div className="flex items-start">
                  <div className="w-36 flex justify-end">
                    <FormSquares form={fixture.homeForm} />
                  </div>
                  <div className="flex-1" />
                  <div className="w-36 flex justify-start">
                    <FormSquares form={fixture.awayForm} />
                  </div>
                </div>
```

Change to:

```tsx
                <div className="flex items-start">
                  <div className="w-36 lg:w-48 flex justify-end">
                    <FormSquares form={fixture.homeForm} />
                  </div>
                  <div className="flex-1" />
                  <div className="w-36 lg:w-48 flex justify-start">
                    <FormSquares form={fixture.awayForm} />
                  </div>
                </div>
```

- [ ] **Step 6: Verify visually**

Run: `npm run dev`

Open `http://localhost:3000/predictions` (log in first if required by the dev environment).

Using browser dev tools' responsive mode, check:
- At 1024px+ width: form is noticeably wider (up to 672px), rows have more padding, team names and score inputs are larger, nothing overflows or wraps awkwardly.
- At 768px and 390px width: layout is identical to how it looked before this change (single `max-w-md` column, original padding/sizing).
- Expand a fixture row at both a sub-1024px and a 1024px+ width: the form-squares row lines up under the team names at both widths (no drift at desktop), and the "Other Picks" grid below it still renders correctly.

- [ ] **Step 7: Commit**

```bash
git add src/components/predictions/prediction-form.tsx
git commit -m "feat: widen predictions page layout at desktop breakpoint"
```

---

### Task 2: Two-column layout for Leaderboard table + chart at desktop

**Files:**
- Modify: `src/app/leaderboard/page.tsx` (JSX return block — table+chart section only)

**Interfaces:**
- No changes to `LeaderboardTable` or `CumulativeScoreChart` props. Both continue to receive the same data as before (`entries`, `playerSeries`, `roundNumbers`).
- The page also renders a `BackToHomeButton`, a "Top Gameweek Scores" section (`TopGameweekScoresTable`), and a "Weeks Won" section (`WeeksWonTable`) after the chart. **Do not modify these** — they stay exactly as they are, full-width, in their current order.

- [ ] **Step 1: Wrap only the table and chart in a responsive grid**

In `src/app/leaderboard/page.tsx`, find this part of the return block:

```tsx
      <LeaderboardTable data={entries} />
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Season Progress</h2>
        <CumulativeScoreChart series={playerSeries} roundNumbers={roundNumbers} />
      </div>
```

Replace with:

```tsx
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <LeaderboardTable data={entries} />
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Season Progress</h2>
          <CumulativeScoreChart series={playerSeries} roundNumbers={roundNumbers} />
        </div>
      </div>
```

Everything before this block (`BackToHomeButton`, the `<h1>`) and everything after it (the "Top Gameweek Scores" and "Weeks Won" `<div className="mt-8">` sections) must be left exactly as they are — do not change their indentation, wrapping, or spacing classes.

Note: `gap-8` (2rem) matches the previous `mt-8` (2rem) spacing, so below `lg` — where the grid stays single-column and the two children stack — the vertical spacing between the table and the chart section is unchanged from before, and the spacing to the "Top Gameweek Scores" section below it (still its own `mt-8` block) is also unaffected.

- [ ] **Step 2: Verify visually**

Run: `npm run dev` (skip if already running from Task 1)

Open `http://localhost:3000/leaderboard`.

Using browser dev tools' responsive mode, check:
- At 1024px+ width: standings table is on the left, "Season Progress" chart is on the right, side by side in one row, both fully visible without horizontal scrolling. "Top Gameweek Scores" and "Weeks Won" remain full-width, stacked below, unchanged.
- At 768px and 390px width: table appears first, "Season Progress" chart appears below it, then "Top Gameweek Scores", then "Weeks Won" — same stacked order and spacing as before this change.
- Hover/keyboard interaction on the chart (crosshair, tooltip) still works correctly in the narrower two-column width at desktop.
- The per-player chevron dropdown in the standings table (weekly scores breakdown) still works correctly in the narrower two-column width at desktop.

- [ ] **Step 3: Commit**

```bash
git add src/app/leaderboard/page.tsx
git commit -m "feat: place leaderboard table and chart side by side at desktop breakpoint"
```

---

### Task 3: Update backlog

**Files:**
- Modify: `Backlog.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Move item 16 to Complete**

In `Backlog.md`, find this line (in the open-items section near the top):

```
16. Desktop layout pass -- dedicated breakpoint work for larger screens (current design is mobile-first/narrow-centered throughout), not just "doesn't break" on desktop.
```

Delete that line from where it currently sits.

Find the `Complete` section heading further down the file (a line that just says `Complete`), and add the same line immediately after it, so it becomes the first item listed under `Complete`:

```
Complete
16. Desktop layout pass -- dedicated breakpoint work for larger screens (current design is mobile-first/narrow-centered throughout), not just "doesn't break" on desktop.
```

(Keep every other line in the file — both above and below your edit — exactly as it currently reads. Only remove the one line from the open-items section and re-add it under `Complete`.)

- [ ] **Step 2: Commit**

```bash
git add Backlog.md
git commit -m "docs: mark backlog item 16 complete"
```
