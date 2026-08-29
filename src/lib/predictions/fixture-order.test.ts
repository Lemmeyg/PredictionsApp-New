import { describe, expect, it } from 'vitest'
import { sortByKickoff, groupByKickoffDay } from './fixture-order'

describe('sortByKickoff', () => {
  it('orders by kickoff instant ascending', () => {
    const input = [
      { id: 3, kickoff_time: '2026-08-23T13:00:00+00:00' },
      { id: 1, kickoff_time: '2026-08-21T19:00:00+00:00' },
      { id: 2, kickoff_time: '2026-08-22T14:00:00+00:00' },
    ]
    expect(sortByKickoff(input).map((f) => f.id)).toEqual([1, 2, 3])
  })

  it('breaks ties on ascending id (placeholder rounds share a time)', () => {
    const input = [
      { id: 20, kickoff_time: '2027-01-06T20:00:00+00:00' },
      { id: 11, kickoff_time: '2027-01-06T20:00:00+00:00' },
      { id: 15, kickoff_time: '2027-01-06T20:00:00+00:00' },
    ]
    expect(sortByKickoff(input).map((f) => f.id)).toEqual([11, 15, 20])
  })

  it('does not mutate the input array', () => {
    const input = [
      { id: 2, kickoff_time: '2026-08-22T14:00:00+00:00' },
      { id: 1, kickoff_time: '2026-08-21T19:00:00+00:00' },
    ]
    const snapshot = input.map((f) => f.id)
    sortByKickoff(input)
    expect(input.map((f) => f.id)).toEqual(snapshot)
  })

  it('returns an empty array unchanged', () => {
    expect(sortByKickoff([])).toEqual([])
  })
})

describe('groupByKickoffDay', () => {
  const fixtures = [
    { id: 1, kickoff_time: '2026-08-21T19:00:00+00:00' },
    { id: 2, kickoff_time: '2026-08-22T14:00:00+00:00' },
    { id: 3, kickoff_time: '2026-08-22T16:30:00+00:00' },
    { id: 4, kickoff_time: '2026-08-23T13:00:00+00:00' },
  ]

  it('groups consecutive same-day fixtures in the given zone', () => {
    const groups = groupByKickoffDay(fixtures, (f) => f.kickoff_time, 'Europe/London')
    expect(groups.map((g) => g.dayKey)).toEqual(['2026-08-21', '2026-08-22', '2026-08-23'])
    expect(groups.map((g) => g.fixtures.map((f) => f.id))).toEqual([[1], [2, 3], [4]])
  })

  it('exposes the first fixture ISO of each group as headingIso', () => {
    const groups = groupByKickoffDay(fixtures, (f) => f.kickoff_time, 'Europe/London')
    expect(groups[1].headingIso).toBe('2026-08-22T14:00:00+00:00')
  })

  it('returns an empty array for no fixtures', () => {
    expect(groupByKickoffDay([], (f: { kickoff_time: string }) => f.kickoff_time)).toEqual([])
  })
})
