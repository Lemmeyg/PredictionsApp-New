# Supabase Auth + Database Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Google Sheets data layer and "tap your name" pseudo-auth with Supabase (Postgres) auth and a real database, while keeping the app fully working end-to-end (login → enter predictions → admin enters results → leaderboard).

**Architecture:** A new, dedicated Supabase free-tier project provides Postgres + email/password auth. Business logic (scoring, fixture sync, gameweek selection, admin checks) is plain TypeScript in Next.js server components/actions/routes, matching the existing codebase's stack. Row Level Security policies in Postgres are a defense-in-depth safety net, not where logic lives. Vercel Hobby Cron triggers a daily fixture/result sync from api-football.com.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind/shadcn-ui (unchanged), `@supabase/supabase-js`, `@supabase/ssr`, Vitest (new — no test runner currently exists in this repo).

## Global Constraints

- 6 fixed players (David, Gordon, Huw, James, Tom, Ty) — no self-signup, no dynamic player-management UI in this phase.
- Full replace of Google Sheets as the data layer — no historical data migration.
- Scoring: 8 points for an exact score match, 5 points for a correct result (home win / draw / away win) with the wrong score, 0 points otherwise.
- Current gameweek = lowest-numbered round where every fixture has status `NS` (not started).
- Minimize shared infra load: dedicated new Supabase project, Vercel Hobby cron (daily only), no Supabase Edge Functions / `pg_cron`.
- Spec: `docs/superpowers/specs/2026-08-01-supabase-auth-database-foundation-design.md`

---

### Task 1: Security remediation — leaked credentials

**Files:**
- Modify: `.env.local` (untrack from git; update with rotated football API key)
- Modify: `DraftPRD.md` (remove plaintext credentials block)
- Modify: `.gitignore` (already lists `.env.local` — verify, no change expected)

**Interfaces:** None — this task has no code dependencies on other tasks and nothing later depends on it.

This repo is public on GitHub. `.env.local` (containing a real Google service-account private key and the live football-data API key) has been committed since early history and is still tracked today. `DraftPRD.md` also has a separate, plaintext copy of a Google service-account key and API keys. Both must be treated as compromised.

- [ ] **Step 1: Revoke the Google credentials (manual, external)**

  These are no longer needed going forward — Phase 1 removes Google Sheets from the active code path entirely — so the safest move is to revoke rather than rotate:
  - In Google Cloud Console → IAM & Admin → Service Accounts → `predictionsapp@predictionsapp-new.iam.gserviceaccount.com` → Keys: delete the existing key(s). Do not generate a replacement.
  - In Google Cloud Console → APIs & Services → Credentials: delete/revoke the Sheets API key (`AIzaSyATKZC6GFRmM02W5SMqmwydBgCpQ3dpr3Q`).

- [ ] **Step 2: Rotate the football API key (manual, external)**

  This key is still needed (fixture/result sync continues via api-football.com). At api-football.com's dashboard, regenerate the API key and copy the new value.

- [ ] **Step 3: Untrack `.env.local` from git**

  Run: `git rm --cached .env.local`

  This removes it from git's tracking going forward without deleting the local file. `.gitignore` already lists `.env.local`, so it won't be re-added.

- [ ] **Step 4: Update the local `.env.local` with the new football API key**

  Replace the `FOOTBALL_API_KEY` value in `.env.local` with the key generated in Step 2. Leave the Google-related lines in place for now — they'll be removed wholesale in Task 11 when the Sheets code is deleted.

- [ ] **Step 5: Strip the leaked credentials block from `DraftPRD.md`**

  Remove the `##Credentials` section (the plaintext service-account JSON and API key values). Replace it with:

  ```markdown
  ##Credentials
  See `.env.local.example` for the required environment variables. Actual values live in `.env.local` (untracked) and in Vercel project settings.
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add .gitignore DraftPRD.md
  git rm --cached .env.local
  git commit -m "security: stop tracking .env.local, remove leaked credentials from docs"
  ```

---

### Task 2: Supabase project + client setup

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/admin.ts`
- Create: `src/lib/supabase/database.types.ts`
- Create: `.env.local.example`
- Modify: `.env.local` (add Supabase + cron env vars)
- Modify: `package.json` (add `@supabase/supabase-js`, `@supabase/ssr`, `server-only`)

**Interfaces:**
- Produces: `createClient()` (browser, from `src/lib/supabase/client.ts`) — returns a Supabase client for use in `'use client'` components.
- Produces: `createClient()` (server, from `src/lib/supabase/server.ts`) — returns a Supabase client scoped to the current request's session/cookies, for use in Server Components and Server Actions. Not async — call directly, no `await`.
- Produces: `createAdminClient()` (from `src/lib/supabase/admin.ts`) — returns a service-role client that bypasses RLS. Server-only; never import from a `'use client'` file.
- Produces: types `Profile`, `FixtureRow`, `PredictionRow` (from `src/lib/supabase/database.types.ts`).

- [ ] **Step 1: Create the Supabase project (manual, external)**

  In the Supabase dashboard, create a new project dedicated to this app (free tier). Note the Project URL, `anon` public key, and `service_role` secret key from Project Settings → API.

- [ ] **Step 2: Install dependencies**

  ```bash
  npm install @supabase/supabase-js @supabase/ssr server-only
  ```

- [ ] **Step 3: Add environment variables**

  Add to `.env.local`:

  ```
  NEXT_PUBLIC_SUPABASE_URL=<project-url>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
  SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
  CRON_SECRET=<generate a random string, e.g. `openssl rand -hex 32`>
  FOOTBALL_API_SEASON=2026
  ```

  Create `.env.local.example` (committed, no real values) so the required vars are documented:

  ```
  FOOTBALL_API_KEY=
  FOOTBALL_API_SEASON=2026
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  CRON_SECRET=
  ```

  Add the same `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `FOOTBALL_API_KEY`, `FOOTBALL_API_SEASON` to the Vercel project's Environment Variables settings (Production + Preview).

