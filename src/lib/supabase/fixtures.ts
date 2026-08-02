import type { Fixture } from '@/lib/api/football'
import { createAdminClient } from './admin'

export async function upsertFixtures(fixtures: Fixture[]): Promise<void> {
  const rows = fixtures.map((fixture) => ({
    id: fixture.id,
    round: fixture.round,
    home_team: fixture.homeTeam.name,
    away_team: fixture.awayTeam.name,
    kickoff_time: fixture.startTime,
    status: fixture.status,
    home_score: typeof fixture.homeScore === 'number' ? fixture.homeScore : null,
    away_score: typeof fixture.awayScore === 'number' ? fixture.awayScore : null,
    result_source: fixture.status === 'FT' ? 'api' : null,
    updated_at: new Date().toISOString(),
  }))

  const admin = createAdminClient()
  const { error } = await admin.from('fixtures').upsert(rows, { onConflict: 'id' })

  if (error) {
    throw new Error(`Failed to upsert fixtures: ${error.message}`)
  }
}
