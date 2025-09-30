export interface User {
  id: string
  name: string
  email?: string
  photo?: string
  created_at: string
  updated_at: string
}

export interface Announcement {
  id: string
  user_id: string
  announcement_type: 'gp_offer' | 'send_request'
  departure_city: string
  arrival_city: string
  date: string // ISO string
  time?: string
  weight: number
  price_per_kg?: number
  transport_mode?: 'voiture' | 'bus' | 'avion' | 'train'
  is_fragile: boolean
  is_urgent: boolean
  status: 'active' | 'taken' | 'delivered'
  whatsapp_number?: string
  // Receiver information for send_request
  receiver_name?: string
  receiver_phone?: string
  receiver_email?: string
  package_value?: number
  package_photos?: string[]
  description?: string
  created_at: string
  updated_at: string
}

export interface ColiSpace {
  id: string
  announcement_id: string
  sender_id: string
  gp_id: string
  receiver_id?: string
  status: 'created' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled'
  last_message_at?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  coli_space_id: string
  user_id: string
  message?: string
  attachments?: string[]
  created_at: string
}

export interface PackageValidation {
  id: string
  coli_space_id: string
  validation_type: 'sender_photo' | 'gp_pickup' | 'receiver_delivery'
  user_id: string
  photo_urls?: string[]
  created_at: string
}
