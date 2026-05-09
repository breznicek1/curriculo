'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AffiliateButton from '@/components/AffiliateButton'
import { stickerBuyUrl } from '@/lib/affiliates'
import { distanceLabel } from '@/lib/geo'
import type { Sticker } from '@/lib/types'

interface DeckSticker extends Sticker {
  available_count: number
  has_match: boolean
  nearest_km: number | null
}

interface Props {
  deck: DeckSticker[]
  wishlistIds: Set<string>
  userId: string
}

const SECTION_COLORS: Record<string, string> = {
  'ESPECIAL': 'from-yellow-500 to-yellow-700',
  'GRUPO A':  'from-green-600 to-green-800',
  'GRUPO B':  'from-blue-600 to-blue-800',
  'GRUPO C':  'from-red-600 to-red-800',
  'GRUPO D':  'from-purple-600 to-purple-800',
  'GRUPO E':  'from-orange-500 to-orange-700',
  'GRUPO F':  'from-teal-600 to-teal-800',
  'GRUPO G':  'from-pink-600 to-pink-800',
  'GRUPO H':  'from-indigo-600 to-indigo-800',
}

function cardColor(section: string | null) {
  if (!section) return 'from-green-700 to-green-900'
  return SECTION_COLORS[section] ?? 'from-green-700 to-green-900'
}

