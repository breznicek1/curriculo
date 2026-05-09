export interface Profile {
  id: string
  username: string
  full_name: string
  phone: string
  city: string | null
  state: string | null
  latitude: number | null
  longitude: number | null
  location_consent: boolean
  lgpd_consent: boolean
  lgpd_consent_at: string | null
  contact_by_whatsapp: boolean
  contact_by_email: boolean
  created_at: string
  updated_at: string
}

export interface ProfilePublic {
  id: string
  username: string
  city: string | null
  state: string | null
  contact_by_whatsapp: boolean
  contact_by_email: boolean
  created_at: string
}

export interface Album {
  id: string
  name: string
  year: number
  total_stickers: number
  active: boolean
  created_at: string
}

export interface Sticker {
  id: string
  album_id: string
  number: number
  player_name: string
  team: string | null
  country: string | null
  section: string | null
  image_url: string | null
}

export interface UserSticker {
  id: string
  user_id: string
  sticker_id: string
  quantity: number
  created_at: string
  updated_at: string
  sticker?: Sticker
}

export interface WishlistItem {
  id: string
  user_id: string
  sticker_id: string
  created_at: string
  sticker?: Sticker
}

export interface Match {
  id: string
  user_a_id: string
  user_b_id: string
  sticker_a_id: string
  sticker_b_id: string
  status: 'new' | 'seen' | 'contacted' | 'done'
  created_at: string
  sticker_a?: Sticker
  sticker_b?: Sticker
  profile_a?: ProfilePublic
  profile_b?: ProfilePublic
}

export interface StickerPhoto {
  id: string
  user_id: string
  photo_url: string
  caption: string | null
  created_at: string
}

export interface SwipeCard {
  sticker: Sticker
  available_count: number
  has_potential_match: boolean
}

export interface ContactRequest {
  id: string
  requester_id: string
  owner_id: string
  sticker_id: string | null
  message: string | null
  method: 'whatsapp' | 'email'
  status: 'pending' | 'sent' | 'failed'
  created_at: string
}

export interface FeedItem {
  user_id: string
  username: string
  city: string | null
  state: string | null
  contact_by_whatsapp: boolean
  contact_by_email: boolean
  sticker_id: string
  sticker_number: number
  player_name: string
  team: string | null
  country: string | null
  section: string | null
  quantity: number
  distance_km: number | null
  is_boosted?: boolean
}
