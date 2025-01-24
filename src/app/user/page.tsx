'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

const USERS = ["David", "Gordon", "Huw", "James", "Tom", "Ty"]

export default function UserPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold">Select User</h1>
        
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
          {USERS.map((user) => (
            <Link 
              key={user} 
              href={`/predictions?userName=${user}`}
              className="w-full"
            >
              <Button className="w-full">{user}</Button>
            </Link>
          ))}
        </div>

        <Link href="/" className="mt-4">
          <Button variant="outline">Back</Button>
        </Link>
      </div>
    </div>
  )
} 