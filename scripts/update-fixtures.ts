import { fetchFixtures } from '../src/lib/api/football';
import { updateFixturesInGoogleSheets } from '../src/lib/api/sheets';

async function updateFixtures() {
  try {
    console.log('Starting daily fixture update...');
    
    // Fetch fixtures from Football API
    const fixtures = await fetchFixtures();
    console.log(`Fetched ${fixtures.length} fixtures from Football API`);
    
    // Update Google Sheets
    await updateFixturesInGoogleSheets(fixtures);
    console.log('Successfully updated fixtures in Google Sheets');
    
  } catch (error) {
    console.error('Error updating fixtures:', error);
    process.exit(1);
  }
}

// Only run if called directly (not imported)
if (require.main === module) {
  updateFixtures();
} 