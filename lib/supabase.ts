import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cybjdyouocdxrcedtjkq.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YmpkeW91b2NkeHJjZWR0amtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDk5MzYsImV4cCI6MjA2OTUyNTkzNn0.r9IKLpAOd74eeoyXRk5kDgAxVA4Pd-E0qL1TtR053eA"

let supabaseServiceKey: string | undefined

if (typeof window === "undefined") {
  // Server-side only - safe to access service role key
  supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YmpkeW91b2NkeHJjZWR0amtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk0OTkzNiwiZXhwIjoyMDY5NTI1OTM2fQ.vvDIsj14Ii6xKyNS0EpWRTjGdhZtEBwwwoXuUctTlxA"
}

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http"))
}

export const isSupabaseAdminConfigured = (): boolean => {
  if (typeof window !== "undefined") return false
  return !!(supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("http"))
}

let supabase: ReturnType<typeof createClient>

if (isSupabaseConfigured()) {
  supabase = createClient(supabaseUrl!, supabaseAnonKey!)
  console.log("✅ Supabase client initialized successfully")
} else {
  console.error("❌ Supabase configuration missing - check environment variables")
  throw new Error(
    "Supabase environment variables not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.",
  )
}

let supabaseAdmin: ReturnType<typeof createClient> | null

if (typeof window === "undefined") {
  // Server-side only
  try {
    if (isSupabaseAdminConfigured()) {
      supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    } else {
      console.warn("Supabase admin environment variables not configured - admin features will be disabled")
      supabaseAdmin = null
    }
  } catch (error) {
    console.warn("Supabase admin client creation failed:", error)
    supabaseAdmin = null
  }
} else {
  // Client-side - admin client not available
  supabaseAdmin = null
}

export const getSupabaseAdmin = () => {
  if (typeof window !== "undefined") {
    console.warn("Admin client is only available on the server side")
    return null
  }
  return supabaseAdmin
}

export { supabase, supabaseAdmin }

// Export the createClient function for use in other parts of the app
export { createClient }

// Types
export interface User {
  id: string
  email: string
  full_name: string
  phone: string
  date_of_birth: string
  gender: "male" | "female" | "other"
  street_address: string
  emergency_contact_name: string
  emergency_contact_number: string
  role: "user" | "admin"
  membership_status: "active" | "inactive" | "suspended"
  profile_picture_url?: string
  last_payment_date?: string
  created_at: string
  updated_at: string
}

export interface Receipt {
  id: string
  user_id: string
  filename: string
  file_url: string
  amount?: number
  description?: string
  status: "pending" | "verified" | "rejected"
  upload_date: string
  verified_date?: string
  verified_by?: string
  receipt_number?: number
  users?: User
}

export interface Payment {
  id: string
  user_id: string
  receipt_id: string
  amount: number
  payment_date: string
  created_at: string
}

export default supabase
