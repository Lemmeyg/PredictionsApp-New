export interface Fixture {
  id: number;
  round: number;
  date: string;
  startTime: string;
  homeTeam: {
    id: number;
    name: string;
  };
  awayTeam: {
    id: number;
    name: string;
  };
  status: string;
  homeScore?: number;
  awayScore?: number;
}

export interface FootballAPIResponse {
  response: {
    fixture: {
      id: number;
      date: string;
      status: {
        short: string;
      };
    };
    league: {
      round: string;
    };
    teams: {
      home: {
        id: number;
        name: string;
      };
      away: {
        id: number;
        name: string;
      };
    };
    goals: {
      home: number | null;
      away: number | null;
    };
  }[];
} 