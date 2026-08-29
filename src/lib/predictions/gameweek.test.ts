import { describe, expect, it } from 'vitest'
import { getActiveRound, getCurrentRound, getLatestCompletedRound } from './gameweek'

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

  it('does not treat a suspended or cancelled fixture as not-started', () => {
    const fixtures = [
      { round: 1, status: 'SUSP' },
      { round: 1, status: 'NS' },
      { round: 2, status: 'NS' },
      { round: 2, status: 'NS' },
    ]
    expect(getCurrentRound(fixtures)).toBe(2)
  })

  it('returns null for an empty fixture list', () => {
    expect(getCurrentRound([])).toBeNull()
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

  it('does not treat a suspended fixture as finished, even alongside completed ones', () => {
    const fixtures = [
      { round: 1, status: 'FT' },
      { round: 2, status: 'FT' },
      { round: 2, status: 'SUSP' },
    ]
    expect(getLatestCompletedRound(fixtures)).toBe(1)
  })

  it('returns null for an empty fixture list', () => {
    expect(getLatestCompletedRound([])).toBeNull()
  })
})

describe('getActiveRound', () => {
  it('picks the highest round that has at least one fixture kicked off', () => {
    const fixtures = [
      { round: 1, status: 'FT' },
      { round: 2, status: 'FT' },
      { round: 3, status: '1H' },
      { round: 3, status: 'NS' },
      { round: 4, status: 'NS' },
    ]
    expect(getActiveRound(fixtures)).toBe(3)
  })

  it('stays on the latest completed round until the next round kicks off', () => {
    const fixtures = [
      { round: 1, status: 'FT' },
      { round: 2, status: 'FT' },
      { round: 3, status: 'NS' },
      { round: 3, status: 'NS' },
    ]
    expect(getActiveRound(fixtures)).toBe(2)
  })

  it('does not treat a postponed-only round as active', () => {
    const fixtures = [
      { round: 1, status: 'FT' },
      { round: 2, status: 'NS' },
      { round: 2, status: 'PST' },
    ]
    expect(getActiveRound(fixtures)).toBe(1)
  })

  it('returns null when no fixture has kicked off yet', () => {
    const fixtures = [
      { round: 1, status: 'NS' },
      { round: 2, status: 'NS' },
    ]
    expect(getActiveRound(fixtures)).toBeNull()
  })

  it('returns null for an empty fixture list', () => {
    expect(getActiveRound([])).toBeNull()
  })
})
