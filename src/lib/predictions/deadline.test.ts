import { describe, expect, it } from 'vitest'
import { getNextDeadline } from './deadline'

const NS = 'NS'
const FT = 'FT'

describe('getNextDeadline', () => {
  it('returns the earliest kickoff of the next round open for predictions', () => {
    const fixtures = [
      { round: 1, status: FT, kickoff_time: '2026-08-21T19:00:00+00:00' },
      { round: 2, status: NS, kickoff_time: '2026-08-29T14:00:00+00:00' },
      { round: 2, status: NS, kickoff_time: '2026-08-28T19:00:00+00:00' },
      { round: 2, status: NS, kickoff_time: '2026-08-30T15:30:00+00:00' },
      { round: 3, status: NS, kickoff_time: '2026-09-12T14:00:00+00:00' },
    ]
    expect(getNextDeadline(fixtures)).toEqual({
      round: 2,
      kickoff: '2026-08-28T19:00:00+00:00',
    })
  })

  it('ignores fixtures from later rounds', () => {
    const fixtures = [
      { round: 5, status: NS, kickoff_time: '2026-09-19T14:00:00+00:00' },
      { round: 6, status: NS, kickoff_time: '2026-08-01T00:00:00+00:00' },
    ]
    expect(getNextDeadline(fixtures)?.round).toBe(5)
    expect(getNextDeadline(fixtures)?.kickoff).toBe('2026-09-19T14:00:00+00:00')
  })

  it('accepts unsorted input', () => {
    const fixtures = [
      { round: 2, status: NS, kickoff_time: '2026-08-30T15:30:00+00:00' },
      { round: 2, status: NS, kickoff_time: '2026-08-28T19:00:00+00:00' },
    ]
    expect(getNextDeadline(fixtures)?.kickoff).toBe('2026-08-28T19:00:00+00:00')
  })

  it('returns null when every round has started (season complete)', () => {
    const fixtures = [
      { round: 1, status: FT, kickoff_time: '2026-08-21T19:00:00+00:00' },
      { round: 2, status: FT, kickoff_time: '2026-08-28T19:00:00+00:00' },
    ]
    expect(getNextDeadline(fixtures)).toBeNull()
  })

  it('returns null for an empty fixture list', () => {
    expect(getNextDeadline([])).toBeNull()
  })
})
