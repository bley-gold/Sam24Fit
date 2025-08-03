"use server"

import { createClient } from "@supabase/supabase-js"
import type { User } from "@/lib/supabase" // Import the User type from your existing types

/**
 * Fetches a user's profile from the public.users table using the Supabase Service Role Key.
 * This bypasses Row Level Security (RLS) for this specific read operation, ensuring
 * that the user's full profile, including their role, can always be retrieved reliably.
 *
 * @param userId The UUID of the user whose profile is to be fetched.
 * @returns The user's profile (type User) or null if not found or an error occurs.
 */
export async function getUserProfileById(userId: string): Promise<User | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase URL or Service Role Key is not configured for server actions.")
      return null
    }

    // Initialize supabaseAdmin client here, ensuring it's only done on the server
    // and uses the service_role_key to bypass RLS.
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: profile, error } = await supabaseAdmin.from("users").select("*").eq("id", userId).single()

    if (error) {
      // Log detailed error information for debugging
      console.error(
        "Server Action: Error fetching user profile with service role:",
        error.message,
        error.details,
        error.hint,
        error.code,
      )
      return null
    }

    return profile
  } catch (error) {
    console.error("Server Action: getUserProfileById unexpected error:", error)
    return null
  }
}
