# Desktop Layout Pass (Backlog #16)

## Problem

The app is mobile-first/narrow-centered throughout. Only 1 of 19 `.tsx` files uses
`lg:`/`xl:`/`2xl:` breakpoints (a shadcn `button.tsx` utility class) — no page has
dedicated desktop layout work. On larger screens, pages just render their mobile
layout centered in extra whitespace instead of using the available width.

## Scope

In scope: **Predictions** and **Leaderboard** — the two pages used repeatedly by
every player.

Out of scope: **Login**, **Home**, **Admin results**. Login/Home are already a
small centered card, which is a legitimate, intentional desktop pattern, not a
mobile layout leaking onto desktop. Admin results is low-traffic (admin-only) and
shares its current layout with the same "narrow list" pattern as Predictions, but
isn't worth touching in this pass.

## Breakpoint

Target Tailwind's `lg:` (1024px) as the "desktop" threshold. Below `lg`, both
pages must render pixel-identical to their current mobile/tablet layout — all
changes are additive `lg:`-prefixed classes, nothing is removed or restructured
for smaller viewports.

## Predictions page

Files: `src/app/predictions/page.tsx`, `src/components/predictions/prediction-form.tsx`

- Form container: `max-w-md` → `max-w-md lg:max-w-2xl` (448px → 672px at desktop)
- Stays a single column of fixture rows (not a multi-column grid) — just wider
- Fixture rows get more horizontal padding and slightly larger team-name/score
  columns at `lg`, so the wider row doesn't look sparse
- Chevron/expand-for-match-details interaction is unchanged

## Leaderboard page

File: `src/app/leaderboard/page.tsx`

- Below `lg`: unchanged — table full width, chart full width beneath it
- At `lg` and up: table and chart sit side by side in a two-column grid
  (`grid-cols-1 lg:grid-cols-2 gap-8`), table on the left, chart on the right
- The chart's SVG already scales via `viewBox` + `w-full h-auto`, so it renders
  correctly at the narrower column width with no chart component changes

## Non-goals

- No changes to Login, Home, or Admin results pages
- No new shared layout components
- No changes to component props/APIs — this is Tailwind class changes only, in
  the three files listed above
- No changes to interaction behavior (form submission, chart hover/tooltip,
  chevron expand) — layout only

## Testing

- Visual check at 1024px, 1280px, 1440px viewport widths for both pages
- Visual check below 1024px (e.g. 768px, 390px) to confirm the existing
  mobile/tablet layout is unaffected
- Existing Vitest suite (`gameweek.test.ts`, etc.) is unaffected — this is a
  pure styling change with no logic touched
