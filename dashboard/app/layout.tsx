import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/toast-provider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'VibeScan - AI-Powered Code Quality Scanner',
  description: 'Scan smarter, ship faster. Detect security issues, code quality problems, and anti-patterns before they reach production.',
  keywords: ['code quality', 'security scanner', 'AI code analysis', 'developer tools', 'code review'],
  authors: [{ name: 'VibeScan' }],
  openGraph: {
    title: 'VibeScan - AI-Powered Code Quality Scanner',
    description: 'Scan smarter, ship faster. Beautiful dashboard for code security and quality analysis.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/logo/vibescan-icon.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
