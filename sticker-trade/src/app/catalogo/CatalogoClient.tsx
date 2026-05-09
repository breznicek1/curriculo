'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Sticker } from '@/lib/types'

interface Props {
  stickers: Sticker[]
  myDuplicateIds: Set<string>
  myQuantities: Record<string, number>
  userId: string
}

export default function CatalogoClient({ stickers, myDuplicateIds, myQuantities, userId }: Props) {
  const supabase = createClient()
  const [search, setSearch] = useState('')
  const [sectionFilter, setSectionFilter] = useState<string>('all')
  const [onlyMine, setOnlyMine] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>(myQuantities)
  const [marked, setMarked] = useState<Set<string>>(myDuplicateIds)
  const [loading, setLoading] = useState<Set<string>>(new Set())

  const sections = useMemo(() => {
    const secs = [...new Set(stickers.map((s) => s.section || 'Outros'))]
    return secs.sort()
  }, [stickers])

  const filtered = useMemo(() => {
    return stickers.filter((s) => {
      const matchSearch =
        !search ||
        s.player_name.toLowerCase().includes(search.toLowerCase()) ||
        String(s.number).includes(search) ||
        (s.team || '').toLowerCase().includes(search.toLowerCase())
      const matchSection = sectionFilter === 'all' || s.section === sectionFilter
      const matchMine = !onlyMine || marked.has(s.id)
      return matchSearch && matchSection && matchMine
    })
  }, [stickers, search, sectionFilter, onlyMine, marked])

  const bySection = useMemo(() => {
    return filtered.reduce<Record<string, Sticker[]>>((acc, s) => {
      const sec = s.section || 'Outros'
      acc[sec] = acc[sec] || []
      acc[sec].push(s)
      return acc
    }, {})
  }, [filtered])

  async function toggleSticker(sticker: Sticker) {
    if (loading.has(sticker.id)) return
    setLoading((prev) => new Set(prev).add(sticker.id))

    const isMarked = marked.has(sticker.id)

    if (isMarked) {
      const { error } = await supabase
        .schema('figurinhas')
        .from('user_stickers')
        .delete()
        .eq('user_id', userId)
        .eq('sticker_id', sticker.id)

      if (!error) {
        setMarked((prev) => { const next = new Set(prev); next.delete(sticker.id); return next })
        setQuantities((prev) => { const next = { ...prev }; delete next[sticker.id]; return next })
      }
    } else {
      const { error } = await supabase
        .schema('figurinhas')
        .from('user_stickers')
        .upsert({ user_id: userId, sticker_id: sticker.id, quantity: 1 })

      if (!error) {
        setMarked((prev) => new Set(prev).add(sticker.id))
        setQuantities((prev) => ({ ...prev, [sticker.id]: 1 }))
      }
    }

    setLoading((prev) => { const next = new Set(prev); next.delete(sticker.id); return next })
  }

  async function updateQuantity(sticker: Sticker, qty: number) {
    if (qty < 1) return
    const { error } = await supabase
      .schema('figurinhas')
      .from('user_stickers')
      .update({ quantity: qty })
      .eq('user_id', userId)
      .eq('sticker_id', sticker.id)

    if (!error) {
      setQuantities((prev) => ({ ...prev, [sticker.id]: qty }))
    }
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, número ou seleção..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
        />
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
        >
          <option value="all">Todos os grupos</option>
          {sections.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
          <input
            type="checkbox"
            checked={onlyMine}
            onChange={(e) => setOnlyMine(e.target.checked)}
            className="w-4 h-4 accent-green-700"
          />
          <span className="text-sm text-gray-700">Só minhas repetidas</span>
        </label>
      </div>

      <div className="text-sm text-gray-500 mb-4">
        {filtered.length} de {stickers.length} figurinhas •{' '}
        <span className="text-green-700 font-medium">{marked.size} repetidas marcadas</span>
      </div>

      <div className="space-y-6">
        {Object.entries(bySection)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([section, items]) => (
            <div key={section} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-green-50 border-b border-gray-100 px-5 py-3">
                <h2 className="font-semibold text-green-900 text-sm">{section}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y divide-gray-50 sm:divide-x sm:divide-y-0">
                {items.map((sticker, idx) => {
                  const isMine = marked.has(sticker.id)
                  const qty = quantities[sticker.id] || 1
                  const isLoading = loading.has(sticker.id)

                  return (
                    <div
                      key={sticker.id}
                      className={`flex items-center justify-between px-4 py-3 gap-3 ${
                        idx > 0 && idx % 2 === 0 ? 'border-t border-gray-50' : ''
                      } ${isMine ? 'bg-green-50/50' : ''}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                            isMine
                              ? 'bg-green-700 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {sticker.number}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {sticker.player_name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {sticker.team || sticker.country}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isMine && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(sticker, qty - 1)}
                              className="w-6 h-6 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs flex items-center justify-center"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-xs font-semibold text-yellow-700">
                              {qty}
                            </span>
                            <button
                              onClick={() => updateQuantity(sticker, qty + 1)}
                              className="w-6 h-6 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 text-xs flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => toggleSticker(sticker)}
                          disabled={isLoading}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            isMine
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-700 text-white hover:bg-green-800'
                          } disabled:opacity-50`}
                        >
                          {isLoading ? '...' : isMine ? 'Remover' : '+ Tenho'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
