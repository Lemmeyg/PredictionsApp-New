import type { FixtureRow } from '@/lib/supabase/database.types'
import { FINISHED_STATUSES } from './gameweek'

export type FormResult = 'W' | 'L' | 'D'

export interface FormEntry {
  result: FormResult
  venue: 'H' | 'A'
}

const DEFAULT_LIMIT = 5

/**
 * A team's last `limit` finished results this season, oldest first (so the
 * most recent result is last -- rendered rightmost per the form-squares UI).
 */
export function getRecentForm(
  teamName: string,
  fixtures: FixtureRow[],
  limit: number = DEFAULT_LIMIT
): FormEntry[] {
  const teamFixtures = fixtures
    .filter(
      (f) =>
        (f.home_team === teamName || f.away_team === teamName) &&
        FINISHED_STATUSES.includes(f.status) &&
        f.home_score !== null &&
        f.away_score !== null
    )
    .sort((a, b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime())
    .slice(0, limit)

  return teamFixtures
    .map((fixture): FormEntry => {
      const isHome = fixture.home_team === teamName
      const teamScore = (isHome ? fixture.home_score : fixture.away_score) as number
      const opponentScore = (isHome ? fixture.away_score : fixture.home_score) as number

      let result: FormResult
      if (teamScore > opponentScore) {
        result = 'W'
      } else if (teamScore < opponentScore) {
        result = 'L'
      } else {
        result = 'D'
      }

      return { result, venue: isHome ? 'H' : 'A' }
    })
    .reverse()
}
