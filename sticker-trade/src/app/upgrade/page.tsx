'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const FREE_LIMIT = 5

function UpgradeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const status = searchParams.get('status')
  const type   = searchParams.get('type')

  const [loadingType, setLoadingType] = useState<'pro' | null>(null)

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => router.push('/dashboard'), 4000)
      return () => clearTimeout(timer)
    }
  }, [status, router])

  async function handleUpgrade(planType: 'pro') {
    setLoadingType(planType)
    const res = await fetch('/api/mercadopago/preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: planType }),
    })
    const json = await res.json()
    if (json.init_point) {
      window.location.href = json.init_point
    } else {
      setLoadingType(null)
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center max-w-sm">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {type === 'pro' ? 'Bem-vindo ao Pro!' : 'Figurinha impulsionada!'}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            {type === 'pro'
              ? 'Contatos ilimitados ativados. Redirecionando para o painel...'
              : 'Sua figurinha aparecerá em destaque no feed. Redirecionando...'}
          </p>
          <Link href="/dashboard" className="text-green-700 text-sm underline">
            Ir agora →
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'failure') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 text-center max-w-sm">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Pagamento não concluído</h1>
          <p className="text-gray-500 text-sm mb-6">
            Você pode tentar novamente quando quiser.
          </p>
          <Link href="/upgrade" className="bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium">
            Tentar novamente
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-green-800 text-white">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-green-200 hover:text-white">
            ← Voltar
          </Link>
          <span className="text-sm font-semibold">⚽ Troca Figurinhas Copa 2026</span>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Desbloqueie o <span className="text-green-700">Pro</span>
          </h1>
          <p className="text-gray-500">
            Você usou seus {FREE_LIMIT} contatos gratuitos deste mês.
          </p>
        </div>

        {/* Cards de plano */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {/* Plano Free */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-1">Gratuito</div>
            <div className="text-3xl font-black text-gray-800 mb-4">R$0</div>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Ver figurinhas do Brasil todo</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Swipe e wishlist ilimitados</li>
              <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Ver todos os matches</li>
              <li className="flex items-center gap-2"><span className="text-red-400">✗</span> <span className="text-gray-400">{FREE_LIMIT} contatos por mês</span></li>
              <li className="flex items-center gap-2"><span className="text-red-400">✗</span> <span className="text-gray-400">Sem boost no feed</span></li>
            </ul>
            <div className="w-full text-center text-sm text-gray-400 py-2 border border-gray-200 rounded-lg">
              Plano atual
            </div>
          </div>

          {/* Plano Pro */}
          <div className="bg-green-700 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-yellow-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full">
              RECOMENDADO
            </div>
            <div className="text-sm font-semibold text-green-200 uppercase tracking-wide mb-1">Pro</div>
            <div className="text-3xl font-black mb-1">R$9,90</div>
            <div className="text-green-300 text-xs mb-4">por mês · cancele quando quiser</div>
            <ul className="space-y-2 text-sm mb-6">
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> Tudo do plano gratuito</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> Contatos ilimitados</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> Boost de figurinhas no feed</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> Selo Pro no perfil público</li>
            </ul>
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={loadingType === 'pro'}
              className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-200 text-green-900 font-bold py-2.5 rounded-xl text-sm transition-colors"
            >
              {loadingType === 'pro' ? 'Redirecionando...' : 'Assinar Pro — R$9,90/mês'}
            </button>
          </div>
        </div>

        {/* Boost avulso */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-800 mb-1">Boost de figurinha avulso</h2>
          <p className="text-sm text-gray-500 mb-4">
            Não quer assinar? Impulsione uma figurinha específica por 7 dias por R$2,90.
            Ela aparece no topo do feed para todos os colecionadores da região.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 border border-green-700 text-green-700 hover:bg-green-50 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            ⚡ Escolher figurinha para impulsionar →
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Pagamento seguro via Mercado Pago · Cartão, PIX ou boleto
        </p>
      </main>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  )
}
