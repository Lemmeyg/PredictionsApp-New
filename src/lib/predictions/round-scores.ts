import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'
import { FINISHED_STATUSES } from './gameweek'
import { calculatePoints } from './scoring'

export interface RoundScore {
  round: number
  profileId: string
  displayName: string
  initials: string | null
  points: number
}

/**
 * Every player's points total for each requested round (one row per
 * player per round, including zero-point rows). Shared by the "top
 * gameweek scores" and "weeks won" stats below.
 */
export function computeRoundScores(
  profiles: Profile[],
  fixtures: FixtureRow[],
  predictions: PredictionRow[],
  roundNumbers: number[]
): RoundScore[] {
  const fixturesById = new Map(fixtures.map((f) => [f.id, f]))
  const roundSet = new Set(roundNumbers)

  return profiles.flatMap((profile) => {
    const pointsByRound = new Map<number, number>()
    const userPredictions = predictions.filter((p) => p.user_id === profile.id)

    for (const prediction of userPredictions) {
      const fixture = fixturesById.get(prediction.fixture_id)
      if (!fixture || !FINISHED_STATUSES.includes(fixture.status)) continue
      if (!roundSet.has(fixture.round)) continue

      const points = calculatePoints(
        {
          predictedHomeScore: prediction.predicted_home_score,
          predictedAwayScore: prediction.predicted_away_score,
        },
        { homeScore: fixture.home_score, awayScore: fixture.away_score }
      )

      pointsByRound.set(fixture.round, (pointsByRound.get(fixture.round) ?? 0) + points)
    }

    return roundNumbers.map((round) => ({
      round,
      profileId: profile.id,
      displayName: profile.display_name,
      initials: profile.initials,
      points: pointsByRound.get(round) ?? 0,
    }))
  })
}

/** The highest individual round scores across all players, best first. */
export function getTopGameweekScores(roundScores: RoundScore[], limit = 5): RoundScore[] {
  return [...roundScores].sort((a, b) => b.points - a.points).slice(0, limit)
}

export interface WeeksWonEntry {
  profileId: string
  displayName: string
  initials: string | null
  weeksWon: number
}

/**
 * How many rounds each player has outright topped (ties all count -- no
 * arbitrary tiebreaker). A round where everyone scored zero credits no one.
 */
export function getWeeksWon(roundScores: RoundScore[]): WeeksWonEntry[] {
  const byRound = new Map<number, RoundScore[]>()
  for (const score of roundScores) {
    const list = byRound.get(score.round) ?? []
    list.push(score)
    byRound.set(score.round, list)
  }

  const winsByProfile = new Map<string, number>()
  const profileInfo = new Map<string, { displayName: string; initials: string | null }>()

  for (const scores of byRound.values()) {
    const maxPoints = Math.max(...scores.map((s) => s.points))
    if (maxPoints <= 0) continue

    for (const score of scores) {
      if (score.points !== maxPoints) continue
      winsByProfile.set(score.profileId, (winsByProfile.get(score.profileId) ?? 0) + 1)
      if (!profileInfo.has(score.profileId)) {
        profileInfo.set(score.profileId, {
          displayName: score.displayName,
          initials: score.initials,
        })
      }
    }
  }

  return Array.from(winsByProfile.entries())
    .map(([profileId, weeksWon]) => ({
      profileId,
      displayName: profileInfo.get(profileId)!.displayName,
      initials: profileInfo.get(profileId)!.initials,
      weeksWon,
    }))
    .sort((a, b) => b.weeksWon - a.weeksWon)
}
