'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard', label: 'Minhas repetidas' },
  { href: '/catalogo', label: 'Catálogo' },
  { href: '/feed', label: 'Quem tem o quê' },
  { href: '/perfil', label: 'Perfil' },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-green-800 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
          <span>⚽</span>
          <span className="hidden sm:inline">Copa 2026</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === item.href
                  ? 'bg-green-600 text-white'
                  : 'text-green-100 hover:bg-green-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="ml-2 px-3 py-1.5 rounded-lg text-sm text-green-200 hover:bg-green-700 transition-colors"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  )
}
