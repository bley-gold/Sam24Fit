import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const supabaseServiceKey =
  typeof window === "undefined" ? process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() : undefined

const hasValidPublicConfig = (() => {
  if (!supabaseUrl || !supabaseAnonKey) return false

  try {
    const url = new URL(supabaseUrl)
    return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1"
  } catch {
    return false
  }
})()

export const isSupabaseConfigured = (): boolean => hasValidPublicConfig

export const isSupabaseAdminConfigured = (): boolean => {
  if (typeof window !== "undefined") return false
  return !!(hasValidPublicConfig && supabaseServiceKey)
}

// Keep static builds renderable without embedding project credentials. Runtime
// operations guard on isSupabaseConfigured before contacting Supabase.
const supabase = createClient(
  supabaseUrl || "http://127.0.0.1:54321",
  supabaseAnonKey || "supabase-public-key-not-configured",
)

let supabaseAdmin: ReturnType<typeof createClient> | null = null

if (typeof window === "undefined" && isSupabaseAdminConfigured()) {
  try {
    supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } catch (error) {
    console.warn("Supabase admin client creation failed:", error)
  }
}

export const getSupabaseAdmin = () => {
  if (typeof window !== "undefined") {
    console.warn("Admin client is only available on the server side")
    return null
  }

  return supabaseAdmin
}

export { supabase, supabaseAdmin, createClient }

export interface User {
  id: string
  email: string
  password_hash?: string | null
  full_name: string
  phone: string
  date_of_birth: string
  gender: "male" | "female" | "other"
  street_address: string
  emergency_contact_name: string
  emergency_contact_number: string
  role: "user" | "admin"
  membership_status: "active" | "inactive" | "suspended"
  joining_fee_paid?: boolean
  profile_picture_url?: string | null
  id_number?: string | null
  last_payment_date?: string | null
  created_at: string
  updated_at: string
}

export interface Receipt {
  id: string
  user_id: string
  filename: string
  file_url: string
  amount: number
  description?: string | null
  status: "pending" | "verified" | "rejected"
  upload_date: string
  verified_date?: string | null
  verified_by?: string | null
  rejection_reason?: string | null
  receipt_number?: number
  users?: User
}

export interface Payment {
  id: string
  user_id: string
  receipt_id: string | null
  amount: number
  payment_type: "membership" | "joining_fee" | "other"
  payment_method?: string | null
  payment_date: string
  month_year?: string | null
  status: "completed" | "pending" | "failed"
  notes?: string | null
  created_at: string
  updated_at?: string
}

export interface Review {
  id: string
  user_id?: string
  review_text: string
  rating: number
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at?: string
  rejection_reason?: string | null
  is_featured?: boolean
  users?: {
    full_name: string
    profile_picture_url?: string | null
  } | null
}

export default supabase
