import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import PublicProfileClient from './PublicProfileClient'
import type { Sticker, UserSticker } from '@/lib/types'

interface Props {
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .schema('figurinhas')
    .from('profiles')
    .select('id, username, city, state')
    .eq('username', username)
    .single()

  if (!profile) return { title: 'Usuário não encontrado' }

  const { count } = await supabase
    .schema('figurinhas')
    .from('user_stickers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', (profile as any).id)

  const location = profile.city
    ? `${profile.city}${profile.state ? `/${profile.state}` : ''}`
    : 'Brasil'

  const title = `@${profile.username} tem ${count ?? 0} figurinhas para trocar | Copa 2026`
  const description = `${profile.username} de ${location} está trocando figurinhas da Copa do Mundo 2026. Veja o que está disponível e entre em contato!`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'profile',
      siteName: 'Troca Figurinhas Copa 2026',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .schema('figurinhas')
    .from('profiles')
    .select('id, username, city, state, contact_by_whatsapp, contact_by_email, created_at')
    .eq('username', username)
    .single()

  if (!profile) notFound()

  const { data: userStickers } = await supabase
    .schema('figurinhas')
    .from('user_stickers')
    .select('*, sticker:sticker_id(id, number, player_name, team, country, section)')
    .eq('user_id', profile.id)
    .order('sticker(number)')

  const stickers = (userStickers || []) as (UserSticker & { sticker: Sticker })[]

  const bySection = stickers.reduce<Record<string, typeof stickers>>((acc, s) => {
    const sec = s.sticker?.section ?? 'Outros'
    acc[sec] = acc[sec] ?? []
    acc[sec].push(s)
    return acc
  }, {})

  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  return (
    <PublicProfileClient
      profile={profile as any}
      bySection={bySection}
      totalStickers={stickers.length}
      isLoggedIn={isLoggedIn}
      currentUserId={user?.id ?? null}
    />
  )
}
