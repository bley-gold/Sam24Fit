import { createClient } from "@supabase/supabase-js"

// Provide fallback values for build time
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"

// Only create client if we have real values
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== "https://placeholder.supabase.co" && supabaseAnonKey !== "placeholder-key"
}

// Database types
export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  date_of_birth: string
  gender: string
  street_address: string
  emergency_contact_name: string
  emergency_contact_number: string
  profile_picture_url?: string
  role: "user" | "admin"
  membership_status: "active" | "inactive" | "suspended"
  joining_fee_paid: boolean
  created_at: string
  updated_at: string
}

export interface Receipt {
  id: string
  user_id: string
  filename: string
  file_url: string
  amount: number
  description?: string
  status: "pending" | "verified" | "rejected"
  upload_date: string
  verified_date?: string
  verified_by?: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  user_id: string
  receipt_id?: string
  amount: number
  payment_type: "membership" | "joining_fee" | "other"
  payment_method?: string
  payment_date: string
  month_year?: string
  status: "completed" | "pending" | "failed"
  notes?: string
  created_at: string
  updated_at: string
}
