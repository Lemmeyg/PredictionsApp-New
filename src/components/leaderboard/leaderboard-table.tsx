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
  total: string | number;
  gameweekTotal: string | number;
}

export function LeaderboardTable() {
  const [data, setData] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    const controller = new AbortController();

    fetch('/api/leaderboard', { signal: controller.signal })
      .then(res => res.json())
      .then(result => setData(result))
      .catch(error => {
        if (error.name === 'AbortError') return;
        console.error('Error fetching leaderboard:', error);
        setData([]);
      });

    return () => controller.abort();
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
          {data?.map((entry) => (
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