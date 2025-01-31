import { NextResponse } from "next/server"
import { google } from "googleapis"

// Define proper types instead of using 'any'
interface SheetData {
  values: (string | number)[][]
}

export async function GET(): Promise<Response> {
  try {
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    })

    const sheets = google.sheets({ version: 'v4', auth })
    
    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Table!A2:D7' // Adjust range based on your sheet structure
    })

    const rows = response.data.values as SheetData['values']

    // Transform the data into the LeaderboardEntry format
    const leaderboardData = rows.map((row) => ({
      rank: row[0]?.toString() || '',
      player: row[1]?.toString() || '',
      total: row[2]?.toString() || '',
      gameweekTotal: row[3]?.toString() || ''
    }))

    return NextResponse.json(leaderboardData)
  } catch (error) {
    console.error('Leaderboard fetch error:', error)
    return NextResponse.json(
      { error: "Failed to fetch leaderboard data" },
      { status: 500 }
    )
  }
} 