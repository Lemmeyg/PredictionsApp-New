export interface GameweekFixture {
  round: number
  status: string
}

// api-football status codes that mean "this fixture has not kicked off yet".
export const NOT_STARTED_STATUSES = ['NS', 'TBD', 'PST']

// api-football status codes that mean "this fixture has a final result".
export const FINISHED_STATUSES = ['FT', 'AET', 'PEN', 'AWD', 'CANC']

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
    .filter(([, roundFixtures]) =>
      roundFixtures.every((f) => NOT_STARTED_STATUSES.includes(f.status))
    )
    .map(([round]) => round)

  if (notStartedRounds.length === 0) {
    return null
  }

  return Math.min(...notStartedRounds)
}

export function getLatestCompletedRound(fixtures: GameweekFixture[]): number | null {
  const roundsByNumber = groupByRound(fixtures)

  const completedRounds = Array.from(roundsByNumber.entries())
    .filter(([, roundFixtures]) =>
      roundFixtures.every((f) => FINISHED_STATUSES.includes(f.status))
    )
    .map(([round]) => round)

  if (completedRounds.length === 0) {
    return null
  }

  return Math.max(...completedRounds)
}
