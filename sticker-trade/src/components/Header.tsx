'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const NAV = [
  { href: '/dashboard',  label: 'Repetidas',  icon: '📦' },
  { href: '/swipe',      label: 'Swipe',       icon: '🃏' },
  { href: '/matches',    label: 'Matches',     icon: '⚡' },
  { href: '/feed',       label: 'Feira',       icon: '🏪' },
  { href: '/catalogo',   label: 'Catálogo',    icon: '📋' },
  { href: '/perfil',     label: 'Perfil',      icon: '👤' },
]

interface Props {
  matchCount?: number
}

export default function Header({ matchCount = 0 }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-green-800 text-white shadow-md sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-3 py-3 flex items-center justify-between gap-2">
        <Link href="/dashboard" className="flex items-center gap-1.5 font-bold text-base shrink-0">
          <span>⚽</span>
          <span className="hidden sm:inline text-sm">Copa 2026</span>
        </Link>

        <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
          {NAV.map((item) => {
            const isActive = pathname === item.href
            const isMatches = item.href === '/matches'
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-green-100 hover:bg-green-700'
                }`}
              >
                <span className="hidden sm:inline">{item.icon}</span>
                {item.label}
                {isMatches && matchCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 text-green-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                    {matchCount > 9 ? '9+' : matchCount}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="shrink-0 text-xs text-green-300 hover:text-white transition-colors px-2 py-1"
        >
          Sair
        </button>
      </div>
    </header>
  )
}