- [ ] **Step 4: Create the browser client**

  ```ts
  // src/lib/supabase/client.ts
  import { createBrowserClient } from '@supabase/ssr'

  export function createClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  ```

- [ ] **Step 5: Create the server client**

  ```ts
  // src/lib/supabase/server.ts
  import { createServerClient } from '@supabase/ssr'
  import { cookies } from 'next/headers'

  export function createClient() {
    const cookieStore = cookies()

    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Called from a Server Component - middleware refreshes the session instead.
            }
          },
        },
      }
    )
  }
  ```

- [ ] **Step 6: Create the admin (service-role) client**

  ```ts
  // src/lib/supabase/admin.ts
  import 'server-only'
  import { createClient as createSupabaseClient } from '@supabase/supabase-js'

  export function createAdminClient() {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
  }
  ```

- [ ] **Step 7: Create the database row types**

  ```ts
  // src/lib/supabase/database.types.ts
  export interface Profile {
    id: string
    display_name: string
    initials: string | null
    is_admin: boolean
    created_at: string
  }

  export interface FixtureRow {
    id: number
    round: number
    home_team: string
    away_team: string
    kickoff_time: string
    status: string
    home_score: number | null
    away_score: number | null
    result_source: 'api' | 'admin' | null
    updated_at: string
  }

  export interface PredictionRow {
    id: string
    user_id: string
    fixture_id: number
    predicted_home_score: number
    predicted_away_score: number
    submitted_at: string
  }
  ```

