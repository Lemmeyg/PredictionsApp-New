'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PredictionForm } from "@/components/predictions/prediction-form"
import { useEffect, useState } from 'react'

export default function PredictionsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const userName = searchParams.get('userName')
  const [fixtures, setFixtures] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!userName) {
      console.log('No username found, redirecting to user selection')
      router.push('/user')
      return
    }
    
    const fetchFixtures = async () => {
      try {
        const response = await fetch('/api/fixtures/gameweek')
        if (!response.ok) {
          throw new Error('Failed to fetch fixtures')
        }
        const data = await response.json()
        setFixtures(data)
      } catch (err) {
        console.error('Error fetching fixtures:', err)
        setError('Failed to load fixtures')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFixtures()
  }, [userName, router])

  if (!userName) return null
  
  if (isLoading) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center p-4">
        <Card className="w-full max-w-[min(90vw,380px)] border-border">
          <div className="flex flex-col items-center gap-6 p-6">
            <p>Loading fixtures...</p>
          </div>
        </Card>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center p-4">
        <Card className="w-full max-w-[min(90vw,380px)] border-border">
          <div className="flex flex-col items-center gap-6 p-6">
            <p className="text-destructive">{error}</p>
            <Button 
              variant="secondary"
              className="w-full h-11"
              onClick={() => router.push('/user')}
            >
              Back to Users
            </Button>
          </div>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4">
      <Card className="w-full max-w-[min(90vw,380px)] border-border">
        <div className="flex flex-col items-center gap-6 p-6">
          <h1 className="text-2xl font-semibold text-foreground">
            Welcome {userName}
          </h1>
          
          <PredictionForm 
            userName={userName}
            fixtures={fixtures}
          />

          <div className="w-full space-y-3">
            <Button 
              variant="secondary"
              className="w-full h-11"
              onClick={() => router.push('/user')}
            >
              Back to Users
            </Button>
            
            <Button 
              variant="secondary"
              className="w-full h-11"
              onClick={() => router.push('/')}
            >
              Home
            </Button>
          </div>
        </div>
      </Card>
    </main>
  )
} 