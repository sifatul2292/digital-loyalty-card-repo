export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: string
          name: string
          type: string
          logo_url: string | null
          reward_threshold: number
          reward_name: string
          win_back_enabled: boolean
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          logo_url?: string | null
          reward_threshold?: number
          reward_name?: string
          win_back_enabled?: boolean
          owner_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>
      }
      customers: {
        Row: {
          id: string
          phone: string
          name: string
          birthday: string | null
          business_id: string
          card_token: string
          created_at: string
        }
        Insert: {
          id?: string
          phone: string
          name: string
          birthday?: string | null
          business_id: string
          card_token?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      stamps: {
        Row: {
          id: string
          customer_id: string
          business_id: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          business_id: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['stamps']['Insert']>
      }
      rewards: {
        Row: {
          id: string
          customer_id: string
          business_id: string
          redeemed: boolean
          redeemed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          business_id: string
          redeemed?: boolean
          redeemed_at?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['rewards']['Insert']>
      }
    }
  }
}

export type Business = Database['public']['Tables']['businesses']['Row']
export type Customer = Database['public']['Tables']['customers']['Row']
export type Stamp = Database['public']['Tables']['stamps']['Row']
export type Reward = Database['public']['Tables']['rewards']['Row']
