import { createClient } from '@/lib/supabase/server'
import { FINISHED_STATUSES, getLatestCompletedRound } from '@/lib/predictions/gameweek'
import { calculatePoints } from '@/lib/predictions/scoring'
import { computeStandings } from '@/lib/predictions/standings'
import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'
import { LeaderboardTable, type LeaderboardEntry } from '@/components/leaderboard/leaderboard-table'
import {
  CumulativeScoreChart,
  type PlayerSeries,
} from '@/components/leaderboard/cumulative-score-chart'

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

  const entries: LeaderboardEntry[] = computeStandings(
    profiles,
    fixtures,
    predictions,
    latestRound
  ).map((entry, index) => ({
    rank: String(index + 1),
    player: entry.displayName,
    total: entry.total,
    gameweekTotal: entry.gameweekTotal,
  }))

  // Players get a fixed color assignment (alphabetical by name) so a given
  // player's line color never changes as their rank moves week to week --
  // color follows the entity, never its rank.
  const roundNumbers = latestRound === null ? [] : Array.from({ length: latestRound }, (_, i) => i + 1)

  const playerSeries: PlayerSeries[] = [...profiles]
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
    .map((profile) => {
      const userPredictions = predictions.filter((p) => p.user_id === profile.id)

      const pointsByRound = new Map<number, number>()
      for (const prediction of userPredictions) {
        const fixture = fixturesById.get(prediction.fixture_id)
        if (!fixture || !FINISHED_STATUSES.includes(fixture.status)) continue

        const points = calculatePoints(
          {
            predictedHomeScore: prediction.predicted_home_score,
            predictedAwayScore: prediction.predicted_away_score,
          },
          { homeScore: fixture.home_score, awayScore: fixture.away_score }
        )

        pointsByRound.set(fixture.round, (pointsByRound.get(fixture.round) ?? 0) + points)
      }

      let running = 0
      const points = roundNumbers.map((round) => {
        running += pointsByRound.get(round) ?? 0
        return { round, cumulativeTotal: running }
      })

      return {
        playerId: profile.id,
        displayName: profile.display_name,
        initials: profile.initials,
        points,
      }
    })

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold text-foreground mb-4">Leaderboard</h1>
      <LeaderboardTable data={entries} />
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Season Progress</h2>
        <CumulativeScoreChart series={playerSeries} roundNumbers={roundNumbers} />
      </div>
    </div>
  )
}