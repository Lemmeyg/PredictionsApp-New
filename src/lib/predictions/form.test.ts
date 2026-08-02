import { describe, expect, it } from 'vitest'
import { getRecentForm } from './form'

function fixture(overrides: Partial<Parameters<typeof getRecentForm>[1][number]>) {
  return {
    id: 1,
    round: 1,
    home_team: 'Arsenal',
    away_team: 'Chelsea',
    kickoff_time: '2026-08-01T00:00:00Z',
    status: 'FT',
    home_score: 0,
    away_score: 0,
    result_source: 'api' as const,
    updated_at: '2026-08-01T00:00:00Z',
    ...overrides,
  }
}

describe('getRecentForm', () => {
  it('marks a win/loss correctly for the home team', () => {
    const fixtures = [
      fixture({ id: 1, home_team: 'Arsenal', away_team: 'Chelsea', home_score: 2, away_score: 0 }),
    ]
    expect(getRecentForm('Arsenal', fixtures)).toEqual([{ result: 'W', venue: 'H' }])
    expect(getRecentForm('Chelsea', fixtures)).toEqual([{ result: 'L', venue: 'A' }])
  })

  it('marks a draw for both teams', () => {
    const fixtures = [
      fixture({ id: 1, home_team: 'Arsenal', away_team: 'Chelsea', home_score: 1, away_score: 1 }),
    ]
    expect(getRecentForm('Arsenal', fixtures)).toEqual([{ result: 'D', venue: 'H' }])
    expect(getRecentForm('Chelsea', fixtures)).toEqual([{ result: 'D', venue: 'A' }])
  })

  it('orders results oldest-first so the most recent is last', () => {
    const fixtures = [
      fixture({ id: 1, home_team: 'Arsenal', away_team: 'Chelsea', kickoff_time: '2026-08-01T00:00:00Z', home_score: 1, away_score: 0 }),
      fixture({ id: 2, home_team: 'Arsenal', away_team: 'Fulham', kickoff_time: '2026-08-15T00:00:00Z', home_score: 0, away_score: 2 }),
      fixture({ id: 3, home_team: 'Leeds', away_team: 'Arsenal', kickoff_time: '2026-08-08T00:00:00Z', away_score: 1, home_score: 1 }),
    ]
    // Chronological order: Aug 1 (W), Aug 8 (D, away), Aug 15 (L) -- most recent last.
    expect(getRecentForm('Arsenal', fixtures)).toEqual([
      { result: 'W', venue: 'H' },
      { result: 'D', venue: 'A' },
      { result: 'L', venue: 'H' },
    ])
  })

  it('caps at the 5 most recent finished fixtures', () => {
    const fixtures = Array.from({ length: 8 }, (_, i) =>
      fixture({
        id: i + 1,
        home_team: 'Arsenal',
        away_team: `Team ${i}`,
        kickoff_time: `2026-08-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
        home_score: 1,
        away_score: 0,
      })
    )
    expect(getRecentForm('Arsenal', fixtures)).toHaveLength(5)
  })

  it('ignores fixtures that have not finished yet', () => {
    const fixtures = [
      fixture({ id: 1, home_team: 'Arsenal', away_team: 'Chelsea', status: 'NS', home_score: null, away_score: null }),
    ]
    expect(getRecentForm('Arsenal', fixtures)).toEqual([])
  })

  it('ignores fixtures for other teams', () => {
    const fixtures = [
      fixture({ id: 1, home_team: 'Chelsea', away_team: 'Fulham', home_score: 1, away_score: 0 }),
    ]
    expect(getRecentForm('Arsenal', fixtures)).toEqual([])
  })
})
