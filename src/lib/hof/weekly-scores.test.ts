import { describe, expect, it } from 'vitest'
import { toWeeklyScoreEntries, topWeeklyScores } from './weekly-scores'
import type { RoundScore } from '@/lib/predictions/round-scores'

describe('toWeeklyScoreEntries', () => {
  it('maps each round score to a weekly score entry tagged with the given season', () => {
    const roundScores: RoundScore[] = [
      { round: 1, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 8 },
      { round: 2, profileId: 'p1', displayName: 'Alice', initials: 'AL', points: 5 },
    ]

    expect(toWeeklyScoreEntries(roundScores, '2026/27')).toEqual([
      { season: '2026/27', weekNumber: 1, playerName: 'Alice', score: 8 },
      { season: '2026/27', weekNumber: 2, playerName: 'Alice', score: 5 },
    ])
  })

  it('returns an empty array for no round scores', () => {
    expect(toWeeklyScoreEntries([], '2026/27')).toEqual([])
  })
})

describe('topWeeklyScores', () => {
  it('merges historical and live entries, sorted by score descending', () => {
    const historical = [{ season: '2023/24', weekNumber: 5, playerName: 'Carol', score: 20 }]
    const live = [{ season: '2026/27', weekNumber: 1, playerName: 'Alice', score: 25 }]

    expect(topWeeklyScores(historical, live, 10)).toEqual([
      { season: '2026/27', weekNumber: 1, playerName: 'Alice', score: 25 },
      { season: '2023/24', weekNumber: 5, playerName: 'Carol', score: 20 },
    ])
  })

  it('caps the result at the given limit', () => {
    const historical = [
      { season: '2023/24', weekNumber: 1, playerName: 'A', score: 30 },
      { season: '2023/24', weekNumber: 2, playerName: 'B', score: 25 },
      { season: '2023/24', weekNumber: 3, playerName: 'C', score: 20 },
    ]

    expect(topWeeklyScores(historical, [], 2)).toEqual([
      { season: '2023/24', weekNumber: 1, playerName: 'A', score: 30 },
      { season: '2023/24', weekNumber: 2, playerName: 'B', score: 25 },
    ])
  })

  it('returns an empty array when there are no entries at all', () => {
    expect(topWeeklyScores([], [], 10)).toEqual([])
  })
})
