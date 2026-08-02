import { createClient } from '@/lib/supabase/server'
import { getLatestCompletedRound } from '@/lib/predictions/gameweek'
import { calculatePoints } from '@/lib/predictions/scoring'
import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'
import { LeaderboardTable, type LeaderboardEntry } from '@/components/leaderboard/leaderboard-table'

export default async function LeaderboardPage() {
  const supabase = createClient()

  const [{ data: profilesData }, { data: fixturesData }, { data: predictionsData }] =
    await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('fixtures').select('*'),
      supabase.from('predictions').select('*'),
    ])

  const profiles = (profilesData ?? []) as Profile[]
  const fixtures = (fixturesData ?? []) as FixtureRow[]
  const predictions = (predictionsData ?? []) as PredictionRow[]

  const fixturesById = new Map(fixtures.map((f) => [f.id, f]))
  const latestRound = getLatestCompletedRound(fixtures)

  const entries: LeaderboardEntry[] = profiles
    .map((profile) => {
      const userPredictions = predictions.filter((p) => p.user_id === profile.id)

      let total = 0
      let gameweekTotal = 0

      for (const prediction of userPredictions) {
        const fixture = fixturesById.get(prediction.fixture_id)
        if (!fixture) continue

        const points = calculatePoints(
          {
            predictedHomeScore: prediction.predicted_home_score,
            predictedAwayScore: prediction.predicted_away_score,
          },
          { homeScore: fixture.home_score, awayScore: fixture.away_score }
        )

        total += points
        if (latestRound !== null && fixture.round === latestRound) {
          gameweekTotal += points
        }
      }

      return { player: profile.display_name, total, gameweekTotal }
    })
    .sort((a, b) => b.total - a.total)
    .map((entry, index) => ({
      rank: String(index + 1),
      player: entry.player,
      total: entry.total,
      gameweekTotal: entry.gameweekTotal,
    }))

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Leaderboard</h1>
      <LeaderboardTable data={entries} />
    </div>
  )
} 