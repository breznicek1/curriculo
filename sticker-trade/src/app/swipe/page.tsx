import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import SwipeClient from './SwipeClient'
import { haversineKm } from '@/lib/geo'
import type { Sticker } from '@/lib/types'

export default async function SwipePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: album } = await supabase
    .schema('figurinhas')
    .from('albums')
    .select('id')
    .eq('active', true)
    .single()

  // Figurinhas que pelo menos 1 pessoa tem como repetida
  // excluindo o que o usuário já marcou como repetida ou na wishlist
  const { data: available } = await supabase
    .schema('figurinhas')
    .from('stickers')
    .select(`
      *,
      user_stickers!inner(user_id)
    `)
    .eq('album_id', album?.id ?? '')
    .neq('user_stickers.user_id', user.id)
    .order('number')

  // O que o usuário já tem repetido (oferece)
  const { data: myStickers } = await supabase
    .schema('figurinhas')
    .from('user_stickers')
    .select('sticker_id')
    .eq('user_id', user.id)

  // O que o usuário já quer (wishlist)
  const { data: myWishlist } = await supabase
    .schema('figurinhas')
    .from('user_wishlist')
    .select('sticker_id')
    .eq('user_id', user.id)

  // Cards já vistos nesta sessão / resetados
  const { data: seenRows } = await supabase
    .schema('figurinhas')
    .from('swipe_seen')
    .select('sticker_id, decision')
    .eq('user_id', user.id)

  const myDuplicateIds = new Set((myStickers || []).map((s) => s.sticker_id))
  const wishlistIds    = new Set((myWishlist  || []).map((s) => s.sticker_id))
  const seenIds        = new Set((seenRows    || []).map((s) => s.sticker_id))

  // Fetch my location for proximity on cards
  const { data: myProfile } = await supabase
    .schema('figurinhas')
    .from('profiles')
    .select('latitude, longitude')
    .eq('id', user.id)
    .single()

  // Build nearest-owner distance map
  let nearestKmMap = new Map<string, number>()
  if (myProfile?.latitude && myProfile?.longitude) {
    const ownerIds = [...new Set((available || []).map((r: any) => r.user_stickers?.user_id).filter(Boolean))]
    if (ownerIds.length) {
      const { data: ownerCoords } = await supabase
        .schema('figurinhas')
        .from('profiles')
        .select('id, latitude, longitude')
        .in('id', ownerIds)
      const coordMap = new Map((ownerCoords || []).map((p: any) => [p.id, { lat: p.latitude, lng: p.longitude }]))
      for (const row of (available || []) as any[]) {
        const ownerId = row.user_stickers?.user_id
        const coords = coordMap.get(ownerId)
        if (coords?.lat && coords?.lng) {
          const km = haversineKm(myProfile.latitude, myProfile.longitude, coords.lat, coords.lng)
          const current = nearestKmMap.get(row.id)
          if (current === undefined || km < current) nearestKmMap.set(row.id, Math.round(km))
        }
      }
    }
  }

  // Stickers únicos disponíveis (dedup), excluindo vistos e os que já tenho como repetida
  const seen = new Set<string>()
  const deck: (Sticker & { available_count: number; has_match: boolean; nearest_km: number | null })[] = []

  for (const row of (available || []) as any[]) {
    if (seen.has(row.id)) continue
    if (seenIds.has(row.id)) continue
    if (myDuplicateIds.has(row.id)) continue
    seen.add(row.id)

    const count = (available || []).filter((r: any) => r.id === row.id).length
    const has_match = myDuplicateIds.size > 0
    deck.push({ ...row, available_count: count, has_match, nearest_km: nearestKmMap.get(row.id) ?? null })
  }

  const { count: matchCount } = await supabase
    .schema('figurinhas')
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .eq('status', 'new')

  return (
    <div className="min-h-screen bg-gray-50">
      <Header matchCount={matchCount ?? 0} />
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Swipe de Figurinhas</h1>
          <p className="text-gray-500 text-sm mt-1">
            Deslize → para querer • ← para pular
          </p>
        </div>
        <SwipeClient
          deck={deck}
          wishlistIds={wishlistIds}
          userId={user.id}
        />
      </main>
    </div>
  )
}
