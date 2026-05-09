export interface Profile {
  id: string
  username: string
  full_name: string
  phone: string
  city: string | null
  state: string | null
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
}
