import { getCurrentRound } from './gameweek'

export interface DeadlineFixture {
  round: number
  status: string
  kickoff_time: string
}

export interface NextDeadline {
  round: number
  kickoff: string
}

/**
 * The next predictions deadline: the kickoff of the first match in the round
 * that is currently open for predictions (the lowest round where every fixture
 * is still not-started, per getCurrentRound). Returns null once the season is
 * complete.
 */
export function getNextDeadline(fixtures: DeadlineFixture[]): NextDeadline | null {
  const round = getCurrentRound(fixtures)
  if (round === null) return null

  const kickoffs = fixtures
    .filter((f) => f.round === round)
    .map((f) => f.kickoff_time)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  if (kickoffs.length === 0) return null

  return { round, kickoff: kickoffs[0] }
}
