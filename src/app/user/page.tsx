'use client'

import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useState, useEffect } from 'react'
import Link from 'next/link'

const users = [
  "David",
  "Gordon",
  "Huw",
  "James",
  "Tom",
  "Ty"
]

export default function UserSelectionPage() {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<string>('')

  // Load previously selected user if exists
  useEffect(() => {
    const savedUser = localStorage.getItem('selectedUser')
    if (savedUser) setSelectedUser(savedUser)
  }, [])

  const handleUserSelect = (user: string) => {
    setSelectedUser(user)
    localStorage.setItem('selectedUser', user)
    router.push('/predictions')
  }

  return (
    <main className="min-h-screen p-4">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="hover:bg-slate-100">
            ← Back
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {users.map((user) => (
          <Card 
            key={user}
            className="p-0 overflow-hidden"
          >
            <Button
              variant="ghost"
              className={`w-full h-24 text-lg transition-colors
                ${selectedUser === user 
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                  : 'hover:bg-slate-100'
                }`}
              onClick={() => handleUserSelect(user)}
            >
              {user}
            </Button>
          </Card>
        ))}
      </div>
    </main>
  )
} 