import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Troca Figurinhas Copa 2026',
    short_name: 'FigurinhasCopa',
    description: 'Troque figurinhas da Copa do Mundo FIFA 2026 com colecionadores do Brasil',
    start_url: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f9fafb',
    theme_color: '#006b2b',
    categories: ['games', 'sports', 'social'],
    lang: 'pt-BR',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
    shortcuts: [
      { name: 'Swipe', short_name: 'Swipe', url: '/swipe', description: 'Descobrir figurinhas' },
      { name: 'Matches', short_name: 'Matches', url: '/matches', description: 'Ver matches' },
    ],
  }
}
