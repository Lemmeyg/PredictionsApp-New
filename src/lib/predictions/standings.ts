import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'
import { FINISHED_STATUSES } from './gameweek'
import { calculatePoints } from './scoring'

export interface StandingsEntry {
  profileId: string
  displayName: string
  initials: string | null
  total: number
  gameweekTotal: number
}

/**
 * Season standings for every player, sorted by total points descending.
 * Shared by the leaderboard page (display) and the predictions page
 * (rank-relative highlighting), so both stay in agreement.
 */
export function computeStandings(
  profiles: Profile[],
  fixtures: FixtureRow[],
  predictions: PredictionRow[],
  latestCompletedRound: number | null
): StandingsEntry[] {
  const fixturesById = new Map(fixtures.map((f) => [f.id, f]))

  return profiles
    .map((profile) => {
      const userPredictions = predictions.filter((p) => p.user_id === profile.id)

      let total = 0
      let gameweekTotal = 0

      for (const prediction of userPredictions) {
        const fixture = fixturesById.get(prediction.fixture_id)
        // A live match reports real (non-null) scores, so points must only
        // be counted once the fixture has actually finished.
        if (!fixture || !FINISHED_STATUSES.includes(fixture.status)) continue

        const points = calculatePoints(
          {
            predictedHomeScore: prediction.predicted_home_score,
            predictedAwayScore: prediction.predicted_away_score,
          },
          { homeScore: fixture.home_score, awayScore: fixture.away_score }
        )

        total += points
        if (latestCompletedRound !== null && fixture.round === latestCompletedRound) {
          gameweekTotal += points
        }
      }

      return {
        profileId: profile.id,
        displayName: profile.display_name,
        initials: profile.initials,
        total,
        gameweekTotal,
      }
    })
    .sort((a, b) => b.total - a.total)
}
