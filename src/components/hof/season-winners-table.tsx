import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { HofSeasonWinner } from '@/lib/supabase/database.types'

export function SeasonWinnersTable({ data }: { data: HofSeasonWinner[] }) {
  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No season winners recorded yet.</p>
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-primary">Competition</TableHead>
            <TableHead className="text-primary">Season</TableHead>
            <TableHead className="text-primary">Winner</TableHead>
            <TableHead className="text-primary">Final Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell>{entry.competition_name}</TableCell>
              <TableCell>{entry.season}</TableCell>
              <TableCell>{entry.winner_name}</TableCell>
              <TableCell>{entry.final_points}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
