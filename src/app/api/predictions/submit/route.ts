import { google } from 'googleapis';
import { verifyEnvVariables } from '@/lib/api/sheets';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Verify we have a request body
    if (!request.body) {
      return NextResponse.json(
        { success: false, message: 'No request body provided' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Verify predictions exist in the body
    if (!body.predictions || !Array.isArray(body.predictions)) {
      return NextResponse.json(
        { success: false, message: 'Invalid predictions format' },
        { status: 400 }
      );
    }

    const { predictions } = body;
    console.log('Received predictions:', predictions);

    // Verify environment variables
    verifyEnvVariables();

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Format data for sheet
    const rows = predictions.map(pred => [
      pred.userName,
      pred.fixtureId,
      pred.homeTeam,
      pred.awayTeam,
      pred.homeScore,
      pred.awayScore,
      pred.round,
      pred.submittedAt
    ]);

    console.log('Formatted rows:', rows);

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'Predictions!A:G',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows
      }
    });

    // Always return a response
    return NextResponse.json({ 
      success: true, 
      message: 'Predictions submitted successfully' 
    });

  } catch (error) {
    console.error('Error submitting predictions:', error);
    
    // Ensure we return a response even in error cases
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to submit predictions',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 