import { kickoffDayKey } from '../format/kickoff'

/**
 * Sort fixtures into the order the games are played: ascending by kickoff
 * instant, with a stable tie-break on ascending id so placeholder rounds
 * (every match sharing one time) still get a deterministic order.
 * Returns a new array; the input is not mutated.
 */
export function sortByKickoff<T extends { id: number; kickoff_time: string }>(
  fixtures: T[],
): T[] {
  return [...fixtures].sort((a, b) => {
    const delta =
      new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime()
    return delta !== 0 ? delta : a.id - b.id
  })
}

export interface KickoffDayGroup<T> {
  /** `YYYY-MM-DD` in the grouping zone. */
  dayKey: string
  /** ISO timestamp of the first fixture in the group, for a day heading. */
  headingIso: string
  fixtures: T[]
}

/**
 * Group an already-sorted fixture list into consecutive same-calendar-day runs,
 * evaluated in `timeZone` (device zone when omitted).
 */
export function groupByKickoffDay<T>(
  fixtures: T[],
  getIso: (fixture: T) => string,
  timeZone?: string,
): KickoffDayGroup<T>[] {
  const groups: KickoffDayGroup<T>[] = []

  for (const fixture of fixtures) {
    const iso = getIso(fixture)
    const dayKey = kickoffDayKey(iso, timeZone)
    const last = groups[groups.length - 1]

    if (last && last.dayKey === dayKey) {
      last.fixtures.push(fixture)
    } else {
      groups.push({ dayKey, headingIso: iso, fixtures: [fixture] })
    }
  }

  return groups
}
