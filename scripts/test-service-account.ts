import dotenv from 'dotenv';
import { google } from 'googleapis';
import { GoogleAuth, JWT } from 'google-auth-library';

dotenv.config({ path: '.env.local' });

// Define the credentials interface
interface ServiceAccountCredentials {
  type: string;
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
  universe_domain: string;
}

// Define the required fields type explicitly
type RequiredField = 'type' | 'project_id' | 'private_key_id' | 'private_key' | 
                    'client_email' | 'client_id' | 'auth_uri' | 'token_uri';

async function testServiceAccount() {
  try {
    console.log('Testing service account authentication...');

    console.log('Configuration:', {
      sheetId: process.env.GOOGLE_SHEET_ID,
      serviceAccount: process.env.GOOGLE_CLIENT_EMAIL,
      projectId: process.env.GOOGLE_PROJECT_ID
    });

    const credentials: ServiceAccountCredentials = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID!,
      private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID!,
      private_key: process.env.GOOGLE_PRIVATE_KEY!,
      client_email: process.env.GOOGLE_CLIENT_EMAIL!,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      auth_uri: process.env.GOOGLE_AUTH_URI!,
      token_uri: process.env.GOOGLE_TOKEN_URI!,
      auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL!,
      client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL!,
      universe_domain: 'googleapis.com'
    };

    console.log('\nVerifying credentials structure...');
    const requiredFields: RequiredField[] = [
      'type', 'project_id', 'private_key_id', 'private_key', 
      'client_email', 'client_id', 'auth_uri', 'token_uri'
    ];
    
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required credentials: ${missingFields.join(', ')}`);
    }

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const client = await auth.getClient() as JWT;
    
    const sheets = google.sheets({
      version: 'v4',
      auth: client as any
    });

    console.log('\nTesting sheet access...');
    const testResponse = await sheets.spreadsheets.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID
    });

    console.log('\nSuccessfully accessed spreadsheet:', {
      title: testResponse.data.properties?.title,
      sheets: testResponse.data.sheets?.length
    });

  } catch (error) {
    console.error('Service account test failed:', error);
    process.exit(1);
  }
}

testServiceAccount(); 