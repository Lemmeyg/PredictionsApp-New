//this script is to test the clear fixtures function, clearing cells on the google Fixtures sheet.
//import dotenv from 'dotenv';
import path from 'path';

// Load environment variables BEFORE any other imports
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Loading environment variables from:', envPath);

//const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('Error loading .env.local file:', result.error);
  process.exit(1);
}

// Now we can import modules that depend on environment variables
import { testClearFixtures } from '../src/lib/api/sheets';

// Verify environment variables are loaded
console.log('Environment check:', {
  has_client_email: !!process.env.GOOGLE_CLIENT_EMAIL,
  has_private_key: !!process.env.GOOGLE_PRIVATE_KEY,
  client_email: process.env.GOOGLE_CLIENT_EMAIL, // Log the actual email (for debugging)
  cwd: process.cwd(),
});

async function runTest() {
  try {
    console.log('Starting test to clear fixtures data...');
    await testClearFixtures();
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTest(); 