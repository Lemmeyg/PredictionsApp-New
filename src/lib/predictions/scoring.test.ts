import { describe, expect, it } from 'vitest'
import { calculatePoints } from './scoring'

describe('calculatePoints', () => {
  it('awards 8 points for an exact score match', () => {
    expect(
      calculatePoints(
        { predictedHomeScore: 2, predictedAwayScore: 1 },
        { homeScore: 2, awayScore: 1 }
      )
    ).toBe(8)
  })

  it('awards 8 points for an exact 0-0 draw match', () => {
    expect(
      calculatePoints(
        { predictedHomeScore: 0, predictedAwayScore: 0 },
        { homeScore: 0, awayScore: 0 }
      )
    ).toBe(8)
  })

  it('awards 5 points for correct result but wrong score', () => {
    expect(
      calculatePoints(
        { predictedHomeScore: 3, predictedAwayScore: 1 },
        { homeScore: 2, awayScore: 0 }
      )
    ).toBe(5)
  })

  it('awards 5 points for a correctly predicted draw with the wrong score', () => {
    expect(
      calculatePoints(
        { predictedHomeScore: 1, predictedAwayScore: 1 },
        { homeScore: 2, awayScore: 2 }
      )
    ).toBe(5)
  })

  it('awards 0 points for a wrong result', () => {
    expect(
      calculatePoints(
        { predictedHomeScore: 2, predictedAwayScore: 0 },
        { homeScore: 0, awayScore: 1 }
      )
    ).toBe(0)
  })

  it('awards 0 points when the fixture has no result yet', () => {
    expect(
      calculatePoints(
        { predictedHomeScore: 1, predictedAwayScore: 0 },
        { homeScore: null, awayScore: null }
      )
    ).toBe(0)
  })
})
