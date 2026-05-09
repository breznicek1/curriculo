import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Troca Figurinhas Copa 2026',
    template: '%s | Copa 2026',
  },
  description: 'Troque figurinhas da Copa do Mundo FIFA 2026 com colecionadores do Brasil inteiro',
  applicationName: 'FigurinhasCopa',
  keywords: ['figurinhas', 'copa do mundo', '2026', 'panini', 'troca', 'colecionadores'],
  authors: [{ name: 'Troca Figurinhas Copa 2026' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: 'Troca Figurinhas Copa 2026',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FigurinhasCopa',
  },
}

export const viewport: Viewport = {
  themeColor: '#006b2b',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
