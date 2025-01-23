import { NextResponse } from 'next/server'
import { getGameWeekFixtures } from '@/lib/api/sheets'

export async function GET() {
  console.log('API route called')
  try {
    const fixtures = await getGameWeekFixtures()
    console.log('Fixtures fetched:', fixtures)
    return NextResponse.json(fixtures)
  } catch (error) {
    console.error('API route error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fixtures' },
      { status: 500 }
    )
  }
} 