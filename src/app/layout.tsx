import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Predictions App',
  description: 'Football predictions application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased")}>
        {children}
        <Toaster />
      </body>
    </html>
  )
} 