- [ ] **Step 8: Verify the app still builds**

  Run: `npm run build`
  Expected: builds successfully (these new files aren't imported anywhere yet, so this just confirms no syntax errors).

- [ ] **Step 9: Commit**

  ```bash
  git add src/lib/supabase package.json package-lock.json .env.local.example
  git commit -m "feat: add Supabase client helpers and database types"
  ```

---

### Task 3: Database schema + RLS + seed profiles

**Files:**
- Create: `supabase/migrations/0001_init.sql`

**Interfaces:**
- Produces: tables `public.profiles`, `public.fixtures`, `public.predictions` — consumed by every later task that queries Supabase.

- [ ] **Step 1: Write the migration SQL**

  ```sql
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
  ```

  Note: the daily cron sync (Task 7) uses the service-role client, which bypasses RLS entirely — the admin-only fixture policies apply to interactive/session-based writes (e.g. the admin results UI in Task 8), not the cron job.

- [ ] **Step 2: Apply the migration (manual)**

  In the Supabase dashboard → SQL Editor, paste the contents of `supabase/migrations/0001_init.sql` and run it. Verify the three tables appear under Table Editor.

- [ ] **Step 3: Create the 6 player accounts (manual)**

  In Supabase dashboard → Authentication → Users → Add User, create one user per player (David, Gordon, Huw, James, Tom, Ty) with an email and password each. The `on_auth_user_created` trigger will auto-create a matching `profiles` row with `display_name` defaulted from the email's local part.

- [ ] **Step 4: Fix up display names, initials, and admin flag (manual)**

  In SQL Editor, run:

  ```sql
  select id, email from auth.users;
  ```

  Then, for each player, run (substituting the real `id` and values — mark yourself as the initial admin):

  ```sql
  update public.profiles
  set display_name = 'Gordon', initials = 'GL', is_admin = true
  where id = '<gordon-auth-uid>';
  ```

  Repeat for David, Huw, James, Tom, Ty (with `is_admin = false` for the non-admins).

- [ ] **Step 5: Commit**

  ```bash
  git add supabase/migrations/0001_init.sql
  git commit -m "feat: add Supabase schema (profiles, fixtures, predictions) with RLS"
  ```

---

### Task 4: Scoring engine

**Files:**
- Create: `src/lib/predictions/scoring.ts`
- Test: `src/lib/predictions/scoring.test.ts`
- Create: `vitest.config.ts`
- Modify: `package.json` (add `vitest` dev dependency, `"test"` script)

**Interfaces:**
- Produces: `calculatePoints(prediction: ScoringPrediction, fixture: ScoringFixture): number` — consumed by the leaderboard page (Task 10).
- Produces: types `ScoringPrediction`, `ScoringFixture`.

- [ ] **Step 1: Install Vitest**

  ```bash
  npm install --save-dev vitest
  ```

- [ ] **Step 2: Add the Vitest config**

  ```ts
  // vitest.config.ts
  import { defineConfig } from 'vitest/config'

  export default defineConfig({
    test: {
      environment: 'node',
    },
  })
  ```

- [ ] **Step 3: Add the `test` script**

  In `package.json` `"scripts"`, add:

  ```json
  "test": "vitest run"
  ```

- [ ] **Step 4: Write the failing tests**

  ```ts
  // src/lib/predictions/scoring.test.ts
  import { describe, expect, it } from 'vitest'
  import { calculatePoints } from './scoring'

  describe('calculatePoints', () => {
    it('awards 8 points for an exact score match', () => {
      expect(
        calculatePoints(
          { predictedHomeScore: 2, predictedAwayScore: 1 },
          { homeScore: 2, awayScore: 1 }
        )
      ).toBe(8)
    })

    it('awards 8 points for an exact 0-0 draw match', () => {
      expect(
        calculatePoints(
          { predictedHomeScore: 0, predictedAwayScore: 0 },
          { homeScore: 0, awayScore: 0 }
        )
      ).toBe(8)
    })

    it('awards 5 points for correct result but wrong score', () => {
      expect(
        calculatePoints(
          { predictedHomeScore: 3, predictedAwayScore: 1 },
          { homeScore: 2, awayScore: 0 }
        )
      ).toBe(5)
    })

    it('awards 5 points for a correctly predicted draw with the wrong score', () => {
      expect(
        calculatePoints(
          { predictedHomeScore: 1, predictedAwayScore: 1 },
          { homeScore: 2, awayScore: 2 }
        )
      ).toBe(5)
    })

    it('awards 0 points for a wrong result', () => {
      expect(
        calculatePoints(
          { predictedHomeScore: 2, predictedAwayScore: 0 },
          { homeScore: 0, awayScore: 1 }
        )
      ).toBe(0)
    })

    it('awards 0 points when the fixture has no result yet', () => {
      expect(
        calculatePoints(
          { predictedHomeScore: 1, predictedAwayScore: 0 },
          { homeScore: null, awayScore: null }
        )
      ).toBe(0)
    })
  })
  ```

- [ ] **Step 5: Run the tests and verify they fail**

  Run: `npm test`
  Expected: FAIL with "Cannot find module './scoring'" (the module doesn't exist yet).

- [ ] **Step 6: Implement `calculatePoints`**

  ```ts
  // src/lib/predictions/scoring.ts
  export interface ScoringFixture {
    homeScore: number | null
    awayScore: number | null
  }

  export interface ScoringPrediction {
    predictedHomeScore: number
    predictedAwayScore: number
  }

  export function calculatePoints(
    prediction: ScoringPrediction,
    fixture: ScoringFixture
  ): number {
    if (fixture.homeScore === null || fixture.awayScore === null) {
      return 0
    }

    const exactMatch =
      prediction.predictedHomeScore === fixture.homeScore &&
      prediction.predictedAwayScore === fixture.awayScore

    if (exactMatch) {
      return 8
    }

    const predictedResult = Math.sign(
      prediction.predictedHomeScore - prediction.predictedAwayScore
    )
    const actualResult = Math.sign(fixture.homeScore - fixture.awayScore)

    if (predictedResult === actualResult) {
      return 5
    }

    return 0
  }
  ```

- [ ] **Step 7: Run the tests and verify they pass**

  Run: `npm test`
  Expected: PASS, all 6 tests green.

- [ ] **Step 8: Commit**

  ```bash
  git add src/lib/predictions/scoring.ts src/lib/predictions/scoring.test.ts vitest.config.ts package.json package-lock.json
  git commit -m "feat: add scoring engine (8/5/0 points rule) with tests"
  ```

---

### Task 5: Gameweek selection logic

**Files:**
- Create: `src/lib/predictions/gameweek.ts`
- Test: `src/lib/predictions/gameweek.test.ts`

**Interfaces:**
- Consumes: nothing (pure function, no dependency on earlier tasks beyond Vitest being set up in Task 4).
- Produces: `getCurrentRound(fixtures: GameweekFixture[]): number | null` — consumed by the predictions page (Task 9).
- Produces: `getLatestCompletedRound(fixtures: GameweekFixture[]): number | null` — consumed by the leaderboard page (Task 10).
- Produces: type `GameweekFixture`.

- [ ] **Step 1: Write the failing tests**

  ```ts
  // src/lib/predictions/gameweek.test.ts
  import { describe, expect, it } from 'vitest'
  import { getCurrentRound, getLatestCompletedRound } from './gameweek'

  describe('getCurrentRound', () => {
    it('picks the lowest round where every fixture is not started', () => {
      const fixtures = [
        { round: 1, status: 'FT' },
        { round: 2, status: 'FT' },
        { round: 3, status: 'NS' },
        { round: 3, status: 'NS' },
        { round: 4, status: 'NS' },
      ]
      expect(getCurrentRound(fixtures)).toBe(3)
    })

    it('skips a round that has already partially started', () => {
      const fixtures = [
        { round: 3, status: 'FT' },
        { round: 3, status: 'NS' },
        { round: 4, status: 'NS' },
        { round: 4, status: 'NS' },
      ]
      expect(getCurrentRound(fixtures)).toBe(4)
    })

    it('returns null when every round has started', () => {
      const fixtures = [
        { round: 1, status: 'FT' },
        { round: 2, status: 'FT' },
      ]
      expect(getCurrentRound(fixtures)).toBeNull()
    })
  })

  describe('getLatestCompletedRound', () => {
    it('picks the highest round where every fixture is finished', () => {
      const fixtures = [
        { round: 1, status: 'FT' },
        { round: 2, status: 'FT' },
        { round: 3, status: 'NS' },
      ]
      expect(getLatestCompletedRound(fixtures)).toBe(2)
    })

    it('skips a round that is only partially finished', () => {
      const fixtures = [
        { round: 1, status: 'FT' },
        { round: 2, status: 'FT' },
        { round: 2, status: 'NS' },
      ]
      expect(getLatestCompletedRound(fixtures)).toBe(1)
    })

    it('returns null when no round is complete', () => {
      const fixtures = [{ round: 1, status: 'NS' }]
      expect(getLatestCompletedRound(fixtures)).toBeNull()
    })
  })
  ```

- [ ] **Step 2: Run the tests and verify they fail**

  Run: `npm test`
  Expected: FAIL with "Cannot find module './gameweek'".

- [ ] **Step 3: Implement the gameweek functions**

  ```ts
  // src/lib/predictions/gameweek.ts
  export interface GameweekFixture {
    round: number
    status: string
  }

  function groupByRound(fixtures: GameweekFixture[]): Map<number, GameweekFixture[]> {
    const roundsByNumber = new Map<number, GameweekFixture[]>()

    for (const fixture of fixtures) {
      const existing = roundsByNumber.get(fixture.round) ?? []
      existing.push(fixture)
      roundsByNumber.set(fixture.round, existing)
    }

    return roundsByNumber
  }

  export function getCurrentRound(fixtures: GameweekFixture[]): number | null {
    const roundsByNumber = groupByRound(fixtures)

    const notStartedRounds = Array.from(roundsByNumber.entries())
      .filter(([, roundFixtures]) => roundFixtures.every((f) => f.status === 'NS'))
      .map(([round]) => round)

    if (notStartedRounds.length === 0) {
      return null
    }

    return Math.min(...notStartedRounds)
  }

  export function getLatestCompletedRound(fixtures: GameweekFixture[]): number | null {
    const roundsByNumber = groupByRound(fixtures)

    const completedRounds = Array.from(roundsByNumber.entries())
      .filter(([, roundFixtures]) => roundFixtures.every((f) => f.status === 'FT'))
      .map(([round]) => round)

    if (completedRounds.length === 0) {
      return null
    }

    return Math.max(...completedRounds)
  }
  ```

- [ ] **Step 4: Run the tests and verify they pass**

  Run: `npm test`
  Expected: PASS, all 6 tests green.

- [ ] **Step 5: Commit**

  ```bash
  git add src/lib/predictions/gameweek.ts src/lib/predictions/gameweek.test.ts
  git commit -m "feat: add current/latest-completed gameweek selection logic with tests"
  ```

---

### Task 6: Auth — login, logout, middleware

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/components/sign-out-button.tsx`
- Create: `src/middleware.ts`
- Delete: `src/app/user/page.tsx`

**Interfaces:**
- Consumes: `createClient()` (browser, from Task 2).
- Produces: route `/login`. Later tasks (7, 9, 10) rely on `src/middleware.ts` protecting `/predictions`, `/leaderboard`, `/admin` and redirecting unauthenticated requests to `/login`.

- [ ] **Step 1: Delete the old "tap your name" page**

  Delete `src/app/user/page.tsx`. It's replaced by real login.

- [ ] **Step 2: Create the login page**

  ```tsx
  // src/app/login/page.tsx
  'use client'

  import { useState } from 'react'
  import { useRouter } from 'next/navigation'
  import { Button } from '@/components/ui/button'
  import { Card } from '@/components/ui/card'
  import { Input } from '@/components/ui/input'
  import { useToast } from '@/components/ui/use-toast'
  import { createClient } from '@/lib/supabase/client'

  export default function LoginPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      setIsSubmitting(true)

      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      setIsSubmitting(false)

      if (error) {
        toast({ title: 'Login failed', description: error.message, variant: 'destructive' })
        return
      }

      router.push('/')
      router.refresh()
    }

    return (
      <main className="min-h-[100dvh] flex items-center justify-center p-4">
        <Card className="w-full max-w-[min(90vw,380px)] border-border">
          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 p-6 w-full">
            <h1 className="text-2xl font-semibold text-foreground">Log In</h1>

            <div className="w-full space-y-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log In'}
            </Button>
          </form>
        </Card>
      </main>
    )
  }
  ```

- [ ] **Step 3: Create the sign-out button**

  ```tsx
  // src/components/sign-out-button.tsx
  'use client'

  import { useRouter } from 'next/navigation'
  import { Button } from '@/components/ui/button'
  import { createClient } from '@/lib/supabase/client'

  export function SignOutButton() {
    const router = useRouter()

    const handleSignOut = async () => {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    }

    return (
      <Button variant="ghost" className="w-full h-11" onClick={handleSignOut}>
        Log Out
      </Button>
    )
  }
  ```

- [ ] **Step 4: Create the auth middleware**

  ```ts
  // src/middleware.ts
  import { createServerClient } from '@supabase/ssr'
  import { NextResponse, type NextRequest } from 'next/server'

  const PROTECTED_PATHS = ['/predictions', '/leaderboard', '/admin']

  export async function middleware(request: NextRequest) {
    let response = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isProtected = PROTECTED_PATHS.some((path) =>
      request.nextUrl.pathname.startsWith(path)
    )

    if (isProtected && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
  }

  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  }
  ```

- [ ] **Step 5: Manual verification**

  Run `npm run dev`. Visit `/predictions` while logged out — expect a redirect to `/login`. Log in with one of the 6 seeded accounts (Task 3, Step 3/4) — expect redirect back to `/` and no further redirect loop.

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/login src/components/sign-out-button.tsx src/middleware.ts
  git rm src/app/user/page.tsx
  git commit -m "feat: replace tap-your-name page with Supabase email/password login"
  ```

