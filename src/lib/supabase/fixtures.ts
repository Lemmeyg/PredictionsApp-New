import type { Fixture } from '@/lib/api/football'
import { createAdminClient } from './admin'

/** The result fields of a fixture that an admin has manually entered. */
interface AdminResult {
  status: string
  home_score: number | null
  away_score: number | null
  result_source: string | null
}

/**
 * Build the row to upsert for one fixture.
 *
 * If an admin manually entered a result and the API still has no official one
 * (status !== 'FT'), the admin's scoreline is preserved and only the
 * descriptive fields are refreshed. Once the API reports 'FT', the official
 * result supersedes the admin's stand-in.
 */
function buildRow(fixture: Fixture, adminResults: Map<number, AdminResult>) {
  const base = {
    id: fixture.id,
    round: fixture.round,
    home_team: fixture.homeTeam.name,
    away_team: fixture.awayTeam.name,
    kickoff_time: fixture.startTime,
    updated_at: new Date().toISOString(),
  }

  const adminResult = adminResults.get(fixture.id)

  if (adminResult && fixture.status !== 'FT') {
    return {
      ...base,
      status: adminResult.status,
      home_score: adminResult.home_score,
      away_score: adminResult.away_score,
      result_source: adminResult.result_source,
    }
  }

  return {
    ...base,
    status: fixture.status,
    home_score: typeof fixture.homeScore === 'number' ? fixture.homeScore : null,
    away_score: typeof fixture.awayScore === 'number' ? fixture.awayScore : null,
    result_source: fixture.status === 'FT' ? 'api' : null,
  }
}

export async function upsertFixtures(fixtures: Fixture[]): Promise<void> {
  if (fixtures.length === 0) {
    return
  }

  const admin = createAdminClient()

  const { data: existing, error: existingError } = await admin
    .from('fixtures')
    .select('id, status, home_score, away_score, result_source')
    .in(
      'id',
      fixtures.map((f) => f.id)
    )
    .eq('result_source', 'admin')

  if (existingError) {
    throw new Error(`Failed to read existing fixtures: ${existingError.message}`)
  }

  const adminResults = new Map<number, AdminResult>(
    (existing ?? []).map((row) => [
      row.id as number,
      {
        status: row.status as string,
        home_score: row.home_score as number | null,
        away_score: row.away_score as number | null,
        result_source: row.result_source as string | null,
      },
    ])
  )

  const rows = fixtures.map((fixture) => buildRow(fixture, adminResults))

  const { error } = await admin.from('fixtures').upsert(rows, { onConflict: 'id' })

  if (error) {
    throw new Error(`Failed to upsert fixtures: ${error.message}`)
  }
}
