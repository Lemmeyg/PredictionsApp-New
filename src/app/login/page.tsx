'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    setIsSubmitting(false)

    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' })
      return
    }

    router.push('/')
    router.refresh()
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setIsSubmitting(false)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    // Supabase doesn't reveal whether the email is registered -- keep the
    // message generic so this can't be used to enumerate accounts.
    toast({
      title: 'Check your email',
      description: 'If an account exists for that email, a reset link has been sent.',
    })
    setMode('login')
  }

  if (mode === 'forgot') {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center p-4">
        <Card className="w-full max-w-[min(90vw,380px)] border-border">
          <form
            onSubmit={handleForgotPassword}
            className="flex flex-col items-center gap-6 p-6 w-full"
          >
            <h1 className="text-2xl font-semibold text-foreground">Reset Password</h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
            />

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>

            <button
              type="button"
              onClick={() => setMode('login')}
              className="text-sm text-muted-foreground hover:text-white transition-colors"
            >
              Back to log in
            </button>
          </form>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-[100dvh] flex items-center justify-center p-4">
      <Card className="w-full max-w-[min(90vw,380px)] border-border">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-6 p-6 w-full">
          <h1 className="text-2xl font-semibold text-foreground">Log In</h1>

          <div className="w-full space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
            {isSubmitting ? 'Logging in...' : 'Log In'}
          </Button>

          <button
            type="button"
            onClick={() => setMode('forgot')}
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            Forgot password?
          </button>
        </form>
      </Card>
    </main>
  )
}
