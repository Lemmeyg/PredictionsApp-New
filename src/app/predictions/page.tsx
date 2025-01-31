'use client'

import { useRouter } from 'next/navigation'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"


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

  const fetchFixtures = useCallback(async () => {
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
  }, [toast])

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
  }, [router, fetchFixtures])

  const handleScoreChange = (fixtureId: string, type: 'home' | 'away', value: string, currentIndex: number) => {
    // Only allow single numeric digits
    if (value === '' || /^[0-9]$/.test(value)) {
      setPredictions(prev => ({
        ...prev,
        [fixtureId]: {
          ...prev[fixtureId],
          [type]: value
        }
      }))

      // If a digit was entered (not empty), move to next input
      if (value !== '') {
        let nextIndex;
        if (type === 'home') {
          // If it's a home score, move to the away score (right field)
          nextIndex = currentIndex + 1;
        } else {
          // If it's an away score, move to the home score of next fixture (left field of next row)
          nextIndex = currentIndex + 1;
        }
        
        // Focus next input if it exists
        if (inputRefs.current[nextIndex]) {
          inputRefs.current[nextIndex]?.focus();
        }
      }
    }
  }

  const isFormComplete = () => {
    return fixtures.every(fixture => 
      predictions[fixture.id]?.home !== undefined && 
      predictions[fixture.id]?.home !== '' &&
      predictions[fixture.id]?.away !== undefined &&
      predictions[fixture.id]?.away !== ''
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('1. Form submission started');
    
    try {
      const predictionsData = fixtures.map(fixture => ({
        userName: username,
        fixtureId: fixture.id,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        homeScore: predictions[fixture.id]?.home,
        awayScore: predictions[fixture.id]?.away,
        submittedAt: new Date().toISOString()
      }));

      console.log('2. Predictions data prepared:', predictionsData);

      const response = await fetch('/api/predictions/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ predictions: predictionsData }),
      });

      console.log('3. API response received:', response.status);

      if (!response.ok) {
        throw new Error('Failed to submit predictions');
      }

      console.log('4. Showing toast...');
      toast({
        title: "Predictions Submitted!",
        description: (
          <div className="mt-2 space-y-1">
            {fixtures.map((fixture) => (
              <div key={fixture.id} className="flex justify-between text-sm">
                <span className="flex-1">{fixture.homeTeam}</span>
                <span className="px-2 text-[#ffa500] font-bold">{predictions[fixture.id]?.home}</span>
                <span className="px-1">-</span>
                <span className="px-2 text-[#ffa500] font-bold">{predictions[fixture.id]?.away}</span>
                <span className="flex-1 text-right">{fixture.awayTeam}</span>
              </div>
            ))}
          </div>
        ),
        duration: 4000,
      });

      console.log('5. Toast shown, waiting before redirect...');
      // Additional delay to ensure toast is visible
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('6. Starting redirect');
      router.push('/');

    } catch (error) {
      console.error('Error in submission:', error);
      toast({
        title: "Error!",
        description: "Failed to submit predictions.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
      <p className="text-white text-xl">Loading...</p>
    </div>
  }

  return (
    <div className="container mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold">
          Enter Your <span className="text-primary">Predictions</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Predict scores for the upcoming matches
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {fixtures.map((fixture, index) => (
          <div key={fixture.id} className="flex items-center">
            <div className="w-36 text-right">
              <span className="text-white">{fixture.homeTeam}</span>
            </div>
            <div className="flex items-center gap-2 mx-4">
              <Input
                ref={(el) => {
                  if (el) {
                    inputRefs.current[index * 2] = el;
                  }
                }}
                className="w-14 h-14 text-center bg-transparent border-gray-600 text-lg"
                value={predictions[fixture.id]?.home || ''}
                onChange={(e) => handleScoreChange(fixture.id, 'home', e.target.value, index * 2)}
              />
              <span className="text-gray-400 mx-1">-</span>
              <Input
                ref={(el) => {
                  if (el) {
                    inputRefs.current[index * 2 + 1] = el;
                  }
                }}
                className="w-14 h-14 text-center bg-transparent border-gray-600 text-lg"
                value={predictions[fixture.id]?.away || ''}
                onChange={(e) => handleScoreChange(fixture.id, 'away', e.target.value, index * 2 + 1)}
              />
            </div>
            <div className="w-36">
              <span className="text-white">{fixture.awayTeam}</span>
            </div>
          </div>
        ))}
        {fixtures.length > 0 && (
          <Button 
            type="submit"
            className="w-full mt-8 bg-[#ffa500] hover:bg-[#ffa500]/90" 
            disabled={!isFormComplete()}
          >
            Submit Predictions
          </Button>
        )}
      </form>
    </div>
  )
} 