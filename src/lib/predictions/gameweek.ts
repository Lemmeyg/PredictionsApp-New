export interface GameweekFixture {
  round: number
  status: string
}

function groupByRound(fixtures: GameweekFixture[]): Map<number, GameweekFixture[]> {
  const roundsByNumber = new Map<number, GameweekFixture[]>()

  for (const fixture of fixtures) {
    const existing = roundsByNumber.get(fixture.round) ?? []
    existing.push(fixture)
    roundsByNumber.set(fixture.round, existing)
  }

  return roundsByNumber
}

export function getCurrentRound(fixtures: GameweekFixture[]): number | null {
  const roundsByNumber = groupByRound(fixtures)

  const notStartedRounds = Array.from(roundsByNumber.entries())
    .filter(([, roundFixtures]) => roundFixtures.every((f) => f.status === 'NS'))
    .map(([round]) => round)

  if (notStartedRounds.length === 0) {
    return null
  }

  return Math.min(...notStartedRounds)
}

export function getLatestCompletedRound(fixtures: GameweekFixture[]): number | null {
  const roundsByNumber = groupByRound(fixtures)

  const completedRounds = Array.from(roundsByNumber.entries())
    .filter(([, roundFixtures]) => roundFixtures.every((f) => f.status === 'FT'))
    .map(([round]) => round)

  if (completedRounds.length === 0) {
    return null
  }

  return Math.max(...completedRounds)
}
