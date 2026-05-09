'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { distanceLabel } from '@/lib/geo'

interface MatchRow {
  id: string
  user_a_id: string
  user_b_id: string
  sticker_a_id: string
  sticker_b_id: string
  sticker_a: { id: string; number: number; player_name: string; team: string | null; section: string | null }
  sticker_b: { id: string; number: number; player_name: string; team: string | null; section: string | null }
  profile_a: { id: string; username: string; city: string | null; state: string | null; contact_by_whatsapp: boolean; contact_by_email: boolean }
  profile_b: { id: string; username: string; city: string | null; state: string | null; contact_by_whatsapp: boolean; contact_by_email: boolean }
  status: string
  created_at: string
  partner_distance_km: number | null
}

interface Props {
  matches: MatchRow[]
  currentUserId: string
}

export default function MatchesClient({ matches, currentUserId }: Props) {
  const supabase = createClient()
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(matches.map((m) => [m.id, m.status]))
  )
  const [contactLoading, setContactLoading] = useState<string | null>(null)

  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">Nenhum match ainda</h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">
          Use o Swipe para marcar o que você quer. Quando alguém tiver o que você precisa
          e quiser o que você tem, aparece aqui automaticamente.
        </p>
      </div>
    )
  }

  async function handleContact(match: MatchRow) {
    setContactLoading(match.id)

    // Descobre quem é o parceiro e qual sticker ele oferece
    const iAmA = match.user_a_id === currentUserId
    const partner = iAmA ? match.profile_b : match.profile_a
    const partnerSticker = iAmA ? match.sticker_b : match.sticker_a
    const mySticker = iAmA ? match.sticker_a : match.sticker_b

    const method = partner.contact_by_whatsapp ? 'whatsapp' : 'email'

    const res = await fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_id: partner.id,
        sticker_id: iAmA ? match.sticker_b_id : match.sticker_a_id,
        message: `Oi! Temos um match perfeito ⚡\nVocê tem a #${partnerSticker.number} (${partnerSticker.player_name}) que eu preciso, e eu tenho a #${mySticker.number} (${mySticker.player_name}) que você precisa. Vamos trocar?`,
        method,
      }),
    })

    const json = await res.json()
    if (json.url) window.open(json.url, '_blank')

    // Atualiza status localmente
    setStatuses((prev) => ({ ...prev, [match.id]: 'contacted' }))
    await supabase
      .schema('figurinhas')
      .from('matches')
      .update({ status: 'contacted' })
      .eq('id', match.id)

    setContactLoading(null)
  }

  async function markDone(matchId: string) {
    setStatuses((prev) => ({ ...prev, [matchId]: 'done' }))
    await supabase
      .schema('figurinhas')
      .from('matches')
      .update({ status: 'done' })
      .eq('id', matchId)
  }

  const active = matches.filter((m) => statuses[m.id] !== 'done')
  const done   = matches.filter((m) => statuses[m.id] === 'done')

  return (
    <div className="space-y-4">
      {active.map((match) => {
        const iAmA = match.user_a_id === currentUserId
        const me      = iAmA ? match.profile_a : match.profile_b
        const partner = iAmA ? match.profile_b : match.profile_a
        const iOffer  = iAmA ? match.sticker_a : match.sticker_b
        const iGet    = iAmA ? match.sticker_b : match.sticker_a
        const status  = statuses[match.id]
        const isNew   = status === 'new' || status === 'seen'

        return (
          <div
            key={match.id}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
              isNew ? 'border-yellow-300 ring-2 ring-yellow-200' : 'border-gray-100'
            }`}
          >
            {isNew && (
              <div className="bg-yellow-400 text-green-900 text-xs font-bold text-center py-1">
                ⚡ NOVO MATCH!
              </div>
            )}

            <div className="p-5">
              {/* Visual da troca */}
              <div className="flex items-center gap-3 mb-4">
                {/* Minha figurinha */}
                <div className="flex-1 bg-green-50 rounded-xl p-3 text-center border border-green-100">
                  <p className="text-xs text-green-600 font-semibold mb-1">Você oferece</p>
                  <div className="text-2xl font-black text-green-800">#{iOffer.number}</div>
                  <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">{iOffer.player_name}</p>
                  <p className="text-xs text-gray-400 truncate">{iOffer.team}</p>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <span className="text-2xl">⇄</span>
                  <span className="text-xs text-gray-400">troca</span>
                </div>

                {/* Figurinha do parceiro */}
                <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                  <p className="text-xs text-blue-600 font-semibold mb-1">Você recebe</p>
                  <div className="text-2xl font-black text-blue-800">#{iGet.number}</div>
                  <p className="text-xs font-medium text-gray-700 mt-0.5 truncate">{iGet.player_name}</p>
                  <p className="text-xs text-gray-400 truncate">{iGet.team}</p>
                </div>
              </div>

              {/* Parceiro */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">
                      Match com <span className="text-green-700">@{partner.username}</span>
                    </p>
                    {match.partner_distance_km !== null && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        📍 {distanceLabel(match.partner_distance_km)}
                      </span>
                    )}
                  </div>
                  {partner.city && (
                    <p className="text-xs text-gray-400">
                      {partner.city}{partner.state ? `, ${partner.state}` : ''}
                    </p>
                  )}
                  {status === 'contacted' && (
                    <span className="text-xs text-blue-600 font-medium">✓ Contato iniciado</span>
                  )}
                </div>

                <div className="flex gap-2">
                  {status !== 'contacted' && (
                    <button
                      onClick={() => handleContact(match)}
                      disabled={contactLoading === match.id}
                      className="bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors"
                    >
                      {contactLoading === match.id
                        ? '...'
                        : partner.contact_by_whatsapp
                        ? '📱 WhatsApp'
                        : '✉️ E-mail'}
                    </button>
                  )}
                  <button
                    onClick={() => markDone(match.id)}
                    className="border border-gray-200 text-gray-500 hover:bg-gray-50 text-xs px-3 py-2 rounded-lg transition-colors"
                    title="Marcar como concluída"
                  >
                    ✓ Feito
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {done.length > 0 && (
        <details className="mt-4">
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600">
            {done.length} troca{done.length > 1 ? 's' : ''} concluída{done.length > 1 ? 's' : ''}
          </summary>
          <div className="mt-3 space-y-2">
            {done.map((match) => {
              const iAmA = match.user_a_id === currentUserId
              const partner = iAmA ? match.profile_b : match.profile_a
              const iOffer  = iAmA ? match.sticker_a : match.sticker_b
              const iGet    = iAmA ? match.sticker_b : match.sticker_a
              return (
                <div key={match.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between opacity-60">
                  <span className="text-xs text-gray-500">
                    #{iOffer.number} ⇄ #{iGet.number} com @{partner.username}
                  </span>
                  <span className="text-xs text-green-600 font-medium">✓ Concluída</span>
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}
