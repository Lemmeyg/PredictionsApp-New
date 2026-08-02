import { NextResponse } from 'next/server'
import { fetchFixtures } from '@/lib/api/football'
import { upsertFixtures } from '@/lib/supabase/fixtures'

// Syncing a full season (~380 fixtures) needs more than the default timeout.
export const maxDuration = 60

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET is not configured')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const authHeader = request.headers.get('authorization')

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const fixtures = await fetchFixtures()
    await upsertFixtures(fixtures)

    return NextResponse.json({ success: true, count: fixtures.length })
  } catch (error) {
    console.error('Fixture sync failed:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
