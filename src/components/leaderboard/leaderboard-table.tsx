'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useState, useEffect } from 'react'

export interface LeaderboardEntry {
  rank: string;
  player: string;
  total: string;
  gameweekTotal: string;
}

export function LeaderboardTable() {
  const [data, setData] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then((result) => {
        // Ensure we're working with the array directly
        if (!Array.isArray(result)) {
          console.error('Expected array, got:', result);
          return;
        }

        // Explicitly map the data to match our interface
        const formattedData = result.map((item): LeaderboardEntry => ({
          rank: String(item.rank),
          player: String(item.player),
          total: String(item.total),
          gameweekTotal: String(item.gameweekTotal)
        }));

        setData(formattedData);
      })
      .catch(error => {
        console.error('Error fetching leaderboard:', error);
        setData([]);
      });
  }, []);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary">Rank</TableHead>
            <TableHead className="text-primary">Player</TableHead>
            <TableHead className="text-primary">Total</TableHead>
            <TableHead className="text-primary">Gameweek</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => (
            <TableRow key={entry.rank}>
              <TableCell>{entry.rank}</TableCell>
              <TableCell>{entry.player}</TableCell>
              <TableCell>{entry.total}</TableCell>
              <TableCell>{entry.gameweekTotal}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 