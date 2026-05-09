import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import MatchesClient from './MatchesClient'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rawMatches } = await supabase
    .schema('figurinhas')
    .from('matches')
    .select(`
      *,
      sticker_a:sticker_a_id(id, number, player_name, team, country, section),
      sticker_b:sticker_b_id(id, number, player_name, team, country, section),
      profile_a:user_a_id(id, username, city, state, contact_by_whatsapp, contact_by_email),
      profile_b:user_b_id(id, username, city, state, contact_by_whatsapp, contact_by_email)
    `)
    .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  // Marca como visto
  const newIds = (rawMatches || [])
    .filter((m: any) => m.status === 'new')
    .map((m: any) => m.id)

  if (newIds.length > 0) {
    await supabase
      .schema('figurinhas')
      .from('matches')
      .update({ status: 'seen' })
      .in('id', newIds)
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
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            ⚡ Seus Matches
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Trocas perfeitas detectadas automaticamente
          </p>
        </div>
        <MatchesClient
          matches={(rawMatches || []) as any[]}
          currentUserId={user.id}
        />
      </main>
    </div>
  )
}
