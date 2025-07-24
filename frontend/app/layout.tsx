import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import ServerStats from '@/components/ServerStats'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Document Converter',
  description: 'Convert documents to various formats',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-white">
          <header className="border-b border-gray-100">
            <div className="max-w-4xl mx-auto px-6 py-6">
              <Link href="/" className="inline-block">
                <h1 className="text-2xl font-medium text-gray-900 hover:text-gray-700 transition-colors cursor-pointer">
                  Document Converter
                </h1>
              </Link>
            </div>
          </header>
          <main className="max-w-4xl mx-auto px-6 py-12">
            {children}
          </main>
          <ServerStats />
        </div>
      </body>
    </html>
  )
}
