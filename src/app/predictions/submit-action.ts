'use server'

import { createClient } from '@/lib/supabase/server'
import { getCurrentRound } from '@/lib/predictions/gameweek'
import type { FixtureRow } from '@/lib/supabase/database.types'

interface SubmitPredictionInput {
  fixtureId: number
  homeScore: number
  awayScore: number
}

type SubmitResult =
  | { success: true }
  | { success: false; alreadySubmitted: boolean; error: string }

const INVALID_ROUND: SubmitResult = {
  success: false,
  alreadySubmitted: false,
  error: 'These predictions are no longer valid for the current round.',
}

const INVALID_SCORE: SubmitResult = {
  success: false,
  alreadySubmitted: false,
  error: 'Predicted scores must be whole numbers between 0 and 99.',
}

function isValidScore(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 99
}

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

  // Server-side gating: this action is a plain POST endpoint, so the round and
  // score bounds must be re-checked here rather than trusted from the client.
  const { data: allFixtures } = await supabase.from('fixtures').select('*')
  const fixtures = (allFixtures ?? []) as FixtureRow[]
  const currentRound = getCurrentRound(fixtures)

  if (currentRound === null) {
    return INVALID_ROUND
  }

  const currentRoundFixtureIds = new Set(
    fixtures.filter((f) => f.round === currentRound).map((f) => f.id)
  )

  for (const prediction of predictions) {
    if (!currentRoundFixtureIds.has(prediction.fixtureId)) {
      return INVALID_ROUND
    }

    if (!isValidScore(prediction.homeScore) || !isValidScore(prediction.awayScore)) {
      return INVALID_SCORE
    }
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
