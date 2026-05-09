import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import ShareProfileButton from '@/components/ShareProfileButton'
import AffiliateButton from '@/components/AffiliateButton'
import { pacotesBuyUrl } from '@/lib/affiliates'
import type { UserSticker, Sticker } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: profile },
    { data: userStickers },
    { count: wishlistCount },
    { count: matchCount },
  ] = await Promise.all([
    supabase.schema('figurinhas').from('profiles')
      .select('username, city, state').eq('id', user.id).single(),
    supabase.schema('figurinhas').from('user_stickers')
      .select('*, sticker:sticker_id(id, number, player_name, team, country, section)')
      .eq('user_id', user.id).order('sticker(number)'),
    supabase.schema('figurinhas').from('user_wishlist')
      .select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.schema('figurinhas').from('matches')
      .select('*', { count: 'exact', head: true })
      .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
      .eq('status', 'new'),
  ])

  const stickers = (userStickers || []) as (UserSticker & { sticker: Sticker })[]
  const totalRepetidas = stickers.reduce((sum, s) => sum + s.quantity, 0)

  const bySection = stickers.reduce<Record<string, typeof stickers>>((acc, s) => {
    const sec = s.sticker?.section ?? 'Outros'
    acc[sec] = acc[sec] ?? []
    acc[sec].push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <Header matchCount={matchCount ?? 0} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Olá, {profile?.username ?? 'colecionador'}! 👋
            </h1>
            {profile?.city && (
              <p className="text-gray-500 text-sm mt-0.5">
                {profile.city}{profile.state ? ` — ${profile.state}` : ''}
              </p>
            )}
          </div>
          <Link
            href="/catalogo"
            className="inline-flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            + Adicionar figurinhas
          </Link>
        </div>

        {/* Compartilhar + afiliado */}
        {profile?.username && (
          <ShareProfileButton username={profile.username} />
        )}
        <div className="mb-6">
          <AffiliateButton url={pacotesBuyUrl()} label="🛒 Comprar pacotes de figurinhas Copa 2026" variant="banner" />
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-green-700">{stickers.length}</div>
            <div className="text-xs text-gray-500 mt-1">Figurinhas repetidas</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-yellow-600">{totalRepetidas}</div>
            <div className="text-xs text-gray-500 mt-1">Total de cópias</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm text-center">
            <div className="text-2xl font-bold text-blue-600">{wishlistCount ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">Na wishlist</div>
          </div>
          <Link
            href="/matches"
            className={`rounded-xl border p-4 shadow-sm text-center transition-all ${
              (matchCount ?? 0) > 0
                ? 'bg-yellow-400 border-yellow-300 hover:bg-yellow-500'
                : 'bg-white border-gray-100 hover:bg-gray-50'
            }`}
          >
            <div className={`text-2xl font-bold ${(matchCount ?? 0) > 0 ? 'text-green-900' : 'text-purple-600'}`}>
              {matchCount ?? 0}
            </div>
            <div className={`text-xs mt-1 font-medium ${(matchCount ?? 0) > 0 ? 'text-green-800' : 'text-gray-500'}`}>
              {(matchCount ?? 0) > 0 ? '⚡ Matches novos!' : 'Matches'}
            </div>
          </Link>
        </div>

        {/* Atalhos rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <Link href="/swipe"
            className="bg-gradient-to-br from-green-600 to-green-800 text-white rounded-xl p-4 hover:from-green-700 hover:to-green-900 transition-all">
            <div className="text-2xl mb-1">🃏</div>
            <p className="font-semibold text-sm">Swipe</p>
            <p className="text-xs text-green-200">Descobrir figurinhas</p>
          </Link>
          <Link href="/matches"
            className="bg-gradient-to-br from-yellow-500 to-yellow-700 text-white rounded-xl p-4 hover:from-yellow-600 hover:to-yellow-800 transition-all">
            <div className="text-2xl mb-1">⚡</div>
            <p className="font-semibold text-sm">Matches</p>
            <p className="text-xs text-yellow-100">Trocas perfeitas</p>
          </Link>
          <Link href="/feed"
            className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl p-4 hover:from-blue-700 hover:to-blue-900 transition-all col-span-2 sm:col-span-1">
            <div className="text-2xl mb-1">🏪</div>
            <p className="font-semibold text-sm">Feira</p>
            <p className="text-xs text-blue-200">Ver todas as repetidas</p>
          </Link>
        </div>

        {/* Lista de repetidas */}
        {stickers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma repetida cadastrada</h2>
            <p className="text-gray-400 text-sm mb-6">
              Abra o catálogo, tire uma foto da sua pilha ou deslize no Swipe.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/catalogo"
                className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors">
                Abrir catálogo
              </Link>
              <Link href="/swipe"
                className="border border-green-700 text-green-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors">
                Ir pro Swipe
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(bySection).sort(([a], [b]) => a.localeCompare(b)).map(([section, items]) => (
              <div key={section} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-green-50 border-b border-gray-100 px-5 py-2.5 flex items-center justify-between">
                  <h2 className="font-semibold text-green-900 text-sm">{section}</h2>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center text-sm font-bold text-green-800 shrink-0">
                          {item.sticker?.number}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.sticker?.player_name}</p>
                          <p className="text-xs text-gray-400">{item.sticker?.team ?? item.sticker?.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full font-semibold">
                          ×{item.quantity}
                        </span>
                        <button
                          className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
                          onClick={async () => {
                            await fetch(`/api/stickers/${item.id}`, { method: 'DELETE' })
                            window.location.reload()
                          }}
                          title="Remover"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
