'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import Link from 'next/link'

interface Fixture {
  homeTeam: string
  awayTeam: string
  id: string
}

export default function PredictionsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [predictions, setPredictions] = useState<Record<string, { home: string, away: string }>>({})
  const [username, setUsername] = useState<string>('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    console.log('Component mounted')
    const savedUser = localStorage.getItem('selectedUser')
    console.log('Saved user:', savedUser)
    
    if (!savedUser) {
      console.log('No user found, redirecting to /user')
      router.push('/user')
      return
    }
    
    setUsername(savedUser)
    fetchFixtures()
  }, [])

  const fetchFixtures = async () => {
    console.log('Fetching fixtures...')
    try {
      console.log('Starting fetch request...')
      
      const response = await fetch('/api/fixtures/gameweek', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('API Response status:', response.status)
      console.log('API Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error details:', errorData)
        throw new Error(`Failed to fetch fixtures: ${response.status}`)
      }

      const data = await response.json()
      console.log('Fixtures data:', data)
      
      setFixtures(data)
    } catch (error) {
      console.error('Error fetching fixtures:', error)
      toast({
        title: "Error",
        description: "Failed to load fixtures. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleScoreChange = (fixtureId: string, type: 'home' | 'away', value: string, currentIndex: number) => {
    setPredictions(prev => ({
      ...prev,
      [fixtureId]: {
        ...prev[fixtureId],
        [type]: value
      }
    }))
  }

  const isFormComplete = () => {
    return fixtures.every(fixture => 
      predictions[fixture.id]?.home !== undefined && 
      predictions[fixture.id]?.home !== '' &&
      predictions[fixture.id]?.away !== undefined &&
      predictions[fixture.id]?.away !== ''
    )
  }

  const handleSubmit = async () => {
    try {
      // Format predictions for submission
      const predictionsData = fixtures.map(fixture => ({
        userName: username,
        fixtureId: fixture.id,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        homeScore: predictions[fixture.id]?.home,
        awayScore: predictions[fixture.id]?.away,
        submittedAt: new Date().toISOString()
      }));

      console.log('Submitting predictions:', predictionsData);

      const response = await fetch('/api/predictions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ predictions: predictionsData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit predictions');
      }

      // Show success toast
      toast({
        title: "Predictions Submitted",
        description: fixtures.map(fixture => 
          `${fixture.homeTeam} ${predictions[fixture.id]?.home} - ${predictions[fixture.id]?.away} ${fixture.awayTeam}`
        ).join('\n'),
        duration: 3000,
      });

      // Redirect after successful submission
      setTimeout(() => {
        router.push('/');
      }, 3000);

    } catch (error) {
      console.error('Error submitting predictions:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit predictions",
        variant: "destructive",
      });
    }
  };

  console.log('Rendering with state:', { isLoading, fixtures, username })

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#1a1f2e] text-white p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-bold mb-2">Loading...</h1>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#1a1f2e] text-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          Enter Your <span className="text-[#ffa500]">Predictions</span>
        </h1>
        <p className="text-gray-400 mb-8">Predict scores for the upcoming matches</p>

        <div className="space-y-8">
          {fixtures && fixtures.length > 0 ? (
            fixtures.map((fixture, index) => (
              <div key={fixture.id} className="flex items-center">
                <div className="w-36 text-right">
                  <span className="text-white">{fixture.homeTeam}</span>
                </div>
                <div className="flex items-center gap-2 mx-4">
                  <Input
                    ref={el => inputRefs.current[index * 2] = el}
                    className="w-14 h-14 text-center bg-transparent border-gray-600 text-lg"
                    value={predictions[fixture.id]?.home || ''}
                    onChange={(e) => handleScoreChange(fixture.id, 'home', e.target.value, index * 2)}
                  />
                  <span className="text-gray-400 mx-1">-</span>
                  <Input
                    ref={el => inputRefs.current[index * 2 + 1] = el}
                    className="w-14 h-14 text-center bg-transparent border-gray-600 text-lg"
                    value={predictions[fixture.id]?.away || ''}
                    onChange={(e) => handleScoreChange(fixture.id, 'away', e.target.value, index * 2 + 1)}
                  />
                </div>
                <div className="w-36">
                  <span className="text-white">{fixture.awayTeam}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400">No fixtures available</p>
          )}
        </div>

        {fixtures.length > 0 && (
          <Button 
            className="w-full mt-8 bg-[#ffa500] hover:bg-[#ffa500]/90" 
            disabled={!isFormComplete()}
            onClick={handleSubmit}
          >
            Submit Predictions
          </Button>
        )}
      </div>
    </main>
  )
} 