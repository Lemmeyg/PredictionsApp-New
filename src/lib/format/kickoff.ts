// Formatting helpers for fixture kickoff timestamps.
//
// `fixtures.kickoff_time` is genuine UTC ISO-8601. These helpers convert it to
// a wall-clock zone for display. When `timeZone` is omitted, Intl uses the
// runtime zone — on the client that is the viewer's device zone, which is what
// we want users to see. Callers that render on the server (or before hydration)
// pass 'Europe/London' as a stable fallback.

const UK_ZONE = 'Europe/London'

function isValidIso(iso: string): boolean {
  return !Number.isNaN(new Date(iso).getTime())
}

/** Formatted parts for the instant; throws if `timeZone` is not a real zone. */
function parts(iso: string, timeZone: string | undefined) {
  const date = new Date(iso)
  const dtf = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  const map: Record<string, string> = {}
  for (const part of dtf.formatToParts(date)) {
    map[part.type] = part.value
  }
  return map
}

const SHORT_WEEKDAY: Record<string, string> = {
  Monday: 'Mon',
  Tuesday: 'Tue',
  Wednesday: 'Wed',
  Thursday: 'Thu',
  Friday: 'Fri',
  Saturday: 'Sat',
  Sunday: 'Sun',
}

function safe<T>(
  iso: string,
  timeZone: string | undefined,
  build: (p: Record<string, string>) => T,
  fallback: T,
): T {
  if (!isValidIso(iso)) return fallback
  try {
    return build(parts(iso, timeZone))
  } catch {
    try {
      return build(parts(iso, UK_ZONE))
    } catch {
      return fallback
    }
  }
}

export function formatKickoffTime(iso: string, timeZone?: string): string {
  return safe(iso, timeZone, (p) => `${p.hour}:${p.minute}`, '')
}

export function formatKickoffRow(iso: string, timeZone?: string): string {
  return safe(
    iso,
    timeZone,
    (p) => `${SHORT_WEEKDAY[p.weekday] ?? p.weekday} ${p.day}/${p.month} · ${p.hour}:${p.minute}`,
    iso.slice(0, 10),
  )
}

export function formatKickoffDayHeading(iso: string, timeZone?: string): string {
  return safe(iso, timeZone, (p) => `${p.weekday} ${p.day}/${p.month}`, iso.slice(0, 10))
}

export function kickoffDayKey(iso: string, timeZone?: string): string {
  return safe(iso, timeZone, (p) => `${p.year}-${p.month}-${p.day}`, iso.slice(0, 10))
}
