'use client'

import { useState } from 'react'
import Link from 'next/link'
import ContactModal from '@/components/ContactModal'
import AffiliateButton from '@/components/AffiliateButton'
import { pacotesBuyUrl, albumBuyUrl } from '@/lib/affiliates'
import { distanceLabel } from '@/lib/geo'
import type { UserSticker, Sticker, ProfilePublic, FeedItem } from '@/lib/types'

interface Props {
  profile: ProfilePublic
  bySection: Record<string, (UserSticker & { sticker: Sticker })[]>
  totalStickers: number
  isLoggedIn: boolean
  currentUserId: string | null
  distanceKm: number | null
}

export default function PublicProfileClient({
  profile, bySection, totalStickers, isLoggedIn, currentUserId, distanceKm,
}: Props) {
  const [copied, setCopied]           = useState(false)
  const [contactItem, setContactItem] = useState<FeedItem | null>(null)

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/u/${profile.username}`
    : `/u/${profile.username}`

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Oi! Tenho ${totalStickers} figurinhas repetidas da Copa 2026 para trocar. Veja quais aqui: ${profileUrl}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  async function copyLink() {
    await navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function openContact(sticker: Sticker) {
    if (!isLoggedIn) {
      window.location.href = `/login?next=/u/${profile.username}`
      return
    }
    if (currentUserId === profile.id) return
    setContactItem({
      user_id: profile.id,
      username: profile.username,
      city: profile.city,
      state: profile.state,
      contact_by_whatsapp: profile.contact_by_whatsapp,
      contact_by_email: profile.contact_by_email,
      sticker_id: sticker.id,
      sticker_number: sticker.number,
      player_name: sticker.player_name,
      team: sticker.team,
      country: sticker.country,
      section: sticker.section,
      quantity: 1,
      distance_km: distanceKm,
    })
  }

  const isOwnProfile = currentUserId === profile.id

  return (
    <div className="min-h-screen bg-gray-50">
      {contactItem && (
        <ContactModal item={contactItem} onClose={() => setContactItem(null)} />
      )}

      {/* Header público — sem navbar de app */}
      <div className="bg-green-800 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold flex items-center gap-1.5 text-green-100 hover:text-white">
            ⚽ Troca Figurinhas Copa 2026
          </Link>
          {isLoggedIn ? (
            <Link href="/dashboard" className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
              Meu painel
            </Link>
          ) : (
            <Link href="/cadastro" className="text-xs bg-yellow-400 hover:bg-yellow-500 text-green-900 font-semibold px-3 py-1.5 rounded-lg transition-colors">
              Criar conta grátis
            </Link>
          )}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Card do perfil */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700 mb-3">
                {profile.username[0].toUpperCase()}
              </div>
              <h1 className="text-xl font-bold text-gray-900">@{profile.username}</h1>
              {profile.city && (
                <p className="text-gray-500 text-sm mt-0.5">
                  📍 {profile.city}{profile.state ? `, ${profile.state}` : ''}
                </p>
              )}
              {distanceKm !== null && !isOwnProfile && (
                <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                  📍 {distanceLabel(distanceKm)} de você
                </span>
              )}
            </div>

            <div className="text-right shrink-0">
              <div className="text-3xl font-black text-green-700">{totalStickers}</div>
              <div className="text-xs text-gray-400">figurinhas repetidas</div>
            </div>
          </div>

          {/* Botões de compartilhar */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              📱 Compartilhar no WhatsApp
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {copied ? '✓ Copiado!' : '🔗 Copiar link'}
            </button>
            {isOwnProfile && (
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 border border-green-200 text-green-700 hover:bg-green-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                ✏️ Editar minhas repetidas
              </Link>
            )}
          </div>
        </div>

        {/* Afiliado: banner contextual */}
        {!isOwnProfile && (
          <div className="mb-6 space-y-2">
            <AffiliateButton
              url={pacotesBuyUrl()}
              label="🛒 Comprar pacotes de figurinhas Copa 2026"
              variant="banner"
            />
          </div>
        )}

        {/* Lista de repetidas */}
        {totalStickers === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="text-5xl mb-3">📭</div>
            <p className="text-gray-500">Nenhuma figurinha cadastrada ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-700 text-sm">
              Figurinhas disponíveis para troca
            </h2>
            {Object.entries(bySection).sort(([a], [b]) => a.localeCompare(b)).map(([section, items]) => (
              <div key={section} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-green-50 border-b border-gray-100 px-4 py-2.5 flex items-center justify-between">
                  <h3 className="font-semibold text-green-900 text-sm">{section}</h3>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full">{items.length}</span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-green-700 text-white flex items-center justify-center text-sm font-bold shrink-0">
                          {item.sticker?.number}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{item.sticker?.player_name}</p>
                          <p className="text-xs text-gray-400">{item.sticker?.team ?? item.sticker?.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">×{item.quantity}</span>
                        {!isOwnProfile && (profile.contact_by_whatsapp || profile.contact_by_email) && (
                          <button
                            onClick={() => openContact(item.sticker!)}
                            className="bg-green-700 hover:bg-green-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {!isLoggedIn ? 'Entrar para contatar' : 'Quero essa!'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA para quem ainda não tem conta */}
        {!isLoggedIn && (
          <div className="mt-8 bg-green-800 rounded-2xl p-6 text-center text-white">
            <div className="text-3xl mb-2">⚽</div>
            <h3 className="font-bold text-lg mb-1">Junte-se à Feira de Figurinhas!</h3>
            <p className="text-green-200 text-sm mb-4">
              Cadastre suas repetidas, encontre matches e troque com colecionadores do Brasil inteiro.
            </p>
            <Link
              href="/cadastro"
              className="inline-block bg-yellow-400 hover:bg-yellow-500 text-green-900 font-bold px-6 py-2.5 rounded-xl transition-colors"
            >
              Criar conta grátis →
            </Link>
          </div>
        )}

        {/* Afiliado: rodapé */}
        <div className="mt-6 space-y-2">
          <AffiliateButton url={albumBuyUrl()} label="📖 Comprar álbum oficial Panini 2026" variant="banner" />
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          Plataforma independente, não afiliada à FIFA ou Panini
        </p>
      </main>
    </div>
  )
}