---

### Task 7: Fixtures & results sync

**Files:**
- Modify: `src/lib/api/football.ts` (season becomes an env var)
- Create: `src/lib/supabase/fixtures.ts`
- Create: `src/app/api/cron/sync-fixtures/route.ts`
- Create: `vercel.json`

**Interfaces:**
- Consumes: `fetchFixtures()` (existing, from `src/lib/api/football.ts`), `createAdminClient()` (Task 2), `FixtureRow` (Task 2).
- Produces: `upsertFixtures(fixtures: Fixture[]): Promise<void>` (from `src/lib/supabase/fixtures.ts`) — consumed by the cron route in this task.

- [ ] **Step 1: Make the season configurable**

  In `src/lib/api/football.ts`, replace:

  ```ts
  const SEASON = 2024;
  ```

  with:

  ```ts
  const SEASON = Number(process.env.FOOTBALL_API_SEASON ?? '2026');
  ```

- [ ] **Step 2: Write the Supabase upsert helper**

  ```ts
  // src/lib/supabase/fixtures.ts
  import type { Fixture } from '@/lib/api/football'
  import { createAdminClient } from './admin'

  export async function upsertFixtures(fixtures: Fixture[]): Promise<void> {
    const rows = fixtures.map((fixture) => ({
      id: fixture.id,
      round: fixture.round,
      home_team: fixture.homeTeam.name,
      away_team: fixture.awayTeam.name,
      kickoff_time: fixture.startTime,
      status: fixture.status,
      home_score: typeof fixture.homeScore === 'number' ? fixture.homeScore : null,
      away_score: typeof fixture.awayScore === 'number' ? fixture.awayScore : null,
      result_source: fixture.status === 'FT' ? 'api' : null,
      updated_at: new Date().toISOString(),
    }))

    const admin = createAdminClient()
    const { error } = await admin.from('fixtures').upsert(rows, { onConflict: 'id' })

    if (error) {
      throw new Error(`Failed to upsert fixtures: ${error.message}`)
    }
  }
  ```

