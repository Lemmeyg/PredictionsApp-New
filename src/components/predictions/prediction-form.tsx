'use client'

import { useState, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitPredictions } from '@/app/actions/submit-predictions'
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface Fixture {
  id: number
  homeTeam: string
  awayTeam: string
  round: number
}

interface PredictionFormProps {
  userName: string
  fixtures: Fixture[]
}

export function PredictionForm({ userName, fixtures }: PredictionFormProps) {
  const router = useRouter()
  const [predictions, setPredictions] = useState<Prediction>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const handleSubmit = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    toast({
      title: "Processing...",
      description: "Submitting your predictions",
    })
    
    try {
      const formattedPredictions = Object.entries(predictions)
        .map(([fixtureId, scores]) => {
          const fixture = fixtures.find(f => f.id === Number(fixtureId))
          if (!fixture) return null
          
          return {
            fixtureId: Number(fixtureId),
            homeTeam: fixture.homeTeam,
            awayTeam: fixture.awayTeam,
            homeTeamScore: Number(scores.home),
            awayTeamScore: Number(scores.away),
            round: fixture.round
          }
        })
        .filter((pred): pred is NonNullable<typeof pred> => pred !== null)

      if (formattedPredictions.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No predictions to submit",
        })
        return
      }

      await submitPredictions({
        userName,
        predictions: formattedPredictions
      })

      toast({
        title: "Success! 🎉",
        description: `Submitted ${formattedPredictions.length} predictions`,
        duration: 5000,
      })

      setTimeout(() => {
        router.push('/')
      }, 2000)

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to submit",
        description: "Please try again",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // ... rest of the component code ...
}

// OR use this alternative export syntax:
// export default PredictionForm; 