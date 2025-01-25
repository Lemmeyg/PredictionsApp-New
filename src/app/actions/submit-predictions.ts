'use server'

import { google } from 'googleapis';
import { getGoogleSheetsAuth } from '@/lib/google-sheets';

// Add the interface definition
interface PredictionSubmission {
  userName: string;
  predictions: {
    fixtureId: number;
    homeTeam: string;
    awayTeam: string;
    homeTeamScore: number;
    awayTeamScore: number;
    round: number;
  }[];
}

export async function submitPredictions({ userName, predictions }: PredictionSubmission) {
  try {
    console.log('Starting prediction submission for:', userName);
    const auth = await getGoogleSheetsAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const currentDate = new Date().toISOString().split('T')[0];
    const rows = predictions.map(pred => [
      userName,
      pred.fixtureId,
      pred.homeTeam,
      pred.awayTeam,
      pred.homeTeamScore,
      pred.awayTeamScore,
      pred.round,
      currentDate
    ]);

    // Log the data being sent
    console.log('Submitting predictions to sheet:', rows);

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEETS_ID,
      range: 'predictions', // Make sure this matches your sheet name exactly
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: rows
      }
    });

    console.log('Google Sheets response:', response.data);

    if (response.status !== 200) {
      throw new Error(`Failed to submit predictions: ${response.statusText}`);
    }

    return {
      success: true,
      message: 'Predictions submitted successfully',
      predictions: predictions,
      round: predictions[0]?.round,
      date: currentDate
    };

  } catch (error) {
    console.error('Failed to submit predictions:', error);
    throw error; // Re-throw to handle in the component
  }
} 