import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Troca Figurinhas Copa 2026',
  description: 'Sistema de troca de figurinhas da Copa do Mundo FIFA 2026',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  )
}
