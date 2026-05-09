'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { registerSchema, type RegisterFormData } from '@/lib/validations'

const BR_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC',
  'SP','SE','TO',
]

export default function CadastroPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState('')
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { contact_by_whatsapp: true, contact_by_email: true },
  })

  async function onSubmit(data: RegisterFormData) {
    setServerError('')

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (signUpError) {
      setServerError(signUpError.message === 'User already registered'
        ? 'Este e-mail já está cadastrado.'
        : 'Erro ao criar conta. Tente novamente.')
      return
    }

    if (!authData.user) {
      setServerError('Erro ao criar conta. Tente novamente.')
      return
    }

    const { error: profileError } = await supabase
      .schema('figurinhas')
      .from('profiles')
      .insert({
        id: authData.user.id,
        username: data.username,
        full_name: data.full_name,
        phone: data.phone,
        city: data.city || null,
        state: data.state || null,
        lgpd_consent: true,
        lgpd_consent_at: new Date().toISOString(),
        contact_by_whatsapp: data.contact_by_whatsapp,
        contact_by_email: data.contact_by_email,
      })

    if (profileError) {
      if (profileError.code === '23505') {
        setServerError('Este nome de usuário já está em uso.')
      } else {
        setServerError('Erro ao salvar perfil. Tente novamente.')
      }
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚽</div>
          <h1 className="text-2xl font-bold text-green-800">Troca Figurinhas</h1>
          <p className="text-gray-500 text-sm mt-1">Copa do Mundo FIFA 2026</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Criar conta</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome completo *
                </label>
                <input
                  {...register('full_name')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Seu nome completo"
                />
                {errors.full_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuário público *
                </label>
                <input
                  {...register('username')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="ex: joao_silva"
                />
                <p className="text-gray-400 text-xs mt-1">Visível para outros colecionadores</p>
                {errors.username && (
                  <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="(11) 98765-4321"
                />
                <p className="text-gray-400 text-xs mt-1">Nunca exibido publicamente</p>
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="seu@email.com"
                />
                <p className="text-gray-400 text-xs mt-1">Nunca exibido publicamente</p>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <input
                  {...register('password')}
                  type="password"
                  autoComplete="new-password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="Mínimo 8 caracteres"
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input
                  {...register('city')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  {...register('state')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-white"
                >
                  <option value="">--</option>
                  {BR_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50 space-y-2">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                Como posso ser contactado?
              </p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('contact_by_whatsapp')}
                  type="checkbox"
                  className="w-4 h-4 accent-green-700"
                />
                <span className="text-sm text-gray-700">Via WhatsApp (número não exibido)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('contact_by_email')}
                  type="checkbox"
                  className="w-4 h-4 accent-green-700"
                />
                <span className="text-sm text-gray-700">Via e-mail (e-mail não exibido)</span>
              </label>
            </div>

            <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  {...register('lgpd_consent')}
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 accent-green-700 flex-shrink-0"
                />
                <span className="text-xs text-gray-700 leading-relaxed">
                  Li e concordo com o uso dos meus dados pessoais para a finalidade exclusiva de
                  facilitar trocas de figurinhas, conforme a{' '}
                  <strong>Lei Geral de Proteção de Dados (LGPD – Lei 13.709/2018)</strong>. Meus
                  dados de contato (telefone e e-mail) nunca serão exibidos publicamente e posso
                  solicitar a exclusão da conta a qualquer momento.
                </span>
              </label>
              {errors.lgpd_consent && (
                <p className="text-red-500 text-xs mt-2">{errors.lgpd_consent.message}</p>
              )}
            </div>

            {serverError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-green-700 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
