import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import CatalogoClient from './CatalogoClient'
import type { Sticker, UserSticker } from '@/lib/types'

export default async function CatalogoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: albums } = await supabase
    .schema('figurinhas')
    .from('albums')
    .select('*')
    .eq('active', true)
    .single()

  const { data: stickers } = await supabase
    .schema('figurinhas')
    .from('stickers')
    .select('*')
    .eq('album_id', albums?.id || '')
    .order('number')

  const { data: userStickers } = await supabase
    .schema('figurinhas')
    .from('user_stickers')
    .select('*')
    .eq('user_id', user.id)

  const myDuplicateIds = new Set((userStickers || []).map((s: UserSticker) => s.sticker_id))
  const myQuantities = Object.fromEntries(
    (userStickers || []).map((s: UserSticker) => [s.sticker_id, s.quantity])
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Catálogo</h1>
          <p className="text-gray-500 text-sm mt-1">
            {albums?.name} — Marque as figurinhas que você tem repetidas
          </p>
        </div>
        <CatalogoClient
          stickers={(stickers || []) as Sticker[]}
          myDuplicateIds={myDuplicateIds}
          myQuantities={myQuantities}
          userId={user.id}
        />
      </main>
    </div>
  )
}