- [ ] **Step 3: Write the cron route**

  ```ts
  // src/app/api/cron/sync-fixtures/route.ts
  import { NextResponse } from 'next/server'
  import { fetchFixtures } from '@/lib/api/football'
  import { upsertFixtures } from '@/lib/supabase/fixtures'

  export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization')

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      const fixtures = await fetchFixtures()
      await upsertFixtures(fixtures)

      return NextResponse.json({ success: true, count: fixtures.length })
    } catch (error) {
      console.error('Fixture sync failed:', error)
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  }
  ```

- [ ] **Step 4: Configure the Vercel Cron**

  ```json
  // vercel.json
  {
    "crons": [
      {
        "path": "/api/cron/sync-fixtures",
        "schedule": "0 21 * * *"
      }
    ]
  }
  ```

  This runs once daily at 21:00 UTC (~5pm EST, matching the old schedule; not DST-adjusted — fine for a hobby app). Vercel automatically sends the correct `Authorization: Bearer <CRON_SECRET>` header for its own cron invocations as long as `CRON_SECRET` is set in the project's environment variables (done in Task 2, Step 3).

- [ ] **Step 5: Manual verification**

  Deploy, then manually trigger: `curl -H "Authorization: Bearer <CRON_SECRET>" https://<your-app>.vercel.app/api/cron/sync-fixtures`
  Expected: `{"success":true,"count":<N>}` and the `fixtures` table in Supabase populated with ~380 rows.

- [ ] **Step 6: Commit**

  ```bash
  git add src/lib/api/football.ts src/lib/supabase/fixtures.ts src/app/api/cron vercel.json
  git commit -m "feat: sync fixtures/results from api-football.com into Supabase via daily cron"
  ```

---

### Task 8: Admin manual result override

**Files:**
- Create: `src/app/admin/results/page.tsx`
- Create: `src/app/admin/results/results-form.tsx`
- Create: `src/app/admin/results/actions.ts`

**Interfaces:**
- Consumes: `createClient()` (server, Task 2), `FixtureRow`/`Profile` (Task 2), `Profile.is_admin` (Task 3 schema), middleware protection of `/admin` (Task 6).
- Produces: `updateFixtureResult(fixtureId: number, homeScore: number, awayScore: number): Promise<{ success: true } | { success: false; error: string }>` — used only within this admin page.

- [ ] **Step 1: Write the server action**

  ```ts
  // src/app/admin/results/actions.ts
  'use server'

  import { createClient } from '@/lib/supabase/server'

  export async function updateFixtureResult(
    fixtureId: number,
    homeScore: number,
    awayScore: number
  ): Promise<{ success: true } | { success: false; error: string }> {
    const supabase = createClient()

    const { error } = await supabase
      .from('fixtures')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'FT',
        result_source: 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', fixtureId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  }
  ```

  This writes through the signed-in user's own session client, so the `fixtures are updatable only by admins` RLS policy (Task 3) applies — a non-admin calling this action gets rejected at the database level regardless of any UI-level check.

- [ ] **Step 2: Write the results form (client component)**

  ```tsx
  // src/app/admin/results/results-form.tsx
  'use client'

  import { useState } from 'react'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { useToast } from '@/components/ui/use-toast'
  import type { FixtureRow } from '@/lib/supabase/database.types'
  import { updateFixtureResult } from './actions'

  export function ResultsForm({ fixtures, round }: { fixtures: FixtureRow[]; round: number }) {
    const { toast } = useToast()
    const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({})
    const [savingId, setSavingId] = useState<number | null>(null)

    const handleSave = async (fixture: FixtureRow) => {
      const entry = scores[fixture.id]
      const homeScore = Number(entry?.home ?? fixture.home_score ?? 0)
      const awayScore = Number(entry?.away ?? fixture.away_score ?? 0)

      setSavingId(fixture.id)
      const result = await updateFixtureResult(fixture.id, homeScore, awayScore)
      setSavingId(null)

      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' })
        return
      }

      toast({
        title: 'Saved',
        description: `${fixture.home_team} ${homeScore} - ${awayScore} ${fixture.away_team}`,
      })
    }

    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Round {round}</p>
        {fixtures.map((fixture) => (
          <div key={fixture.id} className="flex items-center gap-4">
            <span className="w-36 text-right text-white">{fixture.home_team}</span>
            <Input
              className="w-14 text-center"
              defaultValue={fixture.home_score ?? ''}
              onChange={(e) =>
                setScores((prev) => ({
                  ...prev,
                  [fixture.id]: { ...prev[fixture.id], home: e.target.value },
                }))
              }
            />
            <span>-</span>
            <Input
              className="w-14 text-center"
              defaultValue={fixture.away_score ?? ''}
              onChange={(e) =>
                setScores((prev) => ({
                  ...prev,
                  [fixture.id]: { ...prev[fixture.id], away: e.target.value },
                }))
              }
            />
            <span className="w-36 text-white">{fixture.away_team}</span>
            <Button onClick={() => handleSave(fixture)} disabled={savingId === fixture.id}>
              Save
            </Button>
          </div>
        ))}
      </div>
    )
  }
  ```

