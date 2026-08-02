export interface Profile {
  id: string
  display_name: string
  initials: string | null
  is_admin: boolean
  created_at: string
}

export interface FixtureRow {
  id: number
  round: number
  home_team: string
  away_team: string
  kickoff_time: string
  status: string
  home_score: number | null
  away_score: number | null
  result_source: 'api' | 'admin' | null
  updated_at: string
}

export interface PredictionRow {
  id: string
  user_id: string
  fixture_id: number
  predicted_home_score: number
  predicted_away_score: number
  submitted_at: string
}
