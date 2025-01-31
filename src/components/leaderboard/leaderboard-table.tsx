'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export interface LeaderboardEntry {
  rank: string;
  player: string;
  total: string | number;
  gameweekTotal: string | number;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
}

export function LeaderboardTable({ data }: LeaderboardTableProps) {
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