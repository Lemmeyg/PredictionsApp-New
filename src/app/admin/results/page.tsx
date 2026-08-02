import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { FixtureRow, Profile } from '@/lib/supabase/database.types'
import { ResultsForm } from './results-form'

export default async function AdminResultsPage({
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

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  if (!profile?.is_admin) {
    redirect('/')
  }

  const round = Number(searchParams.round ?? '1')

  const { data } = await supabase
    .from('fixtures')
    .select('*')
    .eq('round', round)
    .order('kickoff_time', { ascending: true })

  const fixtures = (data ?? []) as FixtureRow[]

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold text-foreground mb-4">
        Admin: Round {round} Results
      </h1>
      <ResultsForm fixtures={fixtures} round={round} />
    </div>
  )
}
