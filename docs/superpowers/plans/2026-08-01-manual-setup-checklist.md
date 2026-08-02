# Manual Setup Checklist — Supabase Auth + Database Foundation

Do these while implementation work happens in parallel. Sections are ordered —
later sections need values from earlier ones. Tick each box as you go.

## 1. Revoke the leaked Google credentials

Not needed going forward (Google Sheets is being removed from the app entirely),
so revoke rather than replace.

- [ ] Go to https://console.cloud.google.com/ → select the `predictionsapp-new` project.
- [ ] IAM & Admin → Service Accounts → click `predictionsapp@predictionsapp-new.iam.gserviceaccount.com`.
- [ ] Go to the **Keys** tab → delete every existing key listed there. Do **not** create a new one.
- [ ] APIs & Services → Credentials → find the Sheets API key (starts `AIzaSyATKZ...`) → delete/revoke it.

## 2. Rotate the football API key

Still needed — the app keeps pulling fixtures/results from api-football.com.

- [ ] Log into your api-football.com dashboard.
- [ ] Regenerate/rotate the API key.
- [ ] Copy the new key value somewhere safe — you'll paste it into `.env.local` in Section 5.

## 3. Create the Supabase project

- [ ] Go to https://supabase.com/dashboard → **New project**.
- [ ] Name it something like `predictions-app` (dedicated project, free tier — isolated from your other apps).
- [ ] Choose a region close to you, set a database password (save it somewhere safe — you likely won't need it day-to-day since the app uses the API keys, not a direct DB password connection).
- [ ] Once it's provisioned, go to **Project Settings → API**. Copy and save these three values:
  - **Project URL**
  - **anon / public** key
  - **service_role** key (keep this one especially private — it bypasses all security rules)

## 4. Generate a cron secret

This is just a random string used to stop strangers from triggering your fixture-sync endpoint.

- [ ] Generate one:
  - Mac/Linux terminal: `openssl rand -hex 32`
  - Or use any password generator to produce a 40+ character random string.
- [ ] Save the value — you'll use it twice (local `.env.local` and Vercel).

## 5. Set local environment variables

- [ ] Open `.env.local` in the project root (create it if it doesn't exist — it's gitignored, safe for real secrets).
- [ ] Add/update these lines with the real values from Sections 2–4:

  ```
  FOOTBALL_API_KEY=<the rotated key from Section 2>
  FOOTBALL_API_SEASON=2026
  NEXT_PUBLIC_SUPABASE_URL=<Project URL from Section 3>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Section 3>
  SUPABASE_SERVICE_ROLE_KEY=<service_role key from Section 3>
  CRON_SECRET=<random string from Section 4>
  ```

- [ ] Leave any old `GOOGLE_*` lines in place for now — those get deleted later once the code no longer references them.

## 6. Set the same variables in Vercel

- [ ] Go to your Vercel project → **Settings → Environment Variables**.
- [ ] Add each of the 6 variables from Section 5's code block (same names, same values) for **Production** and **Preview**.

## 7. Apply the database schema

- [ ] In the Supabase dashboard → **SQL Editor** → **New query**.
- [ ] Paste this and run it:

  ```sql
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

- [ ] Confirm in **Table Editor** that `profiles`, `fixtures`, and `predictions` all appear.

## 8. Create the 6 player accounts

- [ ] Supabase dashboard → **Authentication → Users → Add user**.
- [ ] Create one user per player — pick real or placeholder emails and a password each:
  - [ ] David
  - [ ] Gordon
  - [ ] Huw
  - [ ] James
  - [ ] Tom
  - [ ] Ty
- [ ] Each one you create automatically gets a matching row in `profiles` (via the trigger from Section 7), with `display_name` defaulted from the email.

## 9. Set display names, initials, and the admin flag

- [ ] SQL Editor → run:

  ```sql
  select id, email from auth.users;
  ```

- [ ] Copy each user's `id`. Then run one `update` per player (adjust names/initials, set `is_admin = true` for yourself only — you can flip this for others later directly in this same editor if needed):

  ```sql
  update public.profiles set display_name = 'Gordon', initials = 'GL', is_admin = true where id = '<gordon-id>';
  update public.profiles set display_name = 'David',  initials = 'DA', is_admin = false where id = '<david-id>';
  update public.profiles set display_name = 'Huw',    initials = 'HU', is_admin = false where id = '<huw-id>';
  update public.profiles set display_name = 'James',  initials = 'JA', is_admin = false where id = '<james-id>';
  update public.profiles set display_name = 'Tom',    initials = 'TO', is_admin = false where id = '<tom-id>';
  update public.profiles set display_name = 'Ty',     initials = 'TY', is_admin = false where id = '<ty-id>';
  ```

## Once all of this is done

Let me know — I'll wire the app up against these values and we'll do a full login → predict → admin result → leaderboard smoke test together.
