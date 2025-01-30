import { NextResponse } from 'next/server'
import { getGameWeekFixtures } from '@/lib/api/sheets'

export async function GET() {
  try {
    const fixtures = await getGameWeekFixtures()
    
    // Ensure fixtures is an array before mapping
    if (!Array.isArray(fixtures)) {
      console.error('Fixtures is not an array:', fixtures)
      return NextResponse.json({ data: [] }, { status: 200 })
    }

    return NextResponse.json({ data: fixtures }, { status: 200 })
  } catch (error) {
    console.error('Leaderboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
} 