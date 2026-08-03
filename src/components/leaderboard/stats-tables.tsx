import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { RoundScore, WeeksWonEntry } from '@/lib/predictions/round-scores'

export function TopGameweekScoresTable({ scores }: { scores: RoundScore[] }) {
  if (scores.length === 0) {
    return <p className="text-muted-foreground text-sm">No completed rounds yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary">Player</TableHead>
            <TableHead className="text-primary">Round</TableHead>
            <TableHead className="text-primary">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {scores.map((score, index) => (
            <TableRow key={`${score.profileId}-${score.round}-${index}`}>
              <TableCell>{score.displayName}</TableCell>
              <TableCell>{score.round}</TableCell>
              <TableCell>{score.points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function WeeksWonTable({ entries }: { entries: WeeksWonEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-muted-foreground text-sm">No weeks won yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary">Player</TableHead>
            <TableHead className="text-primary">Weeks Won</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.profileId}>
              <TableCell>{entry.displayName}</TableCell>
              <TableCell>{entry.weeksWon}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
