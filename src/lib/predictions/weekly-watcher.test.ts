import { describe, expect, it } from 'vitest'
import { getSubmittedRounds } from './weekly-watcher'
import type { FixtureRow, PredictionRow } from '@/lib/supabase/database.types'

function fixture(overrides: Partial<FixtureRow>): FixtureRow {
  return {
    id: 1,
    round: 1,
    home_team: 'Home',
    away_team: 'Away',
    kickoff_time: '2026-08-01T00:00:00Z',
    status: 'NS',
    home_score: null,
    away_score: null,
    result_source: null,
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

function prediction(overrides: Partial<PredictionRow>): PredictionRow {
  return {
    id: 'pred1',
    user_id: 'p1',
    fixture_id: 1,
    predicted_home_score: 1,
    predicted_away_score: 0,
    submitted_at: '2026-08-01T00:00:00Z',
    actual_score: null,
    points_awarded: null,
    ...overrides,
  }
}

describe('getSubmittedRounds', () => {
  it('returns the round for a fixture the user predicted on', () => {
    const fixtures = [fixture({ id: 1, round: 3 })]
    const predictions = [prediction({ user_id: 'p1', fixture_id: 1 })]
    expect(getSubmittedRounds(fixtures, predictions, 'p1')).toEqual([3])
  })

  it('excludes rounds the user has not submitted predictions for', () => {
    const fixtures = [fixture({ id: 1, round: 1 }), fixture({ id: 2, round: 2 })]
    const predictions = [prediction({ user_id: 'p1', fixture_id: 1 })]
    expect(getSubmittedRounds(fixtures, predictions, 'p1')).toEqual([1])
  })

  it('excludes predictions belonging to other users', () => {
    const fixtures = [fixture({ id: 1, round: 1 })]
    const predictions = [prediction({ user_id: 'p2', fixture_id: 1 })]
    expect(getSubmittedRounds(fixtures, predictions, 'p1')).toEqual([])
  })

  it('deduplicates a round with multiple predicted fixtures', () => {
    const fixtures = [fixture({ id: 1, round: 1 }), fixture({ id: 2, round: 1 })]
    const predictions = [
      prediction({ user_id: 'p1', fixture_id: 1 }),
      prediction({ user_id: 'p1', fixture_id: 2 }),
    ]
    expect(getSubmittedRounds(fixtures, predictions, 'p1')).toEqual([1])
  })

  it('sorts rounds in descending order', () => {
    const fixtures = [fixture({ id: 1, round: 1 }), fixture({ id: 2, round: 3 }), fixture({ id: 3, round: 2 })]
    const predictions = [
      prediction({ id: 'a', user_id: 'p1', fixture_id: 1 }),
      prediction({ id: 'b', user_id: 'p1', fixture_id: 2 }),
      prediction({ id: 'c', user_id: 'p1', fixture_id: 3 }),
    ]
    expect(getSubmittedRounds(fixtures, predictions, 'p1')).toEqual([3, 2, 1])
  })

  it('returns an empty array when the user has no predictions', () => {
    expect(getSubmittedRounds([], [], 'p1')).toEqual([])
  })
})
