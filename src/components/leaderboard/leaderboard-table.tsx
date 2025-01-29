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
  username: string;
  player: string;    // Add this field
  total: number;        // Required by the table
  gameweekTotal: number; // Required by the table
  // ... any other fields
}

export function LeaderboardTable({ data }: { data: LeaderboardEntry[] }) {
  return (
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
  )
} 