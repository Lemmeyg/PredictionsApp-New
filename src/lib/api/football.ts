import axios from 'axios';
//import { config } from 'dotenv';

// Export the Fixture interface
export interface Fixture {
  id: number;
  date: string;
  startTime: string;
  round: number;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  status: string;
  homeScore: number | string;
  awayScore: number | string;
}

// Load environment variables from .env.local
//config({ path: resolve(process.cwd(), '.env.local') });

// Constants
const PREMIER_LEAGUE_ID = 39;
const SEASON = Number(process.env.FOOTBALL_API_SEASON ?? '2026');
const FOOTBALL_API_BASE_URL = 'https://v3.football.api-sports.io';

// Initialize API client
const footballApiClient = axios.create({
  baseURL: FOOTBALL_API_BASE_URL,
  headers: {
    'x-rapidapi-host': 'v3.football.api-sports.io',
    'x-rapidapi-key': process.env.FOOTBALL_API_KEY
  }
});

export async function fetchFixtures(): Promise<Fixture[]> {
  try {
    const response = await footballApiClient.get('/fixtures', {
      params: {
        league: PREMIER_LEAGUE_ID,
        season: SEASON,
      },
    });

    if (!response.data?.response) {
      throw new Error('Invalid API response structure from football API');
    }

    const fixtures = response.data.response.map((item) => {
      // Extract round number from "Regular Season - 38" format
      const roundMatch = item.league.round.match(/Regular Season - (\d+)/);
      const round = roundMatch ? parseInt(roundMatch[1], 10) : 0;
      
      return {
        id: item.fixture.id,
        date: item.fixture.date.split('T')[0],
        startTime: item.fixture.date,
        round: round,                // Will be the number (e.g., 38) from "Regular Season - 38"
        homeTeam: {
          id: item.teams.home.id,
          name: item.teams.home.name,
        },
        awayTeam: {
          id: item.teams.away.id,
          name: item.teams.away.name,
        },
        status: item.fixture.status.short,
        homeScore: item.goals.home ?? '',
        awayScore: item.goals.away ?? '',
      };
    });

    console.log(`Fetched ${fixtures.length} fixtures`);
    return fixtures;

  } catch (error: unknown) {
    console.error('Error in fetchFixtures:', error);
    // Rethrow so a failed sync surfaces as an error to the caller rather than
    // being silently reported as a successful sync of zero fixtures.
    throw error;
  }
}
