//import dotenv from 'dotenv';
import { google } from 'googleapis';
import { JWT } from 'google-auth-library';

//dotenv.config({ path: '.env.local' });

function formatPrivateKey(key: string): string {
  const cleanKey = key.replace(/\\n/g, '').replace(/"/g, '');
  const chunks = cleanKey.match(/.{1,64}/g) || [];
  return [
    '-----BEGIN PRIVATE KEY-----',
    ...chunks,
    '-----END PRIVATE KEY-----'
  ].join('\n');
}

async function testCredentials() {
  try {
    console.log('Testing Google credentials...');

    const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
    if (!privateKey) {
      throw new Error('Private key is missing');
    }

    const formattedKey = formatPrivateKey(privateKey);
    console.log('\nFormatted key structure:');
    console.log(formattedKey.split('\n').length, 'lines');
    
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: formattedKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = await auth.getClient() as JWT;
    const token = await client.authorize();
    
    console.log('\nSuccessfully obtained access token:', {
      tokenType: token.token_type,
      expiryDate: new Date(token.expiry_date!).toISOString(),
    });

  } catch (error) {
    console.error('Credential test failed:', error);
    process.exit(1);
  }
}

testCredentials(); 