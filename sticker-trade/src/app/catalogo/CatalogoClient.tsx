'use client'

import { useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import PhotoOCR from '@/components/PhotoOCR'
import type { Sticker } from '@/lib/types'

interface Props {
  stickers: Sticker[]
  myDuplicateIds: Set<string>
  myQuantities: Record<string, number>
  myWishlistIds: Set<string>
  userId: string
  albumId: string
}

export default function CatalogoClient({
  stickers, myDuplicateIds, myQuantities, myWishlistIds, userId, albumId,
}: Props) {
  const supabase = createClient()
  const [search, setSearch]           = useState('')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [viewFilter, setViewFilter]   = useState<'all' | 'mine' | 'wishlist'>('all')
  const [showOCR, setShowOCR]         = useState(false)

  const [duplicates, setDuplicates]   = useState<Set<string>>(myDuplicateIds)
  const [quantities, setQuantities]   = useState<Record<string, number>>(myQuantities)
  const [wishlist, setWishlist]       = useState<Set<string>>(myWishlistIds)
  const [loadingDup, setLoadingDup]   = useState<Set<string>>(new Set())
  const [loadingWish, setLoadingWish] = useState<Set<string>>(new Set())

  const stickerById = useMemo(
    () => Object.fromEntries(stickers.map((s) => [s.id, s])),
    [stickers]
  )
  const stickerByNumber = useMemo(
    () => Object.fromEntries(stickers.map((s) => [s.number, s])),
    [stickers]
  )

  const sections = useMemo(
    () => [...new Set(stickers.map((s) => s.section ?? 'Outros'))].sort(),
    [stickers]
  )

  const filtered = useMemo(() => {
    return stickers.filter((s) => {
      const q = search.toLowerCase()
      const matchSearch = !search ||
        s.player_name.toLowerCase().includes(q) ||
        String(s.number).includes(q) ||
        (s.team ?? '').toLowerCase().includes(q)
      const matchSection = sectionFilter === 'all' || s.section === sectionFilter
      const matchView =
        viewFilter === 'all' ? true :
        viewFilter === 'mine' ? duplicates.has(s.id) :
        wishlist.has(s.id)
      return matchSearch && matchSection && matchView
    })
  }, [stickers, search, sectionFilter, viewFilter, duplicates, wishlist])

  const bySection = useMemo(() => {
    return filtered.reduce<Record<string, Sticker[]>>((acc, s) => {
      const sec = s.section ?? 'Outros'
      acc[sec] = acc[sec] ?? []
      acc[sec].push(s)
      return acc
    }, {})
  }, [filtered])

  const toggleDuplicate = useCallback(async (sticker: Sticker) => {
    if (loadingDup.has(sticker.id)) return
    setLoadingDup((p) => new Set(p).add(sticker.id))
    const has = duplicates.has(sticker.id)
    if (has) {
      await supabase.schema('figurinhas').from('user_stickers')
        .delete().eq('user_id', userId).eq('sticker_id', sticker.id)
      setDuplicates((p) => { const n = new Set(p); n.delete(sticker.id); return n })
      setQuantities((p) => { const n = { ...p }; delete n[sticker.id]; return n })
    } else {
      await supabase.schema('figurinhas').from('user_stickers')
        .upsert({ user_id: userId, sticker_id: sticker.id, quantity: 1 })
      setDuplicates((p) => new Set(p).add(sticker.id))
      setQuantities((p) => ({ ...p, [sticker.id]: 1 }))
    }
    setLoadingDup((p) => { const n = new Set(p); n.delete(sticker.id); return n })
  }, [duplicates, loadingDup, supabase, userId])

  const toggleWishlist = useCallback(async (sticker: Sticker) => {
    if (loadingWish.has(sticker.id)) return
    setLoadingWish((p) => new Set(p).add(sticker.id))
    const has = wishlist.has(sticker.id)
    if (has) {
      await supabase.schema('figurinhas').from('user_wishlist')
        .delete().eq('user_id', userId).eq('sticker_id', sticker.id)
      setWishlist((p) => { const n = new Set(p); n.delete(sticker.id); return n })
    } else {
      await supabase.schema('figurinhas').from('user_wishlist')
        .upsert({ user_id: userId, sticker_id: sticker.id })
      setWishlist((p) => new Set(p).add(sticker.id))
    }
    setLoadingWish((p) => { const n = new Set(p); n.delete(sticker.id); return n })
  }, [wishlist, loadingWish, supabase, userId])

  const updateQty = useCallback(async (sticker: Sticker, qty: number) => {
    if (qty < 1) return
    await supabase.schema('figurinhas').from('user_stickers')
      .update({ quantity: qty }).eq('user_id', userId).eq('sticker_id', sticker.id)
    setQuantities((p) => ({ ...p, [sticker.id]: qty }))
  }, [supabase, userId])

  // Chamado pelo OCR com números detectados
  async function handleOCRNumbers(numbers: number[]) {
    setShowOCR(false)
    const toAdd = numbers
      .map((n) => stickerByNumber[n])
      .filter((s): s is Sticker => !!s && !duplicates.has(s.id))

    if (toAdd.length === 0) return

    await supabase.schema('figurinhas').from('user_stickers').upsert(
      toAdd.map((s) => ({ user_id: userId, sticker_id: s.id, quantity: 1 }))
    )
    setDuplicates((p) => {
      const n = new Set(p)
      toAdd.forEach((s) => n.add(s.id))
      return n
    })
    setQuantities((p) => {
      const n = { ...p }
      toAdd.forEach((s) => { n[s.id] = 1 })
      return n
    })
  }

  return (
    <div>
      {/* OCR panel */}
      {showOCR && (
        <div className="mb-6">
          <PhotoOCR userId={userId} albumId={albumId} onNumbersDetected={handleOCRNumbers} />
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nome, número ou seleção..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
          <button
            onClick={() => setShowOCR((v) => !v)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
              showOCR ? 'bg-green-700 text-white border-green-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
            title="Cadastrar por foto"
          >
            📷
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-green-600"
          >
            <option value="all">Todos grupos</option>
            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(['all', 'mine', 'wishlist'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setViewFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                viewFilter === v
                  ? 'bg-green-700 text-white border-green-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {v === 'all' ? 'Todas' : v === 'mine' ? `📦 Repetidas (${duplicates.size})` : `♥ Wishlist (${wishlist.size})`}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-4">
        {filtered.length} de {stickers.length} figurinhas
      </p>

      {/* Cards por seção */}
      <div className="space-y-5">
        {Object.entries(bySection).sort(([a], [b]) => a.localeCompare(b)).map(([section, items]) => (
          <div key={section} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-green-50 border-b border-gray-100 px-4 py-2.5 flex items-center justify-between">
              <h2 className="font-semibold text-green-900 text-sm">{section}</h2>
              <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">{items.length}</span>
            </div>

            <div className="divide-y divide-gray-50">
              {items.map((sticker) => {
                const isDup   = duplicates.has(sticker.id)
                const isWish  = wishlist.has(sticker.id)
                const qty     = quantities[sticker.id] ?? 1
                const isLoadD = loadingDup.has(sticker.id)
                const isLoadW = loadingWish.has(sticker.id)

                return (
                  <div key={sticker.id} className={`px-4 py-3 flex items-center gap-3 ${isDup ? 'bg-green-50/40' : isWish ? 'bg-blue-50/30' : ''}`}>
                    {/* Número */}
                    <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                      isDup ? 'bg-green-700 text-white' : isWish ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {sticker.number}
                    </span>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{sticker.player_name}</p>
                      <p className="text-xs text-gray-400 truncate">{sticker.team ?? sticker.country}</p>
                    </div>

                    {/* Controles */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Wishlist */}
                      <button
                        onClick={() => toggleWishlist(sticker)}
                        disabled={isLoadW || isDup}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-colors ${
                          isWish ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600'
                        } disabled:opacity-40`}
                        title={isWish ? 'Remover da wishlist' : 'Adicionar à wishlist'}
                      >
                        ♥
                      </button>

                      {/* Quantidade (só se for repetida) */}
                      {isDup && (
                        <div className="flex items-center gap-0.5">
                          <button onClick={() => updateQty(sticker, qty - 1)}
                            className="w-5 h-5 rounded border border-gray-200 text-gray-500 text-xs hover:bg-gray-100 flex items-center justify-center">−</button>
                          <span className="w-5 text-center text-xs font-bold text-yellow-700">{qty}</span>
                          <button onClick={() => updateQty(sticker, qty + 1)}
                            className="w-5 h-5 rounded border border-gray-200 text-gray-500 text-xs hover:bg-gray-100 flex items-center justify-center">+</button>
                        </div>
                      )}

                      {/* Repetida toggle */}
                      <button
                        onClick={() => toggleDuplicate(sticker)}
                        disabled={isLoadD}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          isDup ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-700 text-white hover:bg-green-800'
                        } disabled:opacity-50`}
                      >
                        {isLoadD ? '...' : isDup ? '− Remover' : '+ Tenho'}
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
