'use client'

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { useEffect, useState } from "react"
import { LeaderboardEntry } from '@/components/leaderboard/leaderboard-table'

// Define type for raw data from API
interface RawLeaderboardData {
  username: string;
  rank: string;
  player: string;
  total: number | null;
  gameweekTotal: number | null;
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch('/api/leaderboard')
        const rawData = await response.json() as RawLeaderboardData[]
        
        const transformedData: LeaderboardEntry[] = rawData.map((entry) => ({
          rank: entry.rank,
          username: entry.username,
          player: entry.player,
          total: entry.total ?? 0,
          gameweekTotal: entry.gameweekTotal ?? 0
        }))
        
        setData(transformedData)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        setError('Failed to load leaderboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4">
      <Card className="w-full max-w-[min(90vw,380px)] border-border">
        <div className="flex flex-col items-center gap-6 p-6">
          <h1 className="text-2xl font-semibold text-foreground text-center w-full">
            Leaderboard
          </h1>

          {isLoading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-destructive">{error}</p>
          ) : (
            <LeaderboardTable data={data} />
          )}
          
          <Button 
            variant="secondary"
            className="w-full h-11"
            onClick={() => router.push('/')}
          >
            Back
          </Button>
        </div>
      </Card>
    </main>
  )
} 