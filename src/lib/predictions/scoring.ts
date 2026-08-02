export interface ScoringFixture {
  homeScore: number | null
  awayScore: number | null
}

export interface ScoringPrediction {
  predictedHomeScore: number
  predictedAwayScore: number
}

export function calculatePoints(
  prediction: ScoringPrediction,
  fixture: ScoringFixture
): number {
  if (fixture.homeScore === null || fixture.awayScore === null) {
    return 0
  }

  const exactMatch =
    prediction.predictedHomeScore === fixture.homeScore &&
    prediction.predictedAwayScore === fixture.awayScore

  if (exactMatch) {
    return 8
  }

  const predictedResult = Math.sign(
    prediction.predictedHomeScore - prediction.predictedAwayScore
  )
  const actualResult = Math.sign(fixture.homeScore - fixture.awayScore)

  if (predictedResult === actualResult) {
    return 5
  }

  return 0
}
