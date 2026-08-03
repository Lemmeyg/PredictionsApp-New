import type { PredictionRow, Profile } from '@/lib/supabase/database.types'

export type PickColumn = 'home' | 'draw' | 'away'

export interface OtherPlayerPick {
  profileId: string
  initials: string
  column: PickColumn
}

function columnForPrediction(prediction: PredictionRow): PickColumn {
  if (prediction.predicted_home_score > prediction.predicted_away_score) return 'home'
  if (prediction.predicted_home_score < prediction.predicted_away_score) return 'away'
  return 'draw'
}

/**
 * Every other player's predicted outcome for a fixture (excluding the
 * viewer's own pick, which is already visible via the score inputs).
 */
export function getOtherPlayersPicks(
  fixtureId: number,
  viewerProfileId: string,
  predictions: PredictionRow[],
  profiles: Profile[]
): OtherPlayerPick[] {
  const profilesById = new Map(profiles.map((p) => [p.id, p]))

  return predictions
    .filter((p) => p.fixture_id === fixtureId && p.user_id !== viewerProfileId)
    .map((p) => {
      const profile = profilesById.get(p.user_id)
      const initials = profile?.initials ?? profile?.display_name.slice(0, 2).toUpperCase() ?? '??'

      return {
        profileId: p.user_id,
        initials,
        column: columnForPrediction(p),
      }
    })
}
