'use client'

import { useState, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { submitPredictions } from '@/app/actions/submit-predictions'

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
  // ... rest of the component code ...
}

// OR use this alternative export syntax:
// export default PredictionForm; 