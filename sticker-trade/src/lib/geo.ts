// ─── Cálculo de distância e proximidade ───────────────────────────────────

export function haversineKm(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ─── Rótulo de distância ──────────────────────────────────────────────────

export function distanceLabel(km: number | null): string {
  if (km === null) return ''
  if (km < 1)   return '< 1 km'
  if (km < 10)  return `${Math.round(km)} km`
  if (km < 100) return `~${Math.round(km / 5) * 5} km`
  if (km < 500) return `~${Math.round(km / 10) * 10} km`
  return `~${Math.round(km / 100) * 100} km`
}

// ─── Badge de proximidade (com fallback city/state) ───────────────────────

export interface ProximityBadge {
  label: string
  color: string   // classes Tailwind
}

export function proximityBadge(
  distKm: number | null,
  theirCity: string | null,
  theirState: string | null,
  myCity: string | null,
  myState: string | null
): ProximityBadge {
  // GPS disponível
  if (distKm !== null) {
    if (distKm < 5)   return { label: `📍 ${distanceLabel(distKm)}`,  color: 'bg-green-100 text-green-800' }
    if (distKm < 50)  return { label: `📍 ${distanceLabel(distKm)}`,  color: 'bg-blue-100 text-blue-800' }
    if (distKm < 300) return { label: `🗺️ ${distanceLabel(distKm)}`, color: 'bg-gray-100 text-gray-600' }
    return                    { label: `✈️ ${distanceLabel(distKm)}`,  color: 'bg-gray-100 text-gray-400' }
  }

  // Fallback city/state
  if (myCity && theirCity && myCity === theirCity)
    return { label: '📍 Mesma cidade', color: 'bg-green-100 text-green-800' }
  if (myState && theirState && myState === theirState)
    return { label: `🗺️ ${theirState}`, color: 'bg-blue-100 text-blue-800' }
  if (theirCity)
    return { label: `📦 ${theirCity}${theirState ? `/${theirState}` : ''}`, color: 'bg-gray-100 text-gray-500' }
  return { label: '🌎 Brasil', color: 'bg-gray-100 text-gray-400' }
}

// ─── Score de proximidade para ordenação (menor = mais próximo) ───────────

export function proximityScore(
  distKm: number | null,
  theirCity: string | null,
  theirState: string | null,
  myCity: string | null,
  myState: string | null
): number {
  if (distKm !== null) return distKm
  if (myCity && theirCity === myCity)   return 30     // mesma cidade ~30km equivalente
  if (myState && theirState === myState) return 150   // mesmo estado ~150km
  return 2000                                          // outro estado
}

// ─── Ordena lista por proximidade ─────────────────────────────────────────

export function sortByProximity<T extends {
  distance_km: number | null
  city: string | null
  state: string | null
}>(items: T[], myCity: string | null, myState: string | null): T[] {
  return [...items].sort((a, b) =>
    proximityScore(a.distance_km, a.city, a.state, myCity, myState) -
    proximityScore(b.distance_km, b.city, b.state, myCity, myState)
  )
}

// ─── Regiões do Brasil (fallback para quando não há GPS) ──────────────────

const REGIOES: Record<string, string[]> = {
  'Sudeste':     ['SP','RJ','MG','ES'],
  'Sul':         ['PR','SC','RS'],
  'Centro-Oeste':['GO','MT','MS','DF'],
  'Nordeste':    ['BA','SE','AL','PE','PB','RN','CE','PI','MA'],
  'Norte':       ['AM','PA','AC','RO','RR','AP','TO'],
}

export function regiaoByState(state: string): string {
  for (const [region, states] of Object.entries(REGIOES)) {
    if (states.includes(state)) return region
  }
  return 'Brasil'
}
