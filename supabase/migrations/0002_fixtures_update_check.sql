-- supabase/migrations/0002_fixtures_update_check.sql
-- Add a WITH CHECK clause matching the existing USING clause on the fixtures
-- update policy, so a row cannot be updated INTO a state that would fail the
-- same admin check (defense in depth).

drop policy "fixtures are updatable only by admins" on public.fixtures;

create policy "fixtures are updatable only by admins"
  on public.fixtures for update
  to authenticated
  using (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ))
  with check (exists (
    select 1 from public.profiles where id = auth.uid() and is_admin = true
  ));
