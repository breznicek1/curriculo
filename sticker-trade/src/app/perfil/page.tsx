import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import PerfilClient from './PerfilClient'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .schema('figurinhas')
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { count } = await supabase
    .schema('figurinhas')
    .from('user_stickers')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Meu perfil</h1>
        <PerfilClient
          profile={profile}
          email={user.email || ''}
          totalRepetidas={count || 0}
        />
      </main>
    </div>
  )
}
