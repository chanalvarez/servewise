import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ActiveTicketsProvider } from '@/context/ActiveTicketsContext'
import { ActiveTicketsDrawer } from '@/components/ActiveTicketsDrawer'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ServeWise — Skip the Line',
  description:
    'Join virtual queues across multiple stores without creating an account. Real-time updates, instant tickets.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ServeWise',
  },
}

export const viewport: Viewport = {
  themeColor: '#07091A',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
        <body className="font-sans" suppressHydrationWarning>
        <ActiveTicketsProvider>
          {children}
          <ActiveTicketsDrawer />
          <Analytics />
        </ActiveTicketsProvider>
      </body>
    </html>
  )
}
