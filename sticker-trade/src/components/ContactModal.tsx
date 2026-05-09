'use client'

import { useState } from 'react'
import type { FeedItem } from '@/lib/types'

interface Props {
  item: FeedItem
  onClose: () => void
}

export default function ContactModal({ item, onClose }: Props) {
  const [message, setMessage] = useState('')
  const [method, setMethod] = useState<'whatsapp' | 'email'>(
    item.contact_by_whatsapp ? 'whatsapp' : 'email'
  )
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/contato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_id: item.user_id,
        sticker_id: item.sticker_id,
        message: message.trim() || undefined,
        method,
      }),
    })

    const json = await res.json()

    if (res.status === 402) {
      // Limit reached — redirect to upgrade
      window.location.href = '/upgrade'
      return
    }

    if (!res.ok) {
      setError(json.error || 'Erro ao enviar contato.')
      setLoading(false)
      return
    }

    if (method === 'whatsapp' && json.url) {
      window.open(json.url, '_blank')
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Contato enviado!</h3>
            <p className="text-sm text-gray-500 mb-6">
              {method === 'whatsapp'
                ? 'O WhatsApp foi aberto para você iniciar a conversa.'
                : 'Seu interesse foi registrado. O colecionador será notificado.'}
            </p>
            <button
              onClick={onClose}
              className="bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-green-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Solicitar troca</h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Figurinha #{item.sticker_number} — {item.player_name}
                </p>
                <p className="text-xs text-gray-400">com {item.username}</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {item.contact_by_whatsapp && item.contact_by_email && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Forma de contato</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMethod('whatsapp')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        method === 'whatsapp'
                          ? 'bg-green-700 text-white border-green-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      📱 WhatsApp
                    </button>
                    <button
                      onClick={() => setMethod('email')}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        method === 'email'
                          ? 'bg-green-700 text-white border-green-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      ✉️ E-mail
                    </button>
                  </div>
                </div>
              )}

              {!item.contact_by_whatsapp && !item.contact_by_email && (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                  Este colecionador não habilitou contato externo.
                </p>
              )}

              {(item.contact_by_whatsapp || item.contact_by_email) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensagem (opcional)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={300}
                      rows={3}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 resize-none"
                      placeholder="Ex: Oi! Tenho figurinhas para trocar. Você toparia?"
                    />
                    <p className="text-right text-xs text-gray-400">{message.length}/300</p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                    🔒 Seus dados de contato não serão exibidos. O sistema facilita o contato de
                    forma segura.
                  </div>

                  {error && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>
                  )}

                  <button
                    onClick={handleSend}
                    disabled={loading}
                    className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                  >
                    {loading ? 'Enviando...' : method === 'whatsapp' ? '📱 Abrir WhatsApp' : '✉️ Enviar interesse'}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
