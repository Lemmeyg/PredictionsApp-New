import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testFixtures() {
  try {
    console.log('Fetching Premier League fixtures for 2024/2025 season...\n');

    const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
      headers: {
        'x-rapidapi-host': 'v3.football.api-sports.io',
        'x-rapidapi-key': process.env.FOOTBALL_API_KEY,
        'x-apisports-key': process.env.FOOTBALL_API_KEY,
      },
      params: {
        league: 39, // Premier League
        season: 2024,
      }
    });

    const fixtures = response.data.response;
    
    if (!fixtures || fixtures.length === 0) {
      console.log('No fixtures found for the 2024/2025 season. This might be because:');
      console.log('1. The fixtures haven\'t been released yet');
      console.log('2. The API hasn\'t been updated with the new season');
      console.log('\nTrying 2023/2024 season for comparison...');
      
      // Try current season
      const currentResponse = await axios.get('https://v3.football.api-sports.io/fixtures', {
        headers: {
          'x-rapidapi-host': 'v3.football.api-sports.io',
          'x-rapidapi-key': process.env.FOOTBALL_API_KEY,
          'x-apisports-key': process.env.FOOTBALL_API_KEY,
        },
        params: {
          league: 39,
          season: 2023,
        }
      });

      const currentFixtures = currentResponse.data.response;
      console.log(`\nFound ${currentFixtures.length} fixtures for 2023/2024 season`);
      
      // Display sample of current season fixtures
      console.log('\nSample of current season fixtures:');
      currentFixtures.slice(0, 3).forEach((fixture: any) => {
        console.log(`\n${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
        console.log(`Round: ${fixture.league.round}`);
        console.log(`Date: ${new Date(fixture.fixture.date).toLocaleDateString()}`);
        console.log(`Status: ${fixture.fixture.status.long}`);
      });
    } else {
      console.log(`Found ${fixtures.length} fixtures for 2024/2025 season`);
      
      // Display first few fixtures
      console.log('\nSample fixtures:');
      fixtures.slice(0, 3).forEach((fixture: any) => {
        console.log(`\n${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
        console.log(`Round: ${fixture.league.round}`);
        console.log(`Date: ${new Date(fixture.fixture.date).toLocaleDateString()}`);
        console.log(`Status: ${fixture.fixture.status.long}`);
      });
    }

    // Display API response metadata
    console.log('\nAPI Response Metadata:');
    console.log('Current Page:', response.data.paging?.current);
    console.log('Total Pages:', response.data.paging?.total);
    console.log('Total Results:', response.data.results);

  } catch (error: any) {
    console.error('Error fetching fixtures:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      errors: error.response?.data?.errors,
    });
  }
}

testFixtures(); 