import { fetchFixtures } from '../src/lib/api/football';
//import dotenv from 'dotenv';

// Load environment variables from .env.local
//dotenv.config({ path: '.env.local' });

async function testFootballApi() {
  try {
    console.log('Testing Football API integration...');
    console.log('Fetching fixtures...');
    
    const fixtures = await fetchFixtures();
    
    console.log('\nAPI call successful! ✅');
    console.log(`Retrieved ${fixtures.length} fixtures`);
    
    // Log sample fixture
    if (fixtures.length > 0) {
      console.log('\nSample fixture:');
      console.log(JSON.stringify(fixtures[0], null, 2));
    }

    // Verify required fields
    const requiredFields = ['id', 'round', 'date', 'startTime', 'homeTeam', 'awayTeam', 'status'];
    const missingFields = fixtures.flatMap(fixture => 
      requiredFields.filter(field => !(field in fixture))
    );

    if (missingFields.length > 0) {
      console.error('\n❌ Missing required fields:', [...new Set(missingFields)]);
    } else {
      console.log('\n✅ All required fields present');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testFootballApi(); 