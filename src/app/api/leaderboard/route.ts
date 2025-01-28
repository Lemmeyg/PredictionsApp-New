import { getGoogleSheetsAuth } from '@/lib/google-sheets'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

interface LeaderboardEntry {
  rank: string
  player: string
  total: string
  gameweekTotal: string
}

export async function GET() {
  try {
    // Get auth exactly as in working endpoints
    const auth = await getGoogleSheetsAuth()
    const sheets = google.sheets({ version: 'v4', auth })

    // Debug logs
    console.log('Auth initialized')
    console.log('Spreadsheet ID:', process.env.GOOGLE_SHEETS_ID)
    console.log('Attempting to fetch from Table sheet')

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Table!A1:D7',
    })

    if (!response.data.values) {
      console.log('No data found in response')
      return NextResponse.json({ 
        error: 'No leaderboard data found' 
      }, { status: 404 })
    }

    const [headers, ...rows] = response.data.values

    const data = rows.map((row): LeaderboardEntry => ({
      rank: row[0] || '',
      player: row[1] || '',
      total: row[2] || '',
      gameweekTotal: row[3] || ''
    }))

    return NextResponse.json(data)

  } catch (error) {
    // More detailed error logging
    console.error('Leaderboard API Error:', error)
    console.error('Environment variables check:', {
      hasSheetId: !!process.env.GOOGLE_SHEETS_ID,
      hasClientEmail: !!process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_SHEETS_PRIVATE_KEY,
    })

    return NextResponse.json(
      { 
        error: 'Failed to fetch leaderboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
} 