import crypto from 'crypto';

// Enable legacy OpenSSL provider
crypto.constants.OPENSSL_VERSION_NUMBER;

import { fetchFixtures } from '../src/lib/api/football';
import { updateFixturesInGoogleSheets } from '../src/lib/api/sheets';
// this script will import data from the football api and update the google sheets
export async function updateFixtures() {
  try {
    console.log('Starting daily fixture update...');
    
    // Fetch fixtures from Football API
    const fixtures = await fetchFixtures();
    console.log(`Fetched ${fixtures.length} fixtures from Football API`);
    
    // Update Google Sheets
    await updateFixturesInGoogleSheets(fixtures);
    console.log('Successfully updated fixtures in Google Sheets');
    
    return true;
    
  } catch (error) {
    console.error('Error updating fixtures:', error);
    throw error;
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  updateFixtures()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

// Make sure we're exporting the function as default as well
export default updateFixtures; 