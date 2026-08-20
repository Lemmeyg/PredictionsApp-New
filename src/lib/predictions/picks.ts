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

function resolveInitials(profile: Profile | undefined): string {
  return profile?.initials ?? profile?.display_name.slice(0, 2).toUpperCase() ?? '??'
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
    .map((p) => ({
      profileId: p.user_id,
      initials: resolveInitials(profilesById.get(p.user_id)),
      column: columnForPrediction(p),
    }))
}

export interface PlayerPick {
  profileId: string
  initials: string
  column: PickColumn
  predictedHomeScore: number
  predictedAwayScore: number
}

/**
 * Every player's predicted outcome for a fixture, including the viewer's
 * own pick and predicted score. Used by the read-only Weekly Watcher view.
 */
export function getAllPlayersPicks(
  fixtureId: number,
  predictions: PredictionRow[],
  profiles: Profile[]
): PlayerPick[] {
  const profilesById = new Map(profiles.map((p) => [p.id, p]))

  return predictions
    .filter((p) => p.fixture_id === fixtureId)
    .map((p) => ({
      profileId: p.user_id,
      initials: resolveInitials(profilesById.get(p.user_id)),
      column: columnForPrediction(p),
      predictedHomeScore: p.predicted_home_score,
      predictedAwayScore: p.predicted_away_score,
    }))
}
