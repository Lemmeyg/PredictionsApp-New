import { getGameWeekFixtures } from '@/lib/api/sheets'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('Starting gameweek fixtures request...')
    const fixtures = await getGameWeekFixtures()
    
    if (!fixtures || fixtures.length === 0) {
      return NextResponse.json({ 
        error: 'No fixtures found' 
      }, { status: 404 })
    }

    return NextResponse.json(fixtures)
  } catch (error) {
    console.error('Gameweek API Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch fixtures',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
} 