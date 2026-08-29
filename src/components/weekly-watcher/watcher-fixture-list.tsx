'use client'

import { groupByKickoffDay } from '@/lib/predictions/fixture-order'
import { formatKickoffDayHeading } from '@/lib/format/kickoff'
import { useDisplayTimeZone } from '@/lib/format/use-display-time-zone'
import { getAllPlayersPicks } from '@/lib/predictions/picks'
import type { FixtureRow, PredictionRow, Profile } from '@/lib/supabase/database.types'
import { WatcherFixtureCard } from './watcher-fixture-card'

export function WatcherFixtureList({
  fixtures,
  predictions,
  profiles,
}: {
  fixtures: FixtureRow[]
  predictions: PredictionRow[]
  profiles: Profile[]
}) {
  const timeZone = useDisplayTimeZone()
  const dayGroups = groupByKickoffDay(fixtures, (f) => f.kickoff_time, timeZone)

  return (
    <>
      {dayGroups.map((group) => (
        <div key={group.dayKey} className="space-y-4">
          <h2
            suppressHydrationWarning
            className="text-sm font-semibold text-muted-foreground"
          >
            {formatKickoffDayHeading(group.headingIso, timeZone)}
          </h2>
          {group.fixtures.map((fixture) => (
            <WatcherFixtureCard
              key={fixture.id}
              homeTeam={fixture.home_team}
              awayTeam={fixture.away_team}
              kickoffTime={fixture.kickoff_time}
              timeZone={timeZone}
              picks={getAllPlayersPicks(fixture.id, predictions, profiles)}
            />
          ))}
        </div>
      ))}
    </>
  )
}
