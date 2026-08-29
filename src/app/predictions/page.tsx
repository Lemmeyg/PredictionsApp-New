import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRound, getLatestCompletedRound } from '@/lib/predictions/gameweek'
import { sortByKickoff } from '@/lib/predictions/fixture-order'
import { getRecentForm } from '@/lib/predictions/form'
import { computeStandings } from '@/lib/predictions/standings'
import { getOtherPlayersPicks } from '@/lib/predictions/picks'
import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'
import { PredictionForm } from '@/components/predictions/prediction-form'
import { BackToHomeButton } from '@/components/back-to-home-button'

export default async function PredictionsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: allFixturesData }, { data: profilesData }, { data: allPredictionsData }] =
    await Promise.all([
      supabase.from('fixtures').select('*').order('round', { ascending: true }),
      supabase.from('profiles').select('*'),
      supabase.from('predictions').select('*'),
    ])

  const fixtures = (allFixturesData ?? []) as FixtureRow[]
  const profiles = (profilesData ?? []) as Profile[]
  const allPredictions = (allPredictionsData ?? []) as PredictionRow[]

  const currentRound = getCurrentRound(fixtures)

  if (currentRound === null) {
    return (
      <div className="container mx-auto p-4 text-center text-white">
        <BackToHomeButton />
        No upcoming round is open for predictions right now.
      </div>
    )
  }

  const roundFixtures = sortByKickoff(fixtures.filter((f) => f.round === currentRound))
  const roundFixtureIds = new Set(roundFixtures.map((f) => f.id))
  const roundPredictions = allPredictions.filter((p) => roundFixtureIds.has(p.fixture_id))
  const alreadySubmitted = roundPredictions.some((p) => p.user_id === user.id)

  const profile = profiles.find((p) => p.id === user.id) ?? null

  // Rank-relative highlighting for other players' picks: computed once
  // against the season standings, then applied wherever that player's
  // initials show up below.
  const latestCompletedRound = getLatestCompletedRound(fixtures)
  const standings = computeStandings(profiles, fixtures, allPredictions, latestCompletedRound)
  const viewerIndex = standings.findIndex((s) => s.profileId === user.id)
  const aboveProfileId = viewerIndex > 0 ? standings[viewerIndex - 1].profileId : null
  const belowProfileId =
    viewerIndex >= 0 && viewerIndex < standings.length - 1
      ? standings[viewerIndex + 1].profileId
      : null

  return (
    <div className="container mx-auto p-4">
      <BackToHomeButton />
      <div className="flex justify-between items-center mb-6">
        <Link href="/" className="text-white hover:text-primary transition-colors">
          {profile?.display_name ?? user.email}
        </Link>
      </div>
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold">
          Enter Your <span className="text-primary">Predictions</span>
        </h1>
        <p className="text-muted-foreground mt-2">Predict scores for the upcoming matches</p>
      </div>
      <PredictionForm
        fixtures={roundFixtures.map((f) => ({
          id: f.id,
          kickoffTime: f.kickoff_time,
          homeTeam: f.home_team,
          awayTeam: f.away_team,
          homeForm: getRecentForm(f.home_team, fixtures),
          awayForm: getRecentForm(f.away_team, fixtures),
          otherPicks: getOtherPlayersPicks(f.id, user.id, roundPredictions, profiles).map(
            (pick) => ({
              ...pick,
              highlight:
                pick.profileId === aboveProfileId
                  ? ('above' as const)
                  : pick.profileId === belowProfileId
                    ? ('below' as const)
                    : null,
            })
          ),
        }))}
        alreadySubmitted={alreadySubmitted}
      />
    </div>
  )
}
