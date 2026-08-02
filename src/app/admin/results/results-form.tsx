'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import type { FixtureRow } from '@/lib/supabase/database.types'
import { updateFixtureResult } from './actions'

export function ResultsForm({ fixtures, round }: { fixtures: FixtureRow[]; round: number }) {
  const { toast } = useToast()
  const [scores, setScores] = useState<Record<number, { home: string; away: string }>>({})
  const [savingId, setSavingId] = useState<number | null>(null)

  const handleSave = async (fixture: FixtureRow) => {
    const entry = scores[fixture.id]
    const homeScore = Number(entry?.home ?? fixture.home_score ?? 0)
    const awayScore = Number(entry?.away ?? fixture.away_score ?? 0)

    setSavingId(fixture.id)
    const result = await updateFixtureResult(fixture.id, homeScore, awayScore)
    setSavingId(null)

    if (!result.success) {
      toast({
        title: 'Error',
        description: (result as { success: false; error: string }).error,
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Saved',
      description: `${fixture.home_team} ${homeScore} - ${awayScore} ${fixture.away_team}`,
    })
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">Round {round}</p>
      {fixtures.map((fixture) => (
        <div key={fixture.id} className="flex items-center gap-4">
          <span className="w-36 text-right text-white">{fixture.home_team}</span>
          <Input
            className="w-14 text-center"
            defaultValue={fixture.home_score ?? ''}
            onChange={(e) =>
              setScores((prev) => ({
                ...prev,
                [fixture.id]: { ...prev[fixture.id], home: e.target.value },
              }))
            }
          />
          <span>-</span>
          <Input
            className="w-14 text-center"
            defaultValue={fixture.away_score ?? ''}
            onChange={(e) =>
              setScores((prev) => ({
                ...prev,
                [fixture.id]: { ...prev[fixture.id], away: e.target.value },
              }))
            }
          />
          <span className="w-36 text-white">{fixture.away_team}</span>
          <Button onClick={() => handleSave(fixture)} disabled={savingId === fixture.id}>
            Save
          </Button>
        </div>
      ))}
    </div>
  )
}
