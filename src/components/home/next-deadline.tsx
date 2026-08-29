'use client'

import { formatKickoffRow } from '@/lib/format/kickoff'
import { useDisplayTimeZone } from '@/lib/format/use-display-time-zone'

export function NextDeadline({
  kickoff,
  alreadySubmitted,
}: {
  kickoff: string | null
  alreadySubmitted: boolean
}) {
  const timeZone = useDisplayTimeZone()

  if (kickoff === null) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Season complete — no more predictions
      </p>
    )
  }

  const when = formatKickoffRow(kickoff, timeZone)

  if (alreadySubmitted) {
    return (
      <div className="text-center space-y-0.5" suppressHydrationWarning>
        <p className="text-sm text-muted-foreground">Predictions submitted</p>
        <p className="text-sm text-foreground">Next deadline: {when}</p>
      </div>
    )
  }

  return (
    <p className="text-center text-sm text-foreground" suppressHydrationWarning>
      Predictions close: {when}
    </p>
  )
}
