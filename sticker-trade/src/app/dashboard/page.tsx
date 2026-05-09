import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import type { UserSticker, Sticker } from '@/lib/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .schema('figurinhas')
    .from('profiles')
    .select('username, city, state')
    .eq('id', user.id)
    .single()

  const { data: userStickers } = await supabase
    .schema('figurinhas')
    .from('user_stickers')
    .select('*, sticker:sticker_id(id, number, player_name, team, country, section)')
    .eq('user_id', user.id)
    .order('sticker(number)')

  const stickers = (userStickers || []) as (UserSticker & { sticker: Sticker })[]
  const totalRepetidas = stickers.reduce((sum, s) => sum + s.quantity, 0)

  const bySection = stickers.reduce<Record<string, typeof stickers>>((acc, s) => {
    const sec = s.sticker?.section || 'Outros'
    acc[sec] = acc[sec] || []
    acc[sec].push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Olá, {profile?.username || 'colecionador'}! 👋
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
            + Adicionar repetidas
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
            <div className="text-3xl font-bold text-green-700">{stickers.length}</div>
            <div className="text-xs text-gray-500 mt-1">Figurinhas repetidas</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center">
            <div className="text-3xl font-bold text-yellow-600">{totalRepetidas}</div>
            <div className="text-xs text-gray-500 mt-1">Total de cópias</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm text-center col-span-2 sm:col-span-1">
            <div className="text-3xl font-bold text-blue-600">
              {Object.keys(bySection).length}
            </div>
            <div className="text-xs text-gray-500 mt-1">Grupos/Seções</div>
          </div>
        </div>

        {stickers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="text-5xl mb-4">📦</div>
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma repetida ainda</h2>
            <p className="text-gray-400 text-sm mb-6">
              Vá ao catálogo e marque as figurinhas que você tem repetidas.
            </p>
            <Link
              href="/catalogo"
              className="inline-block bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors"
            >
              Abrir catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(bySection)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([section, items]) => (
                <div key={section} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-green-50 border-b border-gray-100 px-5 py-3 flex items-center justify-between">
                    <h2 className="font-semibold text-green-900 text-sm">{section}</h2>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                      {items.length} {items.length === 1 ? 'figurinha' : 'figurinhas'}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {items.map((item) => (
                      <div key={item.id} className="px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center text-sm font-bold text-green-800">
                            {item.sticker?.number}
                          </span>
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {item.sticker?.player_name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.sticker?.team || item.sticker?.country}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2.5 py-1 rounded-full font-semibold">
                            ×{item.quantity}
                          </span>
                          <RemoveStickerButton
                            userStickerId={item.id}
                            quantity={item.quantity}
                          />
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

function RemoveStickerButton({ userStickerId, quantity }: { userStickerId: string; quantity: number }) {
  return (
    <form action={`/api/stickers/${userStickerId}`} method="POST">
      <input type="hidden" name="_method" value="DELETE" />
      <button
        type="button"
        className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none"
        onClick={async () => {
          await fetch(`/api/stickers/${userStickerId}`, { method: 'DELETE' })
          window.location.reload()
        }}
        title="Remover"
      >
        ×
      </button>
    </form>
  )
}
