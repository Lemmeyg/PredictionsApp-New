'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const USERS = ["David", "Gordon", "Huw", "James", "Tom", "Ty"]

export default function UserPage() {
  const router = useRouter()

  const handleUserSelect = (user: string) => {
    console.log('User selected:', user)
    router.push(`/predictions?userName=${user}`)
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4">
      <Card className="w-full max-w-[min(90vw,380px)] border-border">
        <div className="flex flex-col items-center gap-6 p-6">
          <h1 className="text-2xl font-semibold text-foreground">Select User</h1>
          
          <div className="grid grid-cols-2 gap-3 w-full">
            {USERS.map((user) => (
              <Button 
                key={user}
                variant="secondary"
                className="w-full h-11"
                onClick={() => handleUserSelect(user)}
              >
                {user}
              </Button>
            ))}
          </div>

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