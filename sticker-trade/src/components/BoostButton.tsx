'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  stickerId: string
  isBoosted: boolean
  isPro: boolean
}

export default function BoostButton({ stickerId, isBoosted, isPro }: Props) {
  const [loading, setLoading] = useState(false)

  if (isBoosted) {
    return (
      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-semibold">
        ⚡ Destaque
      </span>
    )
  }

  if (!isPro) {
    return (
      <Link
        href="/upgrade"
        className="text-xs text-gray-400 hover:text-green-700 transition-colors"
        title="Assinar Pro para impulsionar"
      >
        ⚡ Boost
      </Link>
    )
  }

  async function handleBoost() {
    setLoading(true)
    const res = await fetch('/api/mercadopago/preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'boost', sticker_id: stickerId }),
    })
    const json = await res.json()
    if (json.init_point) {
      window.location.href = json.init_point
    } else {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleBoost}
      disabled={loading}
      className="text-xs text-green-700 hover:text-green-900 font-semibold transition-colors disabled:opacity-50"
      title="Impulsionar no feed por 7 dias — R$2,90"
    >
      {loading ? '...' : '⚡ Boost'}
    </button>
  )
}
