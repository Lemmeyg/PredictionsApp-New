import { describe, expect, it } from 'vitest'
import {
  formatKickoffTime,
  formatKickoffRow,
  formatKickoffDayHeading,
  kickoffDayKey,
} from './kickoff'

// 2026-08-21T19:00:00Z is a Friday; London is on BST (UTC+1) in August.
// 2027-01-16T15:00:00Z is a Saturday; London is on GMT (UTC+0) in January.
const FRI_AUG = '2026-08-21T19:00:00+00:00'
const SAT_JAN = '2027-01-16T15:00:00+00:00'

describe('formatKickoffTime', () => {
  it('formats 24-hour time in the given zone', () => {
    expect(formatKickoffTime(FRI_AUG, 'Europe/London')).toBe('20:00') // BST
    expect(formatKickoffTime(SAT_JAN, 'Europe/London')).toBe('15:00') // GMT
  })

  it('honours a non-UK zone', () => {
    expect(formatKickoffTime(FRI_AUG, 'America/New_York')).toBe('15:00') // EDT
  })

  it('returns empty string for an invalid date', () => {
    expect(formatKickoffTime('not-a-date', 'Europe/London')).toBe('')
  })
})

describe('formatKickoffRow', () => {
  it('formats "Sat 21/08 · 19:00" style with short weekday and DD/MM', () => {
    expect(formatKickoffRow(FRI_AUG, 'Europe/London')).toBe('Fri 21/08 · 20:00')
    expect(formatKickoffRow(SAT_JAN, 'America/New_York')).toBe('Sat 16/01 · 10:00')
  })

  it('falls back to the date slice on invalid input', () => {
    expect(formatKickoffRow('not-a-date', 'Europe/London')).toBe('not-a-date')
  })
})

describe('formatKickoffDayHeading', () => {
  it('formats "Saturday 16/01" style with long weekday and DD/MM', () => {
    expect(formatKickoffDayHeading(FRI_AUG, 'Europe/London')).toBe('Friday 21/08')
    expect(formatKickoffDayHeading(SAT_JAN, 'Europe/London')).toBe('Saturday 16/01')
  })
})

describe('kickoffDayKey', () => {
  it('returns the calendar day in the given zone as YYYY-MM-DD', () => {
    expect(kickoffDayKey(FRI_AUG, 'Europe/London')).toBe('2026-08-21')
  })

  it('can differ from the UTC date when the zone shifts the day', () => {
    // 00:30 UTC on the 22nd is still the 21st, 20:30, in New York.
    expect(kickoffDayKey('2026-08-22T00:30:00+00:00', 'America/New_York')).toBe('2026-08-21')
  })

  it('falls back to the ISO date slice on invalid input', () => {
    expect(kickoffDayKey('not-a-date', 'Europe/London')).toBe('not-a-date')
  })
})
