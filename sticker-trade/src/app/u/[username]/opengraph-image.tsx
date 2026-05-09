import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const alt = 'Figurinhas para trocar'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .schema('figurinhas')
    .from('profiles')
    .select('id, username, city, state')
    .eq('username', username)
    .single()

  const { count } = await supabase
    .schema('figurinhas')
    .from('user_stickers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', (profile as any)?.id ?? '')

  const name     = profile?.username ?? username
  const location = profile?.city
    ? `${profile.city}${profile.state ? ` · ${profile.state}` : ''}`
    : 'Brasil'
  const total    = count ?? 0

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #006b2b 0%, #004d1f 100%)',
          fontFamily: 'Arial, sans-serif',
          padding: '60px',
        }}
      >
        {/* Top label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{ fontSize: 48 }}>⚽</div>
          <div style={{ color: '#a7f3d0', fontSize: 22, fontWeight: 600, letterSpacing: 2 }}>
            TROCA FIGURINHAS COPA 2026
          </div>
        </div>

        {/* Avatar circle */}
        <div
          style={{
            width: 120, height: 120,
            borderRadius: '50%',
            background: '#f5c800',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 52, fontWeight: 900, color: '#004d1f',
            marginBottom: 28,
          }}
        >
          {name[0]?.toUpperCase()}
        </div>

        {/* Username */}
        <div style={{ color: '#ffffff', fontSize: 56, fontWeight: 900, marginBottom: 8 }}>
          @{name}
        </div>

        {/* Location */}
        <div style={{ color: '#86efac', fontSize: 24, marginBottom: 40 }}>
          📍 {location}
        </div>

        {/* Stats pill */}
        <div
          style={{
            background: '#f5c800',
            borderRadius: 50,
            padding: '18px 48px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 36, color: '#004d1f' }}>📦</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#004d1f' }}>
            {total} figurinha{total !== 1 ? 's' : ''} repetida{total !== 1 ? 's' : ''} para trocar
          </div>
        </div>

        {/* Bottom CTA */}
        <div style={{ color: '#86efac', fontSize: 20, marginTop: 40 }}>
          Clique para ver e entrar em contato
        </div>
      </div>
    ),
    { ...size }
  )
}
