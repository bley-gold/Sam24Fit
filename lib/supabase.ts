import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http"))
}

export const isSupabaseAdminConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseServiceKey && supabaseUrl.startsWith("http"))
}

// Create supabase client only if environment variables are properly configured
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
      // Additional mock auth methods can be added here if needed
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
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: new Error(
                "Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Project Settings",
              ),
            }),
        }),
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

let supabaseAdmin: ReturnType<typeof createClient>

try {
  if (isSupabaseAdminConfigured()) {
    supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  } else {
    throw new Error("Supabase admin environment variables not configured")
  }
} catch (error) {
  console.warn("Supabase admin client creation failed:", error)
  // Create a mock admin client
  supabaseAdmin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: null,
              error: new Error("Please configure SUPABASE_SERVICE_ROLE_KEY in Project Settings for admin operations"),
            }),
          order: () =>
            Promise.resolve({
              data: null,
              error: new Error("Please configure SUPABASE_SERVICE_ROLE_KEY in Project Settings for admin operations"),
            }),
        }),
        order: () =>
          Promise.resolve({
            data: null,
            error: new Error("Please configure SUPABASE_SERVICE_ROLE_KEY in Project Settings for admin operations"),
          }),
      }),
      insert: () =>
        Promise.resolve({
          data: null,
          error: new Error("Please configure SUPABASE_SERVICE_ROLE_KEY in Project Settings for admin operations"),
        }),
      update: () => ({
        eq: () =>
          Promise.resolve({
            error: new Error("Please configure SUPABASE_SERVICE_ROLE_KEY in Project Settings for admin operations"),
          }),
      }),
      delete: () => ({
        eq: () =>
          Promise.resolve({
            error: new Error("Please configure SUPABASE_SERVICE_ROLE_KEY in Project Settings for admin operations"),
          }),
      }),
    }),
    rpc: () =>
      Promise.resolve({
        data: null,
        error: new Error("Please configure SUPABASE_SERVICE_ROLE_KEY in Project Settings for admin operations"),
      }),
  } as any
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