- [ ] **Step 3: Write the admin page (server component)**

  ```tsx
  // src/app/admin/results/page.tsx
  import { redirect } from 'next/navigation'
  import { createClient } from '@/lib/supabase/server'
  import type { FixtureRow, Profile } from '@/lib/supabase/database.types'
  import { ResultsForm } from './results-form'

  export default async function AdminResultsPage({
    searchParams,
  }: {
    searchParams: { round?: string }
  }) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const profile = profileData as Profile | null

    if (!profile?.is_admin) {
      redirect('/')
    }

    const round = Number(searchParams.round ?? '1')

    const { data } = await supabase
      .from('fixtures')
      .select('*')
      .eq('round', round)
      .order('kickoff_time', { ascending: true })

    const fixtures = (data ?? []) as FixtureRow[]

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold text-foreground mb-4">
          Admin: Round {round} Results
        </h1>
        <ResultsForm fixtures={fixtures} round={round} />
      </div>
    )
  }
  ```

- [ ] **Step 4: Manual verification**

  Log in as the seeded admin account and visit `/admin/results?round=1`. Expect to see round 1's fixtures with editable score inputs. Save a result and confirm the `fixtures` row updates in Supabase with `result_source = 'admin'`. Log in as a non-admin account and visit `/admin/results` — expect redirect to `/`.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/admin
  git commit -m "feat: add admin manual result override page"
  ```

---

### Task 9: Predictions page rewrite

**Files:**
- Modify: `src/app/predictions/page.tsx` (full rewrite, server component)
- Create: `src/components/predictions/prediction-form.tsx`
- Create: `src/app/predictions/submit-action.ts`
- Delete: `src/app/predictions/actions.ts`
- Delete: `src/app/api/fixtures/gameweek/route.ts`
- Delete: `src/app/api/predictions/submit/route.ts`

**Interfaces:**
- Consumes: `createClient()` (server, Task 2), `getCurrentRound()` (Task 5), `FixtureRow`/`PredictionRow`/`Profile` (Task 2).
- Produces: `submitPredictions(predictions: { fixtureId: number; homeScore: number; awayScore: number }[]): Promise<{ success: true } | { success: false; alreadySubmitted: boolean; error: string }>` — used only by `PredictionForm` in this task.

- [ ] **Step 1: Delete the old Sheets-era prediction routes**

  Delete `src/app/predictions/actions.ts`, `src/app/api/fixtures/gameweek/route.ts`, `src/app/api/predictions/submit/route.ts`.

- [ ] **Step 2: Write the submit server action**

  ```ts
  // src/app/predictions/submit-action.ts
  'use server'

  import { createClient } from '@/lib/supabase/server'

  interface SubmitPredictionInput {
    fixtureId: number
    homeScore: number
    awayScore: number
  }

  type SubmitResult =
    | { success: true }
    | { success: false; alreadySubmitted: boolean; error: string }

  export async function submitPredictions(
    predictions: SubmitPredictionInput[]
  ): Promise<SubmitResult> {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, alreadySubmitted: false, error: 'Not signed in' }
    }

    const rows = predictions.map((p) => ({
      user_id: user.id,
      fixture_id: p.fixtureId,
      predicted_home_score: p.homeScore,
      predicted_away_score: p.awayScore,
    }))

    const { error } = await supabase.from('predictions').insert(rows)

    if (error) {
      const alreadySubmitted = error.code === '23505'
      return {
        success: false,
        alreadySubmitted,
        error: alreadySubmitted
          ? 'You have already submitted predictions for this round.'
          : error.message,
      }
    }

    return { success: true }
  }
  ```

- [ ] **Step 3: Write the prediction form (client component)**

  ```tsx
  // src/components/predictions/prediction-form.tsx
  'use client'

  import { useRouter } from 'next/navigation'
  import { useRef, useState } from 'react'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { useToast } from '@/components/ui/use-toast'
  import { submitPredictions } from '@/app/predictions/submit-action'

  interface FormFixture {
    id: number
    homeTeam: string
    awayTeam: string
  }

  export function PredictionForm({
    fixtures,
    alreadySubmitted,
  }: {
    fixtures: FormFixture[]
    alreadySubmitted: boolean
  }) {
    const router = useRouter()
    const { toast } = useToast()
    const [predictions, setPredictions] = useState<
      Record<number, { home: string; away: string }>
    >({})
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    if (alreadySubmitted) {
      return (
        <p className="text-white text-center">
          You&apos;ve already submitted predictions for this round.
        </p>
      )
    }

    const handleScoreChange = (
      fixtureId: number,
      type: 'home' | 'away',
      value: string,
      currentIndex: number
    ) => {
      if (value === '' || /^[0-9]$/.test(value)) {
        setPredictions((prev) => ({
          ...prev,
          [fixtureId]: { ...prev[fixtureId], [type]: value },
        }))

        if (value !== '') {
          inputRefs.current[currentIndex + 1]?.focus()
        }
      }
    }

    const isFormComplete = () =>
      fixtures.every(
        (fixture) =>
          predictions[fixture.id]?.home !== undefined &&
          predictions[fixture.id]?.home !== '' &&
          predictions[fixture.id]?.away !== undefined &&
          predictions[fixture.id]?.away !== ''
      )

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()

      const result = await submitPredictions(
        fixtures.map((fixture) => ({
          fixtureId: fixture.id,
          homeScore: Number(predictions[fixture.id]?.home),
          awayScore: Number(predictions[fixture.id]?.away),
        }))
      )

      if (!result.success) {
        toast({
          title: result.alreadySubmitted ? 'Already submitted' : 'Error',
          description: result.error,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Predictions Submitted!',
        description: (
          <div className="mt-2 space-y-1">
            {fixtures.map((fixture) => (
              <div key={fixture.id} className="flex justify-between text-sm">
                <span className="flex-1">{fixture.homeTeam}</span>
                <span className="px-2 text-primary font-bold">
                  {predictions[fixture.id]?.home}
                </span>
                <span className="px-1">-</span>
                <span className="px-2 text-primary font-bold">
                  {predictions[fixture.id]?.away}
                </span>
                <span className="flex-1 text-right">{fixture.awayTeam}</span>
              </div>
            ))}
          </div>
        ),
        duration: 4000,
      })

      await new Promise((resolve) => setTimeout(resolve, 2000))
      router.push('/')
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {fixtures.map((fixture, index) => (
          <div key={fixture.id} className="flex items-center">
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
        ))}
        {fixtures.length > 0 && (
          <Button type="submit" className="w-full mt-8" disabled={!isFormComplete()}>
            Submit Predictions
          </Button>
        )}
      </form>
    )
  }
  ```

- [ ] **Step 4: Rewrite the predictions page as a server component**

  ```tsx
  // src/app/predictions/page.tsx
  import { redirect } from 'next/navigation'
  import { createClient } from '@/lib/supabase/server'
  import { getCurrentRound } from '@/lib/predictions/gameweek'
  import type { FixtureRow, Profile } from '@/lib/supabase/database.types'
  import { PredictionForm } from '@/components/predictions/prediction-form'

  export default async function PredictionsPage() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const { data: allFixtures } = await supabase
      .from('fixtures')
      .select('*')
      .order('round', { ascending: true })

    const fixtures = (allFixtures ?? []) as FixtureRow[]
    const currentRound = getCurrentRound(fixtures)

    if (currentRound === null) {
      return (
        <div className="container mx-auto p-4 text-center text-white">
          No upcoming round is open for predictions right now.
        </div>
      )
    }

    const roundFixtures = fixtures.filter((f) => f.round === currentRound)

    const { data: existing } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', user.id)
      .in('fixture_id', roundFixtures.map((f) => f.id))

    const alreadySubmitted = (existing ?? []).length > 0

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const profile = profileData as Profile | null

    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <span className="text-white">{profile?.display_name ?? user.email}</span>
        </div>
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold">
            Enter Your <span className="text-primary">Predictions</span>
          </h1>
          <p className="text-muted-foreground mt-2">Predict scores for the upcoming matches</p>
        </div>
        <PredictionForm
          fixtures={roundFixtures.map((f) => ({
            id: f.id,
            homeTeam: f.home_team,
            awayTeam: f.away_team,
          }))}
          alreadySubmitted={alreadySubmitted}
        />
      </div>
    )
  }
  ```

- [ ] **Step 5: Manual verification**

  Log in, visit `/predictions`. Expect the current round's fixtures to render with auto-advancing score inputs. Submit predictions, expect the toast summary and redirect to `/`. Revisit `/predictions` — expect the "already submitted" message instead of the form.

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/predictions src/components/predictions
  git rm src/app/predictions/actions.ts src/app/api/fixtures/gameweek/route.ts src/app/api/predictions/submit/route.ts
  git commit -m "feat: rewrite predictions page on Supabase (server component + server action)"
  ```

