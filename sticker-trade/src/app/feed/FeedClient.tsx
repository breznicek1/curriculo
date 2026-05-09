'use client'

import { useState, useMemo } from 'react'
import ContactModal from '@/components/ContactModal'
import type { FeedItem } from '@/lib/types'

interface Props {
  items: FeedItem[]
}

export default function FeedClient({ items }: Props) {
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null)
  const [view, setView] = useState<'figurinha' | 'usuario'>('figurinha')

  const filtered = useMemo(() => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (i) =>
        i.player_name.toLowerCase().includes(q) ||
        String(i.sticker_number).includes(q) ||
        (i.team || '').toLowerCase().includes(q) ||
        i.username.toLowerCase().includes(q) ||
        (i.city || '').toLowerCase().includes(q) ||
        (i.state || '').toLowerCase().includes(q)
    )
  }, [items, search])

  const bySticker = useMemo(() => {
    return filtered.reduce<Record<string, FeedItem[]>>((acc, item) => {
      const key = `${item.sticker_number}|${item.player_name}`
      acc[key] = acc[key] || []
      acc[key].push(item)
      return acc
    }, {})
  }, [filtered])

  const byUser = useMemo(() => {
    return filtered.reduce<Record<string, FeedItem[]>>((acc, item) => {
      acc[item.user_id] = acc[item.user_id] || []
      acc[item.user_id].push(item)
      return acc
    }, {})
  }, [filtered])

  const uniqueStickers = Object.keys(bySticker).length
  const uniqueUsers = Object.keys(byUser).length

  return (
    <div>
      {selectedItem && (
        <ContactModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar figurinha, jogador, usuário, cidade..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('figurinha')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'figurinha' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            Por figurinha
          </button>
          <button
            onClick={() => setView('usuario')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'usuario' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            Por usuário
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        {filtered.length} entradas •{' '}
        {view === 'figurinha'
          ? `${uniqueStickers} figurinhas distintas`
          : `${uniqueUsers} colecionadores`}
      </p>

      {items.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">🤝</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma repetida disponível</h2>
          <p className="text-gray-400 text-sm">
            Seja o primeiro a cadastrar suas repetidas no catálogo!
          </p>
        </div>
      )}

      {view === 'figurinha' && (
        <div className="space-y-3">
          {Object.entries(bySticker)
            .sort(([a], [b]) => {
              const na = parseInt(a.split('|')[0])
              const nb = parseInt(b.split('|')[0])
              return na - nb
            })
            .map(([key, entries]) => {
              const first = entries[0]
              return (
                <div key={key} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 bg-green-50/50">
                    <span className="w-10 h-10 rounded-lg bg-green-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {first.sticker_number}
                    </span>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{first.player_name}</p>
                      <p className="text-xs text-gray-400">
                        {first.team || first.country} • {first.section}
                      </p>
                    </div>
                    <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {entries.length} {entries.length === 1 ? 'pessoa tem' : 'pessoas têm'}
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {entries.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-gray-800">@{item.username}</p>
                          {item.city && (
                            <p className="text-xs text-gray-400">
                              {item.city}{item.state ? `, ${item.state}` : ''}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">×{item.quantity}</span>
                          {(item.contact_by_whatsapp || item.contact_by_email) && (
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold hover:bg-green-800 transition-colors"
                            >
                              Contatar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {view === 'usuario' && (
        <div className="space-y-3">
          {Object.entries(byUser)
            .sort(([, a], [, b]) => b.length - a.length)
            .map(([userId, entries]) => {
              const user = entries[0]
              return (
                <div key={userId} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 bg-blue-50/50">
                    <div>
                      <p className="font-semibold text-gray-800">@{user.username}</p>
                      {user.city && (
                        <p className="text-xs text-gray-400">
                          {user.city}{user.state ? `, ${user.state}` : ''}
                        </p>
                      )}
                    </div>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                      {entries.length} {entries.length === 1 ? 'repetida' : 'repetidas'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 px-4 py-3">
                    {entries
                      .sort((a, b) => a.sticker_number - b.sticker_number)
                      .map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded font-medium"
                          title={item.player_name}
                        >
                          #{item.sticker_number} {item.quantity > 1 ? `×${item.quantity}` : ''}
                        </span>
                      ))}
                  </div>
                  {(user.contact_by_whatsapp || user.contact_by_email) && (
                    <div className="px-4 pb-3">
                      <button
                        onClick={() => setSelectedItem(entries[0])}
                        className="bg-green-700 text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-green-800 transition-colors"
                      >
                        Contatar @{user.username}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
