import type { FixtureRow, PredictionRow } from '@/lib/supabase/database.types'

export function getSubmittedRounds(
  fixtures: FixtureRow[],
  predictions: PredictionRow[],
  userId: string
): number[] {
  const roundByFixtureId = new Map(fixtures.map((f) => [f.id, f.round]))
  const rounds = new Set<number>()

  for (const prediction of predictions) {
    if (prediction.user_id !== userId) continue
    const round = roundByFixtureId.get(prediction.fixture_id)
    if (round !== undefined) rounds.add(round)
  }

  return Array.from(rounds).sort((a, b) => b - a)
}
