'use client'

import { useState } from 'react'

interface Props {
  username: string
}

export default function ShareProfileButton({ username }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${username}`

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Oi! Estou trocando figurinhas da Copa 2026. Veja minhas repetidas aqui: ${url}`
    )
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function shareTelegram() {
    const text = encodeURIComponent(
      `Estou trocando figurinhas da Copa 2026! Minhas repetidas:`
    )
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${text}`, '_blank')
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-semibold text-gray-800 text-sm">Compartilhe seu perfil</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Envie o link nos grupos de figurinhas e receba contatos
          </p>
        </div>
        <span className="text-2xl">🔗</span>
      </div>

      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 mb-3">
        <span className="text-xs text-gray-500 flex-1 truncate">/u/{username}</span>
        <button
          onClick={copyLink}
          className="text-xs text-green-700 font-semibold shrink-0 hover:text-green-900"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={shareWhatsApp}
          className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
        >
          📱 WhatsApp
        </button>
        <button
          onClick={shareTelegram}
          className="flex-1 flex items-center justify-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
        >
          ✈️ Telegram
        </button>
      </div>
    </div>
  )
}
