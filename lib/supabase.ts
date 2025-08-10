import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key"
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl !== "https://placeholder.supabase.co" && supabaseAnonKey !== "placeholder-key"
}

// Create server-side Supabase client
export const supabaseServer = (() => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn("Supabase not configured, using placeholder client")
      return createClient<Database>(supabaseUrl, supabaseAnonKey)
    }

    // Use service role key if available, otherwise fall back to anon key
    const keyToUse = supabaseServiceRoleKey || supabaseAnonKey

    return createClient<Database>(supabaseUrl, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  } catch (error) {
    console.error("Failed to create server Supabase client:", error)
    // Return a placeholder client to prevent app crashes
    return createClient<Database>("https://placeholder.supabase.co", "placeholder-key")
  }
})()

// Client-side Supabase client (singleton pattern)
let supabaseClient: ReturnType<typeof createClient<Database>> | undefined

export function getClientSupabaseClient() {
  if (!supabaseClient) {
    try {
      if (!isSupabaseConfigured()) {
        console.warn("Supabase not configured, using placeholder client")
      }

      supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    } catch (error) {
      console.error("Failed to create client Supabase client:", error)
      // Return a placeholder client to prevent app crashes
      supabaseClient = createClient<Database>("https://placeholder.supabase.co", "placeholder-key")
    }
  }
  return supabaseClient
}

// Export the client-side supabase client as the default export for compatibility
export const supabase = getClientSupabaseClient()

// Define types for your tables based on database.types.ts
export type User = Database["public"]["Tables"]["users"]["Row"]
export type Receipt = Database["public"]["Tables"]["receipts"]["Row"] & {
  users?: User // Add the joined user data to the Receipt type
}
export type Membership = Database["public"]["Tables"]["memberships"]["Row"]
export type Payment = Database["public"]["Tables"]["payments"]["Row"]
