import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface LeaderboardEntry {
  rank: string
  player: string
  total: string
  gameweekTotal: string
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
}

export function LeaderboardTable({ data }: LeaderboardTableProps) {
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] text-center text-yellow-500 font-semibold">Rank</TableHead>
            <TableHead className="text-yellow-500 font-semibold">Player</TableHead>
            <TableHead className="text-right text-yellow-500 font-semibold">Total</TableHead>
            <TableHead className="text-right text-yellow-500 font-semibold">GW Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => (
            <TableRow key={entry.player}>
              <TableCell className="text-center text-yellow-500 font-semibold">{entry.rank}</TableCell>
              <TableCell>{entry.player}</TableCell>
              <TableCell className="text-right">{entry.total}</TableCell>
              <TableCell className="text-right">{entry.gameweekTotal}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 