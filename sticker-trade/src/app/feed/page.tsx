import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import FeedClient from './FeedClient'
import type { FeedItem } from '@/lib/types'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Join: user_stickers → stickers → profiles_public
  // Excludes the current user
  const { data } = await supabase
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
    .limit(500)

  const feedItems: FeedItem[] = (data || []).map((row: any) => ({
    user_id: row.owner?.id || row.user_id,
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
  }))

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
        <FeedClient items={feedItems} />
      </main>
    </div>
  )
}
