import axios from 'axios';

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

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: {
    fullTime: {
      home: number | null;
      away: number | null;
    };
  };
}

// Constants
const COMPETITION_CODE = 'PL'; // Premier League
const SEASON = Number(process.env.FOOTBALL_DATA_SEASON ?? '2026');
const FOOTBALL_DATA_BASE_URL = 'https://api.football-data.org/v4';

// football-data.org status vocabulary -> this app's internal status codes.
// Keeping this mapping isolated here means gameweek.ts, fixtures.ts, and the
// admin override action never need to know which provider is behind them.
const STATUS_MAP: Record<string, string> = {
  SCHEDULED: 'NS',
  TIMED: 'NS',
  IN_PLAY: 'LIVE',
  PAUSED: 'LIVE',
  SUSPENDED: 'SUSP',
  FINISHED: 'FT',
  POSTPONED: 'PST',
  CANCELLED: 'CANC',
  AWARDED: 'AWD',
};

function mapStatus(providerStatus: string): string {
  return STATUS_MAP[providerStatus] ?? providerStatus;
}

// Initialize API client
const footballDataClient = axios.create({
  baseURL: FOOTBALL_DATA_BASE_URL,
  headers: {
    'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY,
  },
});

export async function fetchFixtures(): Promise<Fixture[]> {
  try {
    const response = await footballDataClient.get(`/competitions/${COMPETITION_CODE}/matches`, {
      params: {
        season: SEASON,
      },
    });

    const matches: FootballDataMatch[] = response.data?.matches;

    if (!matches) {
      throw new Error('Invalid API response structure from football-data.org');
    }

    const fixtures = matches.map((match) => ({
      id: match.id,
      date: match.utcDate.split('T')[0],
      startTime: match.utcDate,
      round: match.matchday,
      homeTeam: {
        id: match.homeTeam.id,
        name: match.homeTeam.name,
      },
      awayTeam: {
        id: match.awayTeam.id,
        name: match.awayTeam.name,
      },
      status: mapStatus(match.status),
      homeScore: match.score.fullTime.home ?? '',
      awayScore: match.score.fullTime.away ?? '',
    }));

    console.log(`Fetched ${fixtures.length} fixtures`);
    return fixtures;

  } catch (error: unknown) {
    console.error('Error in fetchFixtures:', error);
    // Rethrow so a failed sync surfaces as an error to the caller rather than
    // being silently reported as a successful sync of zero fixtures.
    throw error;
  }
}
