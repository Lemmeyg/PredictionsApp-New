import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSubmittedRounds } from '@/lib/predictions/weekly-watcher'
import { sortByKickoff } from '@/lib/predictions/fixture-order'
import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'
import { BackToHomeButton } from '@/components/back-to-home-button'
import { WeekSelect } from '@/components/weekly-watcher/week-select'
import { WatcherFixtureList } from '@/components/weekly-watcher/watcher-fixture-list'

export default async function WeeklyWatcherPage({
  searchParams,
}: {
  searchParams: { round?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: fixturesData }, { data: profilesData }, { data: predictionsData }] =
    await Promise.all([
      supabase.from('fixtures').select('*').order('round', { ascending: true }),
      supabase.from('profiles').select('*'),
      supabase.from('predictions').select('*'),
    ])

  const fixtures = (fixturesData ?? []) as FixtureRow[]
  const profiles = (profilesData ?? []) as Profile[]
  const predictions = (predictionsData ?? []) as PredictionRow[]

  const submittedRounds = getSubmittedRounds(fixtures, predictions, user.id)

  const requestedRound = searchParams.round ? Number(searchParams.round) : null
  const selectedRound =
    requestedRound !== null && submittedRounds.includes(requestedRound)
      ? requestedRound
      : (submittedRounds[0] ?? null)

  const roundFixtures =
    selectedRound === null
      ? []
      : sortByKickoff(fixtures.filter((f) => f.round === selectedRound))

  return (
    <div className="container mx-auto p-4">
      <BackToHomeButton />
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold">
          Weekly <span className="text-primary">Watcher</span>
        </h1>
        <p className="text-muted-foreground mt-2">See what everyone predicted</p>
      </div>

      {submittedRounds.length === 0 ? (
        <p className="text-center text-muted-foreground">
          You haven&apos;t submitted any predictions yet.
        </p>
      ) : (
        <div className="max-w-md mx-auto space-y-4">
          <WeekSelect rounds={submittedRounds} selectedRound={selectedRound as number} />
          <WatcherFixtureList
            fixtures={roundFixtures}
            predictions={predictions}
            profiles={profiles}
          />
        </div>
      )}
    </div>
  )
}