---

### Task 10: Leaderboard page rewrite

**Files:**
- Modify: `src/app/leaderboard/page.tsx` (full rewrite, server component)
- Delete: `src/app/api/leaderboard/route.ts`

**Interfaces:**
- Consumes: `createClient()` (server, Task 2), `calculatePoints()` (Task 4), `getLatestCompletedRound()` (Task 5), `LeaderboardTable`/`LeaderboardEntry` (existing, unchanged).

- [ ] **Step 1: Delete the old Sheets-era leaderboard API route**

  Delete `src/app/api/leaderboard/route.ts`.

- [ ] **Step 2: Rewrite the leaderboard page**

  ```tsx
  // src/app/leaderboard/page.tsx
  import { createClient } from '@/lib/supabase/server'
  import { getLatestCompletedRound } from '@/lib/predictions/gameweek'
  import { calculatePoints } from '@/lib/predictions/scoring'
  import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'
  import { LeaderboardTable, type LeaderboardEntry } from '@/components/leaderboard/leaderboard-table'

  export default async function LeaderboardPage() {
    const supabase = createClient()

    const [{ data: profilesData }, { data: fixturesData }, { data: predictionsData }] =
      await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('fixtures').select('*'),
        supabase.from('predictions').select('*'),
      ])

    const profiles = (profilesData ?? []) as Profile[]
    const fixtures = (fixturesData ?? []) as FixtureRow[]
    const predictions = (predictionsData ?? []) as PredictionRow[]

    const fixturesById = new Map(fixtures.map((f) => [f.id, f]))
    const latestRound = getLatestCompletedRound(fixtures)

    const entries: LeaderboardEntry[] = profiles
      .map((profile) => {
        const userPredictions = predictions.filter((p) => p.user_id === profile.id)

        let total = 0
        let gameweekTotal = 0

        for (const prediction of userPredictions) {
          const fixture = fixturesById.get(prediction.fixture_id)
          if (!fixture) continue

          const points = calculatePoints(
            {
              predictedHomeScore: prediction.predicted_home_score,
              predictedAwayScore: prediction.predicted_away_score,
            },
            { homeScore: fixture.home_score, awayScore: fixture.away_score }
          )

          total += points
          if (latestRound !== null && fixture.round === latestRound) {
            gameweekTotal += points
          }
        }

        return { player: profile.display_name, total, gameweekTotal }
      })
      .sort((a, b) => b.total - a.total)
      .map((entry, index) => ({
        rank: String(index + 1),
        player: entry.player,
        total: entry.total,
        gameweekTotal: entry.gameweekTotal,
      }))

    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold text-foreground mb-4">Leaderboard</h1>
        <LeaderboardTable data={entries} />
      </div>
    )
  }
  ```

