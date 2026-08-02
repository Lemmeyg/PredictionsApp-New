'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

const MIN_PASSWORD_LENGTH = 6

export default function ResetPasswordPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' })
      return
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast({
        title: 'Error',
        description: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    // The recovery link from the reset email establishes a session
    // client-side before this page becomes interactive, so updateUser()
    // here is operating on that session -- no separate token handling needed.
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    setIsSubmitting(false)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: 'Password updated', description: 'You can now use your new password.' })
    router.push('/')
    router.refresh()
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4">
      <Card className="w-full max-w-[min(90vw,380px)] border-border">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 p-6 w-full">
          <h1 className="text-2xl font-semibold text-foreground">Set New Password</h1>

          <div className="w-full space-y-3">
            <Input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </Card>
    </main>
  )
}
