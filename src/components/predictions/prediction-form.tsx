'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { submitPredictions } from '@/app/predictions/submit-action'

interface FormFixture {
  id: number
  homeTeam: string
  awayTeam: string
}

export function PredictionForm({
  fixtures,
  alreadySubmitted,
}: {
  fixtures: FormFixture[]
  alreadySubmitted: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [predictions, setPredictions] = useState<
    Record<number, { home: string; away: string }>
  >({})
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  if (alreadySubmitted) {
    return (
      <p className="text-white text-center">
        You&apos;ve already submitted predictions for this round.
      </p>
    )
  }

  const handleScoreChange = (
    fixtureId: number,
    type: 'home' | 'away',
    value: string,
    currentIndex: number
  ) => {
    if (value === '' || /^[0-9]$/.test(value)) {
      setPredictions((prev) => ({
        ...prev,
        [fixtureId]: { ...prev[fixtureId], [type]: value },
      }))

      if (value !== '') {
        inputRefs.current[currentIndex + 1]?.focus()
      }
    }
  }

  const isFormComplete = () =>
    fixtures.every(
      (fixture) =>
        predictions[fixture.id]?.home !== undefined &&
        predictions[fixture.id]?.home !== '' &&
        predictions[fixture.id]?.away !== undefined &&
        predictions[fixture.id]?.away !== ''
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = await submitPredictions(
      fixtures.map((fixture) => ({
        fixtureId: fixture.id,
        homeScore: Number(predictions[fixture.id]?.home),
        awayScore: Number(predictions[fixture.id]?.away),
      }))
    )

    if (!result.success) {
      toast({
        title: 'alreadySubmitted' in result && result.alreadySubmitted ? 'Already submitted' : 'Error',
        description: 'error' in result ? result.error : 'Unknown error',
        variant: 'destructive',
      })
      return
    }

    toast({
      title: 'Predictions Submitted!',
      description: (
        <div className="mt-2 space-y-1">
          {fixtures.map((fixture) => (
            <div key={fixture.id} className="flex justify-between text-sm">
              <span className="flex-1">{fixture.homeTeam}</span>
              <span className="px-2 text-primary font-bold">
                {predictions[fixture.id]?.home}
              </span>
              <span className="px-1">-</span>
              <span className="px-2 text-primary font-bold">
                {predictions[fixture.id]?.away}
              </span>
              <span className="flex-1 text-right">{fixture.awayTeam}</span>
            </div>
          ))}
        </div>
      ),
      duration: 4000,
    })

    await new Promise((resolve) => setTimeout(resolve, 2000))
    router.push('/')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {fixtures.map((fixture, index) => (
        <div key={fixture.id} className="flex items-center">
          <div className="w-36 text-right">
            <span className="text-white">{fixture.homeTeam}</span>
          </div>
          <div className="flex items-center gap-2 mx-4">
            <Input
              ref={(el) => {
                if (el) inputRefs.current[index * 2] = el
              }}
              className="w-14 h-14 text-center bg-transparent border-gray-600 text-lg"
              value={predictions[fixture.id]?.home || ''}
              onChange={(e) =>
                handleScoreChange(fixture.id, 'home', e.target.value, index * 2)
              }
            />
            <span className="text-gray-400 mx-1">-</span>
            <Input
              ref={(el) => {
                if (el) inputRefs.current[index * 2 + 1] = el
              }}
              className="w-14 h-14 text-center bg-transparent border-gray-600 text-lg"
              value={predictions[fixture.id]?.away || ''}
              onChange={(e) =>
                handleScoreChange(fixture.id, 'away', e.target.value, index * 2 + 1)
              }
            />
          </div>
          <div className="w-36">
            <span className="text-white">{fixture.awayTeam}</span>
          </div>
        </div>
      ))}
      {fixtures.length > 0 && (
        <Button type="submit" className="w-full mt-8" disabled={!isFormComplete()}>
          Submit Predictions
        </Button>
      )}
    </form>
  )
}
