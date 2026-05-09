'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/lib/types'

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

interface Props {
  profile: Profile
  email: string
  totalRepetidas: number
}

export default function PerfilClient({ profile, email, totalRepetidas }: Props) {
  const router = useRouter()
  const supabase = createClient()

  const [city, setCity] = useState(profile?.city || '')
  const [state, setState] = useState(profile?.state || '')
  const [whatsapp, setWhatsapp] = useState(profile?.contact_by_whatsapp ?? true)
  const [emailContact, setEmailContact] = useState(profile?.contact_by_email ?? true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  async function handleSave() {
    setSaving(true)
    await supabase
      .schema('figurinhas')
      .from('profiles')
      .update({ city: city || null, state: state || null, contact_by_whatsapp: whatsapp, contact_by_email: emailContact })
      .eq('id', profile.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleDelete() {
    await supabase.schema('figurinhas').from('profiles').delete().eq('id', profile.id)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Informações da conta</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Usuário público</span>
            <span className="font-medium text-gray-800">@{profile?.username}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">E-mail</span>
            <span className="font-medium text-gray-800">{email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-50">
            <span className="text-gray-500">Nome completo</span>
            <span className="font-medium text-gray-800">{profile?.full_name}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500">Figurinhas repetidas</span>
            <span className="font-semibold text-green-700">{totalRepetidas}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Localização</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="São Paulo"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
            >
              <option value="">--</option>
              {BR_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-2">Preferências de contato</h2>
        <p className="text-xs text-gray-400 mb-4">
          Seu telefone e e-mail nunca são exibidos. O contato é sempre intermediado pelo sistema.
        </p>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsapp}
              onChange={(e) => setWhatsapp(e.target.checked)}
              className="w-4 h-4 accent-green-700"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Aceito contato via WhatsApp</p>
              <p className="text-xs text-gray-400">Seu número é protegido pelo sistema</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailContact}
              onChange={(e) => setEmailContact(e.target.checked)}
              className="w-4 h-4 accent-green-700"
            />
            <div>
              <p className="text-sm font-medium text-gray-800">Aceito contato via e-mail</p>
              <p className="text-xs text-gray-400">Seu e-mail é protegido pelo sistema</p>
            </div>
          </label>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-4 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-semibold px-6 py-2 rounded-lg text-sm transition-colors"
        >
          {saving ? 'Salvando...' : saved ? '✓ Salvo!' : 'Salvar alterações'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-2">LGPD — Exclusão de dados</h2>
        <p className="text-xs text-gray-500 mb-4">
          Conforme a Lei 13.709/2018, você pode solicitar a exclusão de todos os seus dados a
          qualquer momento. Essa ação é irreversível.
        </p>
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-red-600 border border-red-300 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Excluir minha conta e dados
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 mb-3">
              Tem certeza? Todos os seus dados e figurinhas registradas serão apagados permanentemente.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Sim, excluir tudo
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
