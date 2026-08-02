import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getCurrentRound } from '@/lib/predictions/gameweek'
import type { FixtureRow, Profile } from '@/lib/supabase/database.types'
import { PredictionForm } from '@/components/predictions/prediction-form'

export default async function PredictionsPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: allFixtures } = await supabase
    .from('fixtures')
    .select('*')
    .order('round', { ascending: true })

  const fixtures = (allFixtures ?? []) as FixtureRow[]
  const currentRound = getCurrentRound(fixtures)

  if (currentRound === null) {
    return (
      <div className="container mx-auto p-4 text-center text-white">
        No upcoming round is open for predictions right now.
      </div>
    )
  }

  const roundFixtures = fixtures.filter((f) => f.round === currentRound)

  const { data: existing } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', user.id)
    .in('fixture_id', roundFixtures.map((f) => f.id))

  const alreadySubmitted = (existing ?? []).length > 0

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <span className="text-white">{profile?.display_name ?? user.email}</span>
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
          homeTeam: f.home_team,
          awayTeam: f.away_team,
        }))}
        alreadySubmitted={alreadySubmitted}
      />
    </div>
  )
} 