export default function SwipeClient({ deck, wishlistIds, userId }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [cards, setCards]     = useState(deck)
  const [index, setIndex]     = useState(0)
  const [inWishlist, setInWishlist] = useState(new Set(wishlistIds))
  const [swipeDir, setSwipeDir]     = useState<'left' | 'right' | null>(null)
  const [feedback, setFeedback]     = useState<'want' | 'skip' | null>(null)
  const [loading, setLoading]       = useState(false)
  const dragStart = useRef<number | null>(null)
  const cardRef   = useRef<HTMLDivElement>(null)

  const current = cards[index]
  const remaining = cards.length - index

  async function decide(decision: 'want' | 'skip') {
    if (loading || !current) return
    setLoading(true)
    setFeedback(decision)
    setSwipeDir(decision === 'want' ? 'right' : 'left')

    if (decision === 'want' && !inWishlist.has(current.id)) {
      await supabase.schema('figurinhas').from('user_wishlist')
        .upsert({ user_id: userId, sticker_id: current.id })
      await supabase.schema('figurinhas').from('swipe_seen')
        .upsert({ user_id: userId, sticker_id: current.id, decision: 'want' })
      setInWishlist(prev => new Set(prev).add(current.id))
    } else {
      await supabase.schema('figurinhas').from('swipe_seen')
        .upsert({ user_id: userId, sticker_id: current.id, decision: 'skip' })
    }

    setTimeout(() => {
      setSwipeDir(null)
      setFeedback(null)
      setIndex(i => i + 1)
      setLoading(false)
    }, 350)
  }

  function onTouchStart(e: React.TouchEvent) {
    dragStart.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (dragStart.current === null) return
    const diff = e.changedTouches[0].clientX - dragStart.current
    dragStart.current = null
    if (Math.abs(diff) < 50) return
    decide(diff > 0 ? 'want' : 'skip')
  }

  function onMouseDown(e: React.MouseEvent) {
    dragStart.current = e.clientX
  }

  function onMouseUp(e: React.MouseEvent) {
    if (dragStart.current === null) return
    const diff = e.clientX - dragStart.current
    dragStart.current = null
    if (Math.abs(diff) < 60) return
    decide(diff > 0 ? 'want' : 'skip')
  }

  async function resetDeck() {
    await supabase.schema('figurinhas').from('swipe_seen')
      .delete().eq('user_id', userId)
    router.refresh()
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-7xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Você viu tudo!</h2>
        <p className="text-gray-500 text-sm mb-2">
          {inWishlist.size > 0
            ? `${inWishlist.size} figurinhas na sua lista de desejos`
            : 'Nenhuma figurinha marcada ainda'}
        </p>
        <p className="text-gray-400 text-xs mb-6">
          Matches são detectados automaticamente quando alguém tem o que você quer.
        </p>
        <div className="flex gap-3">
          <button
            onClick={resetDeck}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
          >
            Recomeçar deck
          </button>
          <button
            onClick={() => router.push('/matches')}
            className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-semibold hover:bg-green-800 transition-colors"
          >
            Ver matches ⚡
          </button>
        </div>
      </div>
    )
  }

  const transform = swipeDir === 'right'
    ? 'translate-x-full rotate-12 opacity-0'
    : swipeDir === 'left'
    ? '-translate-x-full -rotate-12 opacity-0'
    : 'translate-x-0 rotate-0 opacity-100'

  const alreadyWanted = inWishlist.has(current.id)

  return (
    <div className="flex flex-col items-center gap-6">

      {/* Contador */}
      <div className="text-xs text-gray-400">
        {remaining} figurinhas restantes no deck
      </div>

      {/* Stack visual — próximos cards atrás */}
      <div className="relative w-full max-w-sm h-96">
        {[2, 1].map((offset) => {
          const nextCard = cards[index + offset]
          if (!nextCard) return null
          return (
            <div
              key={nextCard.id}
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-600 to-green-800"
              style={{
                transform: `scale(${1 - offset * 0.04}) translateY(${offset * 8}px)`,
                zIndex: 10 - offset,
              }}
            />
          )
        })}

        {/* Card principal */}
        <div
          ref={cardRef}
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${cardColor(current.section)}
            text-white shadow-xl cursor-grab active:cursor-grabbing select-none z-20
            transition-all duration-300 ease-out ${transform}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
        >
          {/* Feedback overlay */}
          {feedback === 'want' && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-green-500/40 z-30">
              <span className="text-white text-5xl font-black border-4 border-white rounded-xl px-4 py-1 rotate-[-15deg]">
                QUERO!
              </span>
            </div>
          )}
          {feedback === 'skip' && (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-red-500/40 z-30">
              <span className="text-white text-5xl font-black border-4 border-white rounded-xl px-4 py-1 rotate-[15deg]">
                PULAR
              </span>
            </div>
          )}

          <div className="p-6 h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                {current.section ?? 'Geral'}
              </span>
              {alreadyWanted && (
                <span className="bg-yellow-400 text-green-900 text-xs font-bold px-2 py-1 rounded-full">
                  ★ Na lista
                </span>
              )}
            </div>

            <div className="text-center">
              <div className="text-8xl font-black text-white/90 leading-none mb-2">
                #{current.number}
              </div>
              <h2 className="text-2xl font-bold text-white drop-shadow">
                {current.player_name}
              </h2>
              <p className="text-white/70 text-sm mt-1">
                {current.team || current.country}
              </p>
            </div>

            <div className="flex items-center justify-between text-white/70 text-xs">
              <span>
                {current.available_count}{' '}
                {current.available_count === 1 ? 'pessoa tem' : 'pessoas têm'} repetida
              </span>
              <div className="flex items-center gap-1.5">
                {current.nearest_km !== null && (
                  <span className="bg-white/20 text-white px-2 py-0.5 rounded-full">
                    📍 {distanceLabel(current.nearest_km)}
                  </span>
                )}
                {current.has_match && (
                  <span className="bg-yellow-400/30 text-yellow-200 px-2 py-0.5 rounded-full">
                    ⚡ Match
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => decide('skip')}
          disabled={loading}
          className="w-16 h-16 rounded-full bg-white border-2 border-red-300 text-red-400 text-2xl shadow-md hover:bg-red-50 hover:border-red-400 transition-all disabled:opacity-50 flex items-center justify-center"
          title="Pular"
        >
          ✕
        </button>

        <div className="text-center">
          <p className="text-xs text-gray-400">arraste ou clique</p>
        </div>

        <button
          onClick={() => decide('want')}
          disabled={loading || alreadyWanted}
          className="w-16 h-16 rounded-full bg-white border-2 border-green-500 text-green-600 text-2xl shadow-md hover:bg-green-50 hover:border-green-600 transition-all disabled:opacity-50 flex items-center justify-center"
          title="Quero!"
        >
          ♥
        </button>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Swipe ← pular &nbsp;|&nbsp; Swipe → quero
      </p>

      {/* Afiliado contextual: só aparece se a figurinha tem poucos donos */}
      {current.available_count === 0 && (
        <div className="w-full max-w-sm mt-2">
          <AffiliateButton
            url={stickerBuyUrl(current.player_name)}
            label={`🛒 Comprar #${current.number} ${current.player_name} online`}
            variant="banner"
          />
        </div>
      )}
    </div>
  )
}
