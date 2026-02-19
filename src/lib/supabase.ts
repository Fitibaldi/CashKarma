import { createClient } from '@supabase/supabase-js'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name: string
          last_name: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          first_name?: string
          last_name?: string
          avatar_url?: string | null
          updated_at?: string
        }
        Relationships: readonly []
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string
          avatar_url: string | null
          location: string
          currency: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          avatar_url?: string | null
          location?: string
          currency?: string
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string
          avatar_url?: string | null
          location?: string
          currency?: string
          updated_at?: string
        }
        Relationships: readonly []
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          role?: 'admin' | 'member'
        }
        Relationships: readonly []
      }
      payments: {
        Row: {
          id: string
          group_id: string
          from_user_id: string
          from_user_name: string
          to_user_id: string | null
          amount: number
          currency: string
          description: string
          date: string
          method: string
          status: string
          split_type: 'equal' | 'specific'
          split_between: string[]
          paid_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          from_user_id: string
          from_user_name: string
          to_user_id?: string | null
          amount: number
          currency?: string
          description: string
          date: string
          method?: string
          status?: string
          split_type?: 'equal' | 'specific'
          split_between?: string[]
          paid_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          from_user_name?: string
          to_user_id?: string | null
          amount?: number
          currency?: string
          description?: string
          date?: string
          method?: string
          status?: string
          split_type?: 'equal' | 'specific'
          split_between?: string[]
          paid_by?: string
          updated_at?: string
        }
        Relationships: readonly []
      }
      settlements: {
        Row: {
          id: string
          group_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          from_user_id: string
          to_user_id: string
          amount: number
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: readonly []
      }
      group_invitations: {
        Row: {
          id: string
          group_id: string
          invited_by: string
          invited_user_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          group_id: string
          invited_by: string
          invited_user_id: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          accepted_at?: string | null
        }
        Update: {
          status?: 'pending' | 'accepted' | 'declined'
          accepted_at?: string | null
        }
        Relationships: readonly []
      }
      invite_codes: {
        Row: {
          id: string
          group_id: string
          code: string
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          code: string
          created_at?: string
        }
        Update: Record<string, never>
        Relationships: readonly []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
