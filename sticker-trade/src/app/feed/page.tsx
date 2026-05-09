import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import FeedClient from './FeedClient'
import { haversineKm } from '@/lib/geo'
import type { FeedItem } from '@/lib/types'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: myProfile }, { data: rawFeed }] = await Promise.all([
    supabase
      .schema('figurinhas')
      .from('profiles')
      .select('latitude, longitude, city, state')
      .eq('id', user.id)
      .single(),
    supabase
      .schema('figurinhas')
      .from('user_stickers')
      .select(`
        quantity,
        user_id,
        sticker:sticker_id(id, number, player_name, team, country, section),
        owner:user_id(id, username, city, state, contact_by_whatsapp, contact_by_email)
      `)
      .neq('user_id', user.id)
      .order('sticker_id')
      .limit(500),
  ])

  // Fetch owner coordinates server-side for distance calculation
  const ownerIds = [...new Set((rawFeed || []).map((r: any) => r.owner?.id || r.user_id))]
  const { data: ownerCoords } = ownerIds.length
    ? await supabase
        .schema('figurinhas')
        .from('profiles')
        .select('id, latitude, longitude')
        .in('id', ownerIds)
    : { data: [] }

  const coordMap = new Map(
    (ownerCoords || []).map((p: any) => [p.id, { lat: p.latitude as number | null, lng: p.longitude as number | null }])
  )

  const myLat = myProfile?.latitude ?? null
  const myLng = myProfile?.longitude ?? null

  const feedItems: FeedItem[] = (rawFeed || []).map((row: any) => {
    const ownerId = row.owner?.id || row.user_id
    const coords = coordMap.get(ownerId)
    let distance_km: number | null = null
    if (myLat !== null && myLng !== null && coords?.lat !== null && coords?.lng !== null && coords?.lat !== undefined) {
      distance_km = Math.round(haversineKm(myLat, myLng, coords.lat!, coords.lng!))
    }
    return {
      user_id: ownerId,
      username: row.owner?.username || 'Anônimo',
      city: row.owner?.city || null,
      state: row.owner?.state || null,
      contact_by_whatsapp: row.owner?.contact_by_whatsapp ?? false,
      contact_by_email: row.owner?.contact_by_email ?? false,
      sticker_id: row.sticker?.id || '',
      sticker_number: row.sticker?.number || 0,
      player_name: row.sticker?.player_name || '',
      team: row.sticker?.team || null,
      country: row.sticker?.country || null,
      section: row.sticker?.section || null,
      quantity: row.quantity,
      distance_km,
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Quem tem o quê</h1>
          <p className="text-gray-500 text-sm mt-1">
            Figurinhas repetidas disponíveis para troca na comunidade
          </p>
        </div>
        <FeedClient
          items={feedItems}
          myCity={myProfile?.city ?? null}
          myState={myProfile?.state ?? null}
          hasGps={myLat !== null}
        />
      </main>
    </div>
  )
}
