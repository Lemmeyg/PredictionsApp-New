-- Adds two inspectable columns to predictions for verifying scoring is
-- computed correctly: the actual final score of the fixture ("H-A" format)
-- and the points that prediction earned. Kept in sync automatically via
-- triggers, so they never go stale even if a fixture's result is corrected
-- after the fact (e.g. an admin override, or the API updating a score).
--
-- These columns are a verification aid, not the source of truth: the app's
-- leaderboard and scoring UI continue to compute points live in TypeScript
-- (src/lib/predictions/scoring.ts). If these stored values and the live
-- computation ever disagree, that's a signal something is wrong.
--
-- Safe to re-run: every statement below is idempotent.

alter table public.predictions
  add column if not exists actual_score text,
  add column if not exists points_awarded integer;

-- Recomputes actual_score/points_awarded for every prediction against one
-- fixture, based on that fixture's current result.
create or replace function public.sync_prediction_score_and_points(target_fixture_id bigint)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.predictions p
  set
    actual_score = case
      when f.status in ('FT', 'AET', 'PEN', 'AWD', 'CANC')
        and f.home_score is not null
        and f.away_score is not null
      then f.home_score::text || '-' || f.away_score::text
      else null
    end,
    points_awarded = case
      when f.status not in ('FT', 'AET', 'PEN', 'AWD', 'CANC')
        or f.home_score is null
        or f.away_score is null
      then null
      when p.predicted_home_score = f.home_score
        and p.predicted_away_score = f.away_score
      then 8
      when sign(p.predicted_home_score - p.predicted_away_score)
        = sign(f.home_score - f.away_score)
      then 5
      else 0
    end
  from public.fixtures f
  where f.id = target_fixture_id
    and p.fixture_id = target_fixture_id;
end;
$$;

-- Fires whenever a fixture's result changes (API sync or admin override).
create or replace function public.handle_fixture_result_change()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.sync_prediction_score_and_points(new.id);
  return new;
end;
$$;

-- Postgres doesn't allow a WHEN clause to reference OLD on an INSERT
-- trigger, so insert and update are two separate triggers.
drop trigger if exists on_fixture_inserted on public.fixtures;
create trigger on_fixture_inserted
  after insert on public.fixtures
  for each row
  execute procedure public.handle_fixture_result_change();

drop trigger if exists on_fixture_result_updated on public.fixtures;
create trigger on_fixture_result_updated
  after update of status, home_score, away_score on public.fixtures
  for each row
  when (
    old.status is distinct from new.status
    or old.home_score is distinct from new.home_score
    or old.away_score is distinct from new.away_score
  )
  execute procedure public.handle_fixture_result_change();

-- Fires when a prediction is submitted, in case its fixture's result is
-- already known (defensive; the normal flow only allows predicting on
-- not-yet-started fixtures).
create or replace function public.handle_prediction_inserted()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  perform public.sync_prediction_score_and_points(new.fixture_id);
  return new;
end;
$$;

drop trigger if exists on_prediction_inserted on public.predictions;
create trigger on_prediction_inserted
  after insert on public.predictions
  for each row execute procedure public.handle_prediction_inserted();

-- Backfill: compute these columns for any predictions/fixtures that
-- already existed before this migration ran.
select public.sync_prediction_score_and_points(id) from public.fixtures;
