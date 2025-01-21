import { google } from 'googleapis';
import { Fixture } from '../types/fixtures';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const FIXTURES_RANGE = 'Fixtures!A2:H'; // Adjust range as needed

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: SCOPES,
  });

  return auth.getClient();
}

export async function updateFixturesInGoogleSheets(fixtures: Fixture[]) {
  try {
    const authClient = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // Clear existing data
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: FIXTURES_RANGE,
    });

    // Prepare new data
    const values = fixtures.map(fixture => [
      fixture.id,
      fixture.homeTeam.name,
      fixture.awayTeam.name,
      fixture.round,
      fixture.status,
      fixture.startTime,
      fixture.homeScore || '',
      fixture.awayScore || '',
    ]);

    // Update with new data
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: FIXTURES_RANGE,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });
  } catch (error) {
    console.error('[Google Sheets] Error updating fixtures:', error);
    throw new Error('Failed to update fixtures in Google Sheets');
  }
} 