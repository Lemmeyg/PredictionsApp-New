import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-2xl font-bold text-center">
        Welcome to Premier League Predictions
      </h1>

      <div className="flex flex-col w-full max-w-xs gap-4">
        <Link href="/user" className="w-full">
          <Button className="w-full">Enter Predictions</Button>
        </Link>
        
        <Link href="/leaderboard" className="w-full">
          <Button className="w-full">View Leaderboard</Button>
        </Link>
      </div>
    </main>
  )
} 