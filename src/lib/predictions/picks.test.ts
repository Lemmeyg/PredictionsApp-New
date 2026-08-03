import { describe, expect, it } from 'vitest'
import { getOtherPlayersPicks } from './picks'
import type { PredictionRow, Profile } from '@/lib/supabase/database.types'

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

describe('getOtherPlayersPicks', () => {
  const profiles = [
    profile({ id: 'p1', initials: 'AL' }),
    profile({ id: 'p2', initials: 'BO' }),
    profile({ id: 'p3', initials: 'CH' }),
  ]

  it('excludes the viewer\'s own pick', () => {
    const predictions = [
      prediction({ user_id: 'p1', fixture_id: 1, predicted_home_score: 1, predicted_away_score: 0 }),
      prediction({ user_id: 'p2', fixture_id: 1, predicted_home_score: 1, predicted_away_score: 0 }),
    ]
    const picks = getOtherPlayersPicks(1, 'p1', predictions, profiles)
    expect(picks.map((p) => p.profileId)).toEqual(['p2'])
  })

  it('places a predicted home win in the home column', () => {
    const predictions = [prediction({ user_id: 'p2', fixture_id: 1, predicted_home_score: 2, predicted_away_score: 0 })]
    const picks = getOtherPlayersPicks(1, 'p1', predictions, profiles)
    expect(picks[0].column).toBe('home')
  })

  it('places a predicted away win in the away column', () => {
    const predictions = [prediction({ user_id: 'p2', fixture_id: 1, predicted_home_score: 0, predicted_away_score: 2 })]
    const picks = getOtherPlayersPicks(1, 'p1', predictions, profiles)
    expect(picks[0].column).toBe('away')
  })

  it('places a predicted draw in the draw column', () => {
    const predictions = [prediction({ user_id: 'p2', fixture_id: 1, predicted_home_score: 1, predicted_away_score: 1 })]
    const picks = getOtherPlayersPicks(1, 'p1', predictions, profiles)
    expect(picks[0].column).toBe('draw')
  })

  it('only includes predictions for the requested fixture', () => {
    const predictions = [
      prediction({ user_id: 'p2', fixture_id: 1 }),
      prediction({ user_id: 'p3', fixture_id: 2 }),
    ]
    const picks = getOtherPlayersPicks(1, 'p1', predictions, profiles)
    expect(picks.map((p) => p.profileId)).toEqual(['p2'])
  })

  it('falls back to the first two letters of the display name when initials are missing', () => {
    const profilesNoInitials = [profile({ id: 'p2', initials: null, display_name: 'Bob' })]
    const predictions = [prediction({ user_id: 'p2', fixture_id: 1 })]
    const picks = getOtherPlayersPicks(1, 'p1', predictions, profilesNoInitials)
    expect(picks[0].initials).toBe('BO')
  })
})
