import { google } from 'googleapis';

export async function getGoogleSheetsAuth() {
  try {
    // Validate environment variables before proceeding
    if (!process.env.GOOGLE_CLIENT_EMAIL) {
      throw new Error('GOOGLE_CLIENT_EMAIL is not configured in environment variables');
    }

    if (!process.env.GOOGLE_PRIVATE_KEY) {
      throw new Error('GOOGLE_PRIVATE_KEY is not configured in environment variables');
    }

    if (!process.env.GOOGLE_SHEETS_ID) {
      throw new Error('GOOGLE_SHEETS_ID is not configured in environment variables');
    }

    // Log the first few characters of each credential to verify they're loaded
    console.log('Credentials check:', {
      sheetId: process.env.GOOGLE_SHEETS_ID.substring(0, 5) + '...',
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL.substring(0, 5) + '...',
      privateKeyLength: process.env.GOOGLE_PRIVATE_KEY.length
    });

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return auth;
  } catch (error) {
    console.error('Google Sheets Authentication Error:', error);
    throw error;
  }
} 