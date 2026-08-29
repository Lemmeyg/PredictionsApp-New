import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getNextDeadline } from '@/lib/predictions/deadline'
import type { FixtureRow, PredictionRow } from '@/lib/supabase/database.types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/sign-out-button'
import { NextDeadline } from '@/components/home/next-deadline'

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let deadlineKickoff: string | null = null
  let deadlineSubmitted = false

  if (user) {
    const [{ data: fixturesData }, { data: predictionsData }] = await Promise.all([
      supabase.from('fixtures').select('id,round,status,kickoff_time'),
      supabase.from('predictions').select('fixture_id').eq('user_id', user.id),
    ])

    const fixtures = (fixturesData ?? []) as Pick<
      FixtureRow,
      'id' | 'round' | 'status' | 'kickoff_time'
    >[]
    const deadline = getNextDeadline(fixtures)
    deadlineKickoff = deadline?.kickoff ?? null

    if (deadline) {
      const predictions = (predictionsData ?? []) as Pick<PredictionRow, 'fixture_id'>[]
      const roundFixtureIds = new Set(
        fixtures.filter((f) => f.round === deadline.round).map((f) => f.id)
      )
      deadlineSubmitted = predictions.some((p) => roundFixtureIds.has(p.fixture_id))
    }
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4">
      <Card className="w-full max-w-[min(90vw,380px)] border-border">
        <div className="flex flex-col items-center gap-6 p-6">
          <div className="animate-in fade-in zoom-in duration-500 transition-transform hover:scale-110">
            <div className="[perspective:1000px]">
              <div className="bg-primary rounded-full p-4 animate-spin-y">
                <Trophy className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Welcome to <span className="text-primary">Predictions</span>
            </h1>
            <p className="text-primary text-sm md:text-base">
              Make your predictions for upcoming matches
            </p>
          </div>

          {user && (
            <div className="w-full">
              <NextDeadline
                kickoff={deadlineKickoff}
                alreadySubmitted={deadlineSubmitted}
              />
            </div>
          )}

          <div className="w-full space-y-3">
            {user ? (
              <>
                <Button asChild className="w-full h-11" variant="secondary">
                  <Link href="/predictions">Make Predictions</Link>
                </Button>
                <Button asChild className="w-full h-11" variant="secondary">
                  <Link href="/leaderboard">View Leaderboard</Link>
                </Button>
                <Button asChild className="w-full h-11" variant="secondary">
                  <Link href="/weekly-watcher">Weekly Watcher</Link>
                </Button>
                <Button asChild className="w-full h-11" variant="secondary">
                  <Link href="/hof">HOF</Link>
                </Button>
                <SignOutButton />
              </>
            ) : (
              <Button asChild className="w-full h-11" variant="secondary">
                <Link href="/login">Log In</Link>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </main>
  )
}
