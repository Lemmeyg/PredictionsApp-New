import { google } from 'googleapis';
//import { config } from 'dotenv';
import { JWT } from 'google-auth-library';
import type { Fixture } from './football';  // Add 'type' to import only the type
//import { getGoogleCredentials } from '../google/auth';

// Load environment variables from .env.local
//config({ path: resolve(process.cwd(), '.env.local') });

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
const SHEET_NAME = 'Fixtures';

// Debug environment variables
console.log('Environment variables loaded:', {
  hasClientEmail: !!process.env.GOOGLE_CLIENT_EMAIL,
  hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
});

// Verify environment variables are loaded
export function verifyEnvVariables() {
  const required = {
    GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Verify environment variables before creating client
verifyEnvVariables();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

//const credentials = getGoogleCredentials();

const auth = new JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: SCOPES,
});

// Create and export the sheets client
const sheets = google.sheets({ version: 'v4', auth });

/**
 * Clears fixture data while preserving headers and formatting
 */
export async function testClearFixtures(): Promise<void> {
  try {
    // First, get the current sheet data to determine the range to clear
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`, // Assuming columns A through H contain our data
    });

    const values = response.data.values;
    if (!values || values.length <= 1) {
      console.log('No data to clear or only headers present');
      return;
    }

    // Clear data starting from row 2 (preserve headers) for all relevant columns
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2:H${values.length}`, // Clear from row 2 to last row
      requestBody: {},
    });

    console.log(`Cleared ${values.length - 1} rows of fixture data`);

  } catch (error) {
    console.error('Error clearing fixtures:', error);
    throw error;
  }
}

/**
 * Helper function to format the private key if needed
 */
export function formatPrivateKey(key: string): string {
  const cleanKey = key.replace(/\\n/g, '\n').replace(/"/g, '');
  return cleanKey.includes('BEGIN PRIVATE KEY') ? 
    cleanKey : 
    `-----BEGIN PRIVATE KEY-----\n${cleanKey}\n-----END PRIVATE KEY-----`;
}

export async function updateFixturesInGoogleSheets(fixtures: Fixture[]): Promise<void> {
  try {
    console.log('Starting Google Sheets update with', fixtures.length, 'fixtures');
    
    // Update function call to match the new name
    await clearFixtures();  // Changed from testClearFixtures to clearFixtures

    // Transform fixtures into rows for Google Sheets
    const values = fixtures.map(fixture => [
      fixture.id,                    // Fixture ID
      fixture.date,                  // Date (YYYY-MM-DD)
      fixture.startTime,             // Full datetime
      fixture.round,                 // Round number
      fixture.homeTeam.name,         // Home Team
      fixture.awayTeam.name,         // Away Team
      fixture.homeScore ?? '',       // Home Score
      fixture.awayScore ?? '',       // Away Score
      fixture.status,                // Status
    ]);

    // Update the sheet with new values
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A2`,
      valueInputOption: 'RAW',
      requestBody: {
        values,
      },
    });

    console.log(`Successfully updated ${values.length} fixtures in Google Sheets`);
  } catch (error) {
    console.error('Error updating fixtures in Google Sheets:', error);
    throw error;
  }
}

// Renamed function (was testClearFixtures)
async function clearFixtures(): Promise<void> {
  // ... rest of the clear function code ...
}

export async function getGameWeekFixtures() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'GameWeek!A:F',
    })

    const rows = response.data.values

    if (!rows || rows.length === 0) {
      return []
    }

    // Skip header row and map only rows with valid data
    return rows
      .slice(1)
      .filter(row => row[0] && row[4] && row[5])
      .map(row => ({
        id: row[0],
        homeTeam: row[4].trim(),
        awayTeam: row[5].trim()
      }))

  } catch (error) {
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      config: error.config
    })
    throw error
  }
} 