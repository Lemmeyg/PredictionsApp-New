'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateFixtureResult(
  fixtureId: number,
  homeScore: number,
  awayScore: number
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createClient()

  // Check admin rights here rather than relying on RLS alone: the fixtures
  // update policy is row-independent, so a denied update returns no error.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authorized' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { success: false, error: 'Not authorized' }
  }

  const { data, error } = await supabase
    .from('fixtures')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'FT',
      result_source: 'admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', fixtureId)
    .select('id')

  if (error) {
    return { success: false, error: error.message }
  }

  // Zero affected rows means nothing was saved, so don't report success.
  if (!data || data.length === 0) {
    return { success: false, error: 'No matching fixture found — it may have been removed.' }
  }

  return { success: true }
}
