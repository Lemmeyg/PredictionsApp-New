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
  username: string;
  player: string;    // Add this field
  total: number;        // Required by the table
  gameweekTotal: number; // Required by the table
  // ... any other fields
}

interface LeaderboardData {
  data: any[] // Replace 'any' with your specific type
}

export function LeaderboardTable() {
  const [data, setData] = useState<LeaderboardData['data']>([])

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then((result: LeaderboardData) => {
        if (Array.isArray(result.data)) {
          setData(result.data)
        } else {
          console.error('Invalid data format:', result)
          setData([])
        }
      })
      .catch(error => {
        console.error('Error fetching leaderboard:', error)
        setData([])
      })
  }, [])

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Gameweek</TableHead>
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