import { createClient } from "@supabase/supabase-js"

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Throw clear errors during build if env vars are missing
if (!supabaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is required. Please set it in your environment variables.'
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY is required. Please set it in your environment variables.'
  )
}

// Create and configure Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  // Recommended global options
  global: {
    headers: {
      'X-Client-Info': 'nextjs-with-supabase/v1.0'
    }
  }
})

// Database Types (generated from your Supabase schema - example only)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          date_of_birth: string | null
          gender: string | null
          street_address: string | null
          emergency_contact_name: string | null
          emergency_contact_number: string | null
          profile_picture_url: string | null
          role: "user" | "admin"
          membership_status: "active" | "inactive" | "suspended"
          joining_fee_paid: boolean
          created_at: string
          updated_at: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      receipts: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_url: string
          amount: number
          description: string | null
          status: "pending" | "verified" | "rejected"
          upload_date: string
          verified_date: string | null
          verified_by: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          receipt_id: string | null
          amount: number
          payment_type: "membership" | "joining_fee" | "other"
          payment_method: string | null
          payment_date: string
          month_year: string | null
          status: "completed" | "pending" | "failed"
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
      }
    }
    Views: { /* ... */ }
    Functions: { /* ... */ }
    Enums: { /* ... */ }
  }
}

// Helper type for row selections
export type User = Database['public']['Tables']['users']['Row']
export type Receipt = Database['public']['Tables']['receipts']['Row']
export type Payment = Database['public']['Tables']['payments']['Row']

// Utility function for safe client access
export const getSupabase = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase client not properly configured')
  }
  return supabase
}