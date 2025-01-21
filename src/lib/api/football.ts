import axios from 'axios';
import { Fixture, FootballAPIResponse } from '../types/fixtures';

const FOOTBALL_API_BASE_URL = 'https://v3.football.api-sports.io';
const PREMIER_LEAGUE_ID = 39;
const SEASON = 2024; // Current season is 2023/2024

const footballApiClient = axios.create({
  baseURL: FOOTBALL_API_BASE_URL,
  headers: {
    // The API requires these specific headers
    'x-rapidapi-host': 'v3.football.api-sports.io',
    'x-rapidapi-key': process.env.FOOTBALL_API_KEY,
    'x-apisports-key': process.env.FOOTBALL_API_KEY, // API-Football specific header
  },
});

export async function fetchFixtures(): Promise<Fixture[]> {
  try {
    console.log('Sending request to Football API...');
    
    const response = await footballApiClient.get<FootballAPIResponse>('/fixtures', {
      params: {
        league: PREMIER_LEAGUE_ID,
        season: SEASON,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.data?.response) {
      throw new Error('Invalid response format from Football API');
    }

    return response.data.response.map((item) => ({
      id: item.fixture.id,
      round: parseInt(item.league.round.split(' ')[1]), // Convert "Round 1" to 1
      date: item.fixture.date.split('T')[0],
      startTime: item.fixture.date,
      homeTeam: {
        id: item.teams.home.id,
        name: item.teams.home.name,
      },
      awayTeam: {
        id: item.teams.away.id,
        name: item.teams.away.name,
      },
      status: item.fixture.status.short,
      homeScore: item.goals.home ?? undefined,
      awayScore: item.goals.away ?? undefined,
    }));
  } catch (error: any) {
    console.error('[Football API] Error details:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    throw new Error(`Failed to fetch fixtures: ${error.message}`);
  }
} 