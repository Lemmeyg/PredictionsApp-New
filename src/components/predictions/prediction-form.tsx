'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { groupByKickoffDay } from '@/lib/predictions/fixture-order'
import { formatKickoffTime, formatKickoffDayHeading } from '@/lib/format/kickoff'
import { useDisplayTimeZone } from '@/lib/format/use-display-time-zone'
import { submitPredictions } from '@/app/predictions/submit-action'

interface FormEntry {
  result: 'W' | 'L' | 'D'
  venue: 'H' | 'A'
}

interface OtherPick {
  profileId: string
  initials: string
  column: 'home' | 'draw' | 'away'
  highlight: 'above' | 'below' | null
}

interface FormFixture {
  id: number
  kickoffTime: string
  homeTeam: string
  awayTeam: string
  homeForm: FormEntry[]
  awayForm: FormEntry[]
  otherPicks: OtherPick[]
}

const FORM_SQUARE_COUNT = 5

function FormSquares({ form }: { form: FormEntry[] }) {
  const padded: (FormEntry | null)[] = [
    ...Array(Math.max(0, FORM_SQUARE_COUNT - form.length)).fill(null),
    ...form,
  ]

  return (
    <div className="flex gap-1">
      {padded.map((entry, index) => (
        <div
          key={index}
          className={cn(
            'w-5 h-5 rounded-sm flex items-center justify-center text-[10px] font-bold text-white',
            entry === null && 'bg-black border border-gray-700',
            entry?.result === 'W' && 'bg-green-600',
            entry?.result === 'L' && 'bg-red-600',
            entry?.result === 'D' && 'bg-primary'
          )}
        >
          {entry?.venue}
        </div>
      ))}
    </div>
  )
}

function PickBadge({ pick }: { pick: OtherPick }) {
  return (
    <span
      key={pick.profileId}
      className={cn(
        'px-1.5 py-0.5 rounded text-xs font-semibold',
        pick.highlight === 'above' && 'bg-green-600/20 text-green-400 border border-green-600',
        pick.highlight === 'below' && 'bg-red-600/20 text-red-400 border border-red-600',
        pick.highlight === null && 'bg-gray-800 text-gray-300'
      )}
    >
      {pick.initials}
    </span>
  )
}

function OtherPicksGrid({ otherPicks }: { otherPicks: OtherPick[] }) {
  const columns: { key: OtherPick['column']; label: string }[] = [
    { key: 'home', label: 'Home' },
    { key: 'draw', label: 'Draw' },
    { key: 'away', label: 'Away' },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      {columns.map((column) => (
        <div key={column.key} className="space-y-1">
          <div className="text-[10px] uppercase text-muted-foreground">{column.label}</div>
          <div className="flex flex-wrap justify-center gap-1">
            {otherPicks
              .filter((pick) => pick.column === column.key)
              .map((pick) => (
                <PickBadge key={pick.profileId} pick={pick} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
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
  const [expandedFixtureId, setExpandedFixtureId] = useState<number | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const timeZone = useDisplayTimeZone()

  const toggleExpanded = (fixtureId: number) => {
    setExpandedFixtureId((current) => (current === fixtureId ? null : fixtureId))
  }

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

    if (result.success === false) {
      toast({
        title: result.alreadySubmitted ? 'Already submitted' : 'Error',
        description: result.error,
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

  const dayGroups = groupByKickoffDay(fixtures, (f) => f.kickoffTime, timeZone)

  return (
    <form onSubmit={handleSubmit} className="max-w-md lg:max-w-2xl mx-auto space-y-6">
      {dayGroups.map((group) => (
        <div key={group.dayKey} className="space-y-4">
          <h2
            suppressHydrationWarning
            className="text-sm font-semibold text-muted-foreground"
          >
            {formatKickoffDayHeading(group.headingIso, timeZone)}
          </h2>

          {group.fixtures.map((fixture) => {
            const index = fixtures.indexOf(fixture)
            const isExpanded = expandedFixtureId === fixture.id

            return (
              <div
                key={fixture.id}
                className="border border-gray-700 rounded-lg p-4 lg:p-6"
              >
                <div
                  suppressHydrationWarning
                  className="text-xs text-muted-foreground text-center mb-2"
                >
                  {formatKickoffTime(fixture.kickoffTime, timeZone)}
                </div>

                <div className="flex items-center lg:justify-between">
                  <div className="w-36 lg:w-48 text-right">
                    <span className="text-white">{fixture.homeTeam}</span>
                  </div>
                  <div className="flex items-center gap-2 lg:gap-3 mx-4 lg:mx-6">
                    <Input
                      ref={(el) => {
                        if (el) inputRefs.current[index * 2] = el
                      }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className="w-14 h-14 lg:w-16 lg:h-16 text-center bg-transparent border-gray-600 text-lg lg:text-xl"
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
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      className="w-14 h-14 lg:w-16 lg:h-16 text-center bg-transparent border-gray-600 text-lg lg:text-xl"
                      value={predictions[fixture.id]?.away || ''}
                      onChange={(e) =>
                        handleScoreChange(fixture.id, 'away', e.target.value, index * 2 + 1)
                      }
                    />
                  </div>
                  <div className="w-36 lg:w-48">
                    <span className="text-white">{fixture.awayTeam}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 space-y-4">
                    <div className="flex items-start">
                      <div className="w-36 lg:w-48 flex justify-end">
                        <FormSquares form={fixture.homeForm} />
                      </div>
                      <div className="flex-1" />
                      <div className="w-36 lg:w-48 flex justify-start">
                        <FormSquares form={fixture.awayForm} />
                      </div>
                    </div>
                    <OtherPicksGrid otherPicks={fixture.otherPicks} />
                  </div>
                )}

                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => toggleExpanded(fixture.id)}
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Collapse match details' : 'Expand match details'}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronDown
                      className={cn('h-5 w-5 transition-transform', isExpanded && 'rotate-180')}
                    />
                  </button>
                </div>
              </div>
            )
          })}
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
