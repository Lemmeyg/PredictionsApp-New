'use server'

import { createClient } from '@/lib/supabase/server'

interface SubmitPredictionInput {
  fixtureId: number
  homeScore: number
  awayScore: number
}

type SubmitResult =
  | { success: true }
  | { success: false; alreadySubmitted: boolean; error: string }

export async function submitPredictions(
  predictions: SubmitPredictionInput[]
): Promise<SubmitResult> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, alreadySubmitted: false, error: 'Not signed in' }
  }

  const rows = predictions.map((p) => ({
    user_id: user.id,
    fixture_id: p.fixtureId,
    predicted_home_score: p.homeScore,
    predicted_away_score: p.awayScore,
  }))

  const { error } = await supabase.from('predictions').insert(rows)

  if (error) {
    const alreadySubmitted = error.code === '23505'
    return {
      success: false,
      alreadySubmitted,
      error: alreadySubmitted
        ? 'You have already submitted predictions for this round.'
        : error.message,
    }
  }

  return { success: true }
}
