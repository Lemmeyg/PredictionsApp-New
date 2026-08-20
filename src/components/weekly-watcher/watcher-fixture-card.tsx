import type { PickColumn } from '@/lib/predictions/picks'

export interface WatcherPick {
  profileId: string
  initials: string
  column: PickColumn
  predictedHomeScore: number
  predictedAwayScore: number
}

function PickBadge({ pick }: { pick: WatcherPick }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-gray-800 text-gray-300">
      {pick.initials} {pick.predictedHomeScore}-{pick.predictedAwayScore}
    </span>
  )
}

export function WatcherFixtureCard({
  homeTeam,
  awayTeam,
  picks,
}: {
  homeTeam: string
  awayTeam: string
  picks: WatcherPick[]
}) {
  const columns: { key: PickColumn; label: string }[] = [
    { key: 'home', label: homeTeam },
    { key: 'draw', label: 'Draw' },
    { key: 'away', label: awayTeam },
  ]

  return (
    <div className="border border-gray-700 rounded-lg p-4">
      <div className="grid grid-cols-3 gap-2 text-center">
        {columns.map((column) => (
          <div key={column.key} className="space-y-1">
            <div className="text-xs text-white truncate">{column.label}</div>
            <div className="flex flex-wrap justify-center gap-1">
              {picks
                .filter((pick) => pick.column === column.key)
                .map((pick) => (
                  <PickBadge key={pick.profileId} pick={pick} />
                ))}
            </div>
          </div>
        ))}
      </div>
      {picks.length === 0 && (
        <p className="text-center text-xs text-muted-foreground mt-3">No predictions yet</p>
      )}
    </div>
  )
}
