import { createClient } from '@/lib/supabase/server'
import { getLatestCompletedRound } from '@/lib/predictions/gameweek'
import { computeStandings } from '@/lib/predictions/standings'
import {
  computeRoundScores,
  getTopGameweekScores,
  getWeeksWon,
} from '@/lib/predictions/round-scores'
import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'
import { LeaderboardTable, type LeaderboardEntry } from '@/components/leaderboard/leaderboard-table'
import {
  CumulativeScoreChart,
  type PlayerSeries,
} from '@/components/leaderboard/cumulative-score-chart'
import { TopGameweekScoresTable, WeeksWonTable } from '@/components/leaderboard/stats-tables'
import { BackToHomeButton } from '@/components/back-to-home-button'

const TOP_SCORES_LIMIT = 5

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
  const roundScores = computeRoundScores(profiles, fixtures, predictions, roundNumbers)

  const playerSeries: PlayerSeries[] = [...profiles]
    .sort((a, b) => a.display_name.localeCompare(b.display_name))
    .map((profile) => {
      let running = 0
      const points = roundScores
        .filter((s) => s.profileId === profile.id)
        .map((s) => {
          running += s.points
          return { round: s.round, cumulativeTotal: running }
        })

      return {
        playerId: profile.id,
        displayName: profile.display_name,
        initials: profile.initials,
        points,
      }
    })

  const topScores = getTopGameweekScores(roundScores, TOP_SCORES_LIMIT)
  const weeksWon = getWeeksWon(roundScores)

  return (
    <div className="container mx-auto p-4">
      <BackToHomeButton />
      <h1 className="text-2xl font-semibold text-foreground mb-4">Leaderboard</h1>
      <LeaderboardTable data={entries} />
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Season Progress</h2>
        <CumulativeScoreChart series={playerSeries} roundNumbers={roundNumbers} />
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Top Gameweek Scores</h2>
        <TopGameweekScoresTable scores={topScores} />
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Weeks Won</h2>
        <WeeksWonTable entries={weeksWon} />
      </div>
    </div>
  )
}
