import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import CatalogoClient from './CatalogoClient'
import type { Sticker, UserSticker, WishlistItem } from '@/lib/types'

export default async function CatalogoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: album } = await supabase
    .schema('figurinhas')
    .from('albums')
    .select('*')
    .eq('active', true)
    .single()

  const [{ data: stickers }, { data: userStickers }, { data: userWishlist }, { count: matchCount }] =
    await Promise.all([
      supabase.schema('figurinhas').from('stickers')
        .select('*').eq('album_id', album?.id ?? '').order('number'),
      supabase.schema('figurinhas').from('user_stickers')
        .select('*').eq('user_id', user.id),
      supabase.schema('figurinhas').from('user_wishlist')
        .select('*').eq('user_id', user.id),
      supabase.schema('figurinhas').from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('status', 'new'),
    ])

  const myDuplicateIds = new Set((userStickers || []).map((s: UserSticker) => s.sticker_id))
  const myWishlistIds  = new Set((userWishlist  || []).map((s: WishlistItem) => s.sticker_id))
  const myQuantities   = Object.fromEntries(
    (userStickers || []).map((s: UserSticker) => [s.sticker_id, s.quantity])
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header matchCount={matchCount ?? 0} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Catálogo</h1>
          <p className="text-gray-500 text-sm mt-1">
            {album?.name} — Marque repetidas (📦) e o que você quer (♥)
          </p>
        </div>
        <CatalogoClient
          stickers={(stickers || []) as Sticker[]}
          myDuplicateIds={myDuplicateIds}
          myQuantities={myQuantities}
          myWishlistIds={myWishlistIds}
          userId={user.id}
          albumId={album?.id ?? ''}
        />
      </main>
    </div>
  )
}
