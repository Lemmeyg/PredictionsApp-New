'use client'

import { useEffect, useState } from 'react'

/**
 * The time zone to format kickoff times in.
 *
 * Returns 'Europe/London' during SSR and the first client render so the markup
 * matches, then switches to `undefined` after mount — letting Intl use the
 * viewer's device zone, which is what we want them to see. UK viewers (nearly
 * all of them) see no change across the switch.
 */
export function useDisplayTimeZone(): string | undefined {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted ? undefined : 'Europe/London'
}
