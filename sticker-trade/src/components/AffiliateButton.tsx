'use client'

interface Props {
  url: string
  label?: string
  size?: 'sm' | 'md'
  variant?: 'banner' | 'inline' | 'card'
}

export default function AffiliateButton({
  url,
  label = '🛒 Comprar no Mercado Livre',
  size = 'sm',
  variant = 'inline',
}: Props) {
  if (variant === 'banner') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 hover:bg-yellow-100 transition-colors group"
        onClick={() => {
          try { (window as any).gtag?.('event', 'affiliate_click', { url }) } catch {}
        }}
      >
        <div>
          <p className="text-sm font-semibold text-yellow-900">{label}</p>
          <p className="text-xs text-yellow-600 mt-0.5">Link patrocinado • abre nova aba</p>
        </div>
        <span className="text-yellow-500 group-hover:translate-x-1 transition-transform text-lg">→</span>
      </a>
    )
  }

  if (variant === 'card') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block text-center bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold text-xs px-3 py-2 rounded-lg transition-colors"
        onClick={() => {
          try { (window as any).gtag?.('event', 'affiliate_click', { url }) } catch {}
        }}
      >
        {label}
      </a>
    )
  }

  // inline
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`inline-flex items-center gap-1 text-yellow-700 hover:text-yellow-900 hover:underline transition-colors ${
        size === 'sm' ? 'text-xs' : 'text-sm'
      }`}
      onClick={() => {
        try { (window as any).gtag?.('event', 'affiliate_click', { url }) } catch {}
      }}
    >
      {label} ↗
    </a>
  )
}
