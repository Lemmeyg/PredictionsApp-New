import { NextResponse } from "next/server"
import { google } from "googleapis"

export async function GET() {
  try {
    // Add debug logging
    console.log('Starting leaderboard fetch...');
    
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    console.log('Auth initialized');

    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('Sheets client created');
    
    // Log spreadsheet ID (redacted)
    console.log('Using spreadsheet ID:', process.env.GOOGLE_SHEET_ID?.substring(0, 5) + '...');

    // Fetch data from Google Sheets
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Table!A2:D7'
    });

    console.log('Sheets API response received:', {
      hasData: !!response.data.values,
      rowCount: response.data.values?.length
    });

    const rows = response.data.values || [];
    const leaderboardData = rows.map((row) => ({
      rank: row[0]?.toString() || '',
      player: row[1]?.toString() || '',
      total: row[2]?.toString() || '',
      gameweekTotal: row[3]?.toString() || ''
    }));

    return NextResponse.json(leaderboardData);
  } catch (error: any) {
    // Enhanced error logging
    console.error('Leaderboard fetch error:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      // Log environment variable presence (not values)
      env: {
        hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        hasSheetId: !!process.env.GOOGLE_SHEET_ID
      }
    });

    return NextResponse.json(
      { 
        error: "Failed to fetch leaderboard data",
        details: error.message // Add error details to response
      },
      { status: 500 }
    );
  }
} 