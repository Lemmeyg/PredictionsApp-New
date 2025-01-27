'use client'

import { useState, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Fixture {
  id: number
  homeTeam: string
  awayTeam: string
}

interface PredictionFormProps {
  userName: string
  fixtures: Fixture[]
}

interface Prediction {
  [key: number]: {
    home: string
    away: string
  }
}

export function PredictionForm({ userName, fixtures }: PredictionFormProps) {
  const [predictions, setPredictions] = useState<Prediction>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Create refs for all input fields
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const handleScoreChange = (fixtureId: number, type: 'home' | 'away', value: string) => {
    // Only allow numbers 0-9
    if (value === '' || /^[0-9]$/.test(value)) {
      setPredictions(prev => ({
        ...prev,
        [fixtureId]: {
          ...prev[fixtureId],
          [type]: value
        }
      }))

      // If a number was entered, move the cursor
      if (/^[0-9]$/.test(value)) {
        const currentIndex = fixtures.findIndex(f => f.id === fixtureId)
        
        if (type === 'home') {
          // Move to away input of same fixture
          inputRefs.current[`${fixtureId}-away`]?.focus()
        } else if (type === 'away' && currentIndex < fixtures.length - 1) {
          // Move to home input of next fixture
          const nextFixture = fixtures[currentIndex + 1]
          inputRefs.current[`${nextFixture.id}-home`]?.focus()
        }
      }
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Format predictions for submission
      const formattedPredictions = Object.entries(predictions).map(([fixtureId, scores]) => ({
        fixtureId: Number(fixtureId),
        homeScore: Number(scores.home),
        awayScore: Number(scores.away),
        userName
      }))
      
      console.log('Submitting predictions:', formattedPredictions)
      // TODO: Add API call to submit predictions
      
    } catch (error) {
      console.error('Error submitting predictions:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      {fixtures.map((fixture) => (
        <Card key={fixture.id} className="p-4">
          <div className="flex items-center justify-center gap-4">
            <div className="text-right min-w-[120px]">{fixture.homeTeam}</div>
            <Input
              ref={el => inputRefs.current[`${fixture.id}-home`] = el}
              type="text"
              inputMode="numeric"
              className="w-12 text-center p-2"
              value={predictions[fixture.id]?.home || ''}
              onChange={(e) => handleScoreChange(fixture.id, 'home', e.target.value)}
              maxLength={1}
            />
            <Input
              ref={el => inputRefs.current[`${fixture.id}-away`] = el}
              type="text"
              inputMode="numeric"
              className="w-12 text-center p-2"
              value={predictions[fixture.id]?.away || ''}
              onChange={(e) => handleScoreChange(fixture.id, 'away', e.target.value)}
              maxLength={1}
            />
            <div className="text-left min-w-[120px]">{fixture.awayTeam}</div>
          </div>
        </Card>
      ))}

      <Button
        className="w-full h-11"
        variant="secondary"
        onClick={handleSubmit}
        disabled={isSubmitting || Object.keys(predictions).length === 0}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Predictions'}
      </Button>
    </div>
  )
} 