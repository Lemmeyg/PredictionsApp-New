import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export function BackToHomeButton() {
  return (
    <Link
      href="/"
      aria-label="Back to home"
      className="fixed top-4 left-4 z-50 text-white hover:text-primary transition-colors"
    >
      <ArrowLeft className="h-5 w-5" />
    </Link>
  )
}
