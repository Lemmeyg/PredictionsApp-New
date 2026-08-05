import { createClient } from '@/lib/supabase/server'
import type {
  FixtureRow,
  HofSeasonWinner,
  HofWeeklyHighScore,
  PredictionRow,
  Profile,
} from '@/lib/supabase/database.types'
import { getLatestCompletedRound } from '@/lib/predictions/gameweek'
import { computeRoundScores } from '@/lib/predictions/round-scores'
import { CURRENT_SEASON_LABEL } from '@/lib/config/season'
import { toWeeklyScoreEntries, topWeeklyScores } from '@/lib/hof/weekly-scores'
import { SeasonWinnersTable } from '@/components/hof/season-winners-table'
import { WeeklyHighScoresTable } from '@/components/hof/weekly-high-scores-table'
import { BackToHomeButton } from '@/components/back-to-home-button'

const TOP_WEEKLY_SCORES_LIMIT = 10

export default async function HofPage() {
  const supabase = createClient()

  const [
    { data: profilesData },
    { data: fixturesData },
    { data: predictionsData },
    { data: winnersData },
    { data: weeklyScoresData },
  ] = await Promise.all([
    supabase.from('profiles').select('*'),
    supabase.from('fixtures').select('*'),
    supabase.from('predictions').select('*'),
    supabase.from('hof_season_winners').select('*'),
    supabase.from('hof_weekly_high_scores').select('*'),
  ])

  const profiles = (profilesData ?? []) as Profile[]
  const fixtures = (fixturesData ?? []) as FixtureRow[]
  const predictions = (predictionsData ?? []) as PredictionRow[]
  const winners = (winnersData ?? []) as HofSeasonWinner[]
  const historicalWeeklyScores = (weeklyScoresData ?? []) as HofWeeklyHighScore[]

  const latestRound = getLatestCompletedRound(fixtures)
  const roundNumbers =
    latestRound === null ? [] : Array.from({ length: latestRound }, (_, i) => i + 1)
  const roundScores = computeRoundScores(profiles, fixtures, predictions, roundNumbers)
  const liveWeeklyScores = toWeeklyScoreEntries(roundScores, CURRENT_SEASON_LABEL)

  const historicalEntries = historicalWeeklyScores.map((row) => ({
    season: row.season,
    weekNumber: row.week_number,
    playerName: row.player_name,
    score: row.score,
  }))

  const topScores = topWeeklyScores(historicalEntries, liveWeeklyScores, TOP_WEEKLY_SCORES_LIMIT)

  const winnersSorted = [...winners].sort((a, b) => b.season.localeCompare(a.season))

  return (
    <div className="container mx-auto p-4">
      <BackToHomeButton />
      <h1 className="text-2xl font-semibold text-foreground mb-4">Hall of Fame</h1>
      <SeasonWinnersTable data={winnersSorted} />
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Top 10 Weekly Scores</h2>
        <WeeklyHighScoresTable data={topScores} />
      </div>
    </div>
  )
}
