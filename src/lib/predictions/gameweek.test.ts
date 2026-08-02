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

  it('treats a postponed fixture as not started so the round stays current', () => {
    const fixtures = [
      { round: 1, status: 'FT' },
      { round: 2, status: 'NS' },
      { round: 2, status: 'PST' },
      { round: 3, status: 'NS' },
    ]
    expect(getCurrentRound(fixtures)).toBe(2)
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

  it('treats an awarded fixture as finished so the round still completes', () => {
    const fixtures = [
      { round: 1, status: 'FT' },
      { round: 2, status: 'FT' },
      { round: 2, status: 'AWD' },
      { round: 3, status: 'NS' },
    ]
    expect(getLatestCompletedRound(fixtures)).toBe(2)
  })

  it('returns null when no round is complete', () => {
    const fixtures = [{ round: 1, status: 'NS' }]
    expect(getLatestCompletedRound(fixtures)).toBeNull()
  })
})
