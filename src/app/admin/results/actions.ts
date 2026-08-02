'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateFixtureResult(
  fixtureId: number,
  homeScore: number,
  awayScore: number
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = createClient()

  const { error } = await supabase
    .from('fixtures')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: 'FT',
      result_source: 'admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', fixtureId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
