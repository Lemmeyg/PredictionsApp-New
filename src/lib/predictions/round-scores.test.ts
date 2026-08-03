import { describe, expect, it } from 'vitest'
import { computeRoundScores, getTopGameweekScores, getWeeksWon } from './round-scores'
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

describe('computeRoundScores', () => {
  it('sums a player\'s points within each round', () => {
    const profiles = [profile({ id: 'p1' })]
    const fixtures = [
      fixture({ id: 1, round: 1, home_score: 2, away_score: 0 }),
      fixture({ id: 2, round: 1, home_team: 'Fulham', away_team: 'Leeds', home_score: 1, away_score: 1 }),
    ]
    const predictions = [
      prediction({ id: 'pr1', user_id: 'p1', fixture_id: 1, predicted_home_score: 2, predicted_away_score: 0 }), // exact -> 8
      prediction({ id: 'pr2', user_id: 'p1', fixture_id: 2, predicted_home_score: 1, predicted_away_score: 1 }), // exact -> 8
    ]

    const scores = computeRoundScores(profiles, fixtures, predictions, [1])
    expect(scores).toEqual([
      { round: 1, profileId: 'p1', displayName: 'Player', initials: 'PL', points: 16 },
    ])
  })

  it('produces a zero-point row for a round the player has no finished predictions in', () => {
    const profiles = [profile({ id: 'p1' })]
    const scores = computeRoundScores(profiles, [], [], [1, 2])
    expect(scores).toEqual([
      { round: 1, profileId: 'p1', displayName: 'Player', initials: 'PL', points: 0 },
      { round: 2, profileId: 'p1', displayName: 'Player', initials: 'PL', points: 0 },
    ])
  })

  it('ignores rounds not in the requested roundNumbers list', () => {
    const profiles = [profile({ id: 'p1' })]
    const fixtures = [fixture({ id: 1, round: 5, home_score: 2, away_score: 0 })]
    const predictions = [
      prediction({ id: 'pr1', user_id: 'p1', fixture_id: 1, predicted_home_score: 2, predicted_away_score: 0 }),
    ]
    const scores = computeRoundScores(profiles, fixtures, predictions, [1])
    expect(scores).toEqual([
      { round: 1, profileId: 'p1', displayName: 'Player', initials: 'PL', points: 0 },
    ])
  })
})

describe('getTopGameweekScores', () => {
  it('returns the highest-scoring rows first, capped at the limit', () => {
    const scores = [
      { round: 1, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 10 },
      { round: 2, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 25 },
      { round: 1, profileId: 'p2', displayName: 'Bob', initials: 'BO', points: 5 },
    ]
    expect(getTopGameweekScores(scores, 2)).toEqual([
      { round: 2, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 25 },
      { round: 1, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 10 },
    ])
  })
})

describe('getWeeksWon', () => {
  it('credits the single highest scorer in a round', () => {
    const scores = [
      { round: 1, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 13 },
      { round: 1, profileId: 'p2', displayName: 'Bob', initials: 'BO', points: 8 },
    ]
    expect(getWeeksWon(scores)).toEqual([
      { profileId: 'p1', displayName: 'Alice', initials: 'AL', weeksWon: 1 },
    ])
  })

  it('credits every player tied for the highest score in a round', () => {
    const scores = [
      { round: 1, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 8 },
      { round: 1, profileId: 'p2', displayName: 'Bob', initials: 'BO', points: 8 },
      { round: 1, profileId: 'p3', displayName: 'Cara', initials: 'CA', points: 3 },
    ]
    const result = getWeeksWon(scores)
    expect(result).toHaveLength(2)
    expect(result.map((r) => r.profileId).sort()).toEqual(['p1', 'p2'])
  })

  it('does not credit anyone for a round where the max score is zero', () => {
    const scores = [
      { round: 1, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 0 },
      { round: 1, profileId: 'p2', displayName: 'Bob', initials: 'BO', points: 0 },
    ]
    expect(getWeeksWon(scores)).toEqual([])
  })

  it('sums wins across multiple rounds and sorts by most weeks won', () => {
    const scores = [
      { round: 1, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 8 },
      { round: 1, profileId: 'p2', displayName: 'Bob', initials: 'BO', points: 3 },
      { round: 2, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 5 },
      { round: 2, profileId: 'p2', displayName: 'Bob', initials: 'BO', points: 10 },
      { round: 3, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 8 },
      { round: 3, profileId: 'p2', displayName: 'Bob', initials: 'BO', points: 2 },
    ]
    expect(getWeeksWon(scores)).toEqual([
      { profileId: 'p1', displayName: 'Alice', initials: 'AL', weeksWon: 2 },
      { profileId: 'p2', displayName: 'Bob', initials: 'BO', weeksWon: 1 },
    ])
  })
})
