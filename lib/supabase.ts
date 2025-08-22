import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://noidkepohqhgdalkvzze.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vaWRrZXBvaHFoZ2RhbGt2enplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMTE4MTYsImV4cCI6MjA2OTg4NzgxNn0.sPoMpbSuSFgwvs_HbqBMhOWLU1PnM4EMm0psMQxhLLM"

let supabaseServiceKey: string | undefined

if (typeof window === "undefined") {
  // Server-side only - safe to access service role key
  supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vaWRrZXBvaHFoZ2RhbGt2enplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDMxMTgxNiwiZXhwIjoyMDY5ODg3ODE2fQ.dXqkt5LDLdCctvZeiOLqKUOguzZkeUB-ojZh2dshJtk"
}

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http"))
}

export const isSupabaseAdminConfigured = (): boolean => {
  if (typeof window !== "undefined") return false
  return !!(supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("http"))
}

let supabase: ReturnType<typeof createClient>

try {
  if (isSupabaseConfigured()) {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!)
  } else {
    throw new Error("Supabase environment variables not configured")
  }
} catch (error) {
  console.warn("Supabase client creation failed:", error)
  // Create a mock client that provides helpful error messages
  supabase = {
    auth: {
      signUp: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: new Error(
            "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
          ),
        }),
      signInWithPassword: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: new Error(
            "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
          ),
        }),
      signOut: () =>
        Promise.resolve({
          error: new Error(
            "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
          ),
        }),
      getUser: () =>
        Promise.resolve({
          data: { user: null },
          error: new Error(
            "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
          ),
        }),
      getSession: () =>
        Promise.resolve({
          data: { session: null },
          error: new Error(
            "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
          ),
        }),
      refreshSession: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: new Error(
            "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
          ),
        }),
      exchangeCodeForSession: () =>
        Promise.resolve({
          data: { user: null, session: null },
          error: new Error(
            "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
          ),
        }),
      onAuthStateChange: (callback: (event: string, session: any) => void) => {
        console.warn("Supabase not configured: onAuthStateChange will not work properly")
        // Return a mock subscription object
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                console.warn("Mock subscription unsubscribed")
              },
            },
          },
        }
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: new Error(
                "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
              ),
            }),
          order: () =>
            Promise.resolve({
              data: null,
              error: new Error(
                "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
              ),
            }),
        }),
        order: () =>
          Promise.resolve({
            data: null,
            error: new Error(
              "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
            ),
          }),
      }),
      insert: () =>
        Promise.resolve({
          data: null,
          error: new Error(
            "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
          ),
        }),
      update: () => ({
        eq: () =>
          Promise.resolve({
            error: new Error(
              "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
            ),
          }),
      }),
      delete: () => ({
        eq: () =>
          Promise.resolve({
            error: new Error(
              "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
            ),
          }),
      }),
    }),
    storage: {
      from: () => ({
        upload: () =>
          Promise.resolve({
            data: null,
            error: new Error(
              "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
            ),
          }),
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
        remove: () =>
          Promise.resolve({
            data: null,
            error: new Error(
              "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
            ),
          }),
      }),
    },
    rpc: () =>
      Promise.resolve({
        data: null,
        error: new Error(
          "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
        ),
      }),
  } as any
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
