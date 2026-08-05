import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { WeeklyScoreEntry } from '@/lib/hof/weekly-scores'

export function WeeklyHighScoresTable({ data }: { data: WeeklyScoreEntry[] }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No weekly scores recorded yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary">Season</TableHead>
            <TableHead className="text-primary">Week</TableHead>
            <TableHead className="text-primary">Player</TableHead>
            <TableHead className="text-primary">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry, index) => (
            <TableRow key={`${entry.season}-${entry.weekNumber}-${entry.playerName}-${index}`}>
              <TableCell>{entry.season}</TableCell>
              <TableCell>{entry.weekNumber}</TableCell>
              <TableCell>{entry.playerName}</TableCell>
              <TableCell>{entry.score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
