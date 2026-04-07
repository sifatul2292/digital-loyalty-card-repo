import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'StampLoop — Digital Loyalty Cards for Local Businesses',
  description: 'Replace paper punch cards with a beautiful digital loyalty card system. Keep customers coming back.',
  openGraph: {
    title: 'StampLoop',
    description: 'Digital loyalty cards for local businesses',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
