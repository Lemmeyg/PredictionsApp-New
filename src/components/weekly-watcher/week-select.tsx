'use client'

import { useRouter } from 'next/navigation'

export function WeekSelect({
  rounds,
  selectedRound,
}: {
  rounds: number[]
  selectedRound: number
}) {
  const router = useRouter()

  return (
    <select
      value={selectedRound}
      onChange={(e) => router.push(`/weekly-watcher?round=${e.target.value}`)}
      aria-label="Select week"
      className="w-full h-11 rounded-md border border-gray-600 bg-transparent px-3 text-white"
    >
      {rounds.map((round) => (
        <option key={round} value={round} className="bg-background text-white">
          Week {round}
        </option>
      ))}
    </select>
  )
}