- [ ] **Step 3: Manual verification**

  With at least one fixture marked `FT` with a result (via Task 8's admin page) and at least one prediction submitted against it, visit `/leaderboard`. Expect the players ranked by total points, computed correctly per the 8/5/0 rule.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/leaderboard
  git rm src/app/api/leaderboard/route.ts
  git commit -m "feat: rewrite leaderboard page on Supabase with computed scoring"
  ```

---

### Task 11: Home page update + final cleanup

**Files:**
- Modify: `src/app/page.tsx`
- Delete: `src/lib/api/sheets.ts`, `src/lib/google-sheets.ts`
- Delete: `src/lib/types/fixtures.ts`, `src/lib/types/predictions.ts`
- Delete: `src/app/api/update-fixtures/route.ts`, `src/app/api/admin/update-fixtures/route.ts`
- Delete: `src/app/actions/predictions.ts`, `src/app/actions/submit-predictions.ts`
- Delete: `scripts/update-fixtures.ts`, `scripts/debug-key.ts`, `scripts/test-api-key.ts`, `scripts/test-credentials.ts`, `scripts/test-fixtures-update.ts`, `scripts/test-fixtures.ts`, `scripts/test-football-api.ts`, `scripts/test-service-account.ts`
- Modify: `package.json` (remove `googleapis`, `google-auth-library`, `cross-env`, `test:credentials` script)
- Modify: `.env.local` (remove now-unused `GOOGLE_*` variables)

**Interfaces:**
- Consumes: `createClient()` (server, Task 2), `SignOutButton` (Task 6).

- [ ] **Step 1: Rewrite the home page**

  ```tsx
  // src/app/page.tsx
  import Link from 'next/link'
  import { Trophy } from 'lucide-react'
  import { createClient } from '@/lib/supabase/server'
  import { Card } from '@/components/ui/card'
  import { Button } from '@/components/ui/button'
  import { SignOutButton } from '@/components/sign-out-button'

  export default async function HomePage() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return (
      <main className="min-h-[100dvh] flex items-center justify-center p-4">
        <Card className="w-full max-w-[min(90vw,380px)] border-border">
          <div className="flex flex-col items-center gap-6 p-6">
            <div className="bg-primary rounded-full p-4">
              <Trophy className="h-8 w-8 text-primary-foreground" />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-2xl font-semibold text-foreground">
                Welcome to <span className="text-primary">Predictions</span>
              </h1>
              <p className="text-primary text-sm md:text-base">
                Make your predictions for upcoming matches
              </p>
            </div>

            <div className="w-full space-y-3">
              {user ? (
                <>
                  <Button asChild className="w-full h-11" variant="secondary">
                    <Link href="/predictions">Make Predictions</Link>
                  </Button>
                  <Button asChild className="w-full h-11" variant="secondary">
                    <Link href="/leaderboard">View Leaderboard</Link>
                  </Button>
                  <SignOutButton />
                </>
              ) : (
                <Button asChild className="w-full h-11" variant="secondary">
                  <Link href="/login">Log In</Link>
                </Button>
              )}
            </div>
          </div>
        </Card>
      </main>
    )
  }
  ```

- [ ] **Step 2: Delete the Google Sheets-era files**

  ```bash
  git rm src/lib/api/sheets.ts src/lib/google-sheets.ts
  git rm src/lib/types/fixtures.ts src/lib/types/predictions.ts
  git rm src/app/api/update-fixtures/route.ts src/app/api/admin/update-fixtures/route.ts
  git rm src/app/actions/predictions.ts src/app/actions/submit-predictions.ts
  git rm scripts/update-fixtures.ts scripts/debug-key.ts scripts/test-api-key.ts scripts/test-credentials.ts scripts/test-fixtures-update.ts scripts/test-fixtures.ts scripts/test-football-api.ts scripts/test-service-account.ts
  ```

- [ ] **Step 3: Remove unused dependencies and script**

  In `package.json`:
  - Remove `"googleapis"` and `"google-auth-library"` from `dependencies`.
  - Remove `"cross-env"` from `devDependencies`.
  - Remove the `"test:credentials"` line from `"scripts"`.

  Run: `npm install` (to update `package-lock.json` after removing the deps).

- [ ] **Step 4: Remove unused Google env vars**

  In `.env.local`, remove every `GOOGLE_*` line. Also remove them from `.env.local.example` if present, and from Vercel project settings.

- [ ] **Step 5: Verify the app builds and tests pass**

  Run: `npm run build`
  Expected: builds successfully with no references to the deleted files remaining.

  Run: `npm test`
  Expected: PASS (12 tests: 6 scoring + 6 gameweek).

- [ ] **Step 6: Manual smoke test of the full flow**

  Log out, visit `/`, click "Log In", sign in, submit predictions for the current round, have the admin (Task 8 page) set a result for at least one fixture in a past round, visit `/leaderboard` and confirm points are computed and displayed correctly.

- [ ] **Step 7: Commit**

  ```bash
  git add src/app/page.tsx package.json package-lock.json .env.local.example
  git commit -m "feat: update home page for Supabase auth; remove Google Sheets code path"
  ```

---

## Self-Review Notes

- **Spec coverage:** every section of the design spec (security fix, infra, data model, auth/RLS, fixtures/results sync + admin override, gameweek logic, scoring engine, page migrations, error handling, testing) maps to a task above.
- **Type consistency:** `FixtureRow`, `PredictionRow`, `Profile` (Task 2) are used with identical field names across Tasks 7–10. `calculatePoints`/`ScoringPrediction`/`ScoringFixture` (Task 4) and `getCurrentRound`/`getLatestCompletedRound`/`GameweekFixture` (Task 5) signatures match their call sites in Tasks 9–10 exactly.
- **No placeholders:** all steps contain full, runnable code or a concrete manual instruction (dashboard clicks, SQL to run) — no TBDs.
