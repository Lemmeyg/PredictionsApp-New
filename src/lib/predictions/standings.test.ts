import { describe, expect, it } from 'vitest'
import { computeStandings } from './standings'
import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'

function profile(overrides: Partial<Profile>): Profile {
  return {
    id: 'p1',
    display_name: 'Player',
    initials: 'PL',
    is_admin: false,
    created_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

function fixture(overrides: Partial<FixtureRow>): FixtureRow {
  return {
    id: 1,
    round: 1,
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    kickoff_time: '2026-08-01T00:00:00Z',
    status: 'FT',
    home_score: 2,
    away_score: 0,
    result_source: 'api',
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

function prediction(overrides: Partial<PredictionRow>): PredictionRow {
  return {
    id: 'pred1',
    user_id: 'p1',
    fixture_id: 1,
    predicted_home_score: 2,
    predicted_away_score: 0,
    submitted_at: '2026-08-01T00:00:00Z',
    actual_score: null,
    points_awarded: null,
    ...overrides,
  }
}

describe('computeStandings', () => {
  it('sorts players by total points descending', () => {
    const profiles = [profile({ id: 'p1', display_name: 'Alice' }), profile({ id: 'p2', display_name: 'Bob' })]
    const fixtures = [fixture({ id: 1, home_score: 2, away_score: 0 })]
    const predictions = [
      prediction({ id: 'pr1', user_id: 'p1', fixture_id: 1, predicted_home_score: 2, predicted_away_score: 0 }), // exact -> 8
      prediction({ id: 'pr2', user_id: 'p2', fixture_id: 1, predicted_home_score: 1, predicted_away_score: 0 }), // correct result -> 5
    ]

    const standings = computeStandings(profiles, fixtures, predictions, 1)

    expect(standings.map((s) => s.profileId)).toEqual(['p1', 'p2'])
    expect(standings[0].total).toBe(8)
    expect(standings[1].total).toBe(5)
  })

  it('only counts a gameweekTotal for the given round', () => {
    const profiles = [profile({ id: 'p1' })]
    const fixtures = [
      fixture({ id: 1, round: 1, home_score: 2, away_score: 0 }),
      fixture({ id: 2, round: 2, home_score: 1, away_score: 1 }),
    ]
    const predictions = [
      prediction({ id: 'pr1', user_id: 'p1', fixture_id: 1, predicted_home_score: 2, predicted_away_score: 0 }), // round 1, exact -> 8
      prediction({ id: 'pr2', user_id: 'p1', fixture_id: 2, predicted_home_score: 1, predicted_away_score: 1 }), // round 2, exact -> 8
    ]

    const standings = computeStandings(profiles, fixtures, predictions, 2)

    expect(standings[0].total).toBe(16)
    expect(standings[0].gameweekTotal).toBe(8)
  })

  it('gives a running gameweekTotal for a partially finished round', () => {
    const profiles = [profile({ id: 'p1' })]
    const fixtures = [
      fixture({ id: 1, round: 3, status: 'FT', home_score: 2, away_score: 0 }),
      fixture({ id: 2, round: 3, status: '1H', home_score: 0, away_score: 0 }),
    ]
    const predictions = [
      prediction({ id: 'pr1', user_id: 'p1', fixture_id: 1, predicted_home_score: 2, predicted_away_score: 0 }), // finished, exact -> 8
      prediction({ id: 'pr2', user_id: 'p1', fixture_id: 2, predicted_home_score: 0, predicted_away_score: 0 }), // still live -> no points yet
    ]

    const standings = computeStandings(profiles, fixtures, predictions, 3)

    expect(standings[0].total).toBe(8)
    expect(standings[0].gameweekTotal).toBe(8)
  })

  it('does not award points for a live (in-progress) fixture', () => {
    const profiles = [profile({ id: 'p1' })]
    const fixtures = [fixture({ id: 1, status: 'IN_PLAY', home_score: 1, away_score: 0 })]
    const predictions = [
      prediction({ id: 'pr1', user_id: 'p1', fixture_id: 1, predicted_home_score: 1, predicted_away_score: 0 }),
    ]

    const standings = computeStandings(profiles, fixtures, predictions, null)

    expect(standings[0].total).toBe(0)
  })

  it('handles a player with no predictions', () => {
    const profiles = [profile({ id: 'p1' })]
    const standings = computeStandings(profiles, [], [], null)
    expect(standings).toEqual([{ profileId: 'p1', displayName: 'Player', initials: 'PL', total: 0, gameweekTotal: 0 }])
  })
